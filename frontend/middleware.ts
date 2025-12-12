import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const authCookie = request.cookies.get("et3aa_auth")
    
    // Strict check - cookie must exist and have exact value
    if (!authCookie || authCookie.value !== "authenticated") {
      // Redirect to login page
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      const response = NextResponse.redirect(loginUrl)
      // Prevent caching of redirect
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
      return response
    }
    
    // Prevent caching of dashboard pages
    const response = NextResponse.next()
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}

