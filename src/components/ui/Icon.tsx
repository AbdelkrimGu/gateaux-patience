import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/*
  Custom icon set (B §9): 24 grid, 2px round strokes, currentColor.
  Only `whatsapp` and `phone` are filled. Directional icons (chevron, arrow,
  back) mirror in RTL automatically; phone/WhatsApp/brand never mirror.
  No lucide in public UI.
*/

type IconDef = { d: string | string[]; fill?: boolean; directional?: boolean };

const ICONS = {
  menu: { d: ["M4 7h16", "M4 12h16", "M4 17h16"] },
  close: { d: ["M6 6l12 12", "M18 6L6 18"] },
  // Points to the inline END (right in LTR, left in RTL).
  chevron: { d: "M9.5 5.5L16 12l-6.5 6.5", directional: true },
  arrow: { d: ["M4.5 12h15", "M13.5 6l6 6-6 6"], directional: true },
  // Points to the inline START (back navigation).
  back: { d: ["M19.5 12h-15", "M10.5 6l-6 6 6 6"], directional: true },
  calendar: {
    d: ["M5 6.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1Z", "M4 10.5h16", "M8 4v4", "M16 4v4"],
  },
  guests: {
    d: [
      "M9 11a3.25 3.25 0 1 0 0-6.5A3.25 3.25 0 0 0 9 11Z",
      "M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5",
      "M15.5 4.8a3.25 3.25 0 0 1 0 6.1",
      "M17.2 14.7c1.8.6 3 2.2 3.3 4.8",
    ],
  },
  gift: {
    d: [
      "M4.5 10h15v10h-15z",
      "M3.5 7h17v3h-17z",
      "M12 7v13",
      "M12 7c-1.2-2.6-4.6-3.4-5.2-1.4C6.4 7 9 7 12 7Z",
      "M12 7c1.2-2.6 4.6-3.4 5.2-1.4C17.6 7 15 7 12 7Z",
    ],
  },
  pin: { d: ["M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z", "M12 12.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"] },
  instagram: {
    d: [
      "M7.5 3.5h9a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4Z",
      "M12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z",
      "M17.1 6.9h.01",
    ],
  },
  facebook: { d: "M14.5 3.5h-1.8a3.7 3.7 0 0 0-3.7 3.7V10H6.8v3.2H9v7.3h3.3v-7.3h2.4l.5-3.2h-2.9V7.6c0-.6.4-1 1-1h1.2Z" },
  check: { d: "M5 12.5l4.5 4.5L19 7.5" },
  phone: {
    fill: true,
    d: "M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z",
  },
  whatsapp: {
    fill: true,
    d: "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.7 11.7 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z",
  },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  /** px; default 24. */
  size?: number;
  /** Accessible name. Omit for decorative icons (aria-hidden). */
  label?: string;
}

export function Icon({ name, size = 24, label, className, ...rest }: IconProps) {
  const def: IconDef = ICONS[name];
  const paths = Array.isArray(def.d) ? def.d : [def.d];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={def.fill ? "currentColor" : "none"}
      stroke={def.fill ? "none" : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={cn("shrink-0", def.directional && "flip-rtl", className)}
      {...rest}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
