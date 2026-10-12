// Shared enums, types and interfaces. Source of truth: docs/schema.md

export const SHOP_TYPES = ["men", "women"] as const
export const ROLES = ["owner", "staff"] as const
export const UNITS = ["piece", "yard", "meter"] as const
export const PAYMENT_METHODS = ["cash", "bKash", "due"] as const
export const EXPENSE_CATEGORIES = [
  "rent",
  "salary",
  "bill",
  "tailor",
  "other",
] as const
export const PARTY_TYPES = ["customer", "supplier"] as const

export type ShopType = (typeof SHOP_TYPES)[number]
export type Role = (typeof ROLES)[number]
export type Unit = (typeof UNITS)[number]
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
export type PartyType = (typeof PARTY_TYPES)[number]

export type ID = number
export type Money = number // BDT

export interface Shop {
  id: ID
  name: string
  type: ShopType
}

export interface User {
  id: ID
  name: string
  pinHash: string // backend only
  role: Role
  shopId: ID
}

export interface Product {
  id: ID
  shopId: ID
  name: string
  brand: string | null
  category: string
  unit: Unit
  costPrice: Money // hidden from staff
  sellPrice: Money
  stockQty: number
  lowStockAt: number
  barcode: string | null
  hasVariants: boolean
  active: boolean
}

export interface ProductVariant {
  id: ID
  productId: ID
  size: string | null
  color: string | null
  stockQty: number
  barcode: string | null
}

export interface Customer {
  id: ID
  shopId: ID
  name: string
  phone: string
  dueBalance: Money
}

export interface Supplier {
  id: ID
  shopId: ID
  name: string
  phone: string
  payableBalance: Money
}

export interface Sale {
  id: ID
  shopId: ID
  userId: ID
  customerId: ID | null
  total: Money
  discount: Money
  paid: Money
  due: Money
  method: PaymentMethod
  createdAt: Date
}

export interface SaleItem {
  saleId: ID
  productId: ID
  variantId: ID | null
  qty: number // negative = return
  price: Money
  costSnapshot: Money
}

export interface Purchase {
  id: ID
  shopId: ID
  supplierId: ID
  productId: ID
  variantId: ID | null
  qty: number
  cost: Money
  paid: Money
  createdAt: Date
}

export interface Expense {
  id: ID
  shopId: ID
  category: ExpenseCategory
  amount: Money
  note: string | null
  date: Date
}

export interface Payment {
  id: ID
  shopId: ID
  partyType: PartyType
  partyId: ID
  amount: Money
  method: PaymentMethod
  date: Date
}

export interface CashCount {
  id: ID
  shopId: ID
  userId: ID
  expected: Money
  counted: Money
  diff: Money
  date: Date
}

// Frontend-only shapes

/** Logged-in user, never includes pinHash. */
export type SessionUser = Omit<User, "pinHash">

export interface ProductWithVariants extends Product {
  variants: ProductVariant[]
}

// Inputs for write actions (Zod schemas mirror these later)

export interface SaleItemInput {
  productId: ID
  variantId: ID | null
  qty: number // negative = return
  price: Money
}

export interface SaleInput {
  shopId: ID
  userId: ID
  customerId: ID | null
  items: SaleItemInput[]
  discount: Money
  paid: Money // negative = refund
  method: PaymentMethod
}

export interface PartyInput {
  shopId: ID
  name: string
  phone: string
}

export type ProductInput = Omit<Product, "id" | "active">

export interface VariantInput {
  id?: ID // omit = create
  productId: ID
  size: string | null
  color: string | null
}

export interface PurchaseInput {
  shopId: ID
  supplierId: ID
  productId: ID
  variantId: ID | null
  qty: number
  cost: Money | null // per unit; null = use last cost (staff)
  paid: Money
}

export type ExpenseInput = Omit<Expense, "id" | "date">

// Report rows

export interface LowStockRow {
  product: Product
  variant: ProductVariant | null
  stock: number
  reorderQty: number
}

export interface DeadStockRow {
  product: Product
  stock: number
  lastSoldAt: Date | null
}
