// Minimal CSV builder for admin exports.

type CsvValue = string | number | boolean | Date | null | undefined

function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return ''
  let text = value instanceof Date ? value.toISOString() : String(value)
  // Neutralise spreadsheet formula injection from user-submitted text
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`
  return text
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n')
}
