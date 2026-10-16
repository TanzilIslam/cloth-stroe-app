"use client"

// Add or edit a customer / supplier: name and phone.
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PartyFormProps {
  party?: { name: string; phone: string }
  submitLabel: string
  onSubmit: (values: { name: string; phone: string }) => Promise<void>
}

const field = "flex flex-col gap-1.5 text-sm font-medium"

export function PartyForm({ party, submitLabel, onSubmit }: PartyFormProps) {
  const [name, setName] = useState(party?.name ?? "")
  const [phone, setPhone] = useState(party?.phone ?? "")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await onSubmit({ name, phone })
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
      <label className={field}>
        Phone
        <Input
          inputMode="tel"
          placeholder="01XXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={!name.trim() || pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  )
}
