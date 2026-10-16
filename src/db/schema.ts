// Drizzle schema: 12 tables from docs/schema.md.
// Columns are camelCase in TS and snake_case in Postgres (casing: "snake_case").
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import {
  EXPENSE_CATEGORIES,
  PARTY_TYPES,
  PAYMENT_METHODS,
  ROLES,
  SHOP_TYPES,
  UNITS,
} from "@/types"

// --- enums ---

export const shopType = pgEnum("shop_type", SHOP_TYPES)
export const role = pgEnum("role", ROLES)
export const unit = pgEnum("unit", UNITS)
export const paymentMethod = pgEnum("payment_method", PAYMENT_METHODS)
export const expenseCategory = pgEnum("expense_category", EXPENSE_CATEGORIES)
export const partyType = pgEnum("party_type", PARTY_TYPES)

// --- helpers ---

/** Taka with paisa. Read as a JS number. */
const money = () => numeric({ precision: 12, scale: 2, mode: "number" })
/** Qty: 2.5 yard is allowed. Negative on returns. */
const qty = () => numeric({ precision: 10, scale: 2, mode: "number" })
const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow()
const shopId = () =>
  integer()
    .notNull()
    .references(() => shops.id)

// --- tables ---

export const shops = pgTable("shops", {
  id: serial().primaryKey(),
  name: text().notNull(),
  type: shopType().notNull(),
})

export const users = pgTable("users", {
  id: serial().primaryKey(),
  name: text().notNull(),
  pinHash: text().notNull(),
  role: role().notNull(),
  shopId: shopId(),
  active: boolean().notNull().default(true),
})

export const products = pgTable(
  "products",
  {
    id: serial().primaryKey(),
    shopId: shopId(),
    name: text().notNull(),
    brand: text(),
    category: text().notNull(),
    unit: unit().notNull(),
    costPrice: money().notNull().default(0),
    sellPrice: money().notNull(),
    stockQty: qty().notNull().default(0),
    lowStockAt: qty().notNull().default(5),
    barcode: text(),
    hasVariants: boolean().notNull().default(false),
    active: boolean().notNull().default(true),
  },
  (t) => [index().on(t.shopId), index().on(t.barcode)]
)

export const productVariants = pgTable(
  "product_variants",
  {
    id: serial().primaryKey(),
    productId: integer()
      .notNull()
      .references(() => products.id),
    size: text(),
    color: text(),
    stockQty: qty().notNull().default(0),
    barcode: text(),
  },
  (t) => [index().on(t.productId)]
)

export const customers = pgTable(
  "customers",
  {
    id: serial().primaryKey(),
    shopId: shopId(),
    name: text().notNull(),
    phone: text().notNull(),
    dueBalance: money().notNull().default(0),
  },
  (t) => [index().on(t.shopId)]
)

export const suppliers = pgTable(
  "suppliers",
  {
    id: serial().primaryKey(),
    shopId: shopId(),
    name: text().notNull(),
    phone: text().notNull(),
    payableBalance: money().notNull().default(0),
  },
  (t) => [index().on(t.shopId)]
)

export const sales = pgTable(
  "sales",
  {
    id: serial().primaryKey(),
    shopId: shopId(),
    userId: integer()
      .notNull()
      .references(() => users.id),
    customerId: integer().references(() => customers.id),
    total: money().notNull(),
    discount: money().notNull().default(0),
    paid: money().notNull(),
    due: money().notNull().default(0),
    method: paymentMethod().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.shopId, t.createdAt), index().on(t.customerId)]
)

export const saleItems = pgTable(
  "sale_items",
  {
    id: serial().primaryKey(),
    saleId: integer()
      .notNull()
      .references(() => sales.id),
    productId: integer()
      .notNull()
      .references(() => products.id),
    variantId: integer().references(() => productVariants.id),
    qty: qty().notNull(),
    price: money().notNull(),
    costSnapshot: money().notNull(),
  },
  (t) => [index().on(t.saleId), index().on(t.productId)]
)

export const purchases = pgTable(
  "purchases",
  {
    id: serial().primaryKey(),
    shopId: shopId(),
    supplierId: integer()
      .notNull()
      .references(() => suppliers.id),
    productId: integer()
      .notNull()
      .references(() => products.id),
    variantId: integer().references(() => productVariants.id),
    qty: qty().notNull(),
    cost: money().notNull(),
    paid: money().notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.shopId, t.createdAt), index().on(t.productId)]
)

export const expenses = pgTable(
  "expenses",
  {
    id: serial().primaryKey(),
    shopId: shopId(),
    category: expenseCategory().notNull(),
    amount: money().notNull(),
    note: text(),
    date: createdAt(),
  },
  (t) => [index().on(t.shopId, t.date)]
)

export const payments = pgTable(
  "payments",
  {
    id: serial().primaryKey(),
    shopId: shopId(),
    partyType: partyType().notNull(),
    partyId: integer().notNull(),
    amount: money().notNull(),
    method: paymentMethod().notNull(),
    date: createdAt(),
  },
  (t) => [index().on(t.shopId, t.date)]
)

export const cashCounts = pgTable(
  "cash_counts",
  {
    id: serial().primaryKey(),
    shopId: shopId(),
    userId: integer()
      .notNull()
      .references(() => users.id),
    expected: money().notNull(),
    counted: money().notNull(),
    diff: money().notNull(),
    date: createdAt(),
  },
  (t) => [index().on(t.shopId, t.date)]
)
