// Mock data layer. Function names match docs/function.md so the swap to
// src/actions/ is an import change only.
import type {
  Customer,
  ID,
  PartyInput,
  PartyType,
  ProductWithVariants,
  Sale,
  SaleInput,
  SessionUser,
  Shop,
  Supplier,
} from "@/types"

import {
  customers,
  products,
  saleItems,
  sales,
  shops,
  suppliers,
  users,
  variants,
} from "./data"
import { getSessionUser, setSessionUser } from "./session"

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))
const nextId = (rows: { id: ID }[]) => Math.max(0, ...rows.map((r) => r.id)) + 1
const withVariants = (p: (typeof products)[number]): ProductWithVariants => ({
  ...p,
  variants: variants.filter((v) => v.productId === p.id),
})

// --- auth ---

export async function login(pin: string): Promise<SessionUser | null> {
  await delay()
  const user = users.find((u) => u.pinHash === pin)
  if (!user) return null
  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    role: user.role,
    shopId: user.shopId,
  }
  setSessionUser(sessionUser)
  return sessionUser
}

export async function logout(): Promise<void> {
  setSessionUser(null)
}

// --- shops ---

export async function getShops(): Promise<Shop[]> {
  return shops
}

/** Owner only: switch the active shop in the session. */
export async function switchShop(shopId: number): Promise<void> {
  const user = getSessionUser()
  if (user?.role === "owner") setSessionUser({ ...user, shopId })
}

// --- sales ---

export async function searchProducts(
  shopId: ID,
  query: string
): Promise<ProductWithVariants[]> {
  await delay(100)
  const q = query.trim().toLowerCase()
  if (!q) return []
  return products
    .filter(
      (p) =>
        p.shopId === shopId &&
        p.active &&
        (p.barcode === q ||
          `${p.name} ${p.brand ?? ""} ${p.category}`.toLowerCase().includes(q))
    )
    .map(withVariants)
}

/** Most recently sold products first, then the rest of the shop's products. */
export async function getRecentProducts(
  shopId: ID,
  limit = 12
): Promise<ProductWithVariants[]> {
  await delay()
  const recentIds = [...saleItems].reverse().map((i) => i.productId)
  const shopProducts = products.filter((p) => p.shopId === shopId && p.active)
  const rank = (id: ID) => {
    const i = recentIds.indexOf(id)
    return i === -1 ? Infinity : i
  }
  return [...shopProducts]
    .sort((a, b) => rank(a.id) - rank(b.id))
    .slice(0, limit)
    .map(withVariants)
}

export async function createSale(input: SaleInput): Promise<Sale> {
  await delay()
  if (input.items.length === 0) throw new Error("Cart is empty")

  const total = input.items.reduce((sum, i) => sum + i.qty * i.price, 0)
  const due = Math.max(0, total - input.discount - input.paid)
  if (due > 0 && !input.customerId) {
    throw new Error("Pick a customer for the due amount")
  }

  // Check stock before changing anything (one "transaction")
  for (const item of input.items) {
    const stock = item.variantId
      ? variants.find((v) => v.id === item.variantId)
      : products.find((p) => p.id === item.productId)
    if (!stock) throw new Error("Product not found")
    if (item.qty > stock.stockQty) throw new Error("Not enough stock")
  }

  const sale: Sale = {
    id: nextId(sales),
    shopId: input.shopId,
    userId: input.userId,
    customerId: input.customerId,
    total,
    discount: input.discount,
    paid: input.paid,
    due,
    method: input.method,
    createdAt: new Date(),
  }
  sales.push(sale)

  for (const item of input.items) {
    const product = products.find((p) => p.id === item.productId)!
    const stock = item.variantId
      ? variants.find((v) => v.id === item.variantId)!
      : product
    stock.stockQty -= item.qty
    saleItems.push({
      saleId: sale.id,
      productId: item.productId,
      variantId: item.variantId,
      qty: item.qty,
      price: item.price,
      costSnapshot: product.costPrice,
    })
  }

  const customer = customers.find((c) => c.id === input.customerId)
  if (customer) customer.dueBalance += due

  return sale
}

export async function getSales(shopId: ID): Promise<Sale[]> {
  await delay()
  return sales.filter((s) => s.shopId === shopId).reverse()
}

// --- parties ---

export async function getParties(
  type: "customer",
  shopId: ID
): Promise<Customer[]>
export async function getParties(
  type: "supplier",
  shopId: ID
): Promise<Supplier[]>
export async function getParties(type: PartyType, shopId: ID) {
  await delay()
  const rows = type === "customer" ? customers : suppliers
  return rows.filter((r) => r.shopId === shopId)
}

/** Creates a party. Returns the new row. */
export async function saveParty(
  type: "customer",
  input: PartyInput
): Promise<Customer>
export async function saveParty(
  type: "supplier",
  input: PartyInput
): Promise<Supplier>
export async function saveParty(type: PartyType, input: PartyInput) {
  await delay()
  if (type === "customer") {
    const row: Customer = { id: nextId(customers), ...input, dueBalance: 0 }
    customers.push(row)
    return row
  }
  const row: Supplier = { id: nextId(suppliers), ...input, payableBalance: 0 }
  suppliers.push(row)
  return row
}
