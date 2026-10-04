import type { ReactNode } from "react";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { PIPING, type PipingName } from "@/lib/piping";
import { cn } from "@/lib/utils";

/*
  Filter chip (B §7): 36px pill on dragée; selected = paillette with sucre
  text. Optional dot in a piping colour. No icons. Put chips in a row with
  `flex gap-2 overflow-x-auto snap-x` (mobile scrolls horizontally).

  As a link (URL-driven filters, e.g. ?c=wedding):
    <Chip href="/galerie?c=wedding" selected={c === "wedding"} dot="or" count={4}>Mariage</Chip>
  As a toggle button:
    <Chip selected={on} onClick={…}>Mariage</Chip>    (client parent)
*/

interface ChipBase {
  selected?: boolean;
  dot?: PipingName;
  /** Shown after the label in a lighter weight, e.g. number of cakes. */
  count?: number;
  className?: string;
  children: ReactNode;
}

type ChipProps =
  | (ChipBase & { href: string; scroll?: boolean; onClick?: never })
  | (ChipBase & { href?: undefined; onClick?: () => void });

export function chipClasses(selected?: boolean, className?: string) {
  return cn(
    "press inline-flex h-9 shrink-0 snap-start items-center gap-2 rounded-pill px-4 text-sm font-medium leading-none whitespace-nowrap no-underline",
    selected ? "bg-paillette text-sucre" : "bg-dragee text-paillette hover:bg-[#f0c6d6]",
    className
  );
}

export function Chip(props: ChipProps) {
  const { selected, dot, count, className, children } = props;
  const inner = (
    <>
      {dot && (
        <span
          aria-hidden="true"
          className="size-2 rounded-full"
          style={{ background: selected ? PIPING[dot].tint : PIPING[dot].piping }}
        />
      )}
      <span>{children}</span>
      {count !== undefined && <span className="font-normal opacity-70">{count}</span>}
    </>
  );

  if (props.href !== undefined) {
    return (
      <Link
        href={props.href}
        scroll={props.scroll ?? false}
        aria-current={selected ? "page" : undefined}
        className={chipClasses(selected, className)}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" aria-pressed={!!selected} onClick={props.onClick} className={chipClasses(selected, className)}>
      {inner}
    </button>
  );
}
