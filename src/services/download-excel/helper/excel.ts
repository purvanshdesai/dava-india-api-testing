var excel = require('excel4node')
const moment = require('moment')

export const saveExcelFile = async function (options: any) {
  try {
    const { data, columns, type, header, fileName, sheetIndex } = options
    const workbook = new excel.Workbook()
    workbook.setSelectedTab(sheetIndex)
    let worksheet = workbook.addWorksheet(type)

    let cellRow = 1,
      cellColumn = 1

    //Styles
    var reportHeading = workbook.createStyle({
      font: {
        bold: true
      },
      alignment: {
        wrapText: true,
        horizontal: 'center',
        vertical: 'center'
      }
    })
    const border = {
      border: {
        left: { style: 'thin' },
        right: { style: 'thin' },
        top: { style: 'thin' },
        bottom: { style: 'thin' }
      }
    }
    //Header
    worksheet.row(cellRow).setHeight(25)
    worksheet
      .cell(cellRow, cellColumn, cellRow++, columns.length, true)
      .string(header.title.name)
      .style({ ...reportHeading, font: { bold: true, color: 'Orange' } })

    worksheet.row(cellRow).setHeight(25)
    worksheet
      .cell(cellRow, cellColumn, cellRow++, columns.length, true)
      .string(header.subTitle.name)
      .style(reportHeading)

    cellRow++
    //Column Headings
    //const font = { ...reportHeading.font, color: 'Blue' };
    const columnHeading = {
      ...reportHeading,
      fill: {
        type: 'pattern',
        patternType: 'solid',
        bgColor: '#FFE900',
        fgColor: '#FFE900'
      },
      ...border
    }
    for (let index = 0; index < columns.length; index++) {
      const column = columns[index]
      worksheet.row(cellRow).setHeight(20)
      worksheet.cell(cellRow, cellColumn++).string(column.name).style(columnHeading)
      if (column.width) {
        worksheet.column(index + 1).setWidth(column.width)
      }
    }

    //Column Processing
    for (let row = 0; row < data.length; row++) {
      const content = data[row]
      cellRow++
      cellColumn = 1
      for (let col = 0; col < columns.length; col++) {
        let value = content[columns[col].field]
        switch (columns[col].type) {
          case 'number':
            worksheet.cell(cellRow, cellColumn++).number(value).style(border)
            break
          case 'date':
            worksheet.cell(cellRow, cellColumn++).string(moment(value).format('DD-MM-YYYY')).style(border)
            break
          default:
            worksheet.cell(cellRow, cellColumn++).string(value).style(border)
            break
        }
      }
    }

    workbook.write(fileName, function (err: any, stats: any) {
      if (err) {
        console.error(err)
      }
    })

    return new Promise((resolve, reject) => {
      workbook.write(fileName, function (err: any, stats: any) {
        if (err) {
          reject(false)
        } else {
          resolve(true)
        }
      })
    })
  } catch (error) {
    return error
  }
}
