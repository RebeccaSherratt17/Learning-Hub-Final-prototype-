'use client'

import DOMPurify from 'isomorphic-dompurify'
import { useMemo } from 'react'

interface SafeHtmlProps {
  html: string
  className?: string
  as?: keyof HTMLElementTagNameMap
}

export function SafeHtml({ html, className, as: Tag = 'div' }: SafeHtmlProps) {
  const clean = useMemo(() => DOMPurify.sanitize(html), [html])
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: clean }} />
}
