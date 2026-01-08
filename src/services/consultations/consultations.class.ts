// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Id, Params } from '@feathersjs/feathers'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  ConsultationModal,
  type Consultations,
  type ConsultationsData,
  type ConsultationsPatch,
  type ConsultationsQuery
} from './consultations.schema'
import { nanoid } from 'nanoid'
import moment from 'moment'
import { docDefinition } from '../../utils/invoice'
import { TicketsModel } from '../tickets/tickets.schema'
import { BadRequest } from '@feathersjs/errors'
import { UsersModel } from '../users/users.schema'
import { ProductsModel } from '../super-admin/products/products.schema'
import PdfPrinter from 'pdfmake'
import { aws } from '../../utils/s3'
import { S3_CONST } from '../../constants/general'
import { TicketActivitiesModel } from '../support/support.schema'
import { OrderModel } from '../order/order.schema'
import { notificationServices } from '../../socket/namespaceManager'
import { OrderItemTrackingModal } from '../order-item-tracking/order-item-tracking.schema'
import { AppDataModel, CONSTANTS } from '../app-data/app-data.schema'
import { CONSTANTS as TICKET_CONSTANTS } from '../tickets/tickets.schema'
import { OrderItemModel } from '../order-items/order-items.schema'
import { s3DirectoryName, StorageService } from '../../utils/StoreageService'

export type { Consultations, ConsultationsData, ConsultationsPatch, ConsultationsQuery }

export interface ConsultationsParams extends MongoDBAdapterParams<ConsultationsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class ConsultationsService {
  generateDosageInstructions(dosage: any) {
    const { timesPerDay, noOfDays, beforeFood, afterFood, morning, afternoon, night, sos } = dosage

    let timingParts = []
    if (morning) timingParts.push('morning')
    if (afternoon) timingParts.push('afternoon')
    if (night) timingParts.push('night')
    if (sos) timingParts.push('sos')

    const foodInstruction = beforeFood ? 'before food' : afterFood ? 'after food' : 'as prescribed'

    const timingString =
      timingParts.length > 0
        ? `in the ${timingParts.join(timingParts.length > 1 ? ' and ' : '')}`
        : 'as prescribed'

    const dayInstruction =
      timesPerDay > 0 ? `only ${timesPerDay} time${timesPerDay > 1 ? 's' : ''} a day` : 'as prescribed'

    const durationInstruction = noOfDays > 0 ? `for ${noOfDays} day${noOfDays > 1 ? 's' : ''}` : ''

    // Combine the parts into a single instruction
    const instructions = [`Use ${foodInstruction}`, timingString, dayInstruction, durationInstruction]
      .filter(Boolean) // Remove any empty strings
      .join(', ')

    return instructions.charAt(0).toUpperCase() + instructions.slice(1) + '.'
  }
  uploadPDFStreamToS3(pdfDoc: any) {
    return new Promise((resolve, reject) => {
      // Pipe the PDF stream directly to S3
      const fileName = `${nanoid()}.pdf`
      const passThroughStream = new aws.S3.ManagedUpload({
        params: {
          Bucket: S3_CONST.BUCKET_NAME,
          Key: `${s3DirectoryName}/${fileName}`,
          Body: pdfDoc,
          ContentType: 'application/pdf',
          ...(process.env.NODE_ENV !== 'production' && { ACL: 'public-read' })
        }
      })

      pdfDoc.end() // Finalize the PDF document

      // Start the upload
      passThroughStream
        .promise()
        .then((data) => resolve(`https://${S3_CONST.cloudFrontUrl}/${s3DirectoryName}/${fileName}`))
        .catch((err) => reject(err))
    })
  }
  async find(params: Params<ConsultationsQuery>) {
    try {
      let reqQuery: any = {}
      const user = params.user
      if (params?.query?.status) {
        reqQuery.status = params?.query?.status
        reqQuery.orderPlaced = false
      }

      const consultations = await ConsultationModal.find({ ...reqQuery, userId: user?._id })
        .limit(params?.query?.$limit || 0)
        .skip(params?.query?.$skip || 0)
        .sort({
          _id: -1
        })
        .lean()
      const docCount = await ConsultationModal.countDocuments({ ...reqQuery, userId: user?._id })
      return {
        data: consultations,
        total: docCount
      }
    } catch (error) {
      throw error
    }
  }

  async get(id: Id, params: Params) {
    try {
      const user = params?.user
      const consultation = await ConsultationModal.findById(id).populate('medicines.productId').lean()
      if (consultation?.userId?.toString() != user?._id?.toString()) throw new BadRequest('Not allowed')
      return consultation
    } catch (error) {
      throw error
    }
  }

