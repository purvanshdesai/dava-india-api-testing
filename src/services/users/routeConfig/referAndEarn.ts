import { Application } from '../../../declarations'
import { ReferralService, getOptions } from '../users.class'
import { referralPath, referralMethods } from '../users.shared'
import { authenticate } from '@feathersjs/authentication'

export default function Referral(app: Application) {
  // Register our service on the Feathers application
  app.use(referralPath, new ReferralService(getOptions(app)), {
    methods: referralMethods,
    events: []
  })

  app.service(referralPath).hooks({
    around: {
      all: [authenticate('jwt')],
      create: []
    },
    before: {
      all: [],
      create: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}
