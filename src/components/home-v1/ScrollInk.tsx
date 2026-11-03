"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import Squiggle from "@/components/gp/Squiggle";
import { useReducedMotionSafe } from "@/components/gp/hooks";

interface Token {
  /** Words of this run (an underlined phrase is one run). */
  words: string[];
  key: boolean;
  /** Whether the source had a space before this run ("<u>x</u>," → no space before ","). */
  spaced: boolean;
}

/** "a <u>b c</u> d" → runs; key phrases stay together so their underline can span them. */
function tokenize(source: string): Token[] {
  const out: Token[] = [];
  const re = /<u>(.*?)<\/u>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let pendingSpace = false; // whitespace seen at the end of the previous plain run
  const push = (text: string, key: boolean) => {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length) out.push({ words, key, spaced: pendingSpace || /^\s/.test(text) });
    pendingSpace = words.length ? /\s$/.test(text) : pendingSpace || /\s/.test(text);
  };
  while ((m = re.exec(source))) {
    push(source.slice(last, m.index), false);
    push(m[1], true);
    last = m.index + m[0].length;
  }
  push(source.slice(last), false);
  return out;
}

/**
 * 2 · The one sentence. Words ink in from ink/22 to ink as the paragraph
 * scrolls through the viewport (split by word in every script — never by
 * letter, so Arabic keeps its joins); key phrases are bolder and get a
 * hand-drawn raspberry underline once they are fully inked.
 * Server render and reduced motion: everything inked and underlined.
 */
export default function ScrollInk({ source, className }: { source: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotionSafe();
  const tokens = useMemo(() => tokenize(source), [source]);
  const total = tokens.reduce((n, t) => n + t.words.length, 0);
  // Index (in words) where each run ends: its underline draws once inked past it.
  const ends = useMemo(
    () => tokens.map((_, r) => tokens.slice(0, r + 1).reduce((s, t) => s + t.words.length, 0)),
    [tokens]
  );

  const [inked, setInked] = useState(total); // server: fully inked
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });

  const apply = (p: number) => {
    const v = p * (total + 1);
    ref.current?.style.setProperty("--ink", v.toFixed(3));
    const whole = Math.floor(v);
    setInked((cur) => (cur === whole ? cur : whole));
  };
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!reduced) apply(p);
  });
  useEffect(() => {
    if (reduced) {
      ref.current?.style.setProperty("--ink", String(total + 1));
      return;
    }
    // First read after layout (the scroll may already be past the start).
    const id = requestAnimationFrame(() => apply(scrollYProgress.get()));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // Flatten to words, then glue into unbreakable groups: a key phrase stays on
  // one line together with anything attached to it without a space
  // (",", Arabic "و"), so punctuation never starts a line.
  const words: { text: string; i: number; run: number; key: boolean; space: boolean }[] = [];
  tokens.forEach((tok, r) =>
    tok.words.forEach((text, w) =>
      words.push({ text, i: words.length, run: r, key: tok.key, space: w > 0 || (r > 0 && tok.spaced) })
    )
  );
  const groups: (typeof words)[] = [];
  for (const wd of words) {
    const prev = groups.at(-1)?.at(-1);
    const sameKey = prev && prev.key && wd.key && prev.run === wd.run;
    if (prev && (!wd.space || sameKey)) groups.at(-1)!.push(wd);
    else groups.push([wd]);
  }

  const word = (wd: (typeof words)[number]) => (
    <span className="gp-ink-word" style={{ "--w": wd.i } as React.CSSProperties}>
      {wd.text}
    </span>
  );

  return (
    <p ref={ref} className={className} style={{ "--ink": total + 1 } as React.CSSProperties}>
      {groups.map((g, gi) => {
        // Split the group into plain words and one key phrase (with its underline).
        const parts: React.ReactNode[] = [];
        for (let k = 0; k < g.length; ) {
          const wd = g[k];
          if (wd.key) {
            let n = 0;
            while (k + n < g.length && g[k + n].key && g[k + n].run === wd.run) n++;
            const phrase = g.slice(k, k + n);
            parts.push(
              <Fragment key={k}>
                {k > 0 && wd.space ? " " : null}
                <span className="relative font-semibold text-gp-ink">
                  {phrase.map((x, j) => (
                    <Fragment key={x.i}>
                      {j > 0 ? " " : null}
                      {word(x)}
                    </Fragment>
                  ))}
                  <Squiggle
                    variant="underline"
                    drawn={reduced || inked >= ends[wd.run]}
                    duration={700}
                    strokeWidth={2.6}
                    className="absolute inset-x-0 -bottom-[0.14em] h-[0.26em] w-full text-gp-raspberry"
                  />
                </span>
              </Fragment>
            );
            k += n;
          } else {
            parts.push(
              <Fragment key={k}>
                {k > 0 && wd.space ? " " : null}
                {word(wd)}
              </Fragment>
            );
            k++;
          }
        }
        return (
          <Fragment key={gi}>
            {gi > 0 ? " " : null}
            {g.length > 1 ? <span className="inline-block whitespace-nowrap">{parts}</span> : parts}
          </Fragment>
        );
      })}
    </p>
  );
}