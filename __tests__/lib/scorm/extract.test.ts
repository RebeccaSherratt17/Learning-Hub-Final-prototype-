import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { extractScormPackage } from '@/lib/scorm/extract'

async function createTestZip(files: Record<string, string>): Promise<Buffer> {
  const zip = new JSZip()
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content)
  }
  return Buffer.from(await zip.generateAsync({ type: 'arraybuffer' }))
}

describe('extractScormPackage', () => {
  it('extracts files from a valid SCORM zip', async () => {
    const zipBuffer = await createTestZip({
      'imsmanifest.xml': '<manifest/>',
      'index.html': '<html></html>',
    })
    const files = await extractScormPackage(zipBuffer)
    expect(files).toHaveLength(2)
    expect(files.map((f) => f.path)).toContain('imsmanifest.xml')
    expect(files.map((f) => f.path)).toContain('index.html')
  })

  it('rejects zip without imsmanifest.xml', async () => {
    const zipBuffer = await createTestZip({
      'index.html': '<html></html>',
    })
    await expect(extractScormPackage(zipBuffer)).rejects.toThrow('imsmanifest.xml')
  })

  it('rejects absolute path entries', async () => {
    const zip = new JSZip()
    zip.file('imsmanifest.xml', '<manifest/>')
    zip.file('/etc/passwd', 'malicious')
    const zipBuffer = Buffer.from(await zip.generateAsync({ type: 'arraybuffer' }))
    await expect(extractScormPackage(zipBuffer)).rejects.toThrow('path traversal')
  })

  it('rejects tilde path entries', async () => {
    const zip = new JSZip()
    zip.file('imsmanifest.xml', '<manifest/>')
    zip.file('~/.ssh/id_rsa', 'malicious')
    const zipBuffer = Buffer.from(await zip.generateAsync({ type: 'arraybuffer' }))
    await expect(extractScormPackage(zipBuffer)).rejects.toThrow('path traversal')
  })

  it('rejects zip with too many files', async () => {
    const files: Record<string, string> = { 'imsmanifest.xml': '<manifest/>' }
    for (let i = 0; i < 2001; i++) {
      files[`file-${i}.html`] = '<html/>'
    }
    const zipBuffer = await createTestZip(files)
    await expect(extractScormPackage(zipBuffer)).rejects.toThrow('file count')
  })

  it('rejects individual files exceeding size limit', async () => {
    const zip = new JSZip()
    zip.file('imsmanifest.xml', '<manifest/>')
    // 60 MB file — exceeds 50 MB per-file limit
    zip.file('huge.bin', Buffer.alloc(60 * 1024 * 1024))
    const zipBuffer = Buffer.from(await zip.generateAsync({ type: 'arraybuffer' }))
    await expect(extractScormPackage(zipBuffer)).rejects.toThrow('size limit')
  })
})
