interface SubjectGroupMeta {
  icon: string
  description: string
}

/**
 * Maps subject group slugs to Material Symbols Sharp icon names and one-line descriptions.
 * Order in this object is the display order on the homepage.
 */
export const subjectGroupConfig: Record<string, SubjectGroupMeta> = {
  'board-governance': {
    icon: 'gavel',
    description: 'Tools to help leaders govern effectively',
  },
  'board-meetings-committees': {
    icon: 'groups',
    description: 'Guidance for running meetings and committees',
  },
  'ai-technology': {
    icon: 'smart_toy',
    description: 'Governance of AI, technology and cyber risk',
  },
  'risk-management': {
    icon: 'shield',
    description: 'Managing risk across your organization',
  },
  'compliance-policy': {
    icon: 'policy',
    description: 'Stay ahead of regulatory obligations',
  },
  'governance-professionals': {
    icon: 'person',
    description: 'For the people who make governance work',
  },
}

/** Ordered list of subject group slugs for homepage display */
export const subjectGroupOrder = Object.keys(subjectGroupConfig)

/** Config for organization type cards */
export const orgTypeConfig: Record<
  string,
  { icon: string; subtitle: string }
> = {
  'public-company': {
    icon: 'domain',
    subtitle: 'LISTED \u00B7 PUBLIC MARKETS',
  },
  'private-company': {
    icon: 'apartment',
    subtitle: 'PE-BACKED \u00B7 PRE-IPO',
  },
  nonprofit: {
    icon: 'volunteer_activism',
    subtitle: 'CHARITY / MISSION-LED',
  },
}
