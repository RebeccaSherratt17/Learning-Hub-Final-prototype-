import 'server-only'
import { put, del } from '@vercel/blob'

export async function uploadToBlob(
  file: File,
  folder: string
): Promise<{ url: string; size: number }> {
  const timestamp = Date.now()
  const pathname = `${folder}/${timestamp}-${file.name}`

  try {
    const blob = await put(pathname, file, {
      access: 'public',
    })

    return { url: blob.url, size: file.size }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('private store')
    ) {
      throw new Error(
        'Your Vercel Blob store is configured as private, but the Learning Hub requires a public store so images can be displayed on the site. ' +
        'Please create a new blob store with public access in the Vercel dashboard and update BLOB_READ_WRITE_TOKEN in .env.local.'
      )
    }
    throw error
  }
}

export async function deleteFromBlob(url: string): Promise<void> {
  await del(url)
}
