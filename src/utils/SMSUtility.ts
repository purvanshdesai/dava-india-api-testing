import { app } from '../app'
import FormData from 'form-data'
import axios from 'axios'
import twilio from 'twilio'

export class SMSUtility {
  private templates: any
  constructor() {
    this.templates = {
      login_otp: {
        template: `Dear Customer, OTP for login to the Davaindia application is [OTP] . It will expire within the 5 minutes. Thank you. Team Davaindia`,
        placeholders: ['OTP'],
        smsNotifyTemplateId: '1707173718429571945'
      },
      order_placed: {
        template: `Thank you for ordering with Davaindia Generic Pharmacy. Your order is received. Track status anytime in the 'My Orders' section of the app. - Team Davaindia`,
        placeholders: [],
        smsNotifyTemplateId: '1707175704765720216'
      }
    }
  }

  async sendSMS({
    mobileNo,
    templateName,
    params
  }: {
    mobileNo: string
    templateName: string
    params: Record<string, string>
  }) {
    if (process.env.NODE_ENV !== 'development') {
      if (!params) throw new Error('Params not provided')

      const { text, smsNotifyTemplateId } = this.generateMessage({
        templateName,
        params,
        requestedFields: ['smsNotifyTemplateId']
      })
      return await this.sendSMSUsingSMSNotify({ mobileNo, message: text, dltTemplateId: smsNotifyTemplateId })
    }
    // else {
    //   const { text } = this.generateMessage({
    //     templateName,
    //     params
    //   })
    //   return await this.sendSMSUsingTwilio({ mobileNo, message: text })
    // }
  }

  generateMessage({
    templateName,
    requestedFields,
    params
  }: {
    templateName: string
    params: Record<string, string>
    requestedFields?: any[]
  }) {
    const templateData = this.templates[templateName]

    if (!templateData) {
      throw new Error(`Template with name ${templateName} not found.`)
    }

    let message = templateData.template

    for (const placeholder of templateData.placeholders) {
      if (!params[placeholder]) {
        throw new Error(`Missing value for placeholder: ${placeholder}`)
      }

      const regex = new RegExp(`\\[${placeholder}\\]`, 'g')
      message = message.replace(regex, params[placeholder])
    }

    const response: any = { text: message }

    if (requestedFields) {
      for (const field of requestedFields) {
        if (templateData[field] !== undefined) {
          response[field] = templateData[field]
        }
      }
    }

    return response
  }

  async sendSMSUsingSMSNotify({
    mobileNo,
    message,
    dltTemplateId
  }: {
    mobileNo: string
    message: string
    dltTemplateId: string
  }): Promise<void> {
    const smsConfig = app.get('sms')
    const smsNotifyConfig = smsConfig.smsNotify as any
    const userId = smsNotifyConfig.userId
    const password = smsNotifyConfig.password
    const senderId = smsNotifyConfig.senderId
    const dltEntityId = smsNotifyConfig.dltEntityId
    // Create FormData
    const formData = new FormData()
    formData.append('userid', userId) // 'zotanxt'
    formData.append('password', password) //'Zota@nxt'
    formData.append('senderid', senderId) //'ZOTNXT'
    formData.append('dltEntityId', dltEntityId) //'1701171619544846683'
    formData.append('mobile', mobileNo)
    formData.append('msg', message)
    formData.append('dltTemplateId', dltTemplateId)
    formData.append('sendMethod', 'quick')
    formData.append('msgType', 'text')
    formData.append('output', 'json')
    formData.append('duplicatecheck', 'true')

    try {
      // Make HTTP POST request
      // const response =
      await axios.post('https://smsnotify.one/SMSApi/send', formData, {
        headers: {
          ...formData.getHeaders(), // Dynamically sets Content-Type with boundary
          Cookie: 'SERVERID=webC1' // Add the required cookie header
        }
      })

      // Log the response
      console.log(`✅ SMS Message sent to [${mobileNo}]: `, message)
      // console.log('Response: ', response.data)
    } catch (error: any) {
      console.log('Email Error', error)
      // Handle errors
      if (error.response) {
        console.error('Error Response:', error.response)
      } else {
        console.error('Error:', error.message)
      }
    }
  }

  sendSMSUsingTwilio = async ({ mobileNo, message }: { mobileNo: string; message: string }) => {
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
}
