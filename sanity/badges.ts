import type { DocumentBadgeComponent } from 'sanity'

export const ArchivedBadge: DocumentBadgeComponent = (props) => {
  const doc = props.draft || props.published
  if (!(doc as any)?.archived) {
    return null
  }
  return {
    label: 'Archived',
    title: 'This content has been archived and is not visible on the public hub.',
    color: 'warning',
  }
}

export const RestrictedBadge: DocumentBadgeComponent = (props) => {
  const doc = props.draft || props.published
  if (!(doc as any)?.restricted) {
    return null
  }
  return {
    label: 'Restricted',
    title: 'This course is only accessible via a token URL.',
    color: 'danger',
  }
}
