"use client"

// PIN login. Staff land on /sell, owner on the dashboard.
import { useRouter } from "next/navigation"

import { PinPad } from "@/components/shared/pin-pad"
import { login } from "@/mocks"

export default function LoginPage() {
  const router = useRouter()

  async function handleSubmit(pin: string) {
    const user = await login(pin)
    if (!user) return false
    router.replace(user.role === "owner" ? "/" : "/sell")
    return true
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
