import path from 'path'

const pdfMake = require('pdfmake')
import fs from 'fs'
import { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import { createDirectoryIfNotExists } from './utilities'
import { generateRandomString } from './index'
import { app } from '../app'

export interface OrderInvoiceParams {
  store: {
    name: string
    address: string
    phoneNo: string
    fssaiNo: string
    dlNo: string
    gstNo: string
    state: string
    pincode: string
  }
  customer: {
    name: string
    address: string
    invoiceNo: string
    invoiceDate: string
    orderId: string
    date: string
    qrLink: string
    paymentMethod: string
    transactionId: string
    transactionDate: string
  }
  orderItems: {
    index: number
    productName: string
    manufacturer: string
    bathNo: string
    expiryDate: string
    quantity: number
    mrp: number | string
    discountAmount: number | string
    taxableAmount: number | string
    hsn: string
    gstRate: number
    gstAmount: number | string
    totalAmount: number | string
    schedule: string
  }[]
  taxes: {
    gstPercentage: number
    taxableAmount: number
    cgst: number
    sgst: number
    igst: number
  }[]
  finalCalculations: {
    totalQuantity: number
    grossAmount: number
    shippingAndDeliveryCharges: number
    handlingCharge: number
    packingCharge: number
    platformFee: number
    discountAmount: number
    billAmount: number
    roundOff: number
    payableAmount: number
    amountInWords: string
  }
}

const davaindiaLogoPath = path.resolve(__dirname, '../../public/images/Davaindia.png')

const addUpperPart = (data: OrderInvoiceParams): Content => {
  const { store, customer } = data
  return {
    table: {
      widths: ['10%', '30%', '*', '*'],
      body: [
        [
          {
            image: davaindiaLogoPath,
            width: 50,
            rowSpan: 2,
            fontSize: 8,
            alignment: 'center',
            margin: [0, 50]
          },
          {
            stack: [
              {
                text: 'Registered office:',
                bold: true,
                margin: [0, 0, 0, 2]
              },
              {
                text: 'SHOP NO. G 44 AYAPPA IND, ZOTA HOUSE, BHEDWAD, CHORYASI, Surat, SURAT, Gujarat, India, 394220'
              },
              {
                text: 'CIN: U24110GJ2020PLC111827',
                margin: [0, 2, 0, 0]
              },
              {
                text: 'GST: 24AAHCD5973D1ZO'
              },
              {
                text: 'PAN: AAHCD5973D'
              },
              {
                text: 'Communication address:',
                bold: true,
                margin: [0, 5, 0, 2]
              },
              {
                text: 'Zota House, 2 & 3rd Floor,Navsari State\nHighway, Bhagwan Aiyappa Complex,Opp. GIDC, Udhna, Pandesara Ind. Estate, Surat, Gujarat - 394221'
              },
              {
                text: 'Customer Care:',
                bold: true,
                margin: [0, 5, 0, 0]
              },
              {
                text: `Mobile: +91 847 100 9009`
              },
              {
                text: `Email: care@davaindia.com`
              }
            ],
            rowSpan: 2,
            fontSize: 8
          },
          {
            stack: [
              {
                text: 'Sold By:',
                bold: true,
                margin: [0, 0, 0, 2]
              },
              {
                text: store.name,
                bold: true
              },
              {
                text: [{ text: 'Address: ', bold: true }, { text: store.address }]
              },
              {
                text: [{ text: 'Phone no: ', bold: true }, { text: store.phoneNo }]
              },
              {
                text: [{ text: 'FSSAI no: ', bold: true }, { text: store.fssaiNo }]
              },
              {
                text: [{ text: 'D.L No: ', bold: true }, { text: store.dlNo }]
              },
              {
                text: [{ text: 'GST No: ', bold: true }, { text: store.gstNo }]
              },
              {
                text: [{ text: 'State: ', bold: true }, { text: store.state }]
              },
              {
                text: [{ text: 'Pincode: ', bold: true }, { text: store.pincode }]
              },
              {
                text: [{ text: 'Doctor Name: ', bold: true }, { text: 'Dr. Chetan Angadi' }],
                margin: [0, 5, 0, 0]
              },
              {
                text: [{ text: 'KMC Reg. No: ', bold: true }, { text: '152082' }]
              }
            ],
            rowSpan: 2,
            fontSize: 8
          },
          {
            stack: [
              {
                text: 'Sold To:',
                bold: true,
                margin: [0, 0, 0, 2]
              },
              {
                text: [{ text: 'Customer Name: ', bold: true }, { text: customer.name }]
              },
              {
                text: [{ text: 'Customer Address: ', bold: true }, { text: customer.address }]
              },
              {
                text: [{ text: 'Invoice Number: ', bold: true }, { text: customer.invoiceNo }]
              },
              {
                text: [{ text: 'Invoice/Order Date: ', bold: true }, { text: customer.invoiceDate }]
              },
              {
                text: [{ text: 'Order ID: ', bold: true }, { text: customer.orderId }]
              }
            ],
            fontSize: 8
          }
        ],
        [
          {}, // Empty due to rowspan
          {}, // Empty due to rowspan
          {}, // Empty due to rowspan
          {
            stack: [
              { qr: customer.qrLink, alignment: 'center', fit: 75, margin: [0, 5, 0, 0] },
              { text: 'Get digital invoice', alignment: 'center', fontSize: 8, marginTop: 2, marginBottom: 2 }
            ]
          }
        ]
      ]
    },
    layout: {
      hLineWidth: function (i, node) {
        return 0.5 // Horizontal line width (top and bottom borders)
      },
      vLineWidth: function (i, node) {
        return 0.5 // Vertical line width (left and right borders)
      },
      hLineColor: function (i, node) {
        return '#000000' // Horizontal line color
      },
      vLineColor: function (i, node) {
        return '#000000' // Vertical line color
      }
    }
  }
}

const addMiddlePart = (data: OrderInvoiceParams): Content => {
  return {
    table: {
      headerRows: 1,
      widths: [12, 87, 58, 31, 20, 40, 30, 19, 25, 25, 27, 27, 25, 30],
      body: [
        // Header Row
        [
          { text: 'SR.', bold: true, alignment: 'center' },
          { text: 'PRODUCT', bold: true, alignment: 'center' },
          { text: 'MFR. NAME', bold: true, alignment: 'center' },
          { text: 'BATCH NO.', bold: true, alignment: 'center' },
          { text: 'EXP. DATE', bold: true, alignment: 'center' },
          { text: 'HSN', bold: true, alignment: 'center' },
          { text: 'SCH', bold: true, alignment: 'center' },
          { text: 'QTY', bold: true, alignment: 'center' },
          { text: 'MRP(₹)', bold: true, alignment: 'center' },
          { text: 'DISC AMT(₹)', bold: true, alignment: 'center' },
          { text: 'SALES RATE(₹)', bold: true, alignment: 'center' },
          { text: 'GST RATE(%)', bold: true, alignment: 'center' },
          { text: 'GST AMT(₹)', bold: true, alignment: 'center' },
          { text: 'TOTAL AMT(₹)', bold: true, alignment: 'center' }
        ],
        // Data Row
        ...data.orderItems.map((item) => [
          item.index,
          item.productName,
          item.manufacturer,
          item.bathNo,
          item.expiryDate,
          item.hsn,
          item.schedule,
          item.quantity,
          item.mrp,
          item.discountAmount,
          item.taxableAmount,
          item.gstRate,
          item.gstAmount,
          item.totalAmount
        ])
      ]
    },
    style: 'tableText',
    fontSize: 6,
    layout: {
      hLineWidth: function (i, node) {
        return 0.5 // Horizontal line width (top and bottom borders)
      },
      vLineWidth: function (i, node) {
        return 0.5 // Vertical line width (left and right borders)
      },
      hLineColor: function (i, node) {
        return '#000000' // Horizontal line color
      },
      vLineColor: function (i, node) {
        return '#000000' // Vertical line color
      }
    }
  }
}

const addLowerPart = (data: OrderInvoiceParams) => {
  const { finalCalculations, taxes } = data

  interface gstSlab {
    gstPercentage: number
    taxableAmount: number
    cgst: number
    sgst: number
    igst: number
  }
  const gstSlabs: { [key: string]: gstSlab } = taxes.reduce(
    (acc, curr) => {
      acc[curr.gstPercentage.toString()] = {
        ...curr
      }
      return acc
    },
    {} as { [key: string]: gstSlab }
  )

  return {
    table: {
      headerRows: 1,
      widths: ['auto', 'auto', 'auto', 'auto', 'auto', 70, 25, '*', '*', '*'],
      body: [
        // Header Row
        [
          { text: 'GST %', bold: true },
          { text: 'GST Amt', bold: true },
          { text: 'CGST', bold: true },
          { text: 'SGST', bold: true },
          { text: 'IGST', bold: true },
          { text: 'Total Quantity' },
          { text: finalCalculations.totalQuantity },
          {
            rowSpan: 7,
            stack: [
              {
                text: 'All disputes related to this order are subject to the jurisdiction of courts at Surat, Gujarat',
                margin: [0, 0, 0, 5]
              },
              {}
            ],
            margin: [0, 5, 0, 5]
          },
          {
            rowSpan: 7,
            stack: [
              {
                text: 'Davaindia Health Mart Limited',
                margin: [0, 0, 0, 5],
                alignment: 'center'
              },
              { text: 'Pharmacist Signature', margin: [0, 72, 0, 0], alignment: 'center' } // Pushes top element away
            ],
            margin: [0, 5, 0, 5]
          },
          {
            rowSpan: 7,
            stack: [
              {
                qr: `${app.get('deployment').api_public_url}/getapp`,
                margin: [0, 10, 0, 2],
                alignment: 'center',
                fit: 74
              },
              {
                text: 'Get the app',
                alignment: 'center'
              },
              { image: davaindiaLogoPath, width: 90, margin: [0, 5, 0, 0], alignment: 'center' } // Pushes top element away
            ]
          }
        ],
        // Row 1
        [
          '0',
          gstSlabs[0].taxableAmount,
          gstSlabs[0].cgst,
          gstSlabs[0].sgst,
          gstSlabs[0].igst,
          'Gross Amount',
          `₹${finalCalculations.grossAmount}`
        ],
        // Row 2
        [
          '5',
          gstSlabs[5].taxableAmount,
          gstSlabs[5].cgst,
          gstSlabs[5].sgst,
          gstSlabs[5].igst,
          'Discount Amount',
          `₹${finalCalculations.discountAmount}`
        ],
        // Row 3
        [
          '12',
          gstSlabs[12].taxableAmount,
          gstSlabs[12].cgst,
          gstSlabs[12].sgst,
          gstSlabs[12].igst,
          'Bill Amount',
          `₹${finalCalculations.billAmount}`
        ],
        // Row 4
        [
          '18',
          gstSlabs[18].taxableAmount,
          gstSlabs[18].cgst,
          gstSlabs[18].sgst,
          gstSlabs[18].igst,
          'Round Off',
          `₹${finalCalculations.roundOff}`
        ],
        // Row 5
        ['28', gstSlabs[28].taxableAmount, gstSlabs[28].cgst, gstSlabs[28].sgst, gstSlabs[28].igst, {}, {}],
        // Row 6
        [
          { text: '*All values in (₹)', colSpan: 5, alignment: 'center' },
          {},
          {},
          {},
          {},
          'Payable Amount',
          `₹${finalCalculations.payableAmount}`
        ]
      ]
    },
    style: 'tableText',
    fontSize: 8,
    layout: {
      hLineWidth: function () {
        return 0.5
      },
      vLineWidth: function () {
        return 0.5
      },
      hLineColor: function () {
        return '#000'
      },
      vLineColor: function () {
        return '#000'
      }
    }
  }
}

const createDocDefinition = (data: OrderInvoiceParams): TDocumentDefinitions => {
  return {
    pageSize: 'A4', // Set page size to A4
    pageMargins: [10, 10, 10, 10], // Reduce margins to maximize space
    content: [
      {
        text: 'Tax Invoice/ Bill of supply (Original to Recipient)',
        alignment: 'center',
        bold: true,
        fontSize: 8,
        margin: [0, 0, 0, 10]
      },
      // First Table
      addUpperPart(data),
      // Second Table
      addMiddlePart(data),
      // Third Table (Nested Tables)
      addLowerPart(data),
      {
        text: [
          {
            text: [
              { text: 'Amount in words: ', bold: true },
              { text: 'Rupees: ' + data.finalCalculations.amountInWords }
            ],
            fontSize: 8
          },
          {
            text: [{ text: '    Payment Method: ', bold: true }, { text: data.customer.paymentMethod }],
            fontSize: 8
          },
          {
            text: [{ text: '    Transaction Id: ', bold: true }, { text: data.customer.transactionId }],
            fontSize: 8
          },
          {
            text: [
              { text: '    Transaction date and time: ', bold: true },
              { text: data.customer.transactionDate }
            ],
            fontSize: 8
          }
        ],

        marginTop: 8,
        fontSize: 8
      },
      { text: 'E.&.O.E.', fontSize: 8 },
      {
        text: 'As per amendments in the GST Act, 2017, notified by the Government of India, the MRP on products may slightly vary from the billed amount. You are charged as per current GST rates, effective 22nd September 2025.',
        alignment: 'left',
        fontSize: 8,
        marginTop: 20
      },
      {
        text: 'Invoice issued under section 31 of the CGST Act, 2017 read with the rule 46 of CGST Rule 2017.',
        alignment: 'center',
        fontSize: 8,
        marginRight: 8,
        marginTop: 200
      },
      {
        text: 'Computer generated invoice, no signature required.',
        alignment: 'center',
        fontSize: 8
      }
    ],

    styles: {
      header: {
        fontSize: 8,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      tableHeader: {
        bold: true,
        fontSize: 8,
        color: 'white',
        fillColor: '#4CAF50'
      },
      tableCell: {
        margin: [1, 1, 1, 1],
        fontSize: 8
      },
      tableText: {
        fontSize: 8
      }
    }
  }
}

export const generateOrderInvoice = async (data: OrderInvoiceParams): Promise<string> => {
  const TEMP_DIRECTORY = path.resolve(__dirname, '../../temp')
  await createDirectoryIfNotExists(TEMP_DIRECTORY)

  const FILE_NAME = `invoice_${data.customer.invoiceNo}-${generateRandomString(6)}.pdf`
  const FILE_PATH = `${TEMP_DIRECTORY}/${FILE_NAME}`

  const printer = new pdfMake({
    Roboto: {
      normal: path.resolve(__dirname, '../../fonts/Montserrat-Regular.ttf'),
      bold: path.resolve(__dirname, '../../fonts/Montserrat-Bold.ttf'),
      italics: path.resolve(__dirname, '../../fonts/Montserrat-Italic.ttf'),
      bolditalics: path.resolve(__dirname, '../../fonts/Montserrat-Bold.ttf')
    }
  })

  const docDefinition = createDocDefinition(data)
  const pdfDoc = printer.createPdfKitDocument(docDefinition)
  const writeStream = fs.createWriteStream(FILE_PATH)

  pdfDoc.pipe(writeStream)
  pdfDoc.end()

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => {
      // console.log(`PDF successfully generated at ${FILE_PATH}`)
      resolve(FILE_PATH) // Resolve the promise when the file is written
    })

    writeStream.on('error', (error) => {
      console.error('Error writing PDF:', error)
      reject(error) // Reject the promise if an error occurs
    })
  })
}
