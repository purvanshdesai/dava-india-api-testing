const fs = require('fs')
const path = require('path')
const csvParser = require('csv-parser')

module.exports = {
  async up(db, client) {
    try {
      // 19292
      console.log('Start Here', new Date())

      // Get the absolute path to the CSV file
      const csvFilePath = path.resolve(__dirname, '../seeds/pincode.csv')

      // A utility function to convert stream events into a promise
      const streamToPromise = (stream) => {
        let HOs = []
        let POs = []

        return new Promise((resolve, reject) => {
          stream
            .pipe(csvParser())
            .on('data', async (row) => {
              if (row.OfficeType === 'HO') HOs.push(row)
              else if (row.OfficeType === 'PO') POs.push(row)
            })
            .on('end', async () => {
              resolve({ HOs, POs })
            })
            .on('error', (error) => {
              console.error('Error reading CSV file:', error)
              reject(error)
            })
        })
      }

      const startImportZipCodes = async () => {
        const stream = fs.createReadStream(csvFilePath)
        const { HOs, POs } = await streamToPromise(stream)

        const HOsZipCodes = HOs.map((p) => p.Pincode)

        const filteredPOs = POs.filter((p) => {
          return !HOsZipCodes.includes(p.Pincode)
        })

        const res = [...HOs, ...filteredPOs].reduce((acc, b) => {
          if (b.Delivery === 'Non Delivery') return acc

          const lat = b.Latitude == 'NA' ? 0 : b.Latitude
          const lng = b.Longitude == 'NA' ? 0 : b.Longitude

          // if (Number(lat) > 90 || Number(lng) > 180) return acc

          acc.push({
            area: b.OfficeName.replace('SO', '')
              .replace('S.O', '')
              .replace('HO', '')
              .replace('H.O', '')
              .trim(),
            district: b.District,
            state: b.StateName,
            zipCode: b.Pincode,
            location: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            isDeliverable: false
          })

          return acc
        }, [])

        await db.collection('zip-codes').insertMany(res)
        // await db.collection('zip-codes').createIndex({ zipCode: 1 })
        await db.collection('zip-codes').createIndex({ location: '2dsphere' })

        console.log('ended at: ', new Date())
      }

      await startImportZipCodes()
    } catch (error) {
      console.log(error)
      throw error
    }
  },

  async down(db, client) {
    await db.collection('zip-codes').dropIndex('zipCode_1')
    await db.collection('zip-codes').dropIndex('location_2dsphere')
    await db.collection('zip-codes').deleteMany({})
  }
}
