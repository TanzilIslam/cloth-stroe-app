// Nav links per role. Staff: 3 big actions. Owner: full app.
import {
  BookOpen,
  LayoutDashboard,
  Package,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react"

import type { Role } from "@/types"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const all = {
  dashboard: { href: "/", label: "Dashboard", icon: LayoutDashboard },
  sell: { href: "/sell", label: "Sell", icon: ShoppingCart },
  stock: { href: "/stock", label: "Stock", icon: Package },
  hisab: { href: "/hisab", label: "Hisab", icon: BookOpen },
} satisfies Record<string, NavItem>

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  owner: [all.dashboard, all.sell, all.stock, all.hisab],
  staff: [all.sell, all.stock],
}

/** Routes staff cannot open. */
export const OWNER_ONLY = ["/hisab"]

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}
