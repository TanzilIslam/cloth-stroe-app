# Function Blueprint

A high-level overview of the app structure. It is a **guide, not a strict rule**: files and functions grow or shrink with complexity.

**Now:** 41 `.ts` + 50 `.tsx` files (+10 shadcn), 44 Server Actions. (Starting estimate was 20 + 35 files, 80–85 functions.)

## Principles
- One file = one domain.
- `.ts` = logic, `.tsx` = UI.
- DB writes go through Server Actions only (no API routes).
- Stock and balance updates run in one transaction.
- Every action checks the session and role first.

## Structure
```
src/
├─ proxy.ts        No session cookie → /login
├─ actions/        Server Actions, one file per domain (return { ok, data | error })
├─ api/            Client wrapper: same names, throws on error
├─ db/             Drizzle schema, pg client, time helpers, seed
├─ lib/            Session, login limit, result helpers, formatting, calculations
├─ types/          Shared types (schema.md) + Zod
├─ hooks/          Client state (cart, session, data loading)
├─ app/            Pages + layouts
└─ components/     UI grouped by page
```

## Backend (`.ts`)
| Area | Files | Responsibility |
|---|---|---|
| Actions | `auth`, `users`, `sales`, `products`, `purchases`, `parties`, `expenses`, `cash`, `reports` | Read and write data for each domain |
| DB | `schema`, `index`, `time`, `products`, `seed`, `seed-data` | Tables, connection, Dhaka time SQL, shared product reads, demo data |
| Lib | `session`, `login-limit`, `action`, `result`, `session-store`, `env`, `config`, `errors`, `routes`, `utils`, `calc` | PIN session + guards, attempt limit, `{ ok, data \| error }`, client user cache, env check, shared constants (time zone, cookie, error text, URLs), formatting, profit / reorder / rounding math |
| Types | `index`, `validations` | Interfaces and Zod schemas |
| Hooks | `use-cart`, `use-session`, `use-shops`, `use-query`, `use-action` | POS cart, current user, shops, page data loading, mutations with pending + toasts |
| Config | `proxy`, `drizzle.config` | Route protection, migrations |

## Server Actions (44)
| File | Functions | Who |
|---|---|---|
| `auth` | `login`, `logout`, `getMe`, `getShops`, `switchShop` | All (switch: owner) |
| `users` | `getUsers`, `createUser`, `updateUser`, `setUserActive`, `getLoginLocks`, `unlockLogin` | Owner |
| `sales` | `searchProducts`, `getRecentProducts`, `createSale`, `getSales` | Shop users |
| `products` | `getProducts`, `getProduct`, `createProduct`, `updateProduct`, `toggleProductActive`, `saveVariant`, `deleteVariant` | Read: shop users · write: owner |
| `purchases` | `createPurchase`, `getPurchases`, `getLastCost` | Shop users (`getLastCost`: owner) |
| `parties` | `getParties`, `saveParty`, `updateParty`, `getDues`, `recordPayment` | Shop users (dues, payments: owner) |
| `expenses` | `createExpense`, `getExpenses`, `getTodayExpenses`, `deleteExpense` | Shop users (delete: owner) |
| `cash` | `getExpectedCash`, `saveCashCount`, `getCashCounts` | Shop users |
| `reports` | `getDashboard`, `getComparison`, `getBestsellers`, `getPeakTimes`, `getMonthlyReport`, `getLowStock`, `getDeadStock` | Owner (dashboard + stock alerts: shop users) |

Staff never receive cost price or profit. The client calls these through `src/api/` (same names).

## Frontend (`.tsx`)
| Page | Purpose | Component group |
|---|---|---|
| `/login` | PIN login | `shared` (PinPad) |
| `/` | Dashboard (This shop / Both) | `dashboard` |
| `/sell` | POS; `/sell/history` = sales by day | `sell` |
| `/stock` | Products, stock in, alerts, stock-in history | `stock` |
| `/hisab` | Dues, expenses, cash, reports | `hisab` |
| `/setup` | Owner: staff accounts, customers, suppliers | `setup` |
| Layouts | Root + app shell (bottom nav / sidebar) | `layout` |

Shared UI lives in `components/shared/`: `Numpad`, `PinPad`, `StatCard`, `DataTable`, `Money`, `Loading` / `LoadError`, `EmptyState`, `useConfirm` (confirm dialog). Layout pieces in `components/layout/`: `Brand`, `Sidebar`, `BottomNav`, `PageHeader`, nav items, and the Expense sheet context. shadcn files in `components/ui/` are not tracked here.

## Build Steps
1. ✅ Next.js app, frontend with mock data, polish + PWA
2. ✅ Drizzle schema, migrations, seed
3. ✅ Login + session + guards
4. ✅ Server Actions for every page, Zod validation
5. ✅ `/setup`, sales / stock-in history, staff cash count, PIN limit
6. ✅ Quick improvements, Neon setup, UI polish
7. ⬜ Go-live: Vercel, clean production seed

Update this file as functions are added.
