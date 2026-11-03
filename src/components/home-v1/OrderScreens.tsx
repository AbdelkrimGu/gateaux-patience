"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Check, Heart } from "lucide-react";
import { BrandBadge, BrandWordmark } from "@/components/gp/Brand";
import WhatsAppIcon from "@/components/gp/WhatsAppIcon";
import type { HomePhoto } from "@/lib/home-data";
import { cn } from "@/lib/utils";

export interface StoryPhotos {
  /** The cake the visitor "chooses" (shown in the gallery, the message, the polaroid). */
  chosen: HomePhoto;
  /** Three other gallery tiles. */
  others: HomePhoto[];
  /** The finished cake (another photo of the chosen cake when there is one). */
  finished: HomePhoto;
}

/** The phone body. Its screen is always 280 × 580 (scale the whole phone for small sizes). */
export function Phone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative h-[600px] w-[300px] rounded-[46px] bg-[color-mix(in_srgb,rgb(var(--gp-ink))_88%,rgb(var(--gp-cream)))] p-[10px] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)] ring-1 ring-gp-cream/10",
        className
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-gp-cream text-gp-ink">
        <span className="absolute start-1/2 top-2.5 z-20 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-gp-ink rtl:translate-x-1/2" />
        {children}
      </div>
    </div>
  );
}

function ChatHeader() {
  const t = useTranslations("home.steps");
  return (
    <div className="flex items-center gap-2.5 bg-gp-raspberry px-4 pb-3 pt-11 text-gp-cream">
      <BrandBadge size={34} />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[15px] font-semibold">Gateaux Patience</p>
        <p className="flex items-center gap-1 text-[12px] opacity-85">
          <WhatsAppIcon className="h-3 w-3" />
          {t("wa_label")}
        </p>
      </div>
    </div>
  );
}

function ChatInput() {
  const t = useTranslations("home.steps");
  return (
    <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-full bg-white/70 py-1.5 pe-1.5 ps-4 ring-1 ring-gp-ink/10">
      <span className="flex-1 text-[13px] text-gp-ink/70">{t("wa_input")}</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gp-raspberry text-gp-cream">
        <WhatsAppIcon className="h-4 w-4" />
      </span>
    </div>
  );
}

function OutBubble({ photo, compact = false }: { photo: HomePhoto; compact?: boolean }) {
  const tw = useTranslations("order_wa");
  return (
    <div
      className={cn(
        "ms-auto w-[78%] rounded-[18px] rounded-ee-[6px] bg-[color-mix(in_srgb,rgb(var(--gp-raspberry))_14%,rgb(var(--gp-cream)))] p-1.5 shadow-[0_6px_14px_-10px_rgb(var(--gp-ink)/0.4)]",
        compact && "w-[62%] opacity-60"
      )}
    >
      <span className={cn("relative block overflow-hidden rounded-[13px]", compact ? "aspect-[2/1]" : "aspect-square")}>
        <Image src={photo.src} alt="" width={220} height={220} className="h-full w-full object-cover" />
      </span>
      {!compact ? (
        <p className="px-2 pb-1 pt-2 text-[13px] leading-snug">
          {tw("hello")} {tw("cake", { cake: photo.alt })}
        </p>
      ) : null}
    </div>
  );
}

/** Stagger index for CSS entrances (see .gp-screen in home-v1.css). */
const d = (i: number) => ({ "--d": i }) as React.CSSProperties;

/**
 * One screen of the "watch an order" phone. `live` = its items stagger in
 * (CSS transitions: opacity + transform) each time the screen becomes
 * `active`; otherwise the final state is shown, static.
 */
