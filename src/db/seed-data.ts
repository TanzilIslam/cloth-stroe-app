// Demo data for the seed: 2 shops, 3 users, products, 70 days of history.
import type {
  CashCount,
  Customer,
  Expense,
  Payment,
  Product,
  ProductVariant,
  Purchase,
  Sale,
  SaleItem,
  Shop,
  Supplier,
  User,
} from "@/types"

export const shops: Shop[] = [
  { id: 1, name: "Men's Shop", type: "men" },
  { id: 2, name: "Women's Shop", type: "women" },
]

// Mock only: pinHash holds the plain PIN. Owner: 1111, Staff: 2222 / 3333
export const users: User[] = [
  { id: 1, name: "Owner", pinHash: "1111", role: "owner", shopId: 1 },
  { id: 2, name: "Rahim", pinHash: "2222", role: "staff", shopId: 1 },
  { id: 3, name: "Karima", pinHash: "3333", role: "staff", shopId: 2 },
]

const product = (
  p: Pick<Product, "id" | "shopId" | "name" | "category" | "unit"> &
    Partial<Product>
): Product => ({
  brand: null,
  costPrice: 0,
  sellPrice: 0,
  stockQty: 0,
  lowStockAt: 5,
  barcode: null,
  hasVariants: false,
  active: true,
  ...p,
})

export const products: Product[] = [
  // Men's: fabric by the yard
  product({
    id: 1,
    shopId: 1,
    name: "Suit Fabric Navy",
    brand: "Raymond",
    category: "Suit",
    unit: "yard",
    costPrice: 650,
    sellPrice: 900,
    stockQty: 40,
    lowStockAt: 10,
    barcode: "1001",
  }),
  product({
    id: 2,
    shopId: 1,
    name: "Suit Fabric Black",
    brand: "Raymond",
    category: "Suit",
    unit: "yard",
    costPrice: 700,
    sellPrice: 950,
    stockQty: 6,
    lowStockAt: 10,
    barcode: "1002",
  }),
  product({
    id: 3,
    shopId: 1,
    name: "Shirt Fabric White",
    brand: "Bombay Dyeing",
    category: "Shirt",
    unit: "yard",
    costPrice: 220,
    sellPrice: 320,
    stockQty: 80,
    lowStockAt: 20,
    barcode: "1003",
  }),
  product({
    id: 4,
    shopId: 1,
    name: "Shirt Fabric Check",
    brand: "Bombay Dyeing",
    category: "Shirt",
    unit: "yard",
    costPrice: 240,
    sellPrice: 350,
    stockQty: 55,
    lowStockAt: 20,
    barcode: "1004",
  }),
  product({
    id: 5,
    shopId: 1,
    name: "Pant Fabric Grey",
    brand: "Siyaram",
    category: "Pant",
    unit: "yard",
    costPrice: 300,
    sellPrice: 430,
    stockQty: 35,
    lowStockAt: 10,
    barcode: "1005",
  }),
  product({
    id: 6,
    shopId: 1,
    name: "Pant Fabric Khaki",
    brand: "Siyaram",
    category: "Pant",
    unit: "yard",
    costPrice: 280,
    sellPrice: 400,
    stockQty: 3,
    lowStockAt: 10,
    barcode: "1006",
  }),
  // Women's: pieces, three-piece has variants
  product({
    id: 7,
    shopId: 2,
    name: "Lawn Three-Piece",
    brand: "Aarong",
    category: "Three-Piece",
    unit: "piece",
    costPrice: 1800,
    sellPrice: 2600,
    stockQty: 0,
    lowStockAt: 3,
    hasVariants: true,
    barcode: "2001",
  }),
  product({
    id: 8,
    shopId: 2,
    name: "Cotton Three-Piece",
    brand: "Kay Kraft",
    category: "Three-Piece",
    unit: "piece",
    costPrice: 1200,
    sellPrice: 1750,
    stockQty: 0,
    lowStockAt: 3,
    hasVariants: true,
    barcode: "2002",
  }),
  product({
    id: 9,
    shopId: 2,
    name: "Jamdani Saree",
    brand: "Tangail",
    category: "Saree",
    unit: "piece",
    costPrice: 4500,
    sellPrice: 6500,
    stockQty: 8,
    lowStockAt: 2,
    barcode: "2003",
  }),
  product({
    id: 10,
    shopId: 2,
    name: "Cotton Saree",
    brand: "Tangail",
    category: "Saree",
    unit: "piece",
    costPrice: 900,
    sellPrice: 1350,
    stockQty: 1,
    lowStockAt: 3,
    barcode: "2004",
  }),
  product({
    id: 11,
    shopId: 2,
    name: "Georgette Orna",
    category: "Orna",
    unit: "piece",
    costPrice: 250,
    sellPrice: 400,
    stockQty: 25,
    lowStockAt: 5,
    barcode: "2005",
  }),
  product({
    id: 12,
    shopId: 2,
    name: "Chiffon Orna",
    category: "Orna",
    unit: "piece",
    costPrice: 200,
    sellPrice: 320,
    stockQty: 18,
    lowStockAt: 5,
    barcode: "2006",
  }),
]

