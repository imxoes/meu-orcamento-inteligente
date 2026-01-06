import { NextRequest, NextResponse } from 'next/server'
import { verifyJWTEdge } from './lib/jwt-edge'

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.telegram.org https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: https:; " +
    "connect-src 'self' https://api.openai.com https://api.telegram.org https://api.stripe.com; " +
    "frame-src https://js.stripe.com; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  )

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // HSTS (only in production with HTTPS)
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

export async function middleware(request: NextRequest) {
  // Create response
  let response: NextResponse

  // Only protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('token')?.value

    if (!token) {
      response = NextResponse.redirect(new URL('/auth/login', request.url))
      return addSecurityHeaders(response)
    }

    try {
      // Only validate JWT, not session (to avoid Prisma timeout in Edge Runtime)
      const decoded = await verifyJWTEdge(token)
      if (!decoded) {
        response = NextResponse.redirect(new URL('/auth/login', request.url))
        return addSecurityHeaders(response)
      }
      response = NextResponse.next()
    } catch (error) {
      response = NextResponse.redirect(new URL('/auth/login', request.url))
      return addSecurityHeaders(response)
    }
  } else {
    response = NextResponse.next()
  }

  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}