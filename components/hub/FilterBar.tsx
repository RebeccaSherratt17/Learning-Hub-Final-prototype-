'use client'

import { cn } from '@/lib/cn'
import { contentTypeLabels, subjectGroupLabels } from '@/types/content'
import type { ContentType } from '@/types/content'

interface TaxonomyItem {
  _id: string
  title: string | null
}

interface SubjectItem extends TaxonomyItem {
  group: string | null
}

export interface FilterState {
  types: string[]
  personas: string[]
  regions: string[]
  subjects: string[]
}

interface FilterBarProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  personas: TaxonomyItem[]
  regions: TaxonomyItem[]
  subjects: SubjectItem[]
  className?: string
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-diligent-gray-4">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isActive = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={cn(
                'rounded-sm border px-2.5 py-1 text-xs transition',
                isActive
                  ? 'border-diligent-gray-5 bg-diligent-gray-5 text-white'
                  : 'border-diligent-gray-2 bg-white text-diligent-gray-4 hover:border-diligent-gray-3',
              )}
              aria-pressed={isActive}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function toggleValue(arr: string[], value: string): string[] {
  return arr.includes(value)
    ? arr.filter((v) => v !== value)
    : [...arr, value]
}

export function FilterBar({
  filters,
  onFilterChange,
  personas,
  regions,
  subjects,
  className,
}: FilterBarProps) {
  const typeOptions = (
    Object.entries(contentTypeLabels) as [ContentType, string][]
  ).map(([value, label]) => ({ value, label }))

  const personaOptions = personas.map((p) => ({
    value: p._id,
    label: p.title ?? '',
  }))

  const regionOptions = regions.map((r) => ({
    value: r._id,
    label: r.title ?? '',
  }))

  // Group subjects by their group field
  const groupedSubjects = Object.entries(subjectGroupLabels).map(
    ([groupValue, groupLabel]) => ({
      groupLabel,
      items: subjects
        .filter((s) => s.group === groupValue)
        .map((s) => ({ value: s._id, label: s.title ?? '' })),
    }),
  )

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.personas.length > 0 ||
    filters.regions.length > 0 ||
    filters.subjects.length > 0

  return (
    <div className={cn('space-y-4', className)}>
      <FilterGroup
        label="Content type"
        options={typeOptions}
        selected={filters.types}
        onToggle={(v) =>
          onFilterChange({ ...filters, types: toggleValue(filters.types, v) })
        }
      />
      <FilterGroup
        label="Persona"
        options={personaOptions}
        selected={filters.personas}
        onToggle={(v) =>
          onFilterChange({
            ...filters,
            personas: toggleValue(filters.personas, v),
          })
        }
      />
      <FilterGroup
        label="Region"
        options={regionOptions}
        selected={filters.regions}
        onToggle={(v) =>
          onFilterChange({
            ...filters,
            regions: toggleValue(filters.regions, v),
          })
        }
      />
      {groupedSubjects.map(
        ({ groupLabel, items }) =>
          items.length > 0 && (
            <FilterGroup
              key={groupLabel}
              label={groupLabel}
              options={items}
              selected={filters.subjects}
              onToggle={(v) =>
                onFilterChange({
                  ...filters,
                  subjects: toggleValue(filters.subjects, v),
                })
              }
            />
          ),
      )}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() =>
            onFilterChange({ types: [], personas: [], regions: [], subjects: [] })
          }
          className="text-xs font-medium text-link hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}
