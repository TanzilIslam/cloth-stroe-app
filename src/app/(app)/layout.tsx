"use client"

// App shell: guards auth and role, bottom nav on mobile, sidebar on laptop.
import { LogOut } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { BottomNav } from "@/components/layout/bottom-nav"
import { OWNER_ONLY } from "@/components/layout/nav-items"
import { Sidebar } from "@/components/layout/sidebar"
import { ExpenseForm } from "@/components/hisab/expense-form"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useSession } from "@/hooks/use-session"
import { logout, switchShop } from "@/mocks"
import { shops } from "@/mocks/data" // static config: 2 shops

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [expenseOpen, setExpenseOpen] = useState(false)

  const blocked =
    user?.role === "staff" && OWNER_ONLY.some((p) => pathname.startsWith(p))

  useEffect(() => {
    if (user === null) router.replace("/login")
    else if (blocked) router.replace("/sell")
  }, [user, blocked, router])

  if (!user || blocked) {
    return <div className="flex flex-1 items-center justify-center" />
  }

  const shopIndex = shops.findIndex((s) => s.id === user.shopId)
  const shop = shops[shopIndex]
  const nextShop = shops[(shopIndex + 1) % shops.length]
  const handleLogout = () => logout()

  return (
    <div className="flex min-h-svh">
      <Sidebar
        user={user}
        shops={shops}
        onShopChange={switchShop}
        onExpense={() => setExpenseOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b px-4 py-2 lg:hidden">
          {user.role === "owner" ? (
            <button
              type="button"
              className="text-sm font-medium"
              onClick={() => switchShop(nextShop.id)}
            >
              {shop?.name} ⇄
            </button>
          ) : (
            <span className="text-sm font-medium">{shop?.name}</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <LogOut />
          </Button>
        </div>

        <main className="flex-1 p-4 pb-24 lg:p-6">{children}</main>
      </div>

      <BottomNav role={user.role} onExpense={() => setExpenseOpen(true)} />

      <Sheet open={expenseOpen} onOpenChange={setExpenseOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Add Expense</SheetTitle>
          </SheetHeader>
          <ExpenseForm />
        </SheetContent>
      </Sheet>
    </div>
  )
}
