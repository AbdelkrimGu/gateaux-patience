"use client";

import { useEffect, useId, useMemo, useState, type CSSProperties, type FocusEvent, type ReactNode } from "react";
import { LetteredBoard, RefTag } from "@/components/ui/LetteredBoard";
import { NameField } from "@/components/ui/NameField";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StickyOrderBarView } from "@/components/layout/StickyOrderBar";
import { useCardArrivalScroll, useRememberCake } from "./CardTransitionScope";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/*
  Cake detail "studio" (B §8 detail signature: "your words on this cake").

  The plate shows the cake's first photo (the page's LCP, server-rendered,
  never opacity-gated) on the scalloped board with the occasion phrase.
  Typing a name updates the ring live and re-pipes it once typing pauses;
  the same name, the date and the guests feed one WhatsApp brief (with the
  cake's ref) used by the CTA and the sticky bar. All fields are optional.

  Layout: phone = title, board, name, details+brief (one column);
  desktop = board in a sticky start column, the rest in the end column.
  Server-rendered pieces come in as slots (title, details).
*/

export interface CakeStudioLabels {
  nameLabel: string;
  namePlaceholder: string;
  nameHint: string;
  briefTitle: string;
  /** Rich: the ref sits in a nowrap <bdi>. */
  briefText: ReactNode;
  dateLabel: string;
  guestsLabel: string;
  guestsPlaceholder: string;
  cta: string;
  opensWhatsApp: string;
  barLabel: string;
  barShortLabel: string;
  barNavLabel: string;
  barCallLabel: string;
}

export interface CakeStudioProps {
  locale: string;
  cake: { title: string; ref: string };
  page: string;
  /** Occasion phrase for the ring (common.occasion.*). */
  message: string;
  ecrin: boolean;
  image?: { src: string; alt: string };
  caption: string;
  slug: string;
  /** view-transition-name shared with the gallery card. */
  transitionName: string;
  boardStyle: CSSProperties;
  labels: CakeStudioLabels;
  title: ReactNode;
  details: ReactNode;
}

const PIPE_DEBOUNCE = 450;

/** Today (local) as the picker minimum, set on focus: no SSR/time-zone mismatch. */
function setMinToday(e: FocusEvent<HTMLInputElement>) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  e.currentTarget.min = d.toISOString().slice(0, 10);
}

export function CakeStudio({
  locale,
  cake,
  page,
  message,
  ecrin,
  image,
  caption,
  slug,
  transitionName,
  boardStyle,
  labels,
  title,
  details,
}: CakeStudioProps) {
  const [name, setName] = useState("");
  const [pipeName, setPipeName] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("");
  const id = useId();
  useRememberCake(slug);
  useCardArrivalScroll(slug);

  // Re-pipe the ring once typing pauses (the text itself updates live).
  useEffect(() => {
    const t = window.setTimeout(() => setPipeName(name.trim()), PIPE_DEBOUNCE);
    return () => window.clearTimeout(t);
  }, [name]);

  const waHref = useMemo(
    () =>
      buildWhatsAppUrl({
        locale,
        kind: "cake",
        cake,
        name: name.trim() || undefined,
        date: date || undefined,
        guests: guests.trim() || undefined,
        page,
      }),
    [locale, cake, name, date, guests, page]
  );

  const field = cn(
    "h-12 w-full min-w-0 rounded-pill bg-white px-4 text-base text-paillette",
    "shadow-[inset_0_0_0_1.5px_var(--color-hairline)] focus:outline-none focus-visible:shadow-[0_0_0_2px_var(--color-framboise)]"
  );
  const fieldLabel = cn("type-meta mb-1.5 flex items-center gap-1.5", ecrin ? "text-sucre/80" : "text-ink-muted");

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-6 [grid-template-areas:'title'_'board'_'name'_'info'] desk:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] desk:grid-rows-[auto_auto_1fr] desk:[grid-template-areas:'board_title'_'board_name'_'board_info']">
        <div className="[grid-area:title]">{title}</div>

        <div className="[grid-area:board] desk:sticky desk:top-8 desk:self-start desk:pt-2">
          <LetteredBoard
            lang={locale}
            message={message}
            name={name}
            pipeKey={`${message}|${pipeName}`}
            // Set on arrival (the morph is the entrance); piped only once a name is typed.
            animate={pipeName ? "pipe" : "none"}
            tone={ecrin ? "ecrin" : "sucre"}
            image={
              image && {
                ...image,
                priority: true,
                sizes: "(min-width: 900px) 420px, min(70vw, 320px)",
                position: "50% 40%",
              }
            }
            tag={<RefTag refCode={cake.ref} />}
            caption={caption}
            className={cn(
              "mx-auto w-[min(70vw,320px)]",
              ecrin ? "desk:w-[min(100%,380px)]" : "desk:w-[min(100%,420px)]"
            )}
            style={{ viewTransitionName: transitionName, ...boardStyle }}
          />
        </div>

        <div className="[grid-area:name]">
          <NameField
            value={name}
            onChange={setName}
            label={labels.nameLabel}
            placeholder={labels.namePlaceholder}
            tone={ecrin ? "ecrin" : "sucre"}
            className="max-w-[440px]"
          />
          <p className={cn("type-meta mt-2 ps-5", ecrin ? "text-sucre/75" : "text-ink-muted")}>{labels.nameHint}</p>
          {/* The cake-specific order, in the first viewport (same brief as below). */}
          <Button href={waHref} icon="whatsapp" className="mt-5 w-full max-w-[440px] desk:w-auto">
            {labels.cta}
            <span className="sr-only"> ({labels.opensWhatsApp})</span>
          </Button>
        </div>

        <div className="[grid-area:info]">
          {details}

          <section aria-labelledby={`${id}-brief`} className="mt-10">
            <h2 id={`${id}-brief`} className="type-band">
              {labels.briefTitle}
            </h2>
            <p className={cn("type-meta mt-2 max-w-[46ch]", ecrin ? "text-sucre/80" : "text-ink-soft")}>
              {labels.briefText}
            </p>
            <div className="mt-5 grid max-w-[440px] grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${id}-date`} className={fieldLabel}>
                  <Icon name="calendar" size={16} />
                  {labels.dateLabel}
                </label>
                <input
                  id={`${id}-date`}
                  type="date"
                  value={date}
                  onFocus={setMinToday}
                  onChange={(e) => setDate(e.target.value)}
                  className={field}
                />
              </div>
              <div>
                <label htmlFor={`${id}-guests`} className={fieldLabel}>
                  <Icon name="guests" size={16} />
                  {labels.guestsLabel}
                </label>
                <input
                  id={`${id}-guests`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={guests}
                  placeholder={labels.guestsPlaceholder}
                  onChange={(e) => setGuests(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  className={field}
                />
              </div>
            </div>
            <Button href={waHref} icon="whatsapp" className="mt-6 w-full desk:w-auto">
              {labels.cta}
              <span className="sr-only"> ({labels.opensWhatsApp})</span>
            </Button>
          </section>
        </div>
      </div>

      <StickyOrderBarView
        waHref={waHref}
        label={labels.barLabel}
        shortLabel={labels.barShortLabel}
        navLabel={labels.barNavLabel}
        callLabel={labels.barCallLabel}
      />
    </>
  );
}
