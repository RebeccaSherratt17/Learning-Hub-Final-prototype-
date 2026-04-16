import type { SchemaTypeDefinition } from 'sanity'

import persona from './taxonomy/persona'
import region from './taxonomy/region'
import subject from './taxonomy/subject'
import course from './documents/course'
import template from './documents/template'
import video from './documents/video'
import learningPath from './documents/learningPath'
import hubSettings from './documents/hubSettings'
import educationalPartner from './documents/educationalPartner'
import certificationBadge from './documents/certificationBadge'
import redirect from './documents/redirect'
import feedback from './documents/feedback'

export const schemaTypes: SchemaTypeDefinition[] = [
  // Taxonomy
  persona,
  region,
  subject,
  // Content
  course,
  template,
  video,
  learningPath,
  // Utility
  hubSettings,
  educationalPartner,
  certificationBadge,
  redirect,
  feedback,
]
