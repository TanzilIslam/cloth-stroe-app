"use client"

// PIN login. Staff land on /sell, owner on the dashboard.
// Already logged in (e.g. opening the installed app) → straight to home.
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { Brand } from "@/components/layout/brand"
import { PinPad } from "@/components/shared/pin-pad"
import { useSession } from "@/hooks/use-session"
import { login } from "@/api"
import { ROUTES } from "@/lib/routes"
import { setSessionUser } from "@/lib/session-store"
import type { Role } from "@/types"

const HOME: Record<Role, string> = { owner: ROUTES.home, staff: ROUTES.sell }

export default function LoginPage() {
  const router = useRouter()
  const user = useSession()

  useEffect(() => {
    if (user) router.replace(HOME[user.role])
  }, [user, router])

  async function handleSubmit(pin: string) {
    try {
      const loggedIn = await login(pin)
      if (!loggedIn) return "Wrong PIN, try again"
      setSessionUser(loggedIn)
      return null
    } catch (e) {
      return (e as Error).message // e.g. too many wrong PINs
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 surface px-6 py-8 shadow-sm sm:px-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Brand showName={false} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Shop Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your 4-digit PIN
            </p>
          </div>
        </div>
        <PinPad onSubmit={handleSubmit} />
      </div>
    </main>
  )
}
