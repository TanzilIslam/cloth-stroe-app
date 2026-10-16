// Zod schemas for every Server Action input. Each one is checked against the
// matching interface in ./index.ts, so types and validation can't drift apart.
import { z } from "zod"

import {
  EXPENSE_CATEGORIES,
  PARTY_TYPES,
  ROLES,
  UNITS,
  type ExpenseInput,
  type PartyInput,
  type PaymentInput,
  type ProductInput,
  type PurchaseInput,
  type SaleInput,
  type UserInput,
  type VariantInput,
} from "."

// --- building blocks ---

export const idSchema = z.number().int().positive()
const amount = z.number().finite()
const nonNegative = (label: string) =>
  amount.min(0, `${label} can't be negative`)
const positive = (label: string) =>
  amount.positive(`${label} must be more than 0`)
/** Optional text: trims, and "" becomes null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Max ${max} characters`)
    .nullable()
    .transform((v) => v || null)
const requiredText = (label: string, max = 100) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} is too long`)

// --- auth / shared args ---

export const pinSchema = z.string().regex(/^\d{4}$/, "PIN must be 4 digits")
export const shopIdsSchema = z.array(idSchema).min(1, "Pick a shop").max(10)
export const searchSchema = z.string().max(100)
export const daysSchema = z.number().int().min(1).max(365)
export const monthsSchema = z.number().int().min(1).max(24)
export const limitSchema = z.number().int().min(1).max(50)
export const fromDateSchema = z.date().optional()

// --- sales ---

export const saleItemSchema = z.object({
  productId: idSchema,
  variantId: idSchema.nullable(),
  qty: amount.refine((q) => q !== 0, "Qty can't be 0"),
  price: nonNegative("Price"),
})

export const saleSchema = z.object({
  shopId: idSchema,
  userId: idSchema, // ignored: the session user is used
  customerId: idSchema.nullable(),
  items: z
    .array(saleItemSchema)
    .min(1, "Cart is empty")
    .max(100, "Too many items"),
  discount: nonNegative("Discount"),
  paid: amount,
  method: z.enum(["cash", "bKash", "due"]),
}) satisfies z.ZodType<SaleInput>

// --- products ---

export const productSchema = z.object({
  shopId: idSchema,
  name: requiredText("Name"),
  brand: optionalText(60),
  category: requiredText("Category", 60),
  unit: z.enum(UNITS),
  costPrice: nonNegative("Cost price"),
  sellPrice: positive("Sell price"),
  stockQty: nonNegative("Stock"),
  lowStockAt: nonNegative("Low stock level"),
  barcode: optionalText(40),
  hasVariants: z.boolean(),
}) satisfies z.ZodType<ProductInput>

export const productUpdateSchema = productSchema.partial()

export const variantSchema = z
  .object({
    id: idSchema.optional(),
    productId: idSchema,
    size: optionalText(20),
    color: optionalText(30),
  })
  .refine(
    (v) => v.size || v.color,
    "Add a size or color"
  ) satisfies z.ZodType<VariantInput>

// --- stock in ---

export const purchaseSchema = z.object({
  shopId: idSchema,
  supplierId: idSchema,
  productId: idSchema,
  variantId: idSchema.nullable(),
  qty: positive("Qty"),
  cost: nonNegative("Cost").nullable(),
  paid: nonNegative("Paid"),
}) satisfies z.ZodType<PurchaseInput>

// --- parties ---

export const partyTypeSchema = z.enum(PARTY_TYPES)

export const partySchema = z.object({
  shopId: idSchema,
  name: requiredText("Name"),
  phone: z
    .string()
    .trim()
    .max(20, "Phone is too long")
    .regex(/^[0-9+\- ]*$/, "Phone: digits only"),
}) satisfies z.ZodType<PartyInput>

export const paymentSchema = z.object({
  shopId: idSchema,
  partyType: partyTypeSchema,
  partyId: idSchema,
  amount: positive("Amount"),
  method: z.enum(["cash", "bKash"], "Pick cash or bKash"),
}) satisfies z.ZodType<PaymentInput>

// --- expenses / cash ---

export const expenseSchema = z.object({
  shopId: idSchema,
  category: z.enum(EXPENSE_CATEGORIES, "Pick a category"),
  amount: positive("Amount"),
  note: optionalText(200),
}) satisfies z.ZodType<ExpenseInput>

export const cashCountSchema = z.object({
  shopId: idSchema,
  expected: amount,
  counted: nonNegative("Counted cash"),
})

// --- users (owner, /setup) ---

export const userSchema = z.object({
  name: requiredText("Name", 60),
  role: z.enum(ROLES, "Pick a role"),
  shopId: idSchema,
  pin: pinSchema.nullable(),
}) satisfies z.ZodType<UserInput>
