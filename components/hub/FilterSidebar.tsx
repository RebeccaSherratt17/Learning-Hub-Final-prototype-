'use client'

import { Icon } from '@/components/ui/Icon'
import { subjectGroupLabels } from '@/types/content'
import type { FilterState } from '@/components/hub/FilterBar'

interface TaxonomyItem {
  _id: string
  title: string | null
}

interface SubjectItem extends TaxonomyItem {
  group: string | null
}

interface FilterSidebarProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  personas: TaxonomyItem[]
  regions: TaxonomyItem[]
  subjects: SubjectItem[]
}

function toggleValue(arr: string[], value: string): string[] {
  return arr.includes(value)
    ? arr.filter((v) => v !== value)
    : [...arr, value]
}

function CheckboxOption({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[13px] text-diligent-gray-4 hover:text-diligent-gray-5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 accent-diligent-red"
      />
      <span>{label}</span>
    </label>
  )
}

function AccordionGroup({
  label,
  children,
  defaultOpen = false,
}: {
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details className="group/accordion border-b border-diligent-gray-2 py-4" open={defaultOpen || undefined}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-diligent-gray-5 [&::-webkit-details-marker]:hidden">
        {label}
        <Icon
          name="expand_more"
          className="text-[18px] text-diligent-gray-4 transition-transform group-open/accordion:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-1 pt-3">
        {children}
      </div>
    </details>
  )
}

function SubjectSubgroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <details className="group/subgroup border-t border-diligent-gray-1 py-2.5 first:border-t-0 first:pt-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] font-medium text-diligent-gray-5 [&::-webkit-details-marker]:hidden">
        <span>{label}</span>
        <Icon
          name="expand_more"
          className="text-[16px] text-diligent-gray-4 transition-transform group-open/subgroup:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-0.5 pl-4 pt-2">
        {children}
      </div>
    </details>
  )
}

export function FilterSidebar({
  filters,
  onFilterChange,
  personas,
  regions,
  subjects,
}: FilterSidebarProps) {
  const personaOptions = personas.map((p) => ({
    value: p._id,
    label: p.title ?? '',
  }))

  const regionOptions = regions.map((r) => ({
    value: r._id,
    label: r.title ?? '',
  }))

  const groupedSubjects = Object.entries(subjectGroupLabels).map(
    ([groupValue, groupLabel]) => ({
      groupLabel,
      items: subjects
        .filter((s) => s.group === groupValue)
        .map((s) => ({ value: s._id, label: s.title ?? '' })),
    }),
  )

  const activeCount =
    filters.personas.length +
    filters.regions.length +
    filters.subjects.length

  return (
    <div>
      {/* Eyebrow + clear */}
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-diligent-gray-4">
          Filters
          {activeCount > 0 && (
            <span className="ml-1.5 text-diligent-red">({activeCount})</span>
          )}
        </p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() =>
              onFilterChange({ types: [], personas: [], regions: [], subjects: [] })
            }
            className="text-xs font-medium text-link hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Accordion groups */}
      <div className="border-t border-diligent-gray-5">
        <AccordionGroup label="Subject">
          {groupedSubjects.map(
            ({ groupLabel, items }) =>
              items.length > 0 && (
                <SubjectSubgroup key={groupLabel} label={groupLabel}>
                  {items.map((opt) => (
                    <CheckboxOption
                      key={opt.value}
                      label={opt.label}
                      checked={filters.subjects.includes(opt.value)}
                      onChange={() =>
                        onFilterChange({
                          ...filters,
                          subjects: toggleValue(filters.subjects, opt.value),
                        })
                      }
                    />
                  ))}
                </SubjectSubgroup>
              ),
          )}
        </AccordionGroup>

        <AccordionGroup label="Region">
          {regionOptions.map((opt) => (
            <CheckboxOption
              key={opt.value}
              label={opt.label}
              checked={filters.regions.includes(opt.value)}
              onChange={() =>
                onFilterChange({ ...filters, regions: toggleValue(filters.regions, opt.value) })
              }
            />
          ))}
        </AccordionGroup>

        <AccordionGroup label="Persona">
          {personaOptions.map((opt) => (
            <CheckboxOption
              key={opt.value}
              label={opt.label}
              checked={filters.personas.includes(opt.value)}
              onChange={() =>
                onFilterChange({
                  ...filters,
                  personas: toggleValue(filters.personas, opt.value),
                })
              }
            />
          ))}
        </AccordionGroup>
      </div>
    </div>
  )
}
