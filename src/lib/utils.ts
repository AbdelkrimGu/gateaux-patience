import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
