import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'

const app = feathers().configure(configuration())

export default (token: string) => {
  return `
        <div>
            <h1>You are invited</h1>
            <div>
                <a href="${app.get('web')}/store-reset-password?token=${token}">${app.get('web')}/store-reset-password?token=${token}</a>
            </div>
        </div>
    `
}