export const variants: ProductVariant[] = [
  { id: 1, productId: 7, size: "M", color: "Blue", stockQty: 4, barcode: null },
  { id: 2, productId: 7, size: "L", color: "Blue", stockQty: 3, barcode: null },
  { id: 3, productId: 7, size: "XL", color: "Red", stockQty: 2, barcode: null },
  {
    id: 4,
    productId: 8,
    size: "M",
    color: "Green",
    stockQty: 5,
    barcode: null,
  },
  {
    id: 5,
    productId: 8,
    size: "L",
    color: "Green",
    stockQty: 1,
    barcode: null,
  },
]

export const customers: Customer[] = [
  {
    id: 1,
    shopId: 1,
    name: "Karim Uddin",
    phone: "01711000001",
    dueBalance: 2500,
  },
  {
    id: 2,
    shopId: 1,
    name: "Jamal Hossain",
    phone: "01711000002",
    dueBalance: 0,
  },
  {
    id: 3,
    shopId: 2,
    name: "Nasrin Akter",
    phone: "01711000003",
    dueBalance: 1800,
  },
  {
    id: 4,
    shopId: 2,
    name: "Shirin Begum",
    phone: "01711000004",
    dueBalance: 0,
  },
]

export const suppliers: Supplier[] = [
  {
    id: 1,
    shopId: 1,
    name: "Islampur Fabrics",
    phone: "01811000001",
    payableBalance: 15000,
  },
  {
    id: 2,
    shopId: 2,
    name: "Tangail Weavers",
    phone: "01811000002",
    payableBalance: 8000,
  },
]

export const sales: Sale[] = []
export const saleItems: SaleItem[] = []
export const purchases: Purchase[] = []
export const expenses: Expense[] = []
export const payments: Payment[] = []
export const cashCounts: CashCount[] = []

// --- Generated history (last 70 days) for reports. Deterministic. ---

let seed = 42
const rand = () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]

/** Not sold in the last 60 days, so they show up as dead stock. */
const DEAD_IDS = [4, 12]
const QTY = { yard: [1, 1.5, 2, 2.5, 3], meter: [1, 2], piece: [1, 1, 2] }

function daysAgo(days: number, hour: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, Math.floor(rand() * 60), 0, 0)
  return d
}

// Day 0 = today, only up to the current time
for (let day = 70; day >= 0; day--) {
  for (const shop of shops) {
    const pool = products.filter(
      (p) => p.shopId === shop.id && (day > 60 || !DEAD_IDS.includes(p.id))
    )
    const count = 3 + Math.floor(rand() * 6)
    for (let n = 0; n < count; n++) {
      const id = sales.length + 1
      const items = Array.from({ length: rand() < 0.3 ? 2 : 1 }, () => {
        const p = pick(pool)
        const v = variants.filter((x) => x.productId === p.id)
        return {
          saleId: id,
          productId: p.id,
          variantId: v.length ? pick(v).id : null,
          qty: pick(QTY[p.unit]),
          price: p.sellPrice,
          costSnapshot: p.costPrice,
        }
      })
      const total = items.reduce((s, i) => s + i.qty * i.price, 0)
      const method = rand() < 0.7 ? "cash" : "bKash"
      const createdAt = daysAgo(day, 10 + Math.floor(rand() * 11))
      if (createdAt > new Date()) continue
      saleItems.push(...items)
      sales.push({
        id,
        shopId: shop.id,
        userId: shop.id === 1 ? 2 : 3,
        customerId: null,
        total,
        discount: 0,
        paid: total,
        due: 0,
        method,
        createdAt,
      })
    }
  }
}

for (const shop of shops) {
  for (const day of [65, 35, 5]) {
    expenses.push(
      {
        id: expenses.length + 1,
        shopId: shop.id,
        category: "rent",
        amount: 15000,
        note: null,
        date: daysAgo(day, 11),
      },
      {
        id: expenses.length + 2,
        shopId: shop.id,
        category: "salary",
        amount: 12000,
        note: null,
        date: daysAgo(day, 12),
      }
    )
  }
  for (let day = 60; day >= 1; day -= 7) {
    expenses.push({
      id: expenses.length + 1,
      shopId: shop.id,
      category: pick(["bill", "tailor", "other"] as const),
      amount: 300 + Math.floor(rand() * 15) * 100,
      note: null,
      date: daysAgo(day, 15),
    })
  }
}

// Opening dues: match the customer / supplier balances above
const openingDue = (
  customerId: number,
  shopId: number,
  amount: number,
  day: number
) => {
  const id = sales.length + 1
  const p = products.find((x) => x.shopId === shopId && !x.hasVariants)!
  saleItems.push({
    saleId: id,
    productId: p.id,
    variantId: null,
    qty: 1,
    price: amount,
    costSnapshot: Math.round(amount * 0.7),
  })
  sales.push({
    id,
    shopId,
    userId: shopId === 1 ? 2 : 3,
    customerId,
    total: amount,
    discount: 0,
    paid: 0,
    due: amount,
    method: "due",
    createdAt: daysAgo(day, 17),
  })
}
openingDue(1, 1, 2500, 40)
openingDue(3, 2, 1800, 12)

purchases.push(
  {
    id: 1,
    shopId: 1,
    supplierId: 1,
    productId: 1,
    variantId: null,
    qty: 30,
    cost: 650,
    paid: 4500,
    createdAt: daysAgo(20, 14),
  },
  {
    id: 2,
    shopId: 2,
    supplierId: 2,
    productId: 9,
    variantId: null,
    qty: 4,
    cost: 4500,
    paid: 10000,
    createdAt: daysAgo(9, 14),
  }
)
