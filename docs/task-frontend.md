# Frontend Tasks

Built in user-journey order with **mock data only** (no backend). Each task ends with a clear outcome.
When the backend is ready, mock calls are swapped for Server Actions without changing the UI.

**Rules:** mobile first · big buttons · cost and profit hidden from staff · run `pnpm validate` before each push.

**No-rewrite rules** (so the backend swap needs no UI changes):
1. Types come from `docs/schema.md`.
2. All data goes through one layer (`src/api/`, which calls the Server Actions in `src/actions/`), using the same function names as `docs/function.md`.
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
✅ Done: pages import from `@/api` (Server Actions) instead of the mocks, with no UI changes. The demo data now lives in `src/db/seed-data.ts`.

## Added After the Plan
- [x] `/setup` (owner): staff accounts, customers, suppliers, locked devices
- [x] `/sell/history`: sales by day with details
- [x] Stock → History tab (stock-in history; cost hidden from staff)
- [x] Expense sheet → Count cash tab (staff cash count)
- [x] Mock layer replaced by real Server Actions (`src/api/`)

---

## Improvements (later)
Found in a review after the backend was done. Nothing is broken; these make the code more consistent and the UI safer. Suggested order: 1 → 5.

### 1. Reusable building blocks
- [ ] **`ROUTES` constant** (`src/lib/routes.ts`): one place for `"/"`, `"/login"`, `"/sell"`, `"/sell/history"`, `"/stock"`, `"/hisab"`, `"/setup"`. Use it in nav items, redirects, links, `proxy.ts` and `OWNER_ONLY`.
- [ ] **Shop time zone constant:** `"Asia/Dhaka"` is written in `src/lib/utils.ts`, `src/db/time.ts` and `comparison-card.tsx`. Export one `SHOP_TZ` and use it everywhere (SQL included).
- [ ] **Payment method labels:** "Cash" / "bKash" / "Due" are repeated in the pay dialog, payment form and sale list. Add `PAYMENT_LABELS` next to the enums in `src/types`.
- [ ] **Form field style:** the `flex flex-col gap-1.5 text-sm font-medium` label class is copied in several forms. Make a small `Field` component in `components/shared/` and use it in every form.
- [ ] **Remove unused shadcn `label`** (`src/components/ui/label.tsx`): no file imports it.

**Outcome:** URLs, time zone and labels change in one place only.

### 2. Shared Zod on the client
- [ ] Forms (product, stock in, party, user, payment, expense, cash count) use their own `valid` checks. Validate with the same schemas from `src/types/validations.ts` before calling the action, and show the first error under the form.
- [ ] Keep the server check as is (never trust the client).

**Outcome:** a rule (e.g. "sell price must be more than 0") is written once and gives the same message in the form and on the server.

### 3. `useAction` hook: pending + toast in one place
- [ ] **Hook** (`src/hooks/use-action.ts`): wraps any `src/api` call and returns `{ run, pending }`. On success it shows an optional success toast; on error it shows the error message as a toast (or returns it for inline display).
- [ ] **Use it for every mutation**, replacing the hand-written `pending` / `error` / `try-catch` in each form and page.
- [ ] **Fix one-click actions with no pending state or error handling:** deactivate / activate product, delete expense, add / delete variant, deactivate user, unlock device, shop switch. Today a failure there is silent, and a double tap can fire twice.
- [ ] **Add missing feedback toasts:** shop switch ("Now in Women's Shop"), variant added / deleted, expense deleted, product activated / deactivated.

**Outcome:** every action disables its button while running and always ends with a clear message, success or error.

### 4. Loaders on every data load
- [ ] Shared `Loading` skeleton (already in `components/shared/load-state.tsx`) on the tabs that show nothing while loading: Stock → Alerts, Hisab → Expenses, Cash, Report, and the expense sheet's Today list and Count cash tab.
- [ ] Pay dialog: show a small loader while customers load.
- [ ] Every query also shows `LoadError` with "Try again" on failure (some tabs only check the first query).

**Outcome:** no blank areas; the user always sees loading, data, empty or error.

### 5. `ConfirmDialog` for delete and important actions
- [ ] **Component** (`components/shared/confirm-dialog.tsx`): title, message, confirm label, red "danger" style for destructive actions, pending state while the action runs. Easy to call, e.g. `confirm({ title, message, danger: true })` returning a promise, or a `<ConfirmDialog>` wrapper around the trigger button.
- [ ] **Use it on:**
  - delete expense
  - delete variant
  - deactivate product
  - deactivate user
  - unlock device
  - save cash count when there's a difference ("Cash is short ৳X. Save anyway?")
  - refund in return mode
  - receive / pay a payment of more than ৳10,000
- [ ] Use the danger style (red confirm button) for the deletes and deactivations.

**Outcome:** no destructive or money-moving action happens from a single accidental tap.
