"use client"

// Mobile bottom nav with big buttons. Staff: Sell, Stock, Expense.
import { Wallet } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import type { Role } from "@/types"

import { isActive, NAV_ITEMS } from "./nav-items"

interface BottomNavProps {
  role: Role
  onExpense: () => void
}

const itemClass =
  "flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium"

export function BottomNav({ role, onExpense }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
      {NAV_ITEMS[role].map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            itemClass,
            isActive(pathname, href) ? "text-primary" : "text-muted-foreground"
          )}
        >
          <Icon className="size-6" />
          {label}
        </Link>
      ))}
      {role === "staff" && (
        <button
          type="button"
          onClick={onExpense}
          className={cn(itemClass, "text-muted-foreground")}
        >
          <Wallet className="size-6" />
          Expense
        </button>
      )}
    </nav>
  )
}
