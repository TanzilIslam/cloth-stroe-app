# Shop Dashboard — Core Plan

**Shops:** Men's (suit/shirt/pant fabric) + Women's (three-piece, saree, orna)
**Stack:** Next.js (TS) · shadcn/ui · Neon DB · Drizzle ORM · Vercel

## Core Idea
Staff do only **3 actions**: বিক্রি (sell), মাল তোলা (stock in), খরচ (expense). The system calculates everything else.

## Pages (7)
| Route | Purpose | Who |
|---|---|---|
| `/login` | 4-digit PIN, auto-select shop | All |
| `/` | Dashboard: today's sale, profit, cash, dues, alerts | Owner (staff see today's sale only) |
| `/sell` | POS: search → qty → pay, return mode | Both |
| `/sell/history` | Sales by day, sale details (view only) | Both |
| `/stock` | Products, stock in, low/dead stock, stock-in history | Both |
| `/hisab` | Dues (customer/supplier), expenses, cash count, monthly report | Owner |
| `/setup` | Staff accounts, customers, suppliers, locked devices | Owner |

The **Expense** button (bottom nav / sidebar) opens a sheet with two tabs: add expense and count cash.

## Tables (13)
1. `shops`: id, name, type (men/women)
2. `users`: id, name, pin_hash, role (owner/staff), shop_id, active (inactive users can't log in)
3. `products`: id, shop_id, name, brand, category, unit (piece/yard/meter), cost_price, sell_price, stock_qty, low_stock_at, barcode, has_variants, active
4. `product_variants`: id, product_id, size, color, stock_qty, barcode (ready-made dresses; stock is tracked per variant when `has_variants`)
5. `customers`: id, shop_id, name, phone, due_balance
6. `suppliers`: id, shop_id, name, phone, payable_balance
7. `sales`: id, shop_id, user_id, customer_id, total, discount, paid, due, method (cash/bKash/due), created_at
8. `sale_items`: id, sale_id, product_id, variant_id (nullable), qty, price, cost_snapshot (keeps profit accurate; a negative qty is a return)
9. `purchases`: id, shop_id, supplier_id, product_id, variant_id (nullable), qty, cost, paid, created_at
10. `expenses`: id, shop_id, category (rent/salary/bill/tailor/other), amount, note, date
11. `payments`: id, shop_id, party_type (customer/supplier), party_id, amount, method, date
12. `cash_counts`: id, shop_id, user_id, expected, counted, diff, date
13. `login_attempts`: ip, failures, first_at, locked_until (PIN attempt limit per device)

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
- **Cash count:** opening cash + today's cash flows = expected; enter counted cash.
- **Language:** English for now (Bangla later), big buttons, numpad entry.
- **Hidden from staff:** cost price and profit.

## Layouts
- **Mobile (<768px, staff):** bottom nav with 3 big buttons, stacked number cards, numpad.
- **Tab (md, counter):** POS split, product grid left, cart right.
- **Laptop (lg, owner):** sidebar plus data tables, filters, editing, reports.

## Stack Notes
- **Data layer:** Drizzle ORM + `pg` (node-postgres) on Neon's pooled connection, Server Actions (no separate API). `pg` also runs against a local Postgres for testing.
- **Auth:** PIN (bcrypt hash) with an `iron-session` cookie. `src/proxy.ts` sends visitors without a cookie to `/login`; every action checks the session, role and shop.
- **Stock updates:** stock_qty changes in the same DB transaction as the sale or purchase (atomic `stock >= qty` check).
- **Time zone:** "today", hours and weekdays are computed in Asia/Dhaka (Vercel runs in UTC).
- **Validation:** every Server Action parses its input with Zod (`src/types/validations.ts`).
- **Session check:** every action re-reads the user from the database, so deactivation and role changes apply at once.
- **Login limit:** 5 wrong PINs in 15 min lock that device (IP) for 15 min; the owner can unlock on `/setup`.
- **Mobile install:** PWA, so staff can add it to their home screen.

## Build Order
1. ✅ Frontend with mock data (all pages, polish, PWA)
2. ✅ Schema + migrations + seed
3. ✅ PIN login, session, role and shop guards
4. ✅ Server Actions for every page (frontend switched off mocks)
5. ✅ Zod validation
6. ✅ `/setup`, sales history, stock-in history, staff cash count
7. ✅ PIN attempt limit
8. ⬜ Go-live: Neon on PC, Vercel deploy, clean production seed

## Decisions
- No wall board / kiosk screen: the owner dashboard with the Both toggle covers it.
- Ready-made dresses use a `product_variants` table (size/color).
- Customers, suppliers and payments are scoped per shop.
- Counted cash is stored in `cash_counts`.
- Purchases stay single-item, one row per product bought.
- Database driver is `pg` (node-postgres) with Neon's pooled URL; the same code runs on a local Postgres.
- Sales history is view only; mistakes are fixed with Return mode, so the record stays clean.
- Staff are deactivated, never deleted, so their past sales stay.
- Staff count cash from the Expense sheet (no 4th nav button).
- Owner can add staff and owners; at least one active owner is always kept.
- Moving into the app: products have opening stock, new variants have opening stock, and new customers / suppliers have an opening balance (owner only). None of these create fake sales or purchases; opening dues show as "opening balance" in Hisab.
