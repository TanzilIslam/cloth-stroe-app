// Mock data layer. Function names match docs/function.md so the swap to
// src/actions/ is an import change only.
import { calcReorderQty, daysSince, startOfToday } from "@/lib/calc"
import type {
  Bestsellers,
  CashCount,
  CashSummary,
  Customer,
  DashboardStats,
  DeadStockRow,
  DueRow,
  Expense,
  ExpenseInput,
  ID,
  LowStockRow,
  MonthRow,
  NamedValue,
  PartyInput,
  PartyType,
  Payment,
  PaymentInput,
  PeakTimes,
  Product,
  ProductInput,
  ProductVariant,
  ProductWithVariants,
  Purchase,
  PurchaseInput,
  Sale,
  SaleInput,
  SessionUser,
  Shop,
  Supplier,
  VariantInput,
} from "@/types"

import {
  cashCounts,
  customers,
  expenses,
  payments,
  products,
  purchases,
  saleItems,
  sales,
  shops,
  suppliers,
  users,
  variants,
} from "./data"
import { getSessionUser, setSessionUser } from "./session"

function requireOwner() {
  if (getSessionUser()?.role !== "owner") throw new Error("Owner only")
}

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

// --- products ---

export async function getProducts(shopId: ID): Promise<ProductWithVariants[]> {
  await delay()
  return products.filter((p) => p.shopId === shopId).map(withVariants)
}

export async function getProduct(id: ID): Promise<ProductWithVariants | null> {
  await delay()
  const p = products.find((x) => x.id === id)
  return p ? withVariants(p) : null
}

export async function createProduct(input: ProductInput): Promise<Product> {
  await delay()
  requireOwner()
  const row: Product = { id: nextId(products), ...input, active: true }
  products.push(row)
  return row
}

export async function updateProduct(
  id: ID,
  input: Partial<ProductInput>
): Promise<Product> {
  await delay()
  requireOwner()
  const row = products.find((p) => p.id === id)
  if (!row) throw new Error("Product not found")
  Object.assign(row, input)
  return row
}

export async function toggleProductActive(id: ID): Promise<Product> {
  await delay()
  requireOwner()
  const row = products.find((p) => p.id === id)
  if (!row) throw new Error("Product not found")
  row.active = !row.active
  return row
}

export async function saveVariant(
  input: VariantInput
): Promise<ProductVariant> {
  await delay()
  requireOwner()
  if (input.id) {
    const row = variants.find((v) => v.id === input.id)
    if (!row) throw new Error("Variant not found")
    Object.assign(row, { size: input.size, color: input.color })
    return row
  }
  const row: ProductVariant = {
    id: nextId(variants),
    productId: input.productId,
    size: input.size,
    color: input.color,
    stockQty: 0,
    barcode: null,
  }
  variants.push(row)
  return row
}

export async function deleteVariant(id: ID): Promise<void> {
  await delay()
  requireOwner()
  const i = variants.findIndex((v) => v.id === id)
  if (i === -1) return
  if (variants[i].stockQty !== 0) throw new Error("Variant still has stock")
  variants.splice(i, 1)
}

// --- purchases (stock in) ---

/** Last cost paid for a product / variant, else the product's cost price. */
export async function getLastCost(
  productId: ID,
  variantId: ID | null = null
): Promise<number> {
  const last = [...purchases]
    .reverse()
    .find((p) => p.productId === productId && p.variantId === variantId)
  return last?.cost ?? products.find((p) => p.id === productId)?.costPrice ?? 0
}

