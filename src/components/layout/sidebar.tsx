"use client"

// Laptop sidebar: nav, shop switcher (owner), user and logout.
import { LogOut, Wallet } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { SessionUser, Shop } from "@/types"

import { Brand } from "./brand"
import { isActive, NAV_ITEMS } from "./nav-items"

interface SidebarProps {
  user: SessionUser
  shops: Shop[]
  onShopChange: (shopId: number) => void
  onExpense: () => void
  onLogout: () => void
}

export function Sidebar({
  user,
  shops,
  onShopChange,
  onExpense,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname()
  const shop = shops.find((s) => s.id === user.shopId)

  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r bg-sidebar p-4 lg:flex">
      <Brand className="mb-5 px-1" />

      {user.role === "owner" ? (
        <Select
          value={String(user.shopId)}
          onValueChange={(v) => onShopChange(Number(v))}
        >
          <SelectTrigger className="mb-4 w-full" aria-label="Shop">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {shops.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="mb-4 px-2 text-sm text-muted-foreground">{shop?.name}</p>
      )}

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS[user.role].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
              isActive(pathname, href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={onExpense}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent"
        >
          <Wallet className="size-4" />
          Expense
        </button>
      </nav>

      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {user.name.charAt(0)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">
              {user.name}
            </span>
            <span className="block text-xs text-muted-foreground capitalize">
              {user.role}
            </span>
          </span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          aria-label="Logout"
        >
          <LogOut />
        </Button>
      </div>
    </aside>
  )
}
