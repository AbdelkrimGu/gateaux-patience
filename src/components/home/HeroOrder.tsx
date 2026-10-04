"use client";

import { LetteredBoard, RefTag } from "@/components/ui/LetteredBoard";
import { NameField } from "@/components/ui/NameField";
import { Button } from "@/components/ui/Button";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { setHomeName, useHomeName, useSettled } from "./name-store";

/*
  The hero's one client island (B §2): name field -> ring lettering ->
  WhatsApp CTA. Returns three grid items (board, field, CTA block); the
  server <HomeHero> places them. The photo, H1 and CTA are all in the
  server HTML: nothing here is opacity-gated or waits for hydration.
*/

export interface HeroOrderProps {
  locale: string;
  /** common.occasion.birthday: the neutral ring message (DESIGN.md amend. 2). */
  message: string;
  /** Absent only if the catalogue is unreachable: the plate shows its mat. */
  image?: { src: string; alt: string; position?: string };
  cake?: { href: string; refCode: string; refAria: string };
  caption: string;
  field: { label: string; placeholder: string };
  cta: string;
  note: string;
  seeCreations: string;
}

export function HeroOrder({ locale, message, image, cake, caption, field, cta, note, seeCreations }: HeroOrderProps) {
  const name = useHomeName();
  // Replay the piping once the visitor pauses, not on every keystroke.
  const settled = useSettled(name.trim(), 450);
  const waHref = buildWhatsAppUrl({ locale, kind: "general", name });

  return (
    <>
      <LetteredBoard
        lang={locale}
        message={message}
        name={name}
        pipeKey={`${message}|${settled}`}
        image={
          image && {
            ...image,
            priority: true,
            sizes: "(min-width: 900px) 380px, (max-height: 760px) min(48vw, 250px), min(58vw, 300px)",
          }
        }
        caption={caption}
        tag={
          cake && (
            <Link
              href={cake.href}
              aria-label={cake.refAria}
              className="inline-flex min-h-6 items-center rounded-pill no-underline"
            >
              <RefTag refCode={cake.refCode} />
            </Link>
          )
        }
        className="mt-2 w-[min(58vw,300px)] justify-self-center [@media(max-width:899px)_and_(max-height:760px)]:w-[min(48vw,250px)] desk:col-start-2 desk:row-span-4 desk:row-start-1 desk:mt-0 desk:w-[min(100%,380px)] desk:self-center"
      />

      <NameField
        value={name}
        onChange={setHomeName}
        label={field.label}
        placeholder={field.placeholder}
        onSubmit={() => window.open(waHref, "_blank", "noopener,noreferrer")}
        className="desk:max-w-[460px]"
      />

      <div className="grid gap-2 desk:flex desk:items-center desk:gap-6">
        <Button href={waHref} icon="whatsapp" block className="desk:w-auto desk:shrink-0">
          {cta}
        </Button>
        <p className="type-meta text-center text-ink-muted desk:max-w-[30ch] desk:text-start">
          {note}{" "}
          <a
            href="#creations"
            className="font-semibold whitespace-nowrap text-ink underline decoration-framboise decoration-2 underline-offset-4"
          >
            {seeCreations}
          </a>
        </p>
      </div>
    </>
  );
}