export async function createPurchase(input: PurchaseInput): Promise<Purchase> {
  await delay()
  if (input.qty <= 0) throw new Error("Qty must be more than 0")
  const product = products.find((p) => p.id === input.productId)
  if (!product) throw new Error("Product not found")
  const variant = input.variantId
    ? variants.find((v) => v.id === input.variantId)
    : null
  if (product.hasVariants && !variant) throw new Error("Pick a variant")
  const supplier = suppliers.find((s) => s.id === input.supplierId)
  if (!supplier) throw new Error("Pick a supplier")

  const cost = input.cost ?? (await getLastCost(product.id, input.variantId))
  const row: Purchase = {
    id: nextId(purchases),
    shopId: input.shopId,
    supplierId: input.supplierId,
    productId: input.productId,
    variantId: input.variantId,
    qty: input.qty,
    cost,
    paid: input.paid,
    createdAt: new Date(),
  }
  purchases.push(row)
  ;(variant ?? product).stockQty += input.qty
  product.costPrice = cost
  supplier.payableBalance += input.qty * cost - input.paid
  return row
}

export async function getPurchases(shopId: ID): Promise<Purchase[]> {
  await delay()
  return purchases.filter((p) => p.shopId === shopId).reverse()
}

// --- expenses ---

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  await delay()
  if (input.amount <= 0) throw new Error("Amount must be more than 0")
  const row: Expense = { id: nextId(expenses), ...input, date: new Date() }
  expenses.push(row)
  return row
}

