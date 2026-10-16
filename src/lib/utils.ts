import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { SHOP_TZ } from "./config"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const taka = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 })

/** 125000 → "৳1,25,000" */
export function formatTaka(amount: number) {
  return `${amount < 0 ? "-" : ""}৳${taka.format(Math.abs(amount))}`
}

/** Date → "12 Oct 2026" (shop time, Dhaka) */
export function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    timeZone: SHOP_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** Variant name, e.g. "M · Blue"; "" when it has neither. */
export function variantLabel(v: { size: string | null; color: string | null }) {
  return [v.size, v.color].filter(Boolean).join(" · ")
}

/** WhatsApp chat link with a pre-filled message. BD numbers: 01… → 8801… */
export function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "")
  const intl = digits.startsWith("0") ? `88${digits}` : digits
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`
}

/** A day in shop time (Dhaka) as "YYYY-MM-DD", shifted by `addDays`. */
export function shopDay(addDays = 0, from = new Date()) {
  const d = new Date(from.getTime() + addDays * 24 * 60 * 60 * 1000)
  return d.toLocaleDateString("en-CA", { timeZone: SHOP_TZ })
}

/** Time in shop time, e.g. "4:05 pm". */
export function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    timeZone: SHOP_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}
