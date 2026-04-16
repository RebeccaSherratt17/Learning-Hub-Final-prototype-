import type { SchemaTypeDefinition } from 'sanity'

import persona from './taxonomy/persona'
import region from './taxonomy/region'
import subject from './taxonomy/subject'
import course from './documents/course'

export const schemaTypes: SchemaTypeDefinition[] = [
  persona,
  region,
  subject,
  course,
]
