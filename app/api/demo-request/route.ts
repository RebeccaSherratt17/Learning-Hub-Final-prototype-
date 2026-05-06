import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

interface DemoRequestBody {
  firstName: string
  lastName: string
  workEmail: string
  phone: string
  companyName: string
  country: string
}

const REQUIRED_FIELDS: (keyof DemoRequestBody)[] = [
  'firstName',
  'lastName',
  'workEmail',
  'phone',
  'companyName',
  'country',
]

export async function POST(request: Request) {
  let body: DemoRequestBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    )
  }

  // Validate required fields
  for (const field of REQUIRED_FIELDS) {
    if (!body[field] || typeof body[field] !== 'string' || !body[field].trim()) {
      return NextResponse.json(
        { error: `${field} is required` },
        { status: 400 },
      )
    }
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.workEmail)) {
    return NextResponse.json(
      { error: 'Invalid email address' },
      { status: 400 },
    )
  }

  // TODO: Add Marketo integration here in a later phase
  // await submitToMarketo(body)

  // Send notification email
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: 'certifications@diligent.com',
      subject: `New demo request from ${body.firstName} ${body.lastName}`,
      text: [
        'New demo request submitted via the Learning Hub:',
        '',
        `First name: ${body.firstName}`,
        `Last name: ${body.lastName}`,
        `Work email: ${body.workEmail}`,
        `Phone number: ${body.phone}`,
        `Company name: ${body.companyName}`,
        `Country: ${body.country}`,
        '',
        `Submitted at: ${new Date().toISOString()}`,
      ].join('\n'),
    })
  } catch (err) {
    console.error('Failed to send demo request email:', err)
    return NextResponse.json(
      { error: 'Failed to submit request. Please try again.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
