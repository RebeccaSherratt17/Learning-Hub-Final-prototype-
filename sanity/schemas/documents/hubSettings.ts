import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'hubSettings',
  title: 'Hub Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'siteTitle',
      title: 'Site Title',
      type: 'string',
      initialValue: 'Diligent Learning Hub',
    }),
    defineField({
      name: 'siteDescription',
      title: 'Site Meta Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'demoCTAUrl',
      title: 'Demo Request CTA URL',
      type: 'url',
      description: 'The URL for "Request a demo" buttons across the hub.',
    }),
    defineField({
      name: 'heroHeading',
      title: 'Hero Heading',
      type: 'string',
      initialValue: 'Diligent Learning Hub',
    }),
    defineField({
      name: 'heroSubheading',
      title: 'Hero Subheading',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'heroOverview',
      title: 'Hero Overview Text',
      type: 'text',
      rows: 6,
    }),
    defineField({
      name: 'popularSectionHeading',
      title: 'Popular & Featured Section Heading',
      type: 'string',
      initialValue: 'Jump in: Popular and featured content',
    }),
    defineField({
      name: 'partnersSectionHeading',
      title: 'Educational Partners Section Heading',
      type: 'string',
      initialValue: 'Our educational partners',
    }),
    defineField({
      name: 'librarySectionHeading',
      title: 'Full Resource Library Section Heading',
      type: 'string',
      initialValue: 'Full resource library',
    }),
    defineField({
      name: 'questionsSectionHeading',
      title: 'Got Questions Section Heading',
      type: 'string',
      initialValue: 'Got questions?',
    }),
    defineField({
      name: 'questionsSectionBody',
      title: 'Got Questions Section Body',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'certificationsSectionHeading',
      title: 'Certifications Section Heading',
      type: 'string',
      initialValue: 'Professionally-accredited certifications',
    }),
    defineField({
      name: 'certificationsSectionBody',
      title: 'Certifications Section Body',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'footerHeading',
      title: 'Footer CTA Heading',
      type: 'string',
      initialValue: 'Upskill your board today',
    }),
    defineField({
      name: 'footerBody',
      title: 'Footer CTA Body',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'footerCTAText',
      title: 'Footer CTA Button Text',
      type: 'string',
      initialValue: 'Request a demo',
    }),
    defineField({
      name: 'privacyPolicyUrl',
      title: 'Privacy Policy URL',
      type: 'url',
      description: 'Linked from gate forms and cookie consent banner.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Default Open Graph Image',
      type: 'image',
      description: 'Default social share image for the hub homepage.',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Hub Settings' }
    },
  },
})
