import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  draftMode().disable()
  const url = new URL(request.url)
  const returnTo = url.searchParams.get('return-to') ?? '/'
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
    redirect('/')
  }
  redirect(returnTo)
}
