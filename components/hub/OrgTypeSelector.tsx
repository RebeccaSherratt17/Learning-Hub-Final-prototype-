'use client'

import { orgTypeConfig } from '@/components/hub/subjectGroupConfig'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

export interface OrgType {
  id: string
  name: string
  slug: string
  count: number
}

interface OrgTypeSelectorProps {
  orgTypes: OrgType[]
  activeOrgTypeId: string
  onOrgTypeChange: (id: string) => void
}

export function OrgTypeSelector({
  orgTypes,
  activeOrgTypeId,
  onOrgTypeChange,
}: OrgTypeSelectorProps) {
  return (
    <section>
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <p className="pb-3 pt-12 text-[11px] uppercase tracking-[0.08em] font-medium text-diligent-gray-4">
          I work for a&hellip;
        </p>
      </div>
      <div className="mx-auto max-w-[var(--max-content-width)] px-6 pb-12">
        {/* Red top accent line + dark bar */}
        <div className="overflow-hidden rounded-md border-t-[3px] border-diligent-red bg-diligent-gray-5">
          <div className="grid grid-cols-1 sm:grid-cols-3">
            {orgTypes.map((org, index) => {
              const config = orgTypeConfig[org.slug]
              if (!config) return null

              const isActive = org.id === activeOrgTypeId
              const isLast = index === orgTypes.length - 1

              return (
                <button
                  key={org.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onOrgTypeChange(org.id)}
                  className={cn(
                    'relative flex items-center gap-4 px-5 py-4 text-left transition-colors',
                    !isLast && 'sm:border-r sm:border-white/10',
                    isActive
                      ? 'bg-diligent-red text-white'
                      : 'bg-diligent-gray-5 text-white hover:bg-[#343a44]',
                  )}
                >
                  {/* Icon box */}
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded',
                      isActive ? 'bg-white/20' : 'bg-white/10',
                    )}
                  >
                    <Icon name={config.icon} className="text-[20px] text-white" />
                  </div>

                  {/* Text content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold leading-tight">
                      {org.name}
                    </p>
                    <p
                      className={cn(
                        'mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]',
                        isActive ? 'text-white/60' : 'text-diligent-gray-3',
                      )}
                    >
                      {org.count} resources &middot; {config.subtitle}
                    </p>
                  </div>

                  {/* Viewing badge — top-right */}
                  {isActive && (
                    <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-0.5 rounded bg-white/20 px-1 py-px text-[7px] font-bold uppercase tracking-wider text-white">
                      <Icon name="check" className="text-[12px]" />
                      Viewing
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
