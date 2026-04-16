'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'
import { structure } from './sanity/structure'
import { ArchivedBadge, RestrictedBadge } from './sanity/badges'
import { dataset, projectId } from './sanity/env'

const singletonActions = new Set(['publish', 'discardChanges', 'restore'])
const singletonTypes = new Set(['hubSettings'])

const contentTypes = new Set(['course', 'template', 'video', 'learningPath'])

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,

  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },

  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: '2024-06-01' }),
  ],

  document: {
    actions: (input, context) =>
      singletonTypes.has(context.schemaType)
        ? input.filter(({ action }) => action && singletonActions.has(action))
        : input,

    badges: (prev, context) => {
      if (context.schemaType === 'course') {
        return [RestrictedBadge, ArchivedBadge, ...prev]
      }
      if (contentTypes.has(context.schemaType)) {
        return [ArchivedBadge, ...prev]
      }
      return prev
    },
  },
})
