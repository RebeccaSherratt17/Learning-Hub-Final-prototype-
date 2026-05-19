import { createHmac, timingSafeEqual } from 'crypto'

function getSecret(): string {
  const secret = process.env.SCORM_TOKEN_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'SCORM_TOKEN_SECRET must be set and at least 32 characters. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64\'))"'
    )
  }
  return secret
}

/**
 * Generate an HMAC-SHA256 launch token for a SCORM attempt.
 */
export function generateLaunchToken(attemptId: string, courseId: string): string {
  const secret = getSecret()
  const payload = `${attemptId}:${courseId}`
  const hmac = createHmac('sha256', secret).update(payload).digest('hex')
  return hmac
}

/**
 * Verify a launch token using timing-safe comparison.
 */
export function verifyLaunchToken(
  token: string,
  attemptId: string,
  courseId: string
): boolean {
  if (!token) return false

  try {
    const expected = generateLaunchToken(attemptId, courseId)

    const tokenBuffer = Buffer.from(token, 'utf8')
    const expectedBuffer = Buffer.from(expected, 'utf8')

    if (tokenBuffer.length !== expectedBuffer.length) return false

    return timingSafeEqual(tokenBuffer, expectedBuffer)
  } catch {
    return false
  }
}
