'use client'

import { useState, useCallback, useTransition, useMemo } from 'react'
import { OrgTypeSelector, type OrgType } from '@/components/hub/OrgTypeSelector'
import { PopularWidget } from '@/components/hub/PopularWidget'
import { SubjectGroupWidget } from '@/components/hub/SubjectGroupWidget'
import { subjectGroupOrder } from '@/components/hub/subjectGroupConfig'
import type { ContentItem } from '@/types/content'

export interface SubjectGroupData {
  id: string
  name: string
  slug: string
  subjects: { id: string; name: string; slug: string }[]
}

interface HomepageContentProps {
  orgTypes: OrgType[]
  defaultOrgTypeId: string
  subjectGroups: SubjectGroupData[]
  initialItems: ContentItem[]
}

export function HomepageContent({
  orgTypes,
  defaultOrgTypeId,
  subjectGroups,
  initialItems,
}: HomepageContentProps) {
  const [activeOrgTypeId, setActiveOrgTypeId] = useState(defaultOrgTypeId)
  const [items, setItems] = useState<ContentItem[]>(initialItems)
  const [isPending, startTransition] = useTransition()
  const [isFetching, setIsFetching] = useState(false)

  const isLoading = isPending || isFetching

  const handleOrgTypeChange = useCallback(
    (id: string) => {
      if (id === activeOrgTypeId) return

      setActiveOrgTypeId(id)
      setIsFetching(true)

      startTransition(() => {
        fetch(`/api/hub/content?orgType=${encodeURIComponent(id)}&sort=popular&limit=50`)
          .then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch content: ${res.status}`)
            return res.json()
          })
          .then((data: ContentItem[]) => {
            setItems(data)
          })
          .catch((err) => {
            console.error('Error fetching content for org type:', err)
          })
          .finally(() => {
            setIsFetching(false)
          })
      })
    },
    [activeOrgTypeId],
  )

  const orderedGroups = useMemo(
    () =>
      subjectGroupOrder
        .map((slug) => subjectGroups.find((g) => g.slug === slug))
        .filter(Boolean) as SubjectGroupData[],
    [subjectGroups],
  )

  const itemsForGroup = useCallback(
    (groupSlug: string): ContentItem[] => {
      const group = subjectGroups.find((g) => g.slug === groupSlug)
      if (!group) return []
      const subjectIds = new Set(group.subjects.map((s) => s.id))
      return items.filter((item) =>
        item.subjects?.some((s) => subjectIds.has(s._id)),
      )
    },
    [subjectGroups, items],
  )

  return (
    <div
      className={`transition-opacity duration-300 ${isLoading ? 'opacity-60' : 'opacity-100'}`}
    >
      <OrgTypeSelector
        orgTypes={orgTypes}
        activeOrgTypeId={activeOrgTypeId}
        onOrgTypeChange={handleOrgTypeChange}
      />

      <PopularWidget items={items} />

      {orderedGroups.map((group) => (
        <SubjectGroupWidget
          key={group.id}
          groupSlug={group.slug}
          groupName={group.name}
          subjects={group.subjects}
          items={itemsForGroup(group.slug)}
          activeOrgTypeId={activeOrgTypeId}
        />
      ))}
    </div>
  )
}
