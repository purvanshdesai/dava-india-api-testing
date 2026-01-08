import nodemailer from 'nodemailer'
import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'

const app = feathers().configure(configuration())

const emailConfig = app.get('email')

type MailOptions = {
  to: string[]
  cc?: string[]
  subject: string
  attachments?: Object[]
  html: string
}

export const EMAIL_SENDERS = {
  NO_REPLY: 'no-reply',
  UPDATE: 'update'
} as const

export const sendEmail = async ({
  to,
  cc,
  subject,
  message,
  attachments,
  sender = EMAIL_SENDERS.NO_REPLY
}: {
  to: string | string[]
  cc?: string[]
  subject: string
  message: string
  attachments?: any[]
  sender?: (typeof EMAIL_SENDERS)[keyof typeof EMAIL_SENDERS]
}) => {
  const account = emailConfig.accounts[sender]
  const from = account.from
  const host = account.host
  const port = account.port
  const secure = account.secure
  const user = account.auth.user
  const password = account.auth.password
  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: secure, // true for 465, false for other ports
    auth: {
      user: user,
      pass: password
    }
  })
  // console.log('send to', to)
  try {
    let defaultSendTo = emailConfig?.defaultSendTo
    defaultSendTo = defaultSendTo?.includes(',') ? defaultSendTo.split(',') : defaultSendTo

    const result = await transporter.sendMail({
      from,
      to: to,
      cc: [...defaultSendTo, ...(cc ?? [])],
      subject,
      html: message,
      attachments
    })
    // console.log('email result', result)
    return result
  } catch (error) {
    console.log('email error===>', error)
  }
}
