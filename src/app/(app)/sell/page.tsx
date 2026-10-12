"use client"

// POS: search / tap product → qty → pay. Tablet+: grid left, cart right.
import { ShoppingCart, Undo2 } from "lucide-react"
import { useDeferredValue, useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"
import { Money } from "@/components/shared/money"
import { AddItemDialog } from "@/components/sell/add-item-dialog"
import { Cart } from "@/components/sell/cart"
import { PayDialog, type Payment } from "@/components/sell/pay-dialog"
import { ProductSearch } from "@/components/sell/product-search"
import { productStock, ProductTile } from "@/components/sell/product-tile"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCart } from "@/hooks/use-cart"
import { useQuery } from "@/hooks/use-query"
import { useSession } from "@/hooks/use-session"
import {
  createSale,
  getParties,
  getRecentProducts,
  saveParty,
  searchProducts,
} from "@/mocks"
import { cn, formatTaka } from "@/lib/utils"
import type { ProductWithVariants } from "@/types"

export default function SellPage() {
  const user = useSession()!
  const shopId = user.shopId
  const cart = useCart()

  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const [returnMode, setReturnMode] = useState(false)
  const [picked, setPicked] = useState<ProductWithVariants | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)

  const recent = useQuery(() => getRecentProducts(shopId), [shopId])
  const results = useQuery(
    () => searchProducts(shopId, deferredQuery),
    [shopId, deferredQuery]
  )
  const customers = useQuery(() => getParties("customer", shopId), [shopId])

  const list = query.trim() ? (results.data ?? []) : (recent.data ?? [])

  function pickExactMatch() {
    const exact = results.data?.find((p) => p.barcode === query.trim())
    if (exact) setPicked(exact)
  }

  async function handleConfirm(payment: Payment) {
    await createSale({
      shopId,
      userId: user.id,
      items: cart.toInput(),
      discount: cart.discount,
      ...payment,
    })
    toast.success(cart.total < 0 ? "Refund saved" : "Sale saved", {
      description: formatTaka(Math.abs(cart.total)),
    })
    cart.clear()
    setPayOpen(false)
    setCartOpen(false)
    setQuery("")
    setReturnMode(false)
    recent.reload()
    customers.reload()
  }

  function openPay() {
    setCartOpen(false)
    setPayOpen(true)
  }

  return (
    <div className="md:grid md:grid-cols-[1fr_20rem] md:gap-6 xl:grid-cols-[1fr_24rem]">
      <section className="flex flex-col gap-4 pb-20 md:pb-0">
        <PageHeader
          title="Sell"
          actions={
            <Button
              variant={returnMode ? "destructive" : "outline"}
              onClick={() => setReturnMode(!returnMode)}
              aria-pressed={returnMode}
            >
              <Undo2 /> Return {returnMode ? "on" : "off"}
            </Button>
          }
        />
        <ProductSearch
          value={query}
          onChange={setQuery}
          onSubmit={pickExactMatch}
        />

        {returnMode && (
          <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            Return mode: items you add are returned to stock.
          </p>
        )}

        {recent.loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products found</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((p) => {
              const available =
                productStock(p) -
                cart.items
                  .filter((i) => i.product.id === p.id)
                  .reduce((s, i) => s + i.qty, 0)
              return (
                <ProductTile
                  key={p.id}
                  product={p}
                  available={available}
                  disabled={!returnMode && available <= 0}
                  onSelect={() => setPicked(p)}
                />
              )
            })}
          </div>
        )}
      </section>

      {/* Tablet+: cart column */}
      <aside className="hidden md:block">
        <div className="sticky top-6 rounded-lg border p-4">
          <h2 className="mb-2 font-semibold">Cart</h2>
          <Cart cart={cart} onPay={openPay} />
        </div>
      </aside>

      {/* Mobile: cart bar above bottom nav */}
      {cart.count > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className={cn(
            "fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex h-14 items-center justify-between rounded-lg bg-primary px-4 text-primary-foreground shadow-lg md:hidden"
          )}
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="size-5" /> {cart.count}{" "}
            {cart.count === 1 ? "item" : "items"}
          </span>
          <Money amount={cart.total} className="text-lg font-semibold" />
        </button>
      )}

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="max-h-[90svh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Cart</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <Cart cart={cart} onPay={openPay} />
          </div>
        </SheetContent>
      </Sheet>

      <AddItemDialog
        product={picked}
        returnMode={returnMode}
        inCart={cart.qtyOf}
        onAdd={(variant, qty) => picked && cart.add(picked, variant, qty)}
        onClose={() => setPicked(null)}
      />

      <PayDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        total={cart.total}
        customers={customers.data ?? []}
        onAddCustomer={async (name, phone) => {
          const c = await saveParty("customer", { shopId, name, phone })
          customers.reload()
          return c
        }}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
