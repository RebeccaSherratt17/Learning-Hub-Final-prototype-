'use client'

import { useState } from 'react'

interface TaxonomySelectProps {
  personas: { id: string; name: string }[]
  regions: { id: string; name: string }[]
  subjects: { id: string; name: string; group: { id: string; name: string } }[]
  selectedPersonaIds: string[]
  selectedRegionIds: string[]
  selectedSubjectIds: string[]
  onPersonasChange: (ids: string[]) => void
  onRegionsChange: (ids: string[]) => void
  onSubjectsChange: (ids: string[]) => void
}

function AccordionSection({
  label,
  selectedCount,
  isOpen,
  onToggle,
  children,
}: {
  label: string
  selectedCount: number
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-2 text-sm font-semibold text-diligent-gray-5 hover:text-diligent-gray-4"
      >
        <span>
          {label}
          {selectedCount > 0 && (
            <span className="ml-2 text-xs font-normal text-diligent-gray-4">
              ({selectedCount} selected)
            </span>
          )}
        </span>
        <span
          className={`material-symbols-sharp text-[20px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          expand_more
        </span>
      </button>
      {isOpen && <div className="pt-2 pb-1">{children}</div>}
    </div>
  )
}

function CheckboxGrid({
  items,
  selectedIds,
  onChange,
}: {
  items: { id: string; name: string }[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-2 text-sm text-diligent-gray-5 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={() => toggle(item.id)}
              className="h-4 w-4 rounded border-diligent-gray-2 text-diligent-red focus:ring-diligent-red"
            />
            {item.name}
          </label>
        ))}
      </div>
      {items.length === 0 && (
        <p className="text-xs text-diligent-gray-3">No items available.</p>
      )}
    </>
  )
}

export default function TaxonomySelect({
  personas,
  regions,
  subjects,
  selectedPersonaIds,
  selectedRegionIds,
  selectedSubjectIds,
  onPersonasChange,
  onRegionsChange,
  onSubjectsChange,
}: TaxonomySelectProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Group subjects by their group
  const subjectsByGroup = new Map<string, { groupName: string; subjects: { id: string; name: string }[] }>()
  for (const subject of subjects) {
    const existing = subjectsByGroup.get(subject.group.id)
    if (existing) {
      existing.subjects.push({ id: subject.id, name: subject.name })
    } else {
      subjectsByGroup.set(subject.group.id, {
        groupName: subject.group.name,
        subjects: [{ id: subject.id, name: subject.name }],
      })
    }
  }

  return (
    <div className="divide-y divide-diligent-gray-2">
      <AccordionSection
        label="Personas"
        selectedCount={selectedPersonaIds.length}
        isOpen={!!openSections.personas}
        onToggle={() => toggleSection('personas')}
      >
        <CheckboxGrid
          items={personas}
          selectedIds={selectedPersonaIds}
          onChange={onPersonasChange}
        />
      </AccordionSection>

      <AccordionSection
        label="Regions"
        selectedCount={selectedRegionIds.length}
        isOpen={!!openSections.regions}
        onToggle={() => toggleSection('regions')}
      >
        <CheckboxGrid
          items={regions}
          selectedIds={selectedRegionIds}
          onChange={onRegionsChange}
        />
      </AccordionSection>

      <AccordionSection
        label="Subjects"
        selectedCount={selectedSubjectIds.length}
        isOpen={!!openSections.subjects}
        onToggle={() => toggleSection('subjects')}
      >
        <div className="space-y-4">
          {Array.from(subjectsByGroup.entries()).map(([groupId, group]) => (
            <div key={groupId}>
              <h5 className="mb-2 text-xs font-medium uppercase tracking-wider text-diligent-gray-4">
                {group.groupName}
              </h5>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                {group.subjects.map((subject) => (
                  <label
                    key={subject.id}
                    className="flex items-center gap-2 text-sm text-diligent-gray-5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjectIds.includes(subject.id)}
                      onChange={() => {
                        if (selectedSubjectIds.includes(subject.id)) {
                          onSubjectsChange(selectedSubjectIds.filter((sid) => sid !== subject.id))
                        } else {
                          onSubjectsChange([...selectedSubjectIds, subject.id])
                        }
                      }}
                      className="h-4 w-4 rounded border-diligent-gray-2 text-diligent-red focus:ring-diligent-red"
                    />
                    {subject.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
          {subjectsByGroup.size === 0 && (
            <p className="text-xs text-diligent-gray-3">No subjects available.</p>
          )}
        </div>
      </AccordionSection>
    </div>
  )
}
