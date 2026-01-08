import twilio from 'twilio'
import { app } from '../app'
import axios from 'axios'
import FormData from 'form-data'

export const sendSMS = async (mobileNo: string, message: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Send SMS ===== ', mobileNo, ', message ===== ', message)
    return
  }

  const twilioCreds = app.get('twilio')
  const { accountSid, authToken, from } = twilioCreds
  try {
    const client = twilio(accountSid, authToken)
    const resp = await client.messages.create({
      body: message,
      to: mobileNo, // Text your number
      from: from // From a valid Twilio number
    })
    return resp
  } catch (err) {
    console.log('Error occurred while sending SMS', err)
  }
}
