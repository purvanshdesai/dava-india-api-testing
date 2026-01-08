// For more information about this file see https://dove.feathersjs.com/guides/cli/service.test.html
import assert from 'assert'
import { app } from '../../../src/app'

describe('app-install-referrer-tracker service', () => {
  it('registered the service', () => {
    const service = app.service('app-install-referrer-tracker')

    assert.ok(service, 'Registered the service')
  })
})
