"use client"

// Add or edit a staff / owner account: name, role, shop, 4-digit PIN.
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Role, Shop, UserInput, UserRow } from "@/types"

interface UserFormProps {
  user?: UserRow
  shops: Shop[]
  onSubmit: (input: UserInput) => Promise<void>
}

const field = "flex flex-col gap-1.5 text-sm font-medium"

export function UserForm({ user, shops, onSubmit }: UserFormProps) {
  const [name, setName] = useState(user?.name ?? "")
  const [role, setRole] = useState<Role>(user?.role ?? "staff")
  const [shopId, setShopId] = useState(user?.shopId ?? shops[0]?.id ?? 1)
  const [pin, setPin] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pinOk = user ? pin === "" || pin.length === 4 : pin.length === 4
  const valid = name.trim() && pinOk

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await onSubmit({ name, role, shopId, pin: pin || null })
    } catch (err) {
      setError((err as Error).message)
    }
    setPending(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className={field}>
        Name
        <Input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={field}>
          Role
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className={field}>
          Shop
          <Select
            value={String(shopId)}
            onValueChange={(v) => setShopId(Number(v))}
          >
            <SelectTrigger className="w-full">
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
        </label>
      </div>
      <label className={field}>
        {user ? "New PIN (leave empty to keep)" : "PIN (4 digits)"}
        <Input
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          className="h-12 text-lg tracking-[0.5em]"
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
          }
        />
      </label>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={!valid || pending}>
        {pending ? "Saving…" : user ? "Save changes" : "Add user"}
      </Button>
    </form>
  )
}
