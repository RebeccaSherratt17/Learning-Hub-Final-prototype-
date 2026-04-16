import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  fields: [
    defineField({
      name: 'source',
      title: 'Source Path',
      type: 'string',
      description: 'The old URL path (e.g. /courses/old-slug). Must start with /.',
      validation: (rule) =>
        rule.required().custom((value) => {
          if (typeof value === 'string' && !value.startsWith('/')) {
            return 'Source path must start with /'
          }
          return true
        }),
    }),
    defineField({
      name: 'destination',
      title: 'Destination Path',
      type: 'string',
      description: 'The new URL path (e.g. /courses/new-slug). Must start with /.',
      validation: (rule) =>
        rule.required().custom((value) => {
          if (typeof value === 'string' && !value.startsWith('/')) {
            return 'Destination path must start with /'
          }
          return true
        }),
    }),
    defineField({
      name: 'isPermanent',
      title: 'Permanent Redirect (301)',
      type: 'boolean',
      initialValue: true,
      description: 'Use 301 for permanent moves (SEO-friendly). Use 302 for temporary redirects.',
    }),
  ],
  preview: {
    select: {
      source: 'source',
      destination: 'destination',
      isPermanent: 'isPermanent',
    },
    prepare(selection) {
      const { source, destination, isPermanent } = selection as {
        source: string
        destination: string
        isPermanent: boolean
      }
      return {
        title: `${source} → ${destination}`,
        subtitle: isPermanent ? '301 Permanent' : '302 Temporary',
      }
    },
  },
})
