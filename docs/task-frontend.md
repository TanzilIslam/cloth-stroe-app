# Frontend Tasks

Built in user-journey order with **mock data only** (no backend). Each task ends with a clear outcome.
When the backend is ready, mock calls are swapped for Server Actions without changing the UI.

**Rules:** mobile first · big buttons · cost and profit hidden from staff · run `pnpm validate` before each push.

**No-rewrite rules** (so the backend swap needs no UI changes):
1. Types come from `docs/schema.md`.
2. All data goes through one layer (`src/mocks/` now, `src/actions/` later), using the same function names as `docs/function.md`.
3. Components receive data and handlers through props and never fetch on their own.

---

## 0. Foundation
- [x] Types in `src/types/` from `docs/schema.md`
- [x] Mock data in `src/mocks/` (shops, users, products, variants, customers, sales)
- [x] Mock role switch: log in with owner `1111` or staff `2222` / `3333`
- [x] Shared helpers: `formatTaka`, date format
- [x] Add needed shadcn components (badge, tabs, select, sheet)

**Outcome:** typed mock data that any page can import.

## 1. App Shell & Navigation
- [x] `(app)/layout`: bottom nav on mobile, sidebar on `lg`
- [x] `BottomNav`: Sell, Stock, Expense (staff)
- [x] `Sidebar`: Dashboard, Sell, Stock, Hisab (owner)
- [x] `PageHeader`: title + current shop
- [x] Hide owner-only links for staff

**Outcome:** every page is reachable with the correct nav per role and screen size.

## 2. Login
- [x] `PinPad`: 4 dots + numpad, auto-submit on the 4th digit
- [x] Wrong PIN shake / error state
- [x] Mock login → redirect (staff → `/sell`, owner → `/`)

**Outcome:** a user can "log in" with a mock PIN and lands on their home page.

## 3. Sell (POS): main staff flow
- [x] `ProductSearch`: search by name / barcode
- [x] `ProductTile`: favorite and recent product grid
- [x] Variant picker (size / color) for ready-made dresses
- [x] `QtyChips` (1 / 2 / 2.5 / 3) + `Numpad` for custom qty
- [x] `useCart`: add, remove, change qty, discount, total
- [x] `Cart`: item list + total; side panel on tablet, bottom sheet on mobile
- [x] `PayDialog`: cash / bKash / due, paid amount, change or due shown
- [x] Customer pick / quick add when there's a due
- [x] Success toast, then the cart resets
- [x] Return: negative qty item

**Outcome:** sell in 3 taps (tile → qty → pay), on both mobile and tablet.

## 4. Stock
- [x] `ProductTable`: list, search, filter by category, stock qty
- [x] `ProductForm`: create / edit, unit, prices, low-stock level
- [x] `VariantForm`: add size / color rows
- [x] `StockInForm`: product → qty → cost (pre-filled), supplier
- [x] `StockAlerts`: low stock + reorder suggestion, dead stock (60+ days)
- [x] Hide cost price for staff (staff stock in uses last cost)

**Outcome:** products can be browsed, added, edited and restocked, with alerts visible.

## 5. Expense (staff + owner)
- [x] `ExpenseForm`: category icons → amount numpad → save
- [x] Today's expense list

**Outcome:** an expense is recorded in 2 taps.

## 6. Hisab (owner)
- [x] Tabs: Dues · Expenses · Cash · Report
- [x] `DuesList`: customer / supplier, oldest first, WhatsApp reminder link
- [x] `PaymentForm`: receive / pay against a party
- [x] `CashCountForm`: expected vs. counted, difference highlighted
- [x] `MonthlyReport`: sale, profit, expenses by month and shop

**Outcome:** the owner sees all money in and out and who owes what.

## 7. Dashboard (owner)
- [x] `TodaySummary`: sale, profit, cash, dues (`StatCard`)
- [x] `ComparisonCard`: today vs. the same day last week
- [x] `Bestsellers`: top 5 products / brands / categories
- [x] `PeakTimes`: best hour and day
- [x] Alerts: low stock, oldest dues
- [x] Staff view: today's sale only

**Outcome:** the owner understands the day at a glance.

## 8. Polish & PWA
- [x] Responsive check: mobile, tablet, laptop
- [x] Loading, empty and error states on every page
- [x] Touch targets ≥ 44px, keyboard and focus check
- [x] PWA manifest + icons (add to home screen); no offline mode
- [x] Final `pnpm validate`

**Outcome:** an installable, responsive app ready to connect to the backend.

---

## Backend Hand-off
Mock function names should match `docs/function.md` (e.g. `createSale`, `getProducts`) so the swap is a one-line import change.
