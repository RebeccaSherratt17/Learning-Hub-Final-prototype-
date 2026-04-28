-- CreateEnum
CREATE TYPE "AccessTier" AS ENUM ('FREE', 'GATED', 'PREMIUM');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('COURSE', 'TEMPLATE', 'VIDEO', 'LEARNING_PATH');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "subject_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scormCourseId" TEXT,
    "thumbnailUrl" TEXT,
    "thumbnailAlt" TEXT,
    "ogImageUrl" TEXT,
    "accessTier" "AccessTier" NOT NULL DEFAULT 'FREE',
    "author" TEXT,
    "publishedAt" TIMESTAMP(3),
    "scheduledPublishAt" TIMESTAMP(3),
    "estimatedDuration" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "restricted" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT,
    "restrictedNote" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "thumbnailUrl" TEXT,
    "thumbnailAlt" TEXT,
    "ogImageUrl" TEXT,
    "accessTier" "AccessTier" NOT NULL DEFAULT 'GATED',
    "publishedAt" TIMESTAMP(3),
    "scheduledPublishAt" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vidyardUrl" TEXT,
    "duration" TEXT,
    "thumbnailUrl" TEXT,
    "thumbnailAlt" TEXT,
    "ogImageUrl" TEXT,
    "accessTier" "AccessTier" NOT NULL DEFAULT 'FREE',
    "publishedAt" TIMESTAMP(3),
    "scheduledPublishAt" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedCompletionTime" TEXT,
    "credlyBadgeId" TEXT,
    "thumbnailUrl" TEXT,
    "thumbnailAlt" TEXT,
    "ogImageUrl" TEXT,
    "accessTier" "AccessTier" NOT NULL DEFAULT 'FREE',
    "publishedAt" TIMESTAMP(3),
    "scheduledPublishAt" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_items" (
    "id" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "learning_path_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_personas" (
    "courseId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,

    CONSTRAINT "course_personas_pkey" PRIMARY KEY ("courseId","personaId")
);

-- CreateTable
CREATE TABLE "course_regions" (
    "courseId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,

    CONSTRAINT "course_regions_pkey" PRIMARY KEY ("courseId","regionId")
);

-- CreateTable
CREATE TABLE "course_subjects" (
    "courseId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "course_subjects_pkey" PRIMARY KEY ("courseId","subjectId")
);

-- CreateTable
CREATE TABLE "template_personas" (
    "templateId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,

    CONSTRAINT "template_personas_pkey" PRIMARY KEY ("templateId","personaId")
);

-- CreateTable
CREATE TABLE "template_regions" (
    "templateId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,

    CONSTRAINT "template_regions_pkey" PRIMARY KEY ("templateId","regionId")
);

-- CreateTable
CREATE TABLE "template_subjects" (
    "templateId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "template_subjects_pkey" PRIMARY KEY ("templateId","subjectId")
);

-- CreateTable
CREATE TABLE "video_personas" (
    "videoId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,

    CONSTRAINT "video_personas_pkey" PRIMARY KEY ("videoId","personaId")
);

-- CreateTable
CREATE TABLE "video_regions" (
    "videoId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,

    CONSTRAINT "video_regions_pkey" PRIMARY KEY ("videoId","regionId")
);

-- CreateTable
CREATE TABLE "video_subjects" (
    "videoId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "video_subjects_pkey" PRIMARY KEY ("videoId","subjectId")
);

-- CreateTable
CREATE TABLE "learning_path_personas" (
    "learningPathId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,

    CONSTRAINT "learning_path_personas_pkey" PRIMARY KEY ("learningPathId","personaId")
);

-- CreateTable
CREATE TABLE "learning_path_regions" (
    "learningPathId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,

    CONSTRAINT "learning_path_regions_pkey" PRIMARY KEY ("learningPathId","regionId")
);

-- CreateTable
CREATE TABLE "learning_path_subjects" (
    "learningPathId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "learning_path_subjects_pkey" PRIMARY KEY ("learningPathId","subjectId")
);

