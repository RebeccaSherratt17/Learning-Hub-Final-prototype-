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
  const classes = className ? `rich-text ${className}` : 'rich-text'
  return <Tag className={classes} dangerouslySetInnerHTML={{ __html: clean }} />
}
