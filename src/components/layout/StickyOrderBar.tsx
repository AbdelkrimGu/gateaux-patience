import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { buttonClasses } from "@/components/ui/Button";
import { PHONE_E164, PHONE_LOCAL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import styles from "./StickyOrderBar.module.css";

/*
  Sticky mobile order bar (B §7): WhatsApp (flex 1) + 52px call button,
  safe-area aware, hidden ≥900px.
    <StickyOrderBar>      server component, translates itself
    <StickyOrderBarView>  hook-free, all labels as props: use it inside a
                          client island (e.g. a live href built from the
                          typed name) without needing an IntlIsland.

  The WhatsApp message is the caller's: build it with buildWhatsAppUrl()
  for the page's context (cake ref, tiramisu, the typed name…).

  <StickyOrderBar waHref={buildWhatsAppUrl({ locale, kind: "cake", cake, page })} />
  <StickyOrderBar waHref={…} reveal="scroll" />   slides in between 420 and
     520px of scroll (CSS scroll timeline); without support / with reduced
     motion it is always visible.
  <StickyOrderBar waHref={…} reveal="gate" />     home intent gate: same
     reveal, but never over the third card: without scroll-timeline support
     or with reduced motion it stays hidden.

  The footer already reserves room for it on phones.
*/

export interface StickyOrderBarViewProps {
  waHref: string;
  reveal?: "always" | "scroll" | "gate";
  /** common.order.cta */
  label: string;
  /** common.order.cta_short: shown instead of `label` on phones narrower than 380px. */
  shortLabel?: string;
  /** common.order.bar_label */
  navLabel: string;
  /** common.order.call_aria with {phone} = PHONE_LOCAL */
  callLabel: string;
}

export function StickyOrderBarView({ waHref, reveal = "always", label, shortLabel, navLabel, callLabel }: StickyOrderBarViewProps) {
  return (
    <nav aria-label={navLabel} className={cn(styles.bar, reveal === "scroll" && styles.reveal, reveal === "gate" && styles.gate)}>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses({ size: "md", className: "min-w-0 flex-1" })}
      >
        <Icon name="whatsapp" size={22} />
        {shortLabel ? (
          <>
            <span className="hidden truncate min-[380px]:inline">{label}</span>
            <span className="truncate min-[380px]:hidden">{shortLabel}</span>
          </>
        ) : (
          <span className="truncate">{label}</span>
        )}
      </a>
      <a
        href={`tel:${PHONE_E164}`}
        aria-label={callLabel}
        className={buttonClasses({ size: "md", className: "w-[52px] shrink-0 bg-paillette px-0 text-sucre hover:bg-ink-soft" })}
      >
        <Icon name="phone" size={22} />
      </a>
    </nav>
  );
}

export function StickyOrderBar({
  waHref,
  reveal = "always",
  label,
}: {
  waHref: string;
  reveal?: StickyOrderBarViewProps["reveal"];
  /** Defaults to common.order.cta ("Commander sur WhatsApp"). */
  label?: string;
}) {
  const t = useTranslations("common.order");
  return (
    <StickyOrderBarView
      waHref={waHref}
      reveal={reveal}
      label={label ?? t("cta")}
      shortLabel={label ? undefined : t("cta_short")}
      navLabel={t("bar_label")}
      callLabel={t("call_aria", { phone: PHONE_LOCAL })}
    />
  );
}
