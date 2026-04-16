import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'feedback',
  title: 'Feedback',
  type: 'document',
  fields: [
    defineField({
      name: 'contentItem',
      title: 'Content Item',
      type: 'reference',
      to: [
        { type: 'course' },
        { type: 'template' },
        { type: 'video' },
        { type: 'learningPath' },
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'rating',
      title: 'Star Rating',
      type: 'number',
      validation: (rule) => rule.required().min(1).max(5).integer(),
    }),
    defineField({
      name: 'comment',
      title: 'Comment',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      contentTitle: 'contentItem.title',
      rating: 'rating',
      submittedAt: 'submittedAt',
    },
    prepare({ contentTitle, rating, submittedAt }: { contentTitle?: string; rating?: number; submittedAt?: string }) {
      const stars = rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : ''
      return {
        title: contentTitle || 'Unknown content',
        subtitle: `${stars} | ${submittedAt ? new Date(submittedAt).toLocaleDateString() : 'No date'}`,
      }
    },
  },
})
