// For more information about this file see https://dove.feathersjs.com/guides/cli/logging.html
import { createLogger, format, transports } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

// Configure the Winston logger. For the complete documentation see https://github.com/winstonjs/winston
export const logger = createLogger({
  // To see more detailed errors, change this to 'debug'
  level: 'info',
  format: format.combine(format.splat(), format.simple()),
  transports: [new transports.Console()]
})

// Common format for log output
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Add timestamp
  format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`) // Log format
)

// Separate logger for messages saved in dynamic files
export const requestsLogger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // new transports.Console(),
    new DailyRotateFile({
      // dirname: path.join(__dirname, 'logs'), // Directory for logs
      filename: 'logs/requests_%DATE%.log', // File name format
      datePattern: 'YYYY_MM_DD_HH', // Date format in the file name
      zippedArchive: false, // Do not compress old log files
      maxFiles: '30d' // Keep logs for the last 7 days
    })
  ]
})

// Separate logger for messages saved in dynamic files
export const installReferrerTrackerLogger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // new transports.Console(),
    new DailyRotateFile({
      // dirname: path.join(__dirname, 'logs'), // Directory for logs
      filename: 'logs/referrer-%DATE%.log', // File name format
      datePattern: 'YYYY_MM_DD_HH', // Date format in the file name
      zippedArchive: false, // Do not compress old log files
      maxFiles: '30d' // Keep logs for the last 7 days
    })
  ]
})

// Separate logger for messages saved in dynamic files
export const paymentTrackerLogger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // new transports.Console(),
    new DailyRotateFile({
      // dirname: path.join(__dirname, 'logs'), // Directory for logs
      filename: 'logs/payment-%DATE%.log', // File name format
      datePattern: 'YYYY_MM_DD_HH', // Date format in the file name
      zippedArchive: false, // Do not compress old log files
      maxFiles: '30d' // Keep logs for the last 7 days
    })
  ]
})
