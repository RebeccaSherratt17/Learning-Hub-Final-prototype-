import JSZip from 'jszip'

const MAX_FILE_COUNT = 2000
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB per file
const MAX_TOTAL_SIZE = 500 * 1024 * 1024 // 500 MB total extracted

export interface ExtractedFile {
  path: string
  content: Buffer
}

/**
 * Extract a SCORM zip package with security protections.
 * Returns an array of { path, content } for each extracted file.
 * Throws on invalid packages, path traversal, or zip bombs.
 */
export async function extractScormPackage(
  zipBuffer: Buffer
): Promise<ExtractedFile[]> {
  const zip = await JSZip.loadAsync(zipBuffer)

  // Check for imsmanifest.xml (case-insensitive)
  const manifestKey = Object.keys(zip.files).find(
    (name) => name.toLowerCase() === 'imsmanifest.xml'
  )
  if (!manifestKey) {
    throw new Error('Invalid SCORM package: missing imsmanifest.xml')
  }

  const entries = Object.entries(zip.files).filter(([, file]) => !file.dir)

  // File count check
  if (entries.length > MAX_FILE_COUNT) {
    throw new Error(
      `SCORM package exceeds file count limit (${entries.length} files, max ${MAX_FILE_COUNT})`
    )
  }

  const files: ExtractedFile[] = []
  let totalSize = 0

  for (const [path, file] of entries) {
    // Path traversal check
    const normalised = path.replace(/\\/g, '/')
    if (
      normalised.includes('..') ||
      normalised.startsWith('/') ||
      normalised.startsWith('~')
    ) {
      throw new Error(
        `Invalid SCORM package: path traversal detected in "${path}"`
      )
    }

    const content = Buffer.from(await file.async('arraybuffer'))

    // Per-file size check
    if (content.length > MAX_FILE_SIZE) {
      throw new Error(
        `File "${path}" exceeds per-file size limit (${(content.length / 1024 / 1024).toFixed(1)} MB, max ${MAX_FILE_SIZE / 1024 / 1024} MB)`
      )
    }

    totalSize += content.length
    if (totalSize > MAX_TOTAL_SIZE) {
      throw new Error(
        `SCORM package exceeds total extracted size limit (max ${MAX_TOTAL_SIZE / 1024 / 1024} MB)`
      )
    }

    files.push({ path: normalised, content })
  }

  return files
}
