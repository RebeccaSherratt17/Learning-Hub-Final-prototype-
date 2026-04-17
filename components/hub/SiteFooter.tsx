export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-diligent-gray-2 bg-diligent-gray-1">
      <div className="mx-auto flex max-w-[var(--max-content-width)] flex-col items-start justify-between gap-4 px-6 py-8 md:flex-row md:items-center">
        <p className="text-sm text-diligent-gray-4">
          &copy; {new Date().getFullYear()} Diligent Corporation. All rights reserved.
        </p>
        <a
          href="mailto:certifications@diligent.com"
          className="text-sm font-medium"
        >
          certifications@diligent.com
        </a>
      </div>
    </footer>
  )
}
