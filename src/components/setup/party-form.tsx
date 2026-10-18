"use client"

// Add or edit a customer / supplier: name, phone and (on add) opening balance.
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface PartyValues {
  name: string
  phone: string
  openingBalance?: number
}

interface PartyFormProps {
  party?: { name: string; phone: string }
  /** Label for the opening balance field; omit to hide it (e.g. on edit). */
  openingLabel?: string
  submitLabel: string
  onSubmit: (values: PartyValues) => Promise<void>
}

const field = "flex flex-col gap-1.5 text-sm font-medium"

export function PartyForm({
  party,
  openingLabel,
  submitLabel,
  onSubmit,
}: PartyFormProps) {
  const [name, setName] = useState(party?.name ?? "")
  const [phone, setPhone] = useState(party?.phone ?? "")
  const [opening, setOpening] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await onSubmit({
        name,
        phone,
        ...(openingLabel ? { openingBalance: Number(opening || 0) } : {}),
      })
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
      {openingLabel && (
        <label className={field}>
          {openingLabel}
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="0"
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
          />
          <span className="text-xs font-normal text-muted-foreground">
            Only for dues from before the app. Later dues come from sales and
            stock in.
          </span>
        </label>
      )}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!name.trim() || pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  )
}
