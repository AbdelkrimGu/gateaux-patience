import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge the custom theme keys, otherwise `text-step-head`
// is taken for a colour and silently dropped next to `text-tone-fg`.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["step-small", "step-body", "step-lead", "step-head", "step-display"] }],
      shadow: [{ shadow: ["gp-print", "gp-lifted", "gp-chip", "gp-card"] }],
      rounded: [{ rounded: ["gp-card", "gp-section"] }],
      ease: [{ ease: ["gp"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDimensions(
  length?: number,
  width?: number,
  height?: number,
  locale: string = "fr"
) {
  if (!length && !width && !height) return null;
  const parts = [];
  if (length) parts.push(`${length}`);
  if (width) parts.push(`${width}`);
  if (height) parts.push(`${height}`);
  return parts.join(" × ") + " cm";
}

export function getWhatsAppLink(phone: string, message: string) {
  const cleaned = phone.replace(/\D/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export function getLocaleDirection(locale: string): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
