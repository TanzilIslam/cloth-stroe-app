# Master Schema

Shared by frontend and backend. Copy to `src/types/` when the code is set up.

## Enums

```ts
export const SHOP_TYPES = ["men", "women"] as const;
export const ROLES = ["owner", "staff"] as const;
export const UNITS = ["piece", "yard", "meter"] as const;
export const PAYMENT_METHODS = ["cash", "bKash", "due"] as const;
export const EXPENSE_CATEGORIES = ["rent", "salary", "bill", "tailor", "other"] as const;
export const PARTY_TYPES = ["customer", "supplier"] as const;
```

## Types

```ts
export type ShopType = (typeof SHOP_TYPES)[number];
export type Role = (typeof ROLES)[number];
export type Unit = (typeof UNITS)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type PartyType = (typeof PARTY_TYPES)[number];

export type ID = number;
export type Money = number; // BDT
```

## Interfaces

```ts
export interface Shop {
  id: ID;
  name: string;
  type: ShopType;
}

export interface User {
  id: ID;
  name: string;
  pinHash: string; // backend only
  role: Role;
  shopId: ID;
}

export interface Product {
  id: ID;
  shopId: ID;
  name: string;
  brand: string | null;
  category: string;
  unit: Unit;
  costPrice: Money; // hidden from staff
  sellPrice: Money;
  stockQty: number;
  lowStockAt: number;
  barcode: string | null;
  hasVariants: boolean;
  active: boolean;
}

export interface ProductVariant {
  id: ID;
  productId: ID;
  size: string | null;
  color: string | null;
  stockQty: number;
  barcode: string | null;
}

export interface Customer {
  id: ID;
  shopId: ID;
  name: string;
  phone: string;
  dueBalance: Money;
}

export interface Supplier {
  id: ID;
  shopId: ID;
  name: string;
  phone: string;
  payableBalance: Money;
}

export interface Sale {
  id: ID;
  shopId: ID;
  userId: ID;
  customerId: ID | null;
  total: Money;
  discount: Money;
  paid: Money;
  due: Money;
  method: PaymentMethod;
  createdAt: Date;
}

export interface SaleItem {
  saleId: ID;
  productId: ID;
  variantId: ID | null;
  qty: number; // negative = return
  price: Money;
  costSnapshot: Money;
}

export interface Purchase {
  id: ID;
  shopId: ID;
  supplierId: ID;
  productId: ID;
  variantId: ID | null;
  qty: number;
  cost: Money;
  paid: Money;
  createdAt: Date;
}

export interface Expense {
  id: ID;
  shopId: ID;
  category: ExpenseCategory;
  amount: Money;
  note: string | null;
  date: Date;
}

export interface Payment {
  id: ID;
  shopId: ID;
  partyType: PartyType;
  partyId: ID;
  amount: Money;
  method: PaymentMethod;
  date: Date;
}

export interface CashCount {
  id: ID;
  shopId: ID;
  userId: ID;
  expected: Money;
  counted: Money;
  diff: Money;
  date: Date;
}
```

## Zod Validation

Lives in `src/types/validations.ts`. One schema per action input, each checked with `satisfies z.ZodType<Interface>` so it can't drift from the interfaces above. Every Server Action calls `parse(schema, input)` first; the first problem comes back as the error message.

| Schema | Input | Key rules |
|---|---|---|
| `pinSchema` | login PIN | exactly 4 digits |
| `saleSchema` | `SaleInput` | 1–100 items, qty ≠ 0, price / discount ≥ 0 |
| `productSchema` / `productUpdateSchema` | `ProductInput` | name + category required, sell price > 0, numbers ≥ 0 |
| `variantSchema` | `VariantInput` | size or color required |
| `purchaseSchema` | `PurchaseInput` | qty > 0, cost / paid ≥ 0 |
| `partySchema` | `PartyInput` | name required, phone digits only |
| `paymentSchema` | `PaymentInput` | amount > 0, cash or bKash |
| `expenseSchema` | `ExpenseInput` | known category, amount > 0 |
| `cashCountSchema` | cash count | counted ≥ 0 |
| `idSchema`, `shopIdsSchema`, `daysSchema`, `monthsSchema` | ids and report args | positive ints, sane ranges |

Text is trimmed; empty optional text becomes `null`. Business rules (stock, balances, shop access) stay in the actions.
