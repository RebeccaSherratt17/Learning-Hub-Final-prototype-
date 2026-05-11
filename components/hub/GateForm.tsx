'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface GateFormProps {
  contentType: string
  contentId: string
  downloadUrl?: string
  fromLearningPath?: string
  onSuccess?: () => void
}

export default function GateForm({
  contentType,
  contentId,
  downloadUrl,
  fromLearningPath,
  onSuccess,
}: GateFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [jobTitle, setJobTitle] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/gate/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          organization,
          jobTitle,
          contentType,
          contentId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }

      setSuccess(true)

      // Trigger file download if downloadUrl is provided
      if (downloadUrl) {
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = ''
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }

      // Redirect back to learning path if applicable
      if (fromLearningPath) {
        setTimeout(() => {
          router.push('/learning-paths/' + fromLearningPath)
        }, 1000)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClassName =
    'w-full rounded border border-diligent-gray-2 bg-white px-4 py-3 text-sm text-diligent-gray-5 placeholder:text-diligent-gray-3 focus:border-diligent-gray-4 focus:outline-none'
  const labelClassName = 'mb-1 block text-sm font-medium text-diligent-gray-5'

  return (
    <div className="rounded-lg border border-diligent-gray-2 bg-diligent-gray-1 p-6 sm:p-8">
      <h3 className="mb-4 text-lg font-semibold text-diligent-gray-5">
        Complete the form to access this resource
      </h3>

      {success ? (
        <p className="text-sm font-medium text-diligent-gray-5">
          Thank you! Your download is starting...
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="gate-firstName" className={labelClassName}>
                First name
              </label>
              <input
                id="gate-firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="gate-lastName" className={labelClassName}>
                Last name
              </label>
              <input
                id="gate-lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className={inputClassName}
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="gate-email" className={labelClassName}>
              Email
            </label>
            <input
              id="gate-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Work email address"
              className={inputClassName}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="gate-organization" className={labelClassName}>
              Organization
            </label>
            <input
              id="gate-organization"
              type="text"
              required
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Organization"
              className={inputClassName}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="gate-jobTitle" className={labelClassName}>
              Job title
            </label>
            <input
              id="gate-jobTitle"
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Job title"
              className={inputClassName}
            />
          </div>

          {error && (
            <p className="mb-4 text-sm text-diligent-red">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-diligent-red px-6 py-3 text-sm font-medium text-white hover:bg-diligent-red-2 disabled:opacity-60"
          >
            {submitting ? 'Downloading...' : 'Access resource'}
          </button>

          <p className="mt-4 text-xs text-diligent-gray-4">
            By submitting this form, you agree to receive communications from
            Diligent Corporation and its affiliates. You can update your
            preferences at any time via our{' '}
            <a
              href="https://www.diligent.com/preference-center"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              Preference Center
            </a>{' '}
            or review our{' '}
            <a
              href="https://www.diligent.com/privacy-notice"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              Privacy Notice
            </a>
            .
          </p>
        </form>
      )}
    </div>
  )
}
