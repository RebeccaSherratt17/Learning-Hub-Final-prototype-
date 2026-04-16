import type { SchemaTypeDefinition } from 'sanity'

import persona from './taxonomy/persona'
import region from './taxonomy/region'
import subject from './taxonomy/subject'
import course from './documents/course'
import template from './documents/template'
import video from './documents/video'

export const schemaTypes: SchemaTypeDefinition[] = [
  persona,
  region,
  subject,
  course,
  template,
  video,
]
