// src/app.test.ts (Jest)
import axios from 'axios'
import type { Server } from 'http'
import { app } from '../src/app'

// If your server sometimes boots slowly:
jest.setTimeout(30000)

describe('Feathers application (Jest)', () => {
  let server: Server
  let appUrl: string

  beforeAll(async () => {
    // Use port 0 to let the OS pick a free port
    server = await app.listen(0)

    // Derive the actual port after listen()
    const address = server.address()
    if (address && typeof address !== 'string') {
      const host = app.get('host') || '127.0.0.1'
      appUrl = `http://${host}:${address.port}`
    } else {
      throw new Error('Could not determine server address')
    }
  })

  afterAll(async () => {
    // Feathers v5: this tears down transports & closes the server
    await app.teardown()
  })

  it('starts and shows the index page', async () => {
    const { data } = await axios.get<string>(appUrl)
    expect(data).toContain('<html lang="en">')
  })

  it('shows a 404 JSON error', async () => {
    expect.assertions(3)
    try {
      await axios.get(`${appUrl}/path/to/nowhere`, { responseType: 'json' })
      // should not reach here
      // eslint-disable-next-line jest/no-conditional-expect
      expect(true).toBe(false)
    } catch (error: any) {
      const { response } = error
      expect(response?.status).toBe(404)
      expect(response?.data?.code).toBe(404)
      expect(response?.data?.name).toBe('NotFound')
    }
  })
})
