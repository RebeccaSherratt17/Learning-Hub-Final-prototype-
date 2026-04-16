import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'subject',
  title: 'Subject',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'group',
      title: 'Group',
      type: 'string',
      description: 'The category group this subject belongs to (e.g. "Board Leadership & Operations", "Risk Management")',
      options: {
        list: [
          { title: 'Board Leadership & Operations', value: 'board-leadership-operations' },
          { title: 'Risk Management', value: 'risk-management' },
          { title: 'Regulations & Compliance', value: 'regulations-compliance' },
          { title: 'Entity Management', value: 'entity-management' },
          { title: 'Organization Type', value: 'organization-type' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
  ],
})
