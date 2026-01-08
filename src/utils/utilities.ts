import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import axios from 'axios'
import { s3 } from './s3'
import { S3_CONST } from '../constants/general'
import { s3DirectoryName } from './StoreageService'

export function maskString(input: string): string {
  if (input.length <= 4) {
    return input // No masking needed if the string has 4 or fewer characters
  }

  const visiblePart = input.slice(-4) // Last 4 characters
  const maskedPart = '*'.repeat(input.length - 4) // Asterisks for the rest
  return maskedPart + visiblePart // Combine masked and visible parts
}

export function maskEmail(email: string): string {
  try {
    const [localPart, domain] = email.split('@')

    if (!localPart || !domain) {
      throw new Error('Invalid email address')
    }

    // Mask the local part (before '@')
    const visibleLocal = localPart.slice(0, 1) // Keep the first 3 characters visible
    const maskedLocal = visibleLocal + '*'.repeat(localPart.length - 1)

    // Mask the domain part (after '@')
    const domainParts = domain.split('.')
    if (domainParts.length < 2) {
      throw new Error('Invalid domain in email')
    }

    const domainFirstPart = domainParts[0] // Part before the first dot
    const domainLastPart = domainParts.slice(-1).join('') // TLD or last part
    const visibleDomainFirst = domainFirstPart.slice(0, 2) // First 2 characters of the domain
    const maskedDomain = `${visibleDomainFirst}${'*'.repeat(domainFirstPart.length - 2)}.${domainLastPart}`

    // Combine masked local part and masked domain part
    return `${maskedLocal}@${maskedDomain}`
  } catch (e) {
    console.log('Error masking email ', e)
    return email
  }
}

export function getRandomElementFromArray(arr: any[]) {
  if (!arr?.length) return
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function createDirectoryIfNotExists(dirPath: string): Promise<void> {
  try {
    // Check if the directory exists
    await fs.access(dirPath)
    // console.log(`Directory already exists: ${dirPath}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Directory does not exist, create it
      await fs.mkdir(dirPath, { recursive: true })
      console.log(`Directory created: ${dirPath}`)
    } else {
      // Handle other errors
      console.error(`Error checking directory: ${error}`)
      throw error
    }
  }
}

export const uploadFileToS3 = async ({
  filePath,
  fileKey,
  keyPrefix,
  mimeType
}: {
  filePath: string
  fileKey?: string
  keyPrefix?: string
  mimeType?: string
}): Promise<any> => {
  try {
    // Ensure the file exists
    if (!fsSync.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }

    // Read file and determine content type
    const fileContent = fsSync.readFileSync(filePath)
    const contentType = mimeType || 'application/octet-stream'

    // Derive the file name from the path
    const fileName = fileKey || path.basename(filePath)
    const s3Key = path.join(keyPrefix || s3DirectoryName, fileName).replace(/\\/g, '/')

    // Upload to S3
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: S3_CONST.BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
      ...(process.env.NODE_ENV !== 'production' && { ACL: 'public-read' })
    }

    const cloudFrontURL = `https://${S3_CONST.cloudFrontUrl}/${s3Key}`
    const response = await s3.upload(uploadParams).promise()
    return { Location: cloudFrontURL }
  } catch (error) {
    console.error('Error uploading file to S3:', error)
    throw error
  }
}

export const downloadAndUploadLabelToS3 = async ({
  labelUrl,
  waybill,
  keyPrefix = 'delhivery-labels'
}: {
  labelUrl: string
  waybill: string
  keyPrefix?: string
}): Promise<string> => {
  try {
    if (!labelUrl) {
      throw new Error('Label URL is required')
    }

    // Download the label file from Delhivery
    const response = await axios.get(labelUrl, {
      responseType: 'arraybuffer',
      timeout: 30000 // 30 seconds timeout
    })

    if (!response.data) {
      throw new Error('Failed to download label from Delhivery')
    }

    // Generate a unique filename for the label
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `delhivery-label-${waybill}-${timestamp}.pdf`
    const s3Key = path.join(keyPrefix, fileName).replace(/\\/g, '/')

    // Upload to S3
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: S3_CONST.BUCKET_NAME,
      Key: s3Key,
      Body: Buffer.from(response.data),
      ContentType: 'application/pdf',
      ...(process.env.NODE_ENV !== 'production' && { ACL: 'public-read' })
    }

    await s3.upload(uploadParams).promise()

    // Return the CloudFront URL
    const cloudFrontURL = `https://${S3_CONST.cloudFrontUrl}/${s3Key}`
    return cloudFrontURL
  } catch (error) {
    console.error('Error downloading and uploading label to S3:', error)
    throw error
  }
}
