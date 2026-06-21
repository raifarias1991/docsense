import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROOT_ROUTE = '/'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect root to /login (client-side auth guards handle the rest
  // since the refresh token lives in localStorage, not cookies)
  if (pathname === ROOT_ROUTE) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
