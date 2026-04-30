import { PrismaClient } from '../lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { hashSync } from 'bcryptjs'

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // ─────────────────────────────────────────────
  // 1. Admin User
  // ─────────────────────────────────────────────

  const adminEmail = 'certifications@diligent.com'
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        name: 'Hub Admin',
        passwordHash: hashSync('DiligentHub2026!', 12),
      },
    })
    console.log(`  Created admin user: ${adminEmail}`)
  } else {
    console.log(`  Admin user already exists: ${adminEmail}`)
  }

  // ─────────────────────────────────────────────
  // 2. Personas
  // ─────────────────────────────────────────────

  const personas = [
    { name: 'Board Director', slug: 'board-director' },
    { name: 'Executive Management', slug: 'executive-management' },
    { name: 'Company Secretary', slug: 'company-secretary' },
    { name: 'General Counsel', slug: 'general-counsel' },
    { name: 'Practitioner', slug: 'practitioner' },
    { name: 'Risk', slug: 'risk' },
    { name: 'Legal', slug: 'legal' },
  ]

  for (const persona of personas) {
    await prisma.persona.upsert({
      where: { slug: persona.slug },
      update: {},
      create: persona,
    })
  }
  console.log(`  Seeded ${personas.length} personas`)

  // ─────────────────────────────────────────────
  // 3. Regions
  // ─────────────────────────────────────────────

  const regions = [
    { name: 'Global', slug: 'global' },
    { name: 'USA', slug: 'usa' },
    { name: 'UK', slug: 'uk' },
    { name: 'EU', slug: 'eu' },
    { name: 'APAC', slug: 'apac' },
  ]

  for (const region of regions) {
    await prisma.region.upsert({
      where: { slug: region.slug },
      update: {},
      create: region,
    })
  }
  console.log(`  Seeded ${regions.length} regions`)

  // ─────────────────────────────────────────────
  // 4. Subject Groups & Subjects
  // ─────────────────────────────────────────────

  const subjectGroups = [
    {
      name: 'Board Leadership & Operations',
      slug: 'board-leadership-operations',
      subjects: [
        { name: 'Board governance', slug: 'board-governance' },
        { name: 'Meetings', slug: 'meetings' },
        { name: 'Structure', slug: 'structure' },
        { name: 'Agendas', slug: 'agendas' },
        { name: 'Board committees', slug: 'board-committees' },
        { name: 'Evaluations', slug: 'evaluations' },
        { name: 'Director onboarding', slug: 'director-onboarding' },
        { name: 'Compensation', slug: 'compensation' },
        { name: 'Financials', slug: 'financials' },
        { name: 'Meeting minutes', slug: 'meeting-minutes' },
      ],
    },
    {
      name: 'Risk Management',
      slug: 'risk-management',
      subjects: [
        { name: 'ERM', slug: 'erm' },
        { name: 'Cybersecurity', slug: 'cybersecurity' },
        { name: 'AI', slug: 'ai' },
        { name: 'ESG', slug: 'esg' },
        { name: 'Market risk', slug: 'market-risk' },
      ],
    },
    {
      name: 'Regulations & Compliance',
      slug: 'regulations-compliance',
      subjects: [
        { name: 'Compliance', slug: 'compliance' },
        { name: 'ESG compliance', slug: 'esg-compliance' },
        { name: 'IPO', slug: 'ipo' },
      ],
    },
    {
      name: 'Entity Management',
      slug: 'entity-management',
      subjects: [
        { name: 'Entity management', slug: 'entity-mgmt' },
        { name: 'Subsidiaries', slug: 'subsidiaries' },
      ],
    },
    {
      name: 'Organization Type',
      slug: 'organization-type',
      subjects: [
        { name: 'Public company', slug: 'public-company' },
        { name: 'Private company', slug: 'private-company' },
        { name: 'Nonprofit', slug: 'nonprofit' },
      ],
    },
  ]

  for (const group of subjectGroups) {
    const createdGroup = await prisma.subjectGroup.upsert({
      where: { slug: group.slug },
      update: {},
      create: { name: group.name, slug: group.slug },
    })

    for (const subject of group.subjects) {
      await prisma.subject.upsert({
        where: { slug: subject.slug },
        update: {},
        create: {
          name: subject.name,
          slug: subject.slug,
          groupId: createdGroup.id,
        },
      })
    }
  }
  console.log(
    `  Seeded ${subjectGroups.length} subject groups with ${subjectGroups.reduce((sum, g) => sum + g.subjects.length, 0)} subjects`
  )

  // ─────────────────────────────────────────────
  // 5. Hub Settings (singleton)
  // ─────────────────────────────────────────────

  await prisma.hubSettings.upsert({
    where: { id: 'hub_settings_singleton' },
    update: {},
    create: {
      id: 'hub_settings_singleton',

      // Section 1: Hero
      heroHeading: 'Diligent Learning Hub',
      heroSubheading:
        'Explore educational courses, ready-to-use templates, and videos to develop your expertise and enhance board effectiveness across key governance, risk, and compliance topics.',
      heroOverview:
        'Our Learning Hub brings together practical tools and expert insights to help business leaders strengthen their governance, risk, and compliance practices. Here, you\u2019ll find a curated collection of ready-to-use templates, professionally crafted courses and videos drawn from our premium eLearning platform, the Education & Templates Library.\n\nWhether you\u2019re building foundational frameworks or refining board operations, these resources are designed to save time and improve effectiveness.',
      heroCTAText: 'Explore Resource Library',
      heroCTAUrl: '#resource-library',

      // Section 2: Popular & Featured
      popularSectionHeading: 'Jump in: Popular and featured content',

      // Section 3: Partners
      partnersSectionHeading: 'Our educational partners',

      // Section 4: Resource Library
      librarySectionHeading: 'Full resource library',
      librarySectionBody:
        'Explore educational courses, ready-to-use templates, and videos to develop your expertise and enhance board effectiveness across key governance, risk, and compliance topics.',

      // Section 5: Certifications
      certificationsSectionHeading: 'Professionally-accredited certifications',
      certificationsSectionBody:
        'Empower your business to achieve governance excellency. With Diligent One Platform, you can unlock unlimited access to Diligent\u2019s Education & Templates Library, featuring 600+ educational courses, templates and videos, alongside six professionally-accredited certifications.',

      // Section 7: Footer CTA
      footerHeading: 'Upskill your board today',
      footerBody:
        'Empower directors and executives with best practice education, templates and certifications \u2014 so every meeting is prepared, compliant and impactful.',
      footerCTAText: 'Request a demo',

      // Global
      demoCTAUrl: '', // TBC by Diligent team
    },
  })
  console.log('  Seeded hub settings')

  // ─────────────────────────────────────────────
  // 6. Certification Badges
  // ─────────────────────────────────────────────

  const badges = [
    {
      name: 'Cyber Risk Strategy & Leadership',
      imageUrl: '',
      linkUrl:
        'https://www.diligent.com/platform/cyber-risk-strategy-leadership-certification',
      order: 1,
    },
    {
      name: 'AI Ethics & Board Oversight',
      imageUrl: '',
      linkUrl:
        'https://www.diligent.com/platform/ai-ethics-board-oversight-certification',
      order: 2,
    },
    {
      name: 'Climate & Sustainability Strategy',
      imageUrl: '',
      linkUrl:
        'https://www.diligent.com/platform/climate-and-sustainability-strategy-certification',
      order: 3,
    },
    {
      name: 'Human Capital, Compensation & Culture',
      imageUrl: '',
      linkUrl:
        'https://www.diligent.com/platform/human-capital-compensation-and-culture-certificate',
      order: 4,
    },
    {
      name: 'Board Leadership',
      imageUrl: '',
      linkUrl: '', // TBC by Diligent team
      order: 5,
    },
    {
      name: 'Enterprise Risk Management',
      imageUrl: '',
      linkUrl:
        'https://www.diligent.com/platform/enterprise-risk-management-certification',
      order: 6,
    },
  ]

  for (const badge of badges) {
    const existing = await prisma.certificationBadge.findFirst({
      where: { name: badge.name },
    })
    if (!existing) {
      await prisma.certificationBadge.create({ data: badge })
    }
  }
  console.log(`  Seeded ${badges.length} certification badges`)

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
