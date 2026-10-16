"use client"

// Products, variants, stock in, low and dead stock alerts.
// Owner: add / edit products. Staff: view + stock in (no cost shown).
import { PackagePlus, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/page-header"
import { LoadError, Loading, queryStatus } from "@/components/shared/load-state"
import { ProductForm } from "@/components/stock/product-form"
import { ProductTable } from "@/components/stock/product-table"
import { PurchaseList } from "@/components/stock/purchase-list"
import { StockAlerts } from "@/components/stock/stock-alerts"
import {
  StockInForm,
  type StockInValues,
} from "@/components/stock/stock-in-form"
import { VariantForm } from "@/components/stock/variant-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "@/hooks/use-query"
import { useSession } from "@/hooks/use-session"
import {
  createProduct,
  createPurchase,
  deleteVariant,
  getDeadStock,
  getLastCost,
  getLowStock,
  getParties,
  getProducts,
  getPurchases,
  saveVariant,
  toggleProductActive,
  updateProduct,
} from "@/api"
import type { ID, ProductInput } from "@/types"

type StockInTarget = { productId: ID; variantId: ID | null; qty?: number }

export default function StockPage() {
  const user = useSession()!
  const shopId = user.shopId
  const isOwner = user.role === "owner"

  const products = useQuery(() => getProducts(shopId), [shopId])
  const suppliers = useQuery(() => getParties("supplier", shopId), [shopId])
  const lowStock = useQuery(() => getLowStock(shopId), [shopId])
  const deadStock = useQuery(() => getDeadStock(shopId), [shopId])
  const history = useQuery(() => getPurchases(shopId), [shopId])

  // null = closed, "new" = create, number = edit that product
  const [editing, setEditing] = useState<"new" | ID | null>(null)
  const [stockIn, setStockIn] = useState<StockInTarget | "blank" | null>(null)

  const status = queryStatus(products, suppliers, lowStock, deadStock, history)
  const all = products.data ?? []
  const visible = isOwner ? all : all.filter((p) => p.active)
  const editProduct =
    typeof editing === "number" ? all.find((p) => p.id === editing) : undefined
  const categories = [...new Set(all.map((p) => p.category))]
  const alertCount =
    (lowStock.data?.length ?? 0) + (deadStock.data?.length ?? 0)

  function reloadAll() {
    products.reload()
    suppliers.reload()
    lowStock.reload()
    deadStock.reload()
    history.reload()
  }

  async function saveProduct(input: ProductInput) {
    if (editProduct) {
      await updateProduct(editProduct.id, input)
      toast.success("Product updated")
      setEditing(null)
    } else {
      const created = await createProduct(input)
      toast.success("Product added")
      // Variant products stay open so variants can be added right away
      setEditing(created.hasVariants ? created.id : null)
    }
    reloadAll()
  }

  async function saveStockIn(values: StockInValues) {
    await createPurchase({ shopId, ...values })
    toast.success("Stock added")
    setStockIn(null)
    reloadAll()
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Stock"
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setStockIn("blank")}>
              <PackagePlus /> Stock in
            </Button>
            {isOwner && (
              <Button
                variant="outline"
                className="min-w-11"
                aria-label="Add product"
                onClick={() => setEditing("new")}
              >
                <Plus /> <span className="hidden sm:inline">Product</span>
              </Button>
            )}
          </div>
        }
      />

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {alertCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {alertCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-3">
          {status.error ? (
            <LoadError onRetry={status.retry} />
          ) : products.loading ? (
            <Loading />
          ) : (
            <ProductTable
              products={visible}
              showCost={isOwner}
              onSelect={isOwner ? (p) => setEditing(p.id) : undefined}
            />
          )}
        </TabsContent>

        <TabsContent value="alerts" className="mt-3">
          <StockAlerts
            lowStock={lowStock.data ?? []}
            deadStock={deadStock.data ?? []}
            onRestock={(productId, variantId, qty) =>
              setStockIn({ productId, variantId, qty })
            }
          />
        </TabsContent>
        <TabsContent value="history" className="mt-3">
          {history.loading ? (
            <Loading />
          ) : (
            <PurchaseList rows={history.data ?? []} showCost={isOwner} />
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent className="max-h-[95svh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editProduct ? "Edit product" : "New product"}
            </DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <ProductForm
              key={editProduct?.id ?? "new"}
              shopId={shopId}
              product={editProduct}
              categories={categories}
              onSubmit={saveProduct}
            />
          )}
          {editProduct?.hasVariants && (
            <VariantForm
              variants={editProduct.variants}
              onAdd={async (size, color, openingStock) => {
                await saveVariant({
                  productId: editProduct.id,
                  size,
                  color,
                  openingStock,
                })
                products.reload()
                lowStock.reload()
              }}
              onDelete={async (id) => {
                await deleteVariant(id)
                products.reload()
              }}
            />
          )}
          {editProduct && (
            <Button
              variant="ghost"
              className={editProduct.active ? "text-destructive" : ""}
              onClick={async () => {
                await toggleProductActive(editProduct.id)
                reloadAll()
              }}
            >
              {editProduct.active ? "Deactivate product" : "Activate product"}
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={stockIn !== null}
        onOpenChange={(o) => !o && setStockIn(null)}
      >
        <DialogContent className="max-h-[95svh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock in</DialogTitle>
          </DialogHeader>
          {stockIn !== null && (
            <StockInForm
              products={visible.filter((p) => p.active)}
              suppliers={suppliers.data ?? []}
              isOwner={isOwner}
              initial={stockIn === "blank" ? undefined : stockIn}
              getLastCost={getLastCost}
              onSubmit={saveStockIn}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
