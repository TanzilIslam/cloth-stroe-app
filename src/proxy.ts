// Quick auth check before any page renders: no session cookie → /login.
// Real checks (valid cookie, role, shop) run in every Server Action.
import { NextResponse, type NextRequest } from "next/server"

const COOKIE = "shop_session" // keep in sync with lib/session.ts

export function proxy(request: NextRequest) {
  if (!request.cookies.has(COOKIE)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  // Everything except login, Next internals and public files
  matcher: [
    "/((?!login|_next/|favicon.ico|apple-icon|icon-|manifest.webmanifest).*)",
  ],
}
