import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

type RedirectRule = {
  sourcePath: string
  destinationPath: string
}

let redirectCache: RedirectRule[] = []
let cacheTimestamp = 0
const CACHE_TTL_MS = 60_000

async function getRedirects(request: NextRequest): Promise<RedirectRule[]> {
  const now = Date.now()
  if (now - cacheTimestamp < CACHE_TTL_MS && redirectCache.length > 0) {
    return redirectCache
  }

  try {
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('host') || 'localhost:3000'
    const res = await fetch(`${protocol}://${host}/api/redirects`, {
      headers: { 'x-middleware-internal': '1' },
    })

    if (res.ok) {
      redirectCache = await res.json()
      cacheTimestamp = now
    }
  } catch (error) {
    console.error('Failed to fetch redirects in middleware:', error)
  }

  return redirectCache
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- Admin auth protection ---
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = await getToken({ req: request })
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // --- 301 redirects ---
  const redirects = await getRedirects(request)
  const match = redirects.find((r) => r.sourcePath === pathname)

  if (match) {
    const destination = match.destinationPath.startsWith('http')
      ? match.destinationPath
      : new URL(match.destinationPath, request.url).toString()

    return NextResponse.redirect(destination, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/).*)',
  ],
}
