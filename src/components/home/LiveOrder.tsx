"use client";

import { Button } from "@/components/ui/Button";
import { StickyOrderBarView, type StickyOrderBarViewProps } from "@/components/layout/StickyOrderBar";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useHomeName } from "./name-store";

/*
  WhatsApp links further down the home page carry the name typed in the
  hero too, so the brief started there is never lost. The server HTML has
  the plain link; the name is added after hydration.
*/

export function LiveWhatsAppButton({
  locale,
  children,
  className,
}: {
  locale: string;
  children: string;
  className?: string;
}) {
  const name = useHomeName();
  return (
    <Button href={buildWhatsAppUrl({ locale, kind: "general", name })} icon="whatsapp" className={className}>
      {children}
    </Button>
  );
}

export function HomeStickyBar({
  locale,
  ...labels
}: { locale: string } & Omit<StickyOrderBarViewProps, "waHref" | "reveal">) {
  const name = useHomeName();
  return (
    <StickyOrderBarView waHref={buildWhatsAppUrl({ locale, kind: "general", name })} reveal="scroll" {...labels} />
  );
}
