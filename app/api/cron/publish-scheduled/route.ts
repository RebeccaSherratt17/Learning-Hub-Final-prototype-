import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    let totalPublished = 0

    // Publish due courses
    const courses = await prisma.course.updateMany({
      where: {
        status: 'SCHEDULED',
        scheduledPublishAt: { lte: now },
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: now,
      },
    })
    totalPublished += courses.count

    // Publish due templates
    const templates = await prisma.template.updateMany({
      where: {
        status: 'SCHEDULED',
        scheduledPublishAt: { lte: now },
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: now,
      },
    })
    totalPublished += templates.count

    // Publish due videos
    const videos = await prisma.video.updateMany({
      where: {
        status: 'SCHEDULED',
        scheduledPublishAt: { lte: now },
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: now,
      },
    })
    totalPublished += videos.count

    // Publish due learning paths
    const learningPaths = await prisma.learningPath.updateMany({
      where: {
        status: 'SCHEDULED',
        scheduledPublishAt: { lte: now },
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: now,
      },
    })
    totalPublished += learningPaths.count

    return NextResponse.json({
      published: totalPublished,
      breakdown: {
        courses: courses.count,
        templates: templates.count,
        videos: videos.count,
        learningPaths: learningPaths.count,
      },
    })
  } catch (error) {
    console.error('Scheduled publish cron failed:', error)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
