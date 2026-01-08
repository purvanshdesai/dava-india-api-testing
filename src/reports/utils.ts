import { app } from '../app'
import XLSX from 'xlsx'
import path from 'path'
import fs from 'fs'

export const saveRecordsInExcelFile = async (records: Array<any>, reportName: string) => {
  try {
    const uploadDir = path.join('public', 'reports')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const directoryPath = `public/reports/${reportName}.xlsx`

    const filePath: string = `${app.get('deployment')?.api_public_url}/${directoryPath.replace('public/', '')}`

    const worksheet = XLSX.utils.json_to_sheet(records)

    // Get the keys from the first record
    const headers = Object.keys(records[0] || {})

    // Convert headers to uppercase
    headers.forEach((key, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index }) // Row 0 (header), column index
      if (!worksheet[cellAddress]) return
      worksheet[cellAddress].v = key.toUpperCase()
    })

    // Create workbook and append
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, reportName)

    // Write file
    XLSX.writeFile(workbook, directoryPath)

    console.log(`Excel file saved as: ${filePath}`)

    return filePath
  } catch (e) {
    console.log('Error while saving Excel file', e)
  }
}
