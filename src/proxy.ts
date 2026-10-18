// Quick auth check before any page renders: no session cookie → /login.
// Real checks (valid cookie, role, shop) run in every Server Action.
import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE } from "@/lib/config"
import { ROUTES } from "@/lib/routes"

export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL(ROUTES.login, request.url))
  }
}

export const config = {
  // Everything except login, Next internals and public files
  matcher: [
    "/((?!login|_next/|favicon.ico|apple-icon|icon-|manifest.webmanifest).*)",
  ],
}
