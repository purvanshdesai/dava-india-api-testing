import { app } from './app'
import { UsersModel } from './services/users/users.schema'
import namespaceManager from './socket/namespaceManager'
import { socketCallback } from './utils/socketCallback'

export const socketInstance = (io: any) => {}