/** Expenses for a shop, newest first. `from` limits to that date onward. */
export async function getExpenses(shopId: ID, from?: Date): Promise<Expense[]> {
  await delay()
  return expenses
    .filter((e) => e.shopId === shopId && (!from || e.date >= from))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

export async function deleteExpense(id: ID): Promise<void> {
  await delay()
  requireOwner()
  const i = expenses.findIndex((e) => e.id === id)
  if (i !== -1) expenses.splice(i, 1)
}

export async function getTodayExpenses(shopId: ID) {
  return getExpenses(shopId, startOfToday())
}

// --- reports: stock ---

function soldSince(productId: ID, variantId: ID | null, since: Date) {
  const saleIds = new Set(
    sales.filter((s) => s.createdAt >= since).map((s) => s.id)
  )
  return saleItems
    .filter(
      (i) =>
        saleIds.has(i.saleId) &&
        i.productId === productId &&
        (variantId === null || i.variantId === variantId)
    )
    .reduce((s, i) => s + i.qty, 0)
}

export async function getLowStock(shopId: ID): Promise<LowStockRow[]> {
  await delay()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const rows: LowStockRow[] = []
  for (const product of products.filter(
    (p) => p.shopId === shopId && p.active
  )) {
    const items = product.hasVariants
      ? variants.filter((v) => v.productId === product.id)
      : [null]
    for (const variant of items) {
      const stock = variant ? variant.stockQty : product.stockQty
      // Variants share the product's low level, split across them
      const lowAt = variant
        ? Math.max(1, Math.ceil(product.lowStockAt / items.length))
        : product.lowStockAt
      if (stock > lowAt) continue
      const sold = soldSince(product.id, variant?.id ?? null, since)
      rows.push({
        product,
        variant,
        stock,
        reorderQty: calcReorderQty(sold, stock, lowAt),
      })
    }
  }
  return rows.sort((a, b) => a.stock - b.stock)
}

/** In stock but not sold for 60+ days. */
export async function getDeadStock(shopId: ID): Promise<DeadStockRow[]> {
  await delay()
  const rows: DeadStockRow[] = []
  for (const product of products.filter(
    (p) => p.shopId === shopId && p.active
  )) {
    const stock = product.hasVariants
      ? variants
          .filter((v) => v.productId === product.id)
          .reduce((s, v) => s + v.stockQty, 0)
      : product.stockQty
    if (stock <= 0) continue
    const saleIds = new Set(
      saleItems.filter((i) => i.productId === product.id).map((i) => i.saleId)
    )
    const last = sales
      .filter((s) => saleIds.has(s.id))
      .reduce<Date | null>(
        (max, s) => (!max || s.createdAt > max ? s.createdAt : max),
        null
      )
    if (!last || daysSince(last) >= 60) {
      rows.push({ product, stock, lastSoldAt: last })
    }
  }
  return rows
}

// --- parties: dues + payments ---

export async function getDues(shopId: ID): Promise<DueRow[]> {
  await delay()
  const oldest = (dates: Date[]) =>
    dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null

  const rows: DueRow[] = [
    ...customers
      .filter((c) => c.shopId === shopId && c.dueBalance > 0)
      .map((c) => ({
        partyType: "customer" as const,
        party: c,
        amount: c.dueBalance,
        since: oldest(
          sales
            .filter((s) => s.customerId === c.id && s.due > 0)
            .map((s) => s.createdAt)
        ),
      })),
    ...suppliers
      .filter((s) => s.shopId === shopId && s.payableBalance > 0)
      .map((s) => ({
        partyType: "supplier" as const,
        party: s,
        amount: s.payableBalance,
        since: oldest(
          purchases
            .filter((p) => p.supplierId === s.id && p.qty * p.cost > p.paid)
            .map((p) => p.createdAt)
        ),
      })),
  ]
  return rows.sort(
    (a, b) => (a.since?.getTime() ?? 0) - (b.since?.getTime() ?? 0)
  )
}

export async function recordPayment(input: PaymentInput): Promise<Payment> {
  await delay()
  if (input.amount <= 0) throw new Error("Amount must be more than 0")
  const party =
    input.partyType === "customer"
      ? customers.find((c) => c.id === input.partyId)
      : suppliers.find((s) => s.id === input.partyId)
  if (!party) throw new Error("Party not found")
  const balance =
    "dueBalance" in party ? party.dueBalance : party.payableBalance
  if (input.amount > balance) throw new Error("More than the balance")

  if ("dueBalance" in party) party.dueBalance -= input.amount
  else party.payableBalance -= input.amount
  const row: Payment = { id: nextId(payments), ...input, date: new Date() }
  payments.push(row)
  return row
}

// --- cash ---

export async function getExpectedCash(shopId: ID): Promise<CashSummary> {
  await delay()
  const today = startOfToday()
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
  const todayPayments = payments.filter(
    (p) => p.shopId === shopId && p.date >= today && p.method === "cash"
  )
  // Opening cash defaults to the last count from a previous day
  const last = cashCounts
    .filter((c) => c.shopId === shopId && c.date < today)
    .at(-1)

  return {
    cashSales: sum(
      sales
        .filter(
          (s) =>
            s.shopId === shopId && s.createdAt >= today && s.method === "cash"
        )
        .map((s) => s.paid)
    ),
    cashIn: sum(
      todayPayments
        .filter((p) => p.partyType === "customer")
        .map((p) => p.amount)
    ),
    expenses: sum(
      expenses
        .filter((e) => e.shopId === shopId && e.date >= today)
        .map((e) => e.amount)
    ),
    cashOut:
      sum(
        todayPayments
          .filter((p) => p.partyType === "supplier")
          .map((p) => p.amount)
      ) +
      sum(
        purchases
          .filter((p) => p.shopId === shopId && p.createdAt >= today)
          .map((p) => p.paid)
      ),
    lastCounted: last?.counted ?? null,
  }
}

export async function saveCashCount(input: {
  shopId: ID
  userId: ID
  expected: number
  counted: number
}): Promise<CashCount> {
  await delay()
  const row: CashCount = {
    id: nextId(cashCounts),
    ...input,
    diff: input.counted - input.expected,
    date: new Date(),
  }
  cashCounts.push(row)
  return row
}

export async function getCashCounts(shopId: ID): Promise<CashCount[]> {
  await delay()
  return cashCounts.filter((c) => c.shopId === shopId).reverse()
}

// --- reports ---

const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function salesIn(shopIds: ID[], from: Date, to = new Date()) {
  return sales.filter(
    (s) =>
      shopIds.includes(s.shopId) && s.createdAt >= from && s.createdAt <= to
  )
}

/** Gross profit of a sale: (price - cost) × qty - discount. */
function saleProfit(saleId: ID, discount: number) {
  return (
    saleItems
      .filter((i) => i.saleId === saleId)
      .reduce((s, i) => s + (i.price - i.costSnapshot) * i.qty, 0) - discount
  )
}

const net = (s: Sale) => s.total - s.discount

export async function getDashboard(shopIds: ID[]): Promise<DashboardStats> {
  await delay()
  const today = salesIn(shopIds, startOfToday())
  return {
    sale: today.reduce((a, s) => a + net(s), 0),
    profit: today.reduce((a, s) => a + saleProfit(s.id, s.discount), 0),
    cash: today
      .filter((s) => s.method === "cash")
      .reduce((a, s) => a + s.paid, 0),
    dues: customers
      .filter((c) => shopIds.includes(c.shopId))
      .reduce((a, c) => a + c.dueBalance, 0),
    count: today.length,
  }
}

/** Today so far vs. the same day last week up to the same time. */
export async function getComparison(
  shopIds: ID[]
): Promise<{ today: number; lastWeek: number }> {
  await delay()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS)
  const weekAgoStart = new Date(startOfToday().getTime() - 7 * DAY_MS)
  const total = (xs: Sale[]) => xs.reduce((a, s) => a + net(s), 0)
  return {
    today: total(salesIn(shopIds, startOfToday(), now)),
    lastWeek: total(salesIn(shopIds, weekAgoStart, weekAgo)),
  }
}

