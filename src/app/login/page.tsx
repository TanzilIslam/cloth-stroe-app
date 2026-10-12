"use client"

// PIN login. Staff land on /sell, owner on the dashboard.
// Already logged in (e.g. opening the installed app) → straight to home.
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { PinPad } from "@/components/shared/pin-pad"
import { useSession } from "@/hooks/use-session"
import { login } from "@/mocks"
import type { Role } from "@/types"

const HOME: Record<Role, string> = { owner: "/", staff: "/sell" }

export default function LoginPage() {
  const router = useRouter()
  const user = useSession()

  useEffect(() => {
    if (user) router.replace(HOME[user.role])
  }, [user, router])

  async function handleSubmit(pin: string) {
    const loggedIn = await login(pin)
    return !!loggedIn
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Shop Dashboard</h1>
        <p className="text-sm text-muted-foreground">Enter your PIN</p>
      </div>
      <PinPad onSubmit={handleSubmit} />
    </main>
  )
}
