# Function Master Plan

The starting point for building the app. **55 files → 84 functions** (20 `.ts` + 35 `.tsx`).

## Rules
- One file = one domain. Group related functions together; never one function per file.
- `.ts` = logic (actions, db, lib, hooks). `.tsx` = UI (1 component = 1 function).
- All DB writes are **Server Actions** in `src/actions/`. No API routes.
- Stock and balance changes run inside **one DB transaction**.
- Every action checks the session first (`requireUser` / `requireOwner`).
- shadcn files in `components/ui/` are generated and are **not counted**.

## Summary
| Layer | Files | Functions |
|---|---|---|
| Actions | 8 | 33 |
| DB + config | 5 | 2 |
| Lib | 3 | 12 |
| Types | 2 | 0 |
| Hooks | 2 | 2 |
| Pages / layouts | 7 | 7 |
| Components | 28 | 28 |
| **Total** | **55** | **84** |

## Folder Tree
```
drizzle.config.ts
src/
├─ middleware.ts
├─ actions/   auth · sales · products · purchases · parties · expenses · cash · reports
├─ db/        schema · index · seed
├─ lib/       session · utils · calc
├─ types/     index · validations
├─ hooks/     use-cart · use-auto-refresh
├─ app/
│  ├─ layout.tsx
│  ├─ login/page.tsx
│  └─ (app)/  layout · page · sell/page · stock/page · hisab/page
└─ components/
   ├─ layout/     bottom-nav · sidebar · page-header
   ├─ shared/     pin-pad · numpad · stat-card · data-table · money
   ├─ sell/       product-search · product-tile · qty-chips · cart · pay-dialog
   ├─ stock/      product-table · product-form · variant-form · stock-in-form · stock-alerts
   ├─ hisab/      expense-form · payment-form · cash-count-form · dues-list · monthly-report
   └─ dashboard/  today-summary · comparison-card · bestsellers · peak-times · wall-board
```

---

## Part 1: `.ts` files (20 files, 49 functions)

### Actions: `src/actions/` (8 files, 33)
| File | Functions | Role |
|---|---|---|
| `auth.ts` | `login`, `logout` | All |
| `sales.ts` | `searchProducts`, `getRecentProducts`, `createSale` (negative qty = return), `getSales` | Staff |
| `products.ts` | `getProducts`, `getProduct`, `createProduct`, `updateProduct`, `toggleProductActive`, `saveVariant`, `deleteVariant` | Both |
| `purchases.ts` | `createPurchase`, `getLastCost`, `getPurchases` | Both |
| `parties.ts` | `getParties(type)`, `saveParty(type)`, `recordPayment`, `getDues` | Owner |
| `expenses.ts` | `createExpense`, `getExpenses`, `deleteExpense` | Both |
| `cash.ts` | `getExpectedCash`, `saveCashCount` | Both |
| `reports.ts` | `getDashboard`, `getComparison`, `getBestsellers`, `getPeakTimes`, `getLowStock`, `getDeadStock`, `getMonthlyReport`, `getWallBoard` | Owner |

### DB and config (5 files, 2)
| File | Functions | Notes |
|---|---|---|
| `db/schema.ts` | — | Drizzle tables, enums, relations |
| `db/index.ts` | — | Neon serverless `db` client |
| `db/seed.ts` | `seed` | 2 shops, users, sample products |
| `middleware.ts` | `middleware` | Redirects to `/login`, blocks staff from owner routes |
| `drizzle.config.ts` | — | Migration config |

### Lib: `src/lib/` (3 files, 12)
| File | Functions |
|---|---|
| `session.ts` | `getSession`, `requireUser`, `requireOwner`, `hashPin`, `verifyPin` |
| `utils.ts` | `cn`, `formatTaka`, `toBanglaDigits`, `whatsappLink` |
| `calc.ts` | `calcProfit`, `calcReorderQty`, `calcCashDiff` |

### Types: `src/types/` (2 files, 0)
| File | Content |
|---|---|
| `index.ts` | Enums, types, interfaces (from `schema.md`) |
| `validations.ts` | Zod schemas (to be added with the API) |

### Hooks: `src/hooks/` (2 files, 2)
| File | Function | Purpose |
|---|---|---|
| `use-cart.ts` | `useCart` | Add, remove and set qty; totals for the POS |
| `use-auto-refresh.ts` | `useAutoRefresh` | 60s refresh for the wall board |

---

## Part 2: `.tsx` files (35 files, 35 functions)

### Pages and layouts: `src/app/` (7)
| File | Purpose |
|---|---|
| `layout.tsx` | Root: fonts, Bangla `lang`, PWA meta |
| `login/page.tsx` | PIN login |
| `(app)/layout.tsx` | Bottom nav on mobile, sidebar on desktop |
| `(app)/page.tsx` | Dashboard, which becomes the wall board on 2xl / kiosk |
| `(app)/sell/page.tsx` | POS |
| `(app)/stock/page.tsx` | Products, stock in, alerts |
| `(app)/hisab/page.tsx` | Dues, expenses, cash, monthly report |

### Components: `src/components/` (28)
| Folder | Components | Used in |
|---|---|---|
| `layout/` | `BottomNav`, `Sidebar`, `PageHeader` | All |
| `shared/` | `PinPad`, `Numpad`, `StatCard`, `DataTable`, `Money` | All |
| `sell/` | `ProductSearch`, `ProductTile`, `QtyChips`, `Cart`, `PayDialog` | `/sell` |
| `stock/` | `ProductTable`, `ProductForm`, `VariantForm`, `StockInForm`, `StockAlerts` | `/stock` |
| `hisab/` | `ExpenseForm`, `PaymentForm`, `CashCountForm`, `DuesList`, `MonthlyReport` | `/hisab` |
| `dashboard/` | `TodaySummary`, `ComparisonCard`, `Bestsellers`, `PeakTimes`, `WallBoard` | `/` |

---

## Flow: page → component → action
| Page | Components | Actions |
|---|---|---|
| `/login` | `PinPad` | `login` |
| `/sell` | `ProductSearch`, `ProductTile`, `QtyChips`, `Cart`, `PayDialog` | `searchProducts`, `getRecentProducts`, `createSale` |
| `/stock` | `ProductTable`, `ProductForm`, `VariantForm`, `StockInForm`, `StockAlerts` | `products.*`, `createPurchase`, `getLastCost`, `getLowStock`, `getDeadStock` |
| `/hisab` | `DuesList`, `PaymentForm`, `ExpenseForm`, `CashCountForm`, `MonthlyReport` | `parties.*`, `expenses.*`, `cash.*`, `getMonthlyReport` |
| `/` | `TodaySummary`, `ComparisonCard`, `Bestsellers`, `PeakTimes`, `WallBoard` | `getDashboard`, `getComparison`, `getBestsellers`, `getPeakTimes`, `getWallBoard` |

## Buffer
84 of the 85-function budget is planned. New functions go into an existing domain file first; add a new file only when one passes about 300 lines.
