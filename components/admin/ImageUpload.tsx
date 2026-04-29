'use client'

import { useCallback, useState } from 'react'
import FileUpload from './FileUpload'

interface ImageUploadProps {
  folder?: string
  currentUrl?: string | null
  currentAlt?: string | null
  onUpload: (url: string, alt: string, assetId: string) => void
  onRemove?: () => void
  label?: string
  hint?: string
}

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/svg+xml,image/gif'

export default function ImageUpload({
  folder = 'thumbnails',
  currentUrl = null,
  currentAlt = null,
  onUpload,
  onRemove,
  label = 'Image',
  hint,
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl)
  const [altText, setAltText] = useState(currentAlt ?? '')
  const [assetId, setAssetId] = useState<string | null>(null)

  const handleUpload = useCallback(
    (url: string, _fileName: string, newAssetId: string) => {
      setPreviewUrl(url)
      setAssetId(newAssetId)
      onUpload(url, altText, newAssetId)
    },
    [altText, onUpload]
  )

  const handleRemove = useCallback(() => {
    setPreviewUrl(null)
    setAssetId(null)
    setAltText('')
    onRemove?.()
  }, [onRemove])

  const handleAltChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAlt = e.target.value
    setAltText(newAlt)
    if (previewUrl && assetId) {
      onUpload(previewUrl, newAlt, assetId)
    }
  }

  return (
    <div>
      {previewUrl && (
        <div className="mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={altText || 'Preview'}
            className="h-40 w-auto rounded-md border border-diligent-gray-2 object-cover"
          />
        </div>
      )}

      <FileUpload
        accept={IMAGE_ACCEPT}
        folder={folder}
        maxSizeMB={10}
        currentUrl={previewUrl}
        currentFileName={previewUrl ? (altText || 'Uploaded image') : null}
        onUpload={handleUpload}
        onRemove={handleRemove}
        label={label}
        hint={hint}
      />

      <div className="mt-2">
        <label
          htmlFor="image-alt-text"
          className="mb-1 block text-sm font-medium text-diligent-gray-5"
        >
          Alt text
        </label>
        <input
          id="image-alt-text"
          type="text"
          value={altText}
          onChange={handleAltChange}
          placeholder="Describe the image for accessibility"
          className="w-full rounded-md border border-diligent-gray-2 px-3 py-2 text-sm text-diligent-gray-5 placeholder:text-diligent-gray-3 focus:border-diligent-gray-4 focus:outline-none focus:ring-1 focus:ring-diligent-gray-4"
        />
      </div>
    </div>
  )
}
