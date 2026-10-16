// Nav links per role. Staff: 3 big actions. Owner: full app.
import {
  BookOpen,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react"

import { ROUTES } from "@/lib/routes"
import type { Role } from "@/types"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const all = {
  dashboard: { href: ROUTES.home, label: "Dashboard", icon: LayoutDashboard },
  sell: { href: ROUTES.sell, label: "Sell", icon: ShoppingCart },
  stock: { href: ROUTES.stock, label: "Stock", icon: Package },
  hisab: { href: ROUTES.hisab, label: "Hisab", icon: BookOpen },
  setup: { href: ROUTES.setup, label: "Setup", icon: Settings },
} satisfies Record<string, NavItem>

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  owner: [all.dashboard, all.sell, all.stock, all.hisab, all.setup],
  staff: [all.sell, all.stock],
}

export function isActive(pathname: string, href: string) {
  return href === ROUTES.home
    ? pathname === ROUTES.home
    : pathname.startsWith(href)
}
