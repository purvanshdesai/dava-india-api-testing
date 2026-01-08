import { parentPort, workerData } from 'worker_threads'
import ExcelJs from 'exceljs'
import fs from 'fs'
import csv from 'csv-parser'

const processExcelFile = async (filePath: string) => {
  const rows = []

  const workbook = new ExcelJs.stream.xlsx.WorkbookReader(filePath, {
    worksheets: 'emit', // Emit worksheets as they are parsed
    sharedStrings: 'cache', // Cache shared strings to reduce memory usage
    hyperlinks: 'ignore' // Ignore hyperlinks to improve performance
  })

  for await (const worksheet of workbook) {
    for await (const row of worksheet) {
      rows.push(row.values)
    }
  }

  return rows?.slice(1)
}

/**
 * Reads a CSV file and returns the parsed rows.
 * @param {string} filePath - Absolute path to the CSV file
 * @returns {Promise<Array<Object>>} - Array of rows
 */
function processCsvFile(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = []

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row)
      })
      .on('end', () => {
        resolve(results)
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

const processFile = async (filePath: string) => {
  try {
    let rows: any[] = []

    if (filePath.endsWith('.xlsx')) rows = await processExcelFile(filePath)
    else if (filePath.endsWith('.csv')) rows = await processCsvFile(filePath)

    parentPort?.postMessage({ rows })
  } catch (error) {
    parentPort?.postMessage({ error })
  }
}

// parentPort?.on('message', async (arrayBuffer: ArrayBuffer) => {
//   try {
//     // Convert ArrayBuffer to Node.js Buffer
//     const buffer = Buffer.from(arrayBuffer)

//     // Load the workbook using ExcelJS
//     const workbook = new ExcelJs.Workbook()
//     await workbook.xlsx.load(buffer)

//     const worksheet = workbook.worksheets[0] // First sheet

//     const rows: Record<string, any>[] = []

//     let headers: string[] = []

//     worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
//       const values = Array.isArray(row.values) ? row.values.slice(1) : [] // safely get values as array

//       if (rowNumber === 1) {
//         headers = values.map((cell) => (typeof cell === 'string' ? cell : String(cell ?? '')))
//       } else {
//         const rowData: Record<string, any> = {}
//         values.forEach((cell, idx) => {
//           const header = headers[idx]
//           if (header) {
//             rowData[header] = cell
//           }
//         })
//         rows.push(rowData)
//       }
//     })

//     parentPort?.postMessage(rows)
//   } catch (error: any) {
//     parentPort?.postMessage({ error: error.message })
//   }
// })

if (workerData?.filePath) processFile(workerData.filePath)
