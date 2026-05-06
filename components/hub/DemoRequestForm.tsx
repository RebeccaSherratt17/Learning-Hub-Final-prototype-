'use client'

import { useState, type FormEvent } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function DemoRequestForm() {
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
    'w-full rounded-sm border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-diligent-gray-3 focus:border-white focus:outline-none'

  const selectClasses =
    'w-full rounded-sm border border-white/20 bg-white/10 px-4 py-3 text-sm text-white focus:border-white focus:outline-none [&>option]:bg-white [&>option]:text-diligent-gray-5'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm text-diligent-gray-3">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm text-diligent-gray-3">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            className={inputClasses}
          />
        </div>
      </div>
      <div>
        <label htmlFor="workEmail" className="mb-1 block text-sm text-diligent-gray-3">
          Work email
        </label>
        <input
          id="workEmail"
          name="workEmail"
          type="email"
          required
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm text-diligent-gray-3">
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor="companyName" className="mb-1 block text-sm text-diligent-gray-3">
          Company name
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          required
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor="country" className="mb-1 block text-sm text-diligent-gray-3">
          Country
        </label>
        <select
          id="country"
          name="country"
          required
          className={selectClasses}
          defaultValue=""
        >
          <option value="" disabled>Select country</option>
          <option value="United States">United States</option>
          <option value="Canada">Canada</option>
          <option value="United Kingdom">United Kingdom</option>
          <option disabled>───────────</option>
          <option value="Afghanistan">Afghanistan</option>
          <option value="Albania">Albania</option>
          <option value="Algeria">Algeria</option>
          <option value="Andorra">Andorra</option>
          <option value="Angola">Angola</option>
          <option value="Argentina">Argentina</option>
          <option value="Armenia">Armenia</option>
          <option value="Australia">Australia</option>
          <option value="Austria">Austria</option>
          <option value="Azerbaijan">Azerbaijan</option>
          <option value="Bahrain">Bahrain</option>
          <option value="Bangladesh">Bangladesh</option>
          <option value="Belgium">Belgium</option>
          <option value="Bolivia">Bolivia</option>
          <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
          <option value="Brazil">Brazil</option>
          <option value="Bulgaria">Bulgaria</option>
          <option value="Cambodia">Cambodia</option>
          <option value="Chile">Chile</option>
          <option value="China">China</option>
          <option value="Colombia">Colombia</option>
          <option value="Costa Rica">Costa Rica</option>
          <option value="Croatia">Croatia</option>
          <option value="Cyprus">Cyprus</option>
          <option value="Czech Republic">Czech Republic</option>
          <option value="Denmark">Denmark</option>
          <option value="Ecuador">Ecuador</option>
          <option value="Egypt">Egypt</option>
          <option value="Estonia">Estonia</option>
          <option value="Finland">Finland</option>
          <option value="France">France</option>
          <option value="Georgia">Georgia</option>
          <option value="Germany">Germany</option>
          <option value="Ghana">Ghana</option>
          <option value="Greece">Greece</option>
          <option value="Guatemala">Guatemala</option>
          <option value="Honduras">Honduras</option>
          <option value="Hong Kong">Hong Kong</option>
          <option value="Hungary">Hungary</option>
          <option value="Iceland">Iceland</option>
          <option value="India">India</option>
          <option value="Indonesia">Indonesia</option>
          <option value="Ireland">Ireland</option>
          <option value="Israel">Israel</option>
          <option value="Italy">Italy</option>
          <option value="Japan">Japan</option>
          <option value="Jordan">Jordan</option>
          <option value="Kazakhstan">Kazakhstan</option>
          <option value="Kenya">Kenya</option>
          <option value="Kuwait">Kuwait</option>
          <option value="Latvia">Latvia</option>
          <option value="Lebanon">Lebanon</option>
          <option value="Lithuania">Lithuania</option>
          <option value="Luxembourg">Luxembourg</option>
          <option value="Malaysia">Malaysia</option>
          <option value="Malta">Malta</option>
          <option value="Mexico">Mexico</option>
          <option value="Morocco">Morocco</option>
          <option value="Netherlands">Netherlands</option>
          <option value="New Zealand">New Zealand</option>
          <option value="Nigeria">Nigeria</option>
          <option value="Norway">Norway</option>
          <option value="Oman">Oman</option>
          <option value="Pakistan">Pakistan</option>
          <option value="Panama">Panama</option>
          <option value="Peru">Peru</option>
          <option value="Philippines">Philippines</option>
          <option value="Poland">Poland</option>
          <option value="Portugal">Portugal</option>
          <option value="Qatar">Qatar</option>
          <option value="Romania">Romania</option>
          <option value="Saudi Arabia">Saudi Arabia</option>
          <option value="Serbia">Serbia</option>
          <option value="Singapore">Singapore</option>
          <option value="Slovakia">Slovakia</option>
          <option value="Slovenia">Slovenia</option>
          <option value="South Africa">South Africa</option>
          <option value="South Korea">South Korea</option>
          <option value="Spain">Spain</option>
          <option value="Sri Lanka">Sri Lanka</option>
          <option value="Sweden">Sweden</option>
          <option value="Switzerland">Switzerland</option>
          <option value="Taiwan">Taiwan</option>
          <option value="Thailand">Thailand</option>
          <option value="Turkey">Turkey</option>
          <option value="Uganda">Uganda</option>
          <option value="Ukraine">Ukraine</option>
          <option value="United Arab Emirates">United Arab Emirates</option>
          <option value="Uruguay">Uruguay</option>
          <option value="Vietnam">Vietnam</option>
          <option value="Zimbabwe">Zimbabwe</option>
        </select>
      </div>

      <p className="text-[11px] leading-relaxed text-diligent-gray-4">
        By submitting this form, you agree to receive the information requested as well as sales and/or marketing communication on resources, news, and events related to the Diligent suite of solutions. You can unsubscribe at any time or manage the types of communication you would like to receive by visiting our{' '}
        <a href="https://learn.diligent.com/preference-center.html" target="_blank" rel="noopener noreferrer" className="text-[#0B4CCE] no-underline hover:no-underline">Preference Center</a>. For further details regarding how Diligent processes your personal information, please refer to our{' '}
        <a href="https://www.diligent.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-[#0B4CCE] no-underline hover:no-underline">Privacy Notice</a>.
      </p>

      {status === 'error' && (
        <p className="text-sm text-red-300" role="alert">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-2 inline-flex w-full items-center justify-center rounded-sm bg-diligent-red px-6 py-3 text-sm font-medium text-white no-underline transition hover:bg-diligent-red-2 hover:no-underline focus-visible:bg-diligent-red-2 focus-visible:no-underline disabled:opacity-60"
      >
        {status === 'submitting' ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
