import fs from 'fs'
import path from 'path'

// Ensure logs directory exists
const logDir = path.join(__dirname, 'shipRocketLogs')
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

// Define the log file path
const logFilePath = path.join(logDir, 'shipRocket_logs.json')

// Function to write logs to file
export const writeLogToFile = (data: any) => {
  console.log('Logging to file', data)
  let logs = []
  try {
    if (fs.existsSync(logFilePath)) {
      const existingData: any = fs.readFileSync(logFilePath)
      logs = JSON.parse(existingData)
    }
  } catch (err) {
    console.error('Error reading logs:', err)
  }

  logs.push(data)

  fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2))
}
