import { allowedNamespaces } from '../../socket/namespaceManager'

class SocketUserManager {
  allowedNamespaces: Set<any>
  liveUsers: any
  constructor() {
    this.allowedNamespaces = new Set(allowedNamespaces)
    this.liveUsers = {}
  }

  createNamespace(namespaceName: string) {
    // if (!this.allowedNamespaces.has(namespaceName)) {
    //   throw new Error(`Namespace "${namespaceName}" is not allowed.`)
    // }

    if (this.liveUsers[namespaceName]) {
      return
    }

    this.liveUsers[namespaceName] = new Map()
  }

  registerSocket(namespaceName: string, userId: string, socketId: string) {
    if (!this.liveUsers[namespaceName]) {
      throw new Error(`Namespace "${namespaceName}" does not exist.`)
    }

    const userMap = this.liveUsers[namespaceName]
    if (!userMap.has(userId)) {
      userMap.set(userId, new Set())
    }
    userMap.get(userId).add(socketId)
  }

  removeSocket(namespaceName: string, socketId: string) {
    if (!this.liveUsers[namespaceName]) {
      throw new Error(`Namespace "${namespaceName}" does not exist.`)
    }

    const userMap = this.liveUsers[namespaceName]

    for (const [userId, socketSet] of userMap.entries()) {
      if (socketSet.has(socketId)) {
        socketSet.delete(socketId)
        if (socketSet.size === 0) {
          userMap.delete(userId) // Remove user if no sockets remain
        }
        return
      }
    }

    throw new Error(`Socket "${socketId}" not found in namespace "${namespaceName}".`)
  }

  getSocketsForUser(namespaceName: string, userId: string) {
    if (!this.liveUsers[namespaceName]) {
      throw new Error(`Namespace "${namespaceName}" does not exist.`)
    }

    const userMap = this.liveUsers[namespaceName]
    const sockets = userMap.get(userId) || new Set()
    return Array.from(sockets)
  }

  getAllUsersInNamespace(namespaceName: string) {
    if (!this.liveUsers[namespaceName]) {
      throw new Error(`Namespace "${namespaceName}" does not exist.`)
    }

    const userMap = this.liveUsers[namespaceName]
    return Array.from(userMap.keys())
  }

  getAllNamespaces() {
    return Object.keys(this.liveUsers)
  }

  clearNamespace(namespaceName: string) {
    if (!this.liveUsers[namespaceName]) {
      throw new Error(`Namespace "${namespaceName}" does not exist.`)
    }

    this.liveUsers[namespaceName] = new Map()
  }
}

export default new SocketUserManager()
