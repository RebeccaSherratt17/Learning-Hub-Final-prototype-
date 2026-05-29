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
    description: 'Everything boards and their teams need to govern effectively',
  },
  'board-meetings-committees': {
    icon: 'groups',
    description: 'Tools and guidance for running board meetings and committees',
  },
  'ai-technology': {
    icon: 'smart_toy',
    description:
      'Navigate the governance, ethics and risk dimensions of AI and cybersecurity',
  },
  'risk-management': {
    icon: 'shield',
    description: 'Build robust risk management practices across your organization',
  },
  'compliance-policy': {
    icon: 'policy',
    description: 'Stay ahead of regulatory obligations',
  },
  'governance-professionals': {
    icon: 'person',
    description: 'Resources designed for the people who make governance work',
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
