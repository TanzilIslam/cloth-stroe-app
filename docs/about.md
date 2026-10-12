# Shop Dashboard — Core Plan

**Shops:** Men's (suit/shirt/pant fabric) + Women's (three-piece, saree, orna)
**Stack:** Next.js (TS) · shadcn/ui · Neon DB · Drizzle ORM · Vercel

## Core Idea
Staff do only **3 actions**: বিক্রি (sell), মাল তোলা (stock in), খরচ (expense). The system calculates everything else.

## Pages (5)
| Route | Purpose | Who |
|---|---|---|
| `/login` | 4-digit PIN, auto-select shop | All |
| `/` | Dashboard: today's sale, profit, cash, dues, alerts | Owner (staff see a limited view) |
| `/sell` | POS: search → qty → pay | Staff |
| `/stock` | Products, stock in, low/dead stock | Both |
| `/hisab` | Dues (customer/supplier), expenses, monthly report | Owner |

## Tables (12)
1. `shops`: id, name, type (men/women)
2. `users`: id, name, pin_hash, role (owner/staff), shop_id
3. `products`: id, shop_id, name, brand, category, unit (piece/yard/meter), cost_price, sell_price, stock_qty, low_stock_at, barcode, has_variants, active
4. `product_variants`: id, product_id, size, color, stock_qty, barcode (ready-made dresses; stock is tracked per variant when `has_variants`)
5. `customers`: id, shop_id, name, phone, due_balance
6. `suppliers`: id, shop_id, name, phone, payable_balance
7. `sales`: id, shop_id, user_id, customer_id, total, discount, paid, due, method (cash/bKash/due), created_at
8. `sale_items`: sale_id, product_id, variant_id (nullable), qty, price, cost_snapshot (keeps profit accurate; a negative qty is a return)
9. `purchases`: id, shop_id, supplier_id, product_id, variant_id (nullable), qty, cost, paid, created_at
10. `expenses`: id, shop_id, category (rent/salary/bill/tailor/other), amount, note, date
11. `payments`: id, shop_id, party_type (customer/supplier), party_id, amount, method, date
12. `cash_counts`: id, shop_id, user_id, expected, counted, diff, date

## Auto Outputs (no extra input needed)
- **Profit:** real profit per day, month, and shop.
- **Comparison:** today vs. the same day last week.
- **Low stock:** alerts plus a suggested reorder qty from the last 30 days of sales.
- **Dead stock:** items not sold in 60+ days.
- **Bestsellers:** top 5 products, brands, and categories.
- **Dues:** list sorted by oldest, with a WhatsApp reminder button.
- **Peak times:** best selling hour and day.
- **Cash check:** expected cash in drawer vs. counted cash (saved in `cash_counts`).

## Minimal Operation
- **Sell in 3 taps:** favorite/recent product tiles → qty chips (1 / 2 / 2.5 / 3 yard) → pay button.
- **Stock in:** pick product → qty → cost (pre-filled from last time).
- **Expense:** category icon → amount.
- **Language:** Bangla everywhere, big buttons, numpad entry.
- **Hidden from staff:** cost price and profit.

## Layouts
- **Mobile (<768px, staff):** bottom nav with 3 big buttons, stacked number cards, numpad.
- **Tab (md, counter):** POS split, product grid left, cart right.
- **Laptop (lg, owner):** sidebar plus data tables, filters, editing, reports.

## Stack Notes
- **Data layer:** Drizzle ORM + Neon serverless driver, Server Actions (no separate API).
- **Auth:** PIN with an `iron-session` cookie.
- **Stock updates:** stock_qty changes in the same DB transaction as the sale or purchase.
- **Mobile install:** PWA, so staff can add it to their home screen.

## Build Order
1. Schema + seed
2. Login
3. `/sell`
4. `/stock`
5. `/` dashboard
6. `/hisab`

## Decisions
- No wall board / kiosk screen: the owner dashboard with the Both toggle covers it.
- Ready-made dresses use a `product_variants` table (size/color).
- Customers, suppliers and payments are scoped per shop.
- Counted cash is stored in `cash_counts`.
- Purchases stay single-item, one row per product bought.
