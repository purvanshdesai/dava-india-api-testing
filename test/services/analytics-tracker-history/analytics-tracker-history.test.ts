// For more information about this file see https://dove.feathersjs.com/guides/cli/service.test.html
import assert from 'assert'
import { app } from '../../../src/app'

describe('analytics-tracker-history service', () => {
  it('registered the service', () => {
    const service = app.service('analytics-tracker-history')

    assert.ok(service, 'Registered the service')
  })
})