-- CreateTable
CREATE TABLE "related_items" (
    "id" TEXT NOT NULL,
    "sourceType" "ContentType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" "ContentType" NOT NULL,
    "targetId" TEXT NOT NULL,

    CONSTRAINT "related_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hub_settings" (
    "id" TEXT NOT NULL DEFAULT 'hub_settings_singleton',
    "heroHeading" TEXT,
    "heroSubheading" TEXT,
    "heroOverview" TEXT,
    "popularSectionHeading" TEXT,
    "partnersSectionHeading" TEXT,
    "librarySectionHeading" TEXT,
    "questionsSectionHeading" TEXT,
    "questionsSectionBody" TEXT,
    "certificationsSectionHeading" TEXT,
    "certificationsSectionBody" TEXT,
    "footerHeading" TEXT,
    "footerBody" TEXT,
    "footerCTAText" TEXT,
    "demoCTAUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hub_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "educational_partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "logoAlt" TEXT,
    "linkUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "educational_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certification_badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT,
    "linkUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "certification_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redirects" (
    "id" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "destinationPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redirects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "learnerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "contentType" "ContentType",
    "contentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "focalPointX" DOUBLE PRECISION,
    "focalPointY" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_revisions" (
    "id" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseId" TEXT,
    "templateId" TEXT,
    "videoId" TEXT,
    "learningPathId" TEXT,

    CONSTRAINT "content_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learners" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_progress" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "learningPathItemId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learner_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "personas_name_key" ON "personas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "personas_slug_key" ON "personas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "regions_name_key" ON "regions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "regions_slug_key" ON "regions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subject_groups_name_key" ON "subject_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subject_groups_slug_key" ON "subject_groups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_slug_key" ON "subjects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "courses_accessToken_key" ON "courses"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "templates_slug_key" ON "templates"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "videos_slug_key" ON "videos"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "learning_paths_slug_key" ON "learning_paths"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_items_learningPathId_order_key" ON "learning_path_items"("learningPathId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "related_items_sourceType_sourceId_targetType_targetId_key" ON "related_items"("sourceType", "sourceId", "targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "redirects_sourcePath_key" ON "redirects"("sourcePath");

-- CreateIndex
CREATE INDEX "analytics_events_eventType_idx" ON "analytics_events"("eventType");

-- CreateIndex
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");

-- CreateIndex
CREATE INDEX "content_revisions_contentType_contentId_idx" ON "content_revisions"("contentType", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "learners_email_key" ON "learners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "learner_progress_learnerId_learningPathItemId_key" ON "learner_progress"("learnerId", "learningPathItemId");

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "subject_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_items" ADD CONSTRAINT "learning_path_items_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_personas" ADD CONSTRAINT "course_personas_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_personas" ADD CONSTRAINT "course_personas_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_regions" ADD CONSTRAINT "course_regions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_regions" ADD CONSTRAINT "course_regions_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_subjects" ADD CONSTRAINT "course_subjects_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_subjects" ADD CONSTRAINT "course_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_personas" ADD CONSTRAINT "template_personas_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_personas" ADD CONSTRAINT "template_personas_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_regions" ADD CONSTRAINT "template_regions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_regions" ADD CONSTRAINT "template_regions_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_subjects" ADD CONSTRAINT "template_subjects_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_subjects" ADD CONSTRAINT "template_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_personas" ADD CONSTRAINT "video_personas_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_personas" ADD CONSTRAINT "video_personas_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_regions" ADD CONSTRAINT "video_regions_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_regions" ADD CONSTRAINT "video_regions_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_subjects" ADD CONSTRAINT "video_subjects_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_subjects" ADD CONSTRAINT "video_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_personas" ADD CONSTRAINT "learning_path_personas_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_personas" ADD CONSTRAINT "learning_path_personas_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_regions" ADD CONSTRAINT "learning_path_regions_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_regions" ADD CONSTRAINT "learning_path_regions_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_subjects" ADD CONSTRAINT "learning_path_subjects_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_subjects" ADD CONSTRAINT "learning_path_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learning_paths"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_progress" ADD CONSTRAINT "learner_progress_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "learners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_progress" ADD CONSTRAINT "learner_progress_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_progress" ADD CONSTRAINT "learner_progress_learningPathItemId_fkey" FOREIGN KEY ("learningPathItemId") REFERENCES "learning_path_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