export async function getBestsellers(
  shopIds: ID[],
  days = 30
): Promise<Bestsellers> {
  await delay()
  const ids = new Set(
    salesIn(shopIds, new Date(Date.now() - days * DAY_MS)).map((s) => s.id)
  )
  const by = (key: (p: (typeof products)[number]) => string | null) => {
    const totals = new Map<string, number>()
    for (const i of saleItems.filter((i) => ids.has(i.saleId))) {
      const p = products.find((x) => x.id === i.productId)
      const k = p && key(p)
      if (k) totals.set(k, (totals.get(k) ?? 0) + i.qty * i.price)
    }
    return [...totals]
      .map(([label, value]): NamedValue => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }
  return {
    products: by((p) => p.name),
    brands: by((p) => p.brand),
    categories: by((p) => p.category),
  }
}

export async function getPeakTimes(
  shopIds: ID[],
  days = 30
): Promise<PeakTimes> {
  await delay()
  const recent = salesIn(shopIds, new Date(Date.now() - days * DAY_MS))
  const hours = Array.from({ length: 12 }, (_, i) => i + 10) // 10am–9pm
  const label = (h: number) => `${h % 12 || 12}${h < 12 ? "a" : "p"}`
  return {
    hours: hours.map((h) => ({
      label: label(h),
      value: recent
        .filter((s) => s.createdAt.getHours() === h)
        .reduce((a, s) => a + net(s), 0),
    })),
    // Bangladesh week starts Saturday
    days: [6, 0, 1, 2, 3, 4, 5].map((d) => ({
      label: WEEKDAYS[d],
      value: recent
        .filter((s) => s.createdAt.getDay() === d)
        .reduce((a, s) => a + net(s), 0),
    })),
  }
}

export async function getMonthlyReport(
  shopIds: ID[],
  months = 6
): Promise<MonthRow[]> {
  await delay()
  const rows: MonthRow[] = []
  const now = new Date()
  for (let m = 0; m < months; m++) {
    const from = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const to = new Date(now.getFullYear(), now.getMonth() - m + 1, 1)
    const monthSales = sales.filter(
      (s) =>
        shopIds.includes(s.shopId) && s.createdAt >= from && s.createdAt < to
    )
    const monthExpenses = expenses
      .filter(
        (e) => shopIds.includes(e.shopId) && e.date >= from && e.date < to
      )
      .reduce((a, e) => a + e.amount, 0)
    const salesTotal = monthSales.reduce((a, s) => a + net(s), 0)
    const gross = monthSales.reduce(
      (a, s) => a + saleProfit(s.id, s.discount),
      0
    )
    if (!salesTotal && !monthExpenses) continue
    rows.push({
      month: from.toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      }),
      sales: salesTotal,
      gross,
      expenses: monthExpenses,
      net: gross - monthExpenses,
    })
  }
  return rows
}
