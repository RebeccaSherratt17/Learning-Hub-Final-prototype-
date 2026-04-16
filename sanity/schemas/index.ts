import type { SchemaTypeDefinition } from 'sanity'

import persona from './taxonomy/persona'
import region from './taxonomy/region'
import subject from './taxonomy/subject'

export const schemaTypes: SchemaTypeDefinition[] = [
  persona,
  region,
  subject,
]
