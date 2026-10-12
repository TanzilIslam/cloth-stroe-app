import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const taka = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 })

/** 125000 → "৳1,25,000" */
export function formatTaka(amount: number) {
  return `${amount < 0 ? "-" : ""}৳${taka.format(Math.abs(amount))}`
}

/** Date → "12 Oct 2026" */
export function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** WhatsApp chat link with a pre-filled message. BD numbers: 01… → 8801… */
export function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "")
  const intl = digits.startsWith("0") ? `88${digits}` : digits
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`
}
