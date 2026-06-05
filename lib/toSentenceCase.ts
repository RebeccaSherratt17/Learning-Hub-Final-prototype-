/** Acronyms and abbreviations that should be preserved as-is */
const PRESERVE = new Set(['AI', 'ESG', 'ERM', 'GRC', 'IPO'])

/** Convert a string to sentence case, preserving known acronyms */
export function toSentenceCase(str: string): string {
  if (!str) return str
  return str
    .split(' ')
    .map((word, i) => {
      if (PRESERVE.has(word)) return word
      if (i === 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      return word.toLowerCase()
    })
    .join(' ')
}
