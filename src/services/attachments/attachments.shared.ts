// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Attachments,
  AttachmentsData,
  AttachmentsPatch,
  AttachmentsQuery,
  AttachmentsService
} from './attachments.class'

export type { Attachments, AttachmentsData, AttachmentsPatch, AttachmentsQuery }

export type AttachmentsClientService = Pick<
  AttachmentsService<Params<AttachmentsQuery>>,
  (typeof attachmentsMethods)[number]
>

export const attachmentsPath = 'attachments'

export const attachmentsMethods: Array<keyof AttachmentsService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const attachmentsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(attachmentsPath, connection.service(attachmentsPath), {
    methods: attachmentsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [attachmentsPath]: AttachmentsClientService
  }
}
