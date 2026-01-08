// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Modules, ModulesData, ModulesPatch, ModulesQuery, ModulesService } from './modules.class'

export type { Modules, ModulesData, ModulesPatch, ModulesQuery }

export type ModulesClientService = Pick<ModulesService<Params<ModulesQuery>>, (typeof modulesMethods)[number]>

export const modulesPath = 'modules'

export const modulesMethods: Array<keyof ModulesService> = ['find', 'get', 'create', 'patch', 'remove']

export const modulesClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(modulesPath, connection.service(modulesPath), {
    methods: modulesMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [modulesPath]: ModulesClientService
  }
}
