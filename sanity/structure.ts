import type { StructureResolver } from 'sanity/structure'

const singletonListItem = (
  S: Parameters<StructureResolver>[0],
  typeName: string,
  title: string
) =>
  S.listItem()
    .title(title)
    .id(typeName)
    .child(S.document().schemaType(typeName).documentId(typeName))

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Learning Hub')
    .items([
      // Settings singleton
      singletonListItem(S, 'hubSettings', 'Hub Settings'),

      S.divider(),

      // Content
      S.listItem()
        .title('Content')
        .child(
          S.list()
            .title('Content')
            .items([
              S.documentTypeListItem('course').title('Courses'),
              S.documentTypeListItem('template').title('Templates'),
              S.documentTypeListItem('video').title('Videos'),
              S.documentTypeListItem('learningPath').title('Learning Paths'),
            ])
        ),

      S.divider(),

      // Taxonomy
      S.listItem()
        .title('Taxonomy')
        .child(
          S.list()
            .title('Taxonomy')
            .items([
              S.documentTypeListItem('persona').title('Personas'),
              S.documentTypeListItem('region').title('Regions'),
              S.documentTypeListItem('subject').title('Subjects'),
            ])
        ),

      S.divider(),

      // Site content
      S.listItem()
        .title('Site Content')
        .child(
          S.list()
            .title('Site Content')
            .items([
              S.documentTypeListItem('educationalPartner').title('Educational Partners'),
              S.documentTypeListItem('certificationBadge').title('Certification Badges'),
            ])
        ),

      S.divider(),

      // Administration
      S.listItem()
        .title('Administration')
        .child(
          S.list()
            .title('Administration')
            .items([
              S.documentTypeListItem('redirect').title('Redirects'),
              S.documentTypeListItem('feedback').title('Feedback'),
            ])
        ),
    ])
