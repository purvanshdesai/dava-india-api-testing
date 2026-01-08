import { appConfig } from '../utils/config'
import { Client } from '@elastic/elasticsearch'

const elastic = appConfig.elastic

const client: any = new Client({ node: elastic?.url ?? 'http://localhost:9200' }) // Adjust URL as necessary

export default client
