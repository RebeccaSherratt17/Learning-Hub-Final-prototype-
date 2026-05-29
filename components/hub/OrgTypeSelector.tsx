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
    <section className="border-b border-diligent-gray-2">
      <div className="mx-auto max-w-[var(--max-content-width)] px-6">
        <p className="pb-3 pt-12 text-[11px] font-semibold uppercase tracking-[0.1em] text-diligent-gray-3">
          I work for a&hellip;
        </p>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-diligent-gray-4 pb-12 sm:grid-cols-3">
          {orgTypes.map((org) => {
            const config = orgTypeConfig[org.slug]
            if (!config) return null

            const isActive = org.id === activeOrgTypeId

            return (
              <button
                key={org.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onOrgTypeChange(org.id)}
                className={cn(
                  'relative flex flex-col gap-1 px-6 py-5 text-left transition-colors',
                  isActive
                    ? 'bg-diligent-red text-white'
                    : 'bg-diligent-gray-5 text-white hover:bg-[#343a44]'
                )}
              >
                {isActive && (
                  <span className="absolute right-4 top-4 flex items-center gap-1 rounded-sm bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    <Icon name="check" className="text-[14px]" />
                    Viewing
                  </span>
                )}
                <Icon name={config.icon} className="text-[28px]" />
                <p className="text-lg font-semibold">{org.name}</p>
                <p
                  className={cn(
                    'text-[11px] font-medium uppercase tracking-wider',
                    isActive ? 'text-white/70' : 'text-diligent-gray-3'
                  )}
                >
                  {config.subtitle}
                </p>
                <p
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wider',
                    isActive ? 'text-white/80' : 'text-diligent-gray-3'
                  )}
                >
                  {org.count} resources
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
