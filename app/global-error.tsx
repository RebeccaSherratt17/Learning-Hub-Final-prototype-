'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          backgroundColor: '#ffffff',
          color: '#282E37',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '1.5rem',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: '#6F7377', marginBottom: '2rem' }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              backgroundColor: '#EE312E',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.875rem 2rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
