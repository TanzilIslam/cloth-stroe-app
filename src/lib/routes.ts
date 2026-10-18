// Every app URL in one place.
export const ROUTES = {
  home: "/",
  login: "/login",
  sell: "/sell",
  salesHistory: "/sell/history",
  stock: "/stock",
  hisab: "/hisab",
  setup: "/setup",
} as const

/** Routes staff can't open. */
export const OWNER_ONLY: string[] = [ROUTES.hisab, ROUTES.setup]
