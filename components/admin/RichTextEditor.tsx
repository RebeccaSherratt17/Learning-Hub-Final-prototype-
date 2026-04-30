'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useState, useCallback, useRef, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Brand colour presets
// ---------------------------------------------------------------------------

const COLOR_PRESETS = [
  { label: 'Diligent Red', value: '#EE312E' },
  { label: 'Blue 3', value: '#0B4CCE' },
  { label: 'Gray 5', value: '#282E37' },
  { label: 'Black', value: '#000000' },
  { label: 'White', value: '#FFFFFF' },
] as const

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded px-2 py-1 text-xs font-medium transition ${
        active
          ? 'bg-diligent-gray-5 text-white'
          : 'text-diligent-gray-5 hover:bg-diligent-gray-1'
      } disabled:opacity-40`}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Link input popover
// ---------------------------------------------------------------------------

function LinkPopover({
  initialUrl,
  onSubmit,
  onRemove,
  onClose,
}: {
  initialUrl: string
  onSubmit: (url: string) => void
  onRemove: () => void
  onClose: () => void
}) {
  const [url, setUrl] = useState(initialUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="absolute left-0 top-full z-10 mt-1 flex items-center gap-2 rounded border border-diligent-gray-2 bg-white p-2 shadow-md">
      <input
        ref={inputRef}
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSubmit(url)
          }
          if (e.key === 'Escape') onClose()
        }}
        placeholder="https://example.com"
        className="w-64 border border-diligent-gray-2 rounded px-2 py-1 text-xs focus:border-diligent-red focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onSubmit(url)}
        className="rounded bg-diligent-red px-2 py-1 text-xs font-medium text-white hover:bg-diligent-red-2"
      >
        Apply
      </button>
      {initialUrl && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded px-2 py-1 text-xs font-medium text-diligent-gray-4 hover:text-diligent-red"
        >
          Remove
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="text-xs text-diligent-gray-3 hover:text-diligent-gray-5"
      >
        ✕
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Colour picker popover
// ---------------------------------------------------------------------------

function ColorPopover({
  onSelect,
  onClose,
}: {
  onSelect: (color: string) => void
  onClose: () => void
}) {
  return (
    <div className="absolute left-0 top-full z-10 mt-1 rounded border border-diligent-gray-2 bg-white p-2 shadow-md">
      <div className="flex gap-1.5">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.label}
            onClick={() => {
              onSelect(c.value)
              onClose()
            }}
            className="h-6 w-6 rounded border border-diligent-gray-2 hover:scale-110 transition"
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          onSelect('')
          onClose()
        }}
        className="mt-1.5 w-full text-center text-xs text-diligent-gray-4 hover:text-diligent-gray-5"
      >
        Reset colour
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  const [showLink, setShowLink] = useState(false)
  const [showColor, setShowColor] = useState(false)

  const handleLinkSubmit = useCallback(
    (url: string) => {
      if (!editor) return
      if (!url) {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .setLink({ href: url })
          .run()
      }
      setShowLink(false)
    },
    [editor],
  )

  if (!editor) return null

  const currentLink = editor.getAttributes('link').href ?? ''

  return (
    <div className="relative flex flex-wrap items-center gap-0.5 border-b border-diligent-gray-2 px-2 py-1.5">
      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        H3
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-diligent-gray-2" />

      {/* Inline formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
      >
        B
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
      >
        <em>I</em>
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-diligent-gray-2" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet list"
      >
        • List
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Ordered list"
      >
        1. List
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-diligent-gray-2" />

      {/* Link */}
      <ToolbarButton
        onClick={() => {
          setShowLink(!showLink)
          setShowColor(false)
        }}
        active={editor.isActive('link')}
        title="Hyperlink"
      >
        Link
      </ToolbarButton>

      {/* Colour */}
      <ToolbarButton
        onClick={() => {
          setShowColor(!showColor)
          setShowLink(false)
        }}
        active={!!editor.getAttributes('textStyle').color}
        title="Text colour"
      >
        Colour
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-diligent-gray-2" />

      {/* Clear formatting */}
      <ToolbarButton
        onClick={() =>
          editor.chain().focus().clearNodes().unsetAllMarks().run()
        }
        title="Clear formatting"
      >
        Clear
      </ToolbarButton>

      {/* Popovers */}
      {showLink && (
        <LinkPopover
          initialUrl={currentLink}
          onSubmit={handleLinkSubmit}
          onRemove={() => {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            setShowLink(false)
          }}
          onClose={() => setShowLink(false)}
        />
      )}
      {showColor && (
        <ColorPopover
          onSelect={(color) => {
            if (!color) {
              editor.chain().focus().unsetColor().run()
            } else {
              editor.chain().focus().setColor(color).run()
            }
          }}
          onClose={() => setShowColor(false)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main editor component
// ---------------------------------------------------------------------------

interface RichTextEditorProps {
  id: string
  value: string
  onChange: (html: string) => void
}

export default function RichTextEditor({ id, value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      TextStyle,
      Color,
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML())
    },
    editorProps: {
      attributes: {
        id,
        class:
          'prose prose-sm max-w-none px-3 py-2 min-h-[120px] focus:outline-none',
      },
    },
  })

  return (
    <div className="rounded border border-diligent-gray-2 focus-within:border-diligent-red focus-within:ring-1 focus-within:ring-diligent-red">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
