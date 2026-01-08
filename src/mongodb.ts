// For more information about this file see https://dove.feathersjs.com/guides/cli/databases.html
import { MongoClient } from 'mongodb'
import type { Db } from 'mongodb'
import type { Application } from './declarations'
import mongoose from 'mongoose'

declare module './declarations' {
  interface Configuration {
    mongodbClient: Promise<Db>
  }
}

export const mongodb = (app: Application) => {
  const connection = app.get('mongodb') as string
  const database = app.get('dbName')

  const mongoClient = MongoClient.connect(connection).then((client) => client.db(database))

  // Connect Mongoose
  mongoose
    .connect(connection, { dbName: database })
    .then(() => console.log('DB Connected!'))
    .catch((err: any) => {
      console.log('Error', err)
      process.exit(1)
    })

  app.set('mongodbClient', mongoClient)
}
