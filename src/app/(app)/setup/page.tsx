"use client"

// Owner only: staff accounts (add, rename, PIN, deactivate) and the active
// shop's customers and suppliers (add, edit name / phone).
import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"
import { PartyForm } from "@/components/setup/party-form"
import { UserForm } from "@/components/setup/user-form"
import { DataTable } from "@/components/shared/data-table"
import { LoadError, Loading, queryStatus } from "@/components/shared/load-state"
import { Money } from "@/components/shared/money"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  createUser,
  getLoginLocks,
  getParties,
  getUsers,
  saveParty,
  setUserActive,
  unlockLogin,
  updateParty,
  updateUser,
} from "@/api"
import { useQuery } from "@/hooks/use-query"
import { useSession } from "@/hooks/use-session"
import { useShops } from "@/hooks/use-shops"
import { formatTime } from "@/lib/utils"
import type { Customer, ID, PartyType, Supplier, UserRow } from "@/types"

type Editing =
  | { kind: "user"; row?: UserRow }
  | { kind: PartyType; row?: Customer | Supplier }
  | null

export default function SetupPage() {
  const me = useSession()!
  const shopId = me.shopId
  const shops = useShops()
  const shopName = shops.find((s) => s.id === shopId)?.name ?? ""

  const users = useQuery(getUsers, [])
  const locks = useQuery(getLoginLocks, [])
  const customers = useQuery(() => getParties("customer", shopId), [shopId])
  const suppliers = useQuery(() => getParties("supplier", shopId), [shopId])
  const status = queryStatus(users, customers, suppliers)

  const [editing, setEditing] = useState<Editing>(null)
  const close = () => setEditing(null)

  async function savePartyForm(
    type: PartyType,
    id: ID | undefined,
    values: { name: string; phone: string }
  ) {
    const input = { shopId, ...values }
    if (id) await updateParty(type, id, input)
    else if (type === "customer") await saveParty("customer", input)
    else await saveParty("supplier", input)
    toast.success(
      id ? "Saved" : type === "customer" ? "Customer added" : "Supplier added"
    )
    close()
    if (type === "customer") customers.reload()
    else suppliers.reload()
  }

  const partyColumns = (type: PartyType) => [
    {
      header: "Name",
      cell: (r: Customer | Supplier) => (
        <span className="font-medium">{r.name}</span>
      ),
    },
    { header: "Phone", cell: (r: Customer | Supplier) => r.phone || "—" },
    {
      header: type === "customer" ? "Owes us" : "We owe",
      cell: (r: Customer | Supplier) => (
        <Money amount={"dueBalance" in r ? r.dueBalance : r.payableBalance} />
      ),
    },
  ]

  const editingUser = editing?.kind === "user" ? editing.row : undefined

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Setup" subtitle={shopName} />
      {status.error && <LoadError onRetry={status.retry} />}

      <Tabs defaultValue="staff">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="mt-3 flex flex-col gap-3">
          <Button
            className="self-end"
            onClick={() => setEditing({ kind: "user" })}
          >
            <Plus /> Add user
          </Button>
          {(locks.data ?? []).length > 0 && (
            <section className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <h3 className="mb-2 text-sm font-medium">
                Locked devices (too many wrong PINs)
              </h3>
              <ul className="flex flex-col gap-2 text-sm">
                {(locks.data ?? []).map((l) => (
                  <li
                    key={l.ip}
                    className="flex items-center justify-between gap-3"
                  >
                    <span>
                      {l.ip} · until{" "}
                      {l.lockedUntil && formatTime(l.lockedUntil)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await unlockLogin(l.ip)
                        toast.success("Unlocked")
                        locks.reload()
                      }}
                    >
                      Unlock
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {users.loading ? (
            <Loading />
          ) : (
            <DataTable
              rows={users.data ?? []}
              rowKey={(u) => u.id}
              onRowClick={(row) => setEditing({ kind: "user", row })}
              columns={[
                {
                  header: "Name",
                  cell: (u) => <span className="font-medium">{u.name}</span>,
                },
                {
                  header: "Role",
                  cell: (u) => (u.role === "owner" ? "Owner" : "Staff"),
                },
                {
                  header: "Shop",
                  cell: (u) => shops.find((s) => s.id === u.shopId)?.name,
                  className: "hidden sm:table-cell",
                },
                {
                  header: "Status",
                  cell: (u) =>
                    u.active ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    ),
                },
              ]}
            />
          )}
        </TabsContent>

        {(["customer", "supplier"] as const).map((type) => {
          const q = type === "customer" ? customers : suppliers
          return (
            <TabsContent
              key={type}
              value={`${type}s`}
              className="mt-3 flex flex-col gap-3"
            >
              <Button
                className="self-end"
                onClick={() => setEditing({ kind: type })}
              >
                <Plus /> Add {type}
              </Button>
              {q.loading ? (
                <Loading />
              ) : (
                <DataTable
                  rows={(q.data ?? []) as (Customer | Supplier)[]}
                  rowKey={(r) => r.id}
                  onRowClick={(row) => setEditing({ kind: type, row })}
                  columns={partyColumns(type)}
                  empty={`No ${type}s yet`}
                />
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editing?.row ? "Edit" : "Add"}{" "}
              {editing?.kind === "user" ? "user" : editing?.kind}
            </DialogTitle>
          </DialogHeader>

          {editing?.kind === "user" && (
            <>
              <UserForm
                key={editingUser?.id ?? "new"}
                user={editingUser}
                shops={shops}
                onSubmit={async (input) => {
                  if (editingUser) await updateUser(editingUser.id, input)
                  else await createUser(input)
                  toast.success(editingUser ? "User saved" : "User added")
                  close()
                  users.reload()
                }}
              />
              {editingUser && editingUser.id !== me.id && (
                <Button
                  variant="ghost"
                  className={editingUser.active ? "text-destructive" : ""}
                  onClick={async () => {
                    try {
                      await setUserActive(editingUser.id, !editingUser.active)
                      toast.success(
                        editingUser.active
                          ? "User deactivated"
                          : "User activated"
                      )
                      close()
                      users.reload()
                    } catch (e) {
                      toast.error((e as Error).message)
                    }
                  }}
                >
                  {editingUser.active
                    ? "Deactivate (can't log in)"
                    : "Activate"}
                </Button>
              )}
            </>
          )}

          {(editing?.kind === "customer" || editing?.kind === "supplier") && (
            <PartyForm
              key={editing.row?.id ?? "new"}
              party={editing.row}
              submitLabel={editing.row ? "Save changes" : `Add ${editing.kind}`}
              onSubmit={(values) =>
                savePartyForm(editing.kind, editing.row?.id, values)
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
