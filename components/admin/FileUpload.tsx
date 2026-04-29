'use client'

import { useCallback, useRef, useState } from 'react'

interface FileUploadProps {
  accept?: string
  folder: string
  maxSizeMB?: number
  currentUrl?: string | null
  currentFileName?: string | null
  onUpload: (url: string, fileName: string, assetId: string) => void
  onRemove?: () => void
  label?: string
  hint?: string
}

export default function FileUpload({
  accept,
  folder,
  maxSizeMB = 10,
  currentUrl,
  currentFileName,
  onUpload,
  onRemove,
  label,
  hint,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(
    currentFileName ?? null
  )
  const [fileUrl, setFileUrl] = useState<string | null>(currentUrl ?? null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null)

      if (file.size > maxSizeBytes) {
        setError(`File too large. Maximum size is ${maxSizeMB}MB.`)
        return
      }

      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Upload failed')
        }

        const data = await res.json()
        setFileName(data.fileName)
        setFileUrl(data.url)
        onUpload(data.url, data.fileName, data.assetId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [folder, maxSizeBytes, maxSizeMB, onUpload]
  )

  const handleRemove = useCallback(async () => {
    if (!fileUrl) return

    try {
      await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fileUrl }),
      })
    } catch {
      // Proceed with UI removal even if delete fails
    }

    setFileName(null)
    setFileUrl(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onRemove?.()
  }, [fileUrl, onRemove])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-diligent-gray-5">
          {label}
        </label>
      )}

      {fileUrl && fileName ? (
        <div className="flex items-center gap-3 rounded-md border border-diligent-gray-2 bg-diligent-gray-1 px-4 py-3">
          <span className="material-symbols-sharp text-[20px] text-diligent-gray-4">
            description
          </span>
          <span className="flex-1 truncate text-sm text-diligent-gray-5">
            {fileName}
          </span>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded p-1 text-diligent-gray-4 transition-colors hover:bg-diligent-gray-2 hover:text-diligent-gray-5"
            aria-label="Remove file"
          >
            <span className="material-symbols-sharp text-[18px]">close</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          disabled={uploading}
          className={`flex w-full flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-8 transition-colors ${
            dragOver
              ? 'border-diligent-gray-4 bg-diligent-gray-1'
              : 'border-diligent-gray-2 hover:border-diligent-gray-3'
          } ${uploading ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}
        >
          {uploading ? (
            <>
              <span className="material-symbols-sharp mb-2 text-[32px] animate-pulse text-diligent-gray-3">
                upload_file
              </span>
              <span className="text-sm text-diligent-gray-4">
                Uploading...
              </span>
            </>
          ) : (
            <>
              <span className="material-symbols-sharp mb-2 text-[32px] text-diligent-gray-3">
                upload_file
              </span>
              <span className="text-sm text-diligent-gray-4">
                Drag and drop a file here, or click to browse
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        aria-label={label || 'File upload'}
      />

      {hint && (
        <p className="mt-1 text-xs text-diligent-gray-3">{hint}</p>
      )}

      {error && (
        <p className="mt-1 text-xs text-diligent-red" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