export function OrderScreen({
  step,
  photos,
  live,
  active = true,
}: {
  step: number;
  photos: StoryPhotos;
  live: boolean;
  active?: boolean;
}) {
  const t = useTranslations("home.steps");
  const tf = useTranslations("frame");
  const screen = { "data-live": live || undefined, "data-active": active };

  if (step === 0) {
    const tiles = [photos.others[0], photos.chosen, ...photos.others.slice(1, 5)].filter(Boolean);
    return (
      <div {...screen} className="gp-screen absolute inset-0 px-4 pt-12">
        <p style={d(0)} className="gp-in font-display text-[22px] font-semibold tracking-[-0.03em] rtl:tracking-normal">
          {tf("gallery")}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {tiles.map((p, i) => {
            const chosen = p.src === photos.chosen.src;
            return (
              <div
                key={p.src}
                style={d(i + 1)}
                className={cn(
                  "gp-in relative aspect-square overflow-hidden rounded-[14px] bg-gp-champagne",
                  chosen && "ring-[3px] ring-gp-raspberry ring-offset-2 ring-offset-gp-cream"
                )}
              >
                <Image src={p.src} alt="" width={124} height={124} className="h-full w-full object-cover" />
                {chosen ? (
                  <span
                    style={d(tiles.length + 1)}
                    className="gp-pop absolute end-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-gp-raspberry text-gp-cream shadow-gp-chip"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
        <p style={d(tiles.length + 1)} className="gp-in mt-3 truncate text-[13px] font-medium text-gp-ink/70">
          {photos.chosen.alt}
        </p>
      </div>
    );
  }

  if (step === 1 || step === 2) {
    const chips = [t("chip_size"), t("chip_flavour"), t("chip_decor"), t("chip_message")];
    return (
      <div
        {...screen}
        className="gp-screen absolute inset-0 flex flex-col bg-[color-mix(in_srgb,rgb(var(--gp-champagne))_45%,rgb(var(--gp-cream)))]"
      >
        <ChatHeader />
        <div className="flex flex-1 flex-col justify-end gap-3 px-3 pb-[68px]">
          <div style={d(0)} className="gp-in">
            <OutBubble photo={photos.chosen} compact={step === 2} />
          </div>
          {step === 2 ? (
            <div
              style={d(1)}
              className="gp-in w-[84%] rounded-[18px] rounded-es-[6px] bg-white/80 p-3 shadow-[0_6px_14px_-10px_rgb(var(--gp-ink)/0.4)] ring-1 ring-gp-ink/5"
            >
              <p className="text-[13px] font-semibold text-gp-raspberry">{t("s3_title")}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {chips.map((c, i) => (
                  <li
                    key={c}
                    style={d(i + 2)}
                    className="gp-pop inline-flex items-center gap-1 rounded-full bg-gp-raspberry/10 px-2.5 py-1 text-[12px] font-medium text-gp-ink"
                  >
                    <Check className="h-3 w-3 text-gp-raspberry" strokeWidth={3} />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <ChatInput />
      </div>
    );
  }

  // step 3: the finished cake
  return (
    <div {...screen} className="gp-screen absolute inset-0 px-4 pt-12">
      <div style={d(0)} className="gp-in relative aspect-[4/5] overflow-hidden rounded-[22px] bg-gp-champagne">
        <Image src={photos.finished.src} alt="" width={248} height={310} className="h-full w-full object-cover" />
      </div>
      <p
        style={{ ...d(2), rotate: "var(--gp-sticker-rot)" } as React.CSSProperties}
        className="gp-pop absolute end-3 top-[54%] rounded-full bg-gp-raspberry px-4 py-1.5 font-note text-[22px] font-bold leading-tight text-gp-cream shadow-gp-chip [--gp-sticker-rot:-6deg] rtl:text-[18px] rtl:[--gp-sticker-rot:6deg]"
      >
        {t("sticker")}
      </p>
      <p style={d(1)} className="gp-in mt-5 text-center font-display text-[17px] font-semibold tracking-[-0.02em] rtl:tracking-normal">
        {photos.finished.alt}
      </p>
      <div style={d(3)} className="gp-in mt-6 flex justify-center">
        <BrandWordmark decorative className="w-[150px] text-gp-raspberry" />
      </div>
    </div>
  );
}