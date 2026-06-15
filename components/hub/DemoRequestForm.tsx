'use client'

import { useState, type FormEvent } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function DemoRequestForm({ ctaText }: { ctaText?: string | null }) {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const form = e.currentTarget
    const data = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value.trim(),
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value.trim(),
      workEmail: (form.elements.namedItem('workEmail') as HTMLInputElement).value.trim(),
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value.trim(),
      companyName: (form.elements.namedItem('companyName') as HTMLInputElement).value.trim(),
      country: (form.elements.namedItem('country') as HTMLSelectElement).value,
    }

    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error ?? 'Something went wrong. Please try again.')
      }

      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-md bg-white/10 p-8 text-center">
        <p className="text-lg font-semibold text-white">
          Thank you! We'll be in touch shortly.
        </p>
      </div>
    )
  }

  const inputClasses =
    'w-full rounded-sm border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:border-white focus:outline-none'

  const selectClasses =
    'w-full rounded-sm border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white focus:outline-none'

  const optionStyle = { backgroundColor: '#282E37', color: '#FFFFFF' }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          id="firstName"
          name="firstName"
          type="text"
          required
          placeholder="First name"
          aria-label="First name"
          className={inputClasses}
        />
        <input
          id="lastName"
          name="lastName"
          type="text"
          required
          placeholder="Last name"
          aria-label="Last name"
          className={inputClasses}
        />
      </div>
      <input
        id="workEmail"
        name="workEmail"
        type="email"
        required
        placeholder="Work email"
        aria-label="Work email"
        className={inputClasses}
      />
      <input
        id="phone"
        name="phone"
        type="tel"
        required
        placeholder="Phone number"
        aria-label="Phone number"
        className={inputClasses}
      />
      <input
        id="companyName"
        name="companyName"
        type="text"
        required
        placeholder="Company name"
        aria-label="Company name"
        className={inputClasses}
      />
      <select
          id="country"
          name="country"
          required
          className={selectClasses}
          defaultValue=""
          style={{ backgroundColor: '#282E37', color: '#FFFFFF' }}
        >
          <option value="" disabled style={optionStyle}>Select country</option>
          <option value="United States" style={optionStyle}>United States</option>
          <option value="Canada" style={optionStyle}>Canada</option>
          <option value="United Kingdom" style={optionStyle}>United Kingdom</option>
          <optgroup label="Other countries" style={optionStyle}>
          <option value="Afghanistan" style={optionStyle}>Afghanistan</option>
          <option value="Albania" style={optionStyle}>Albania</option>
          <option value="Algeria" style={optionStyle}>Algeria</option>
          <option value="Andorra" style={optionStyle}>Andorra</option>
          <option value="Angola" style={optionStyle}>Angola</option>
          <option value="Argentina" style={optionStyle}>Argentina</option>
          <option value="Armenia" style={optionStyle}>Armenia</option>
          <option value="Australia" style={optionStyle}>Australia</option>
          <option value="Austria" style={optionStyle}>Austria</option>
          <option value="Azerbaijan" style={optionStyle}>Azerbaijan</option>
          <option value="Bahrain" style={optionStyle}>Bahrain</option>
          <option value="Bangladesh" style={optionStyle}>Bangladesh</option>
          <option value="Belgium" style={optionStyle}>Belgium</option>
          <option value="Bolivia" style={optionStyle}>Bolivia</option>
          <option value="Bosnia and Herzegovina" style={optionStyle}>Bosnia and Herzegovina</option>
          <option value="Brazil" style={optionStyle}>Brazil</option>
          <option value="Bulgaria" style={optionStyle}>Bulgaria</option>
          <option value="Cambodia" style={optionStyle}>Cambodia</option>
          <option value="Chile" style={optionStyle}>Chile</option>
          <option value="China" style={optionStyle}>China</option>
          <option value="Colombia" style={optionStyle}>Colombia</option>
          <option value="Costa Rica" style={optionStyle}>Costa Rica</option>
          <option value="Croatia" style={optionStyle}>Croatia</option>
          <option value="Cyprus" style={optionStyle}>Cyprus</option>
          <option value="Czech Republic" style={optionStyle}>Czech Republic</option>
          <option value="Denmark" style={optionStyle}>Denmark</option>
          <option value="Ecuador" style={optionStyle}>Ecuador</option>
          <option value="Egypt" style={optionStyle}>Egypt</option>
          <option value="Estonia" style={optionStyle}>Estonia</option>
          <option value="Finland" style={optionStyle}>Finland</option>
          <option value="France" style={optionStyle}>France</option>
          <option value="Georgia" style={optionStyle}>Georgia</option>
          <option value="Germany" style={optionStyle}>Germany</option>
          <option value="Ghana" style={optionStyle}>Ghana</option>
          <option value="Greece" style={optionStyle}>Greece</option>
          <option value="Guatemala" style={optionStyle}>Guatemala</option>
          <option value="Honduras" style={optionStyle}>Honduras</option>
          <option value="Hong Kong" style={optionStyle}>Hong Kong</option>
          <option value="Hungary" style={optionStyle}>Hungary</option>
          <option value="Iceland" style={optionStyle}>Iceland</option>
          <option value="India" style={optionStyle}>India</option>
          <option value="Indonesia" style={optionStyle}>Indonesia</option>
          <option value="Ireland" style={optionStyle}>Ireland</option>
          <option value="Israel" style={optionStyle}>Israel</option>
          <option value="Italy" style={optionStyle}>Italy</option>
          <option value="Japan" style={optionStyle}>Japan</option>
          <option value="Jordan" style={optionStyle}>Jordan</option>
          <option value="Kazakhstan" style={optionStyle}>Kazakhstan</option>
          <option value="Kenya" style={optionStyle}>Kenya</option>
          <option value="Kuwait" style={optionStyle}>Kuwait</option>
          <option value="Latvia" style={optionStyle}>Latvia</option>
          <option value="Lebanon" style={optionStyle}>Lebanon</option>
          <option value="Lithuania" style={optionStyle}>Lithuania</option>
          <option value="Luxembourg" style={optionStyle}>Luxembourg</option>
          <option value="Malaysia" style={optionStyle}>Malaysia</option>
          <option value="Malta" style={optionStyle}>Malta</option>
          <option value="Mexico" style={optionStyle}>Mexico</option>
          <option value="Morocco" style={optionStyle}>Morocco</option>
          <option value="Netherlands" style={optionStyle}>Netherlands</option>
          <option value="New Zealand" style={optionStyle}>New Zealand</option>
          <option value="Nigeria" style={optionStyle}>Nigeria</option>
          <option value="Norway" style={optionStyle}>Norway</option>
          <option value="Oman" style={optionStyle}>Oman</option>
          <option value="Pakistan" style={optionStyle}>Pakistan</option>
          <option value="Panama" style={optionStyle}>Panama</option>
          <option value="Peru" style={optionStyle}>Peru</option>
          <option value="Philippines" style={optionStyle}>Philippines</option>
          <option value="Poland" style={optionStyle}>Poland</option>
          <option value="Portugal" style={optionStyle}>Portugal</option>
          <option value="Qatar" style={optionStyle}>Qatar</option>
          <option value="Romania" style={optionStyle}>Romania</option>
          <option value="Saudi Arabia" style={optionStyle}>Saudi Arabia</option>
          <option value="Serbia" style={optionStyle}>Serbia</option>
          <option value="Singapore" style={optionStyle}>Singapore</option>
          <option value="Slovakia" style={optionStyle}>Slovakia</option>
          <option value="Slovenia" style={optionStyle}>Slovenia</option>
          <option value="South Africa" style={optionStyle}>South Africa</option>
          <option value="South Korea" style={optionStyle}>South Korea</option>
          <option value="Spain" style={optionStyle}>Spain</option>
          <option value="Sri Lanka" style={optionStyle}>Sri Lanka</option>
          <option value="Sweden" style={optionStyle}>Sweden</option>
          <option value="Switzerland" style={optionStyle}>Switzerland</option>
          <option value="Taiwan" style={optionStyle}>Taiwan</option>
          <option value="Thailand" style={optionStyle}>Thailand</option>
          <option value="Turkey" style={optionStyle}>Turkey</option>
          <option value="Uganda" style={optionStyle}>Uganda</option>
          <option value="Ukraine" style={optionStyle}>Ukraine</option>
          <option value="United Arab Emirates" style={optionStyle}>United Arab Emirates</option>
          <option value="Uruguay" style={optionStyle}>Uruguay</option>
          <option value="Vietnam" style={optionStyle}>Vietnam</option>
          <option value="Zimbabwe" style={optionStyle}>Zimbabwe</option>
          </optgroup>
        </select>

      <p className="text-[11px] leading-relaxed text-white/60">
        By submitting this form, you agree to receive the information requested as well as sales and/or marketing communication on resources, news, and events related to the Diligent suite of solutions. You can unsubscribe at any time or manage the types of communication you would like to receive by visiting our{' '}
        <a href="https://learn.diligent.com/preference-center.html" target="_blank" rel="noopener noreferrer" className="text-white/70 no-underline hover:underline">Preference Center</a>. For further details regarding how Diligent processes your personal information, please refer to our{' '}
        <a href="https://www.diligent.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-white/70 no-underline hover:underline">Privacy Notice</a>.
      </p>

      {status === 'error' && (
        <p className="text-sm text-red-300" role="alert">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-2 inline-flex w-full items-center justify-center rounded-sm bg-diligent-red px-6 py-3 text-sm font-medium text-white no-underline transition hover:bg-diligent-red-2 hover:no-underline focus-visible:bg-diligent-red-2 focus-visible:no-underline disabled:opacity-60"
      >
        {status === 'submitting' ? 'Submitting...' : (ctaText || 'Request a demo')}
      </button>
    </form>
  )
}
