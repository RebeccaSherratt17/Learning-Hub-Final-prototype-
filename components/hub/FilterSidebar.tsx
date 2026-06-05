'use client'

import { Icon } from '@/components/ui/Icon'
import { subjectGroupLabels } from '@/types/content'
import type { FilterState } from '@/components/hub/FilterBar'
import { toSentenceCase } from '@/lib/toSentenceCase'

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
  filterCounts: Record<string, number>
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
  count,
}: {
  label: string
  checked: boolean
  onChange: () => void
  count?: number
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[13px] text-diligent-gray-4 hover:text-diligent-gray-5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-diligent-red"
      />
      <span>{label}</span>
      {count !== undefined && (
        <span className="ml-auto font-mono text-xs text-diligent-gray-3">{count}</span>
      )}
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
  filterCounts,
}: FilterSidebarProps) {
  const personaOrder = ['Board director', 'Executive management', 'Company secretary', 'General counsel', 'Legal', 'Risk']
  const personaOptions = personas
    .map((p) => ({
      value: p._id,
      label: toSentenceCase(p.title ?? ''),
    }))
    .sort((a, b) => {
      const ai = personaOrder.indexOf(a.label)
      const bi = personaOrder.indexOf(b.label)
      return (ai === -1 ? personaOrder.length : ai) - (bi === -1 ? personaOrder.length : bi)
    })

  const regionOrder = ['Global', 'USA', 'EU', 'UK', 'APAC', 'Canada']
  const regionOptions = regions
    .map((r) => ({
      value: r._id,
      label: r.title ?? '',
    }))
    .sort((a, b) => {
      const ai = regionOrder.indexOf(a.label)
      const bi = regionOrder.indexOf(b.label)
      return (ai === -1 ? regionOrder.length : ai) - (bi === -1 ? regionOrder.length : bi)
    })

  const orgTypeOrder = ['Public company', 'Private company', 'Nonprofit']
  const orgTypeItems = subjects
    .filter((s) => s.group === 'organization-type')
    .map((s) => ({ value: s._id, label: toSentenceCase(s.title ?? '') }))
    .sort((a, b) => {
      const ai = orgTypeOrder.indexOf(a.label)
      const bi = orgTypeOrder.indexOf(b.label)
      return (ai === -1 ? orgTypeOrder.length : ai) - (bi === -1 ? orgTypeOrder.length : bi)
    })

  const groupedSubjects = Object.entries(subjectGroupLabels)
    .filter(([groupValue]) => groupValue !== 'organization-type')
    .map(([groupValue, groupLabel]) => ({
      groupLabel,
      items: subjects
        .filter((s) => s.group === groupValue)
        .map((s) => ({ value: s._id, label: toSentenceCase(s.title ?? '') })),
    }))
    .sort((a, b) => toSentenceCase(a.groupLabel).localeCompare(toSentenceCase(b.groupLabel)))

  const activeCount =
    filters.types.length +
    filters.personas.length +
    filters.regions.length +
    filters.subjects.length +
    (filters.level ? 1 : 0)

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
              onFilterChange({ types: [], personas: [], regions: [], subjects: [], level: '' })
            }
            className="text-xs font-medium hover:opacity-80"
            style={{ fontSize: '12px', color: '#0B4CCE' }}
          >
            Reset all
          </button>
        )}
      </div>

      {/* Accordion groups */}
      <div className="border-t border-diligent-gray-5">
        <AccordionGroup label="Content type">
          {([
            { value: 'course', label: 'Course' },
            { value: 'template', label: 'Template' },
            { value: 'video', label: 'Video' },
            { value: 'learningPath', label: 'Learning path' },
          ] as const).map((opt) => (
            <CheckboxOption
              key={opt.value}
              label={opt.label}
              checked={filters.types.includes(opt.value)}
              onChange={() =>
                onFilterChange({
                  ...filters,
                  types: toggleValue(filters.types, opt.value),
                })
              }
            />
          ))}
        </AccordionGroup>

        <AccordionGroup label="Organization type">
          {orgTypeItems.map((opt) => (
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
              count={filterCounts[opt.value] ?? 0}
            />
          ))}
        </AccordionGroup>

        <AccordionGroup label="Level">
          {([
            { value: 'BEGINNER', label: 'Beginner-friendly' },
            { value: 'INTERMEDIATE', label: 'Intermediate' },
            { value: 'ADVANCED', label: 'Advanced' },
          ] as const).map((opt) => (
            <CheckboxOption
              key={opt.value}
              label={opt.label}
              checked={filters.level === opt.value}
              onChange={() =>
                onFilterChange({
                  ...filters,
                  level: filters.level === opt.value ? '' : opt.value,
                })
              }
            />
          ))}
        </AccordionGroup>

        <AccordionGroup label="Subject">
          {groupedSubjects.map(
            ({ groupLabel, items }) =>
              items.length > 0 && (
                <SubjectSubgroup key={groupLabel} label={toSentenceCase(groupLabel)}>
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
                      count={filterCounts[opt.value] ?? 0}
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
              count={filterCounts[opt.value] ?? 0}
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
              count={filterCounts[opt.value] ?? 0}
            />
          ))}
        </AccordionGroup>
      </div>
    </div>
  )
}