  async create(data: ConsultationsData, params: Params<ConsultationsQuery>) {
    try {
      const user = params.user
      const ticket: any = await TicketsModel.findById(data.ticket)
        .populate('assignee')
        .populate('patientId')
        .lean()
      if (!ticket) throw new BadRequest('Ticket not found')
      const ticketUser = await UsersModel.findById(ticket.createdBy).lean()
      await ConsultationModal.findOneAndUpdate(
        { ticket: ticket?._id },
        {
          ...data,
          status: 'ready_for_order',
          ticketType: 'doctorConsultation',
          userId: ticketUser?._id,
          consultDate: moment().toDate(),
          type: 'online',
          ticket: ticket?._id
        }
      )
      const consultation = await ConsultationModal.findOne({ ticket: ticket?._id })
      if (!consultation) throw new BadRequest('Invalid ticket')
      let order: any = null
      let prescription = null
      if (ticket.order) {
        order = await OrderModel.findById(ticket.order)
        prescription = order.prescription ?? {}
        if (!prescription.urls) prescription.urls = []
      }
      const medicines = []
      let totalPrice = 0
      let products = []
      let prescriptionRequiredProducts = []

      const hasOrder = !!ticket.order

      for (const medicineItem of consultation.get('medicines')) {
        const product = await ProductsModel.findById(medicineItem.productId).lean()
        if (product?.finalPrice) {
          totalPrice = totalPrice + product?.finalPrice
        }
        if (product) products.push(product)
        const medicineDetails = {
          name: product?.title,
          composition: product?.compositions,
          description: this.generateDosageInstructions(medicineItem.dosage)
        }

        if (hasOrder) {
          // If order exists, only push prescription-required products
          if (product?.prescriptionReq) {
            prescriptionRequiredProducts.push(medicineDetails)
          }
        } else {
          // If no order, push all products
          medicines.push(medicineDetails)
        }
      }

      const finalMedicines = hasOrder ? prescriptionRequiredProducts : medicines

      const dd = docDefinition({
        consultingDate: consultation.get('consultDate'),
        consultingType: 'online',
        vitals: {
          height: data?.vitals?.height,
          weight: data?.vitals?.weight,
          bp: data?.vitals?.bloodPressure,
          temperature: data?.vitals?.temperature
        },
        doc: ticket?.assignee ?? {},
        patient: {
          name: ticket?.patientId ? ticket?.patientId?.name : ticketUser?.name,
          mobileNo: ticket?.patientId ? ticket?.patientId?.phoneNumber : ticketUser?.phoneNumber,
          email: ticket?.patientId ? ticket?.patientId?.email : ticketUser?.email,
          age: ticket?.patientId
            ? this.calculateAge(ticket?.editedDateOfBirth || ticket?.patientId?.dateOfBirth)
            : '',
          gender: ticket?.patientId ? ticket?.patientId?.gender : '',
          uhid: '1232',
          apptId: consultation.get('appointmentId')
        },
        complaints: consultation.get('chiefComplains').map((item: any) => ({
          name: item.concern,
          description: `${item.duration} | ${item.severity}`
        })),
        diagnosis: consultation.get('provisionalDiagnosis').map((item: any) => ({
          name: item.concern,
          description: `${item.duration} | ${item.severity}`
        })),
        medicines: finalMedicines
      })
      const fonts = {
        Roboto: {
          normal: 'fonts/Roboto-Regular.ttf',
          bold: 'fonts/Roboto-Medium.ttf',
          italics: 'fonts/Roboto-Italic.ttf',
          bolditalics: 'fonts/Roboto-MediumItalic.ttf'
        }
      }
      const ticketActivity = await TicketActivitiesModel.create({
        ticket: ticket?._id,
        activity: 'order-created',
        createdByUserType: TICKET_CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN,
        createdBy: user?._id
      })
      const printer = new PdfPrinter(fonts)
      const pdf = printer.createPdfKitDocument(dd, {})
      const s3resp: any = await this.uploadPDFStreamToS3(pdf)
      consultation.set('prescriptionUrl', s3resp)
      ticketActivity.set('content', s3resp)
      if (prescription) order?.set('prescription', { ...prescription, urls: [...prescription.urls, s3resp] })
      consultation.save()
      ticketActivity.save()
      order?.save()

      if (order) {
        const prescriptionGeneratedActivity = await AppDataModel.findOne({
          type: CONSTANTS.TYPE.TRACKING_STATUS,
          statusCode: 'prescription_generated'
        })

        const orderTracking = await OrderItemTrackingModal.find({
          order: order._id,
          hasPrescriptionVerification: true,
          isDeleted: { $ne: true }
        })

        for (const tracking of orderTracking) {
          const timeline: any = tracking.timeline || []
          timeline.push({
            label: prescriptionGeneratedActivity?.name,
            date: new Date(),
            statusCode: prescriptionGeneratedActivity?.statusCode,
            authorName: 'Super Admin (System)',
            authorType: 'super-admin'
          })
          await OrderItemTrackingModal.findByIdAndUpdate(tracking._id, {
            timeline,
            lastTimelineStatus: prescriptionGeneratedActivity?.statusCode
          })
        }
      }

      notificationServices.userNotifications.sendNotificationToUser(ticket?.createdBy, {
        recipientId: ticket?.createdBy,
        recipientType: 'user',
        title: 'Consultation Order',
        message: 'Order created for consultation',
        type: 'consultation',
        data: {
          consultationId: consultation?._id
        },
        isRead: false,
        createdAt: moment().toDate(),
        priority: 'normal'
      })
      return consultation
    } catch (error) {
      throw error
    }
  }

  calculateAge = (dateOfBirth: string): number => {
    const dob = new Date(dateOfBirth)
    const now = new Date()

    let age = now.getFullYear() - dob.getFullYear()
    const hasHadBirthdayThisYear =
      now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate())

    if (!hasHadBirthdayThisYear) {
      age--
    }

    return age
  }

  async patch() {}

  async remove() {}
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('consultations'))
  }
}
