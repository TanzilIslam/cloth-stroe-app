# Function Blueprint

A high-level overview of the app structure. It is a **guide, not a strict rule**: files and functions can grow or shrink with complexity. Details get filled in step by step once the Next.js app is connected to Neon.

**Starting estimate:** about 20 `.ts` + 35 `.tsx` files, about 80–85 functions.

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
├─ lib/            Session, helpers, calculations
├─ types/          Shared types (schema.md) + Zod
├─ hooks/          Client state (cart, session, data loading)
├─ app/            Pages + layouts
└─ components/     UI grouped by page
```

## Backend (`.ts`)
| Area | Files | Responsibility |
|---|---|---|
| Actions | `auth`, `sales`, `products`, `purchases`, `parties`, `expenses`, `cash`, `reports` | Read and write data for each domain |
| DB | `schema`, `index`, `seed` | Tables, connection, sample data |
| Lib | `session`, `action`, `result`, `session-store`, `utils`, `calc` | PIN session, formatting (Taka, dates, WhatsApp link), profit and reorder math |
| Types | `index`, `validations` | Interfaces and Zod schemas |
| Hooks | `use-cart`, `use-session`, `use-query` | POS cart, current user, page data loading |
| Config | `proxy`, `drizzle.config` | Route protection, migrations |

## Frontend (`.tsx`)
| Page | Purpose | Component group |
|---|---|---|
| `/login` | PIN login | `shared` (PinPad) |
| `/` | Dashboard (This shop / Both) | `dashboard` |
| `/sell` | POS | `sell` |
| `/stock` | Products, stock in, alerts | `stock` |
| `/hisab` | Dues, expenses, cash, reports | `hisab` |
| Layouts | Root + app shell (bottom nav / sidebar) | `layout` |

Shared UI (Numpad, StatCard, DataTable, Money) lives in `components/shared/`. shadcn files in `components/ui/` are not tracked here.

## Build Steps
1. Set up the Next.js app and connect Neon + Drizzle
2. Schema + seed
3. Login + session
4. `/sell`
5. `/stock`
6. `/` dashboard
7. `/hisab`
8. Polish + PWA

Update this file at each step as functions are added.
