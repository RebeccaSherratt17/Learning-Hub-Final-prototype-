import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const revalidate = 60

export async function GET() {
  try {
    const redirects = await prisma.redirect.findMany({
      select: {
        sourcePath: true,
        destinationPath: true,
      },
    })

    return NextResponse.json(redirects, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Failed to fetch redirects:', error)
    return NextResponse.json([], { status: 200 })
  }
}
