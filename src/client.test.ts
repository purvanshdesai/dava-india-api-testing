// client.test.ts (Jest)
import axios from 'axios'
import rest from '@feathersjs/rest-client'
import authenticationClient from '@feathersjs/authentication-client'
import { app } from '../src/app'
import { createClient } from '../src/client'
import type { Server } from 'http'

// Timeout added incase server takes time to start
jest.setTimeout(30000)

const port = app.get('port')

describe('application client tests (Jest)', () => {
  let server: Server
  let appUrl: string
  let client: any

  beforeAll(async () => {
    // Use port 0 to let the OS pick a free port
    server = await app.listen(0)

    // Derive the actual port after listen()
    const address = server.address()
    if (address && typeof address !== 'string') {
      const host = app.get('host') || '127.0.0.1'
      appUrl = `http://${host}:${address.port}`
      // Build a Feathers REST client against the running server
      client = createClient(rest(appUrl).axios(axios)).configure(authenticationClient())
    } else {
      throw new Error('Could not determine server address')
    }
  })

  afterAll(async () => {
    // Feathers v5: this tears down transports & closes the server
    await app.teardown()
  })

  it('initialized the client', () => {
    expect(client).toBeTruthy()
  })
})
