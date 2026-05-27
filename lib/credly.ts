import { prisma } from '@/lib/db'

interface IssueCredlyBadgeParams {
  learnerEmail: string
  learnerFirstName: string
  learnerLastName?: string
  badgeTemplateId: string
  learningPathId?: string
  courseId?: string
}

interface CredlyBadgeResponse {
  success: boolean
  credlyBadgeId?: string
  error?: string
}

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

export async function issueCredlyBadge(
  params: IssueCredlyBadgeParams,
): Promise<CredlyBadgeResponse> {
  const {
    learnerEmail,
    learnerFirstName,
    learnerLastName,
    badgeTemplateId,
    learningPathId,
    courseId,
  } = params

  if (!learningPathId && !courseId) {
    return { success: false, error: 'Either learningPathId or courseId is required' }
  }

  const apiKey = process.env.CREDLY_API_KEY
  const orgId = process.env.CREDLY_ORGANIZATION_ID

  if (!apiKey || !orgId) {
    console.error('[Credly] Missing CREDLY_API_KEY or CREDLY_ORGANIZATION_ID environment variables')
    return { success: false, error: 'Credly credentials not configured' }
  }

  // Check for duplicate issuance
  const contextLabel = learningPathId
    ? `learning path ${learningPathId}`
    : `course ${courseId}`

  const existing = learningPathId
    ? await prisma.credlyBadgeIssuance.findUnique({
        where: {
          learnerEmail_learningPathId: {
            learnerEmail,
            learningPathId,
          },
        },
      })
    : await prisma.credlyBadgeIssuance.findUnique({
        where: {
          learnerEmail_courseId: {
            learnerEmail,
            courseId: courseId!,
          },
        },
      })

  if (existing) {
    console.log(
      `[Credly] Badge already issued to ${learnerEmail} for ${contextLabel} — skipping`,
    )
    return { success: true, credlyBadgeId: existing.credlyBadgeId ?? undefined }
  }

  // Retry loop with exponential backoff
  let lastError: string | undefined

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        `https://api.credly.com/v1/organizations/${orgId}/badges`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            recipient_email: learnerEmail,
            badge_template_id: badgeTemplateId,
            issued_to_first_name: learnerFirstName,
            issued_to_last_name: learnerLastName || '',
            issuer_earner_id: learnerEmail,
          }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        const credlyBadgeId = data?.data?.id ?? null

        // Record issuance to prevent duplicates
        await prisma.credlyBadgeIssuance.create({
          data: {
            learnerEmail,
            learningPathId: learningPathId ?? null,
            courseId: courseId ?? null,
            badgeTemplateId,
            credlyBadgeId,
          },
        })

        console.log(
          `[Credly] Badge issued successfully to ${learnerEmail} for template ${badgeTemplateId}`,
        )
        return { success: true, credlyBadgeId: credlyBadgeId ?? undefined }
      }

      // Non-retryable client errors (4xx except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        const errorBody = await response.text()
        console.error(
          `[Credly] Client error (${response.status}) issuing badge: ${errorBody}`,
        )
        return { success: false, error: `Credly API error ${response.status}: ${errorBody}` }
      }

      // Retryable errors (5xx, 429)
      lastError = `HTTP ${response.status}`
      console.warn(
        `[Credly] Attempt ${attempt}/${MAX_RETRIES} failed with status ${response.status}`,
      )
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      console.warn(
        `[Credly] Attempt ${attempt}/${MAX_RETRIES} failed: ${lastError}`,
      )
    }

    // Exponential backoff before retry
    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, BASE_DELAY_MS * Math.pow(2, attempt - 1)))
    }
  }

  console.error(
    `[Credly] All ${MAX_RETRIES} attempts failed for ${learnerEmail}, badge template ${badgeTemplateId}. Last error: ${lastError}`,
  )
  return { success: false, error: `Failed after ${MAX_RETRIES} retries: ${lastError}` }
}
