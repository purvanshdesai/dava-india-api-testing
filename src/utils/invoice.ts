import moment from 'moment'

const complaints = (patientComplaints: any[]): any => {
  let data: any[] = []

  for (const patientComplaint of patientComplaints) {
    data.push({
      text: patientComplaint?.name,
      style: 'complaintTitle'
    })
    data.push({
      text: patientComplaint?.description || '',
      style: 'complaintDesc'
    })
  }
  return data
}
const diagnosis = (patientDiagnosis: any[]) => {
  let data: any[] = []

  for (const patientComplaint of patientDiagnosis) {
    data.push({
      text: patientComplaint?.name,
      style: 'complaintTitle'
    })
    data.push({
      text: patientComplaint?.description || '',
      style: 'complaintDesc'
    })
  }
  return data
}

const medicineList = (medicines: any[]) => {
  let data: any[] = []

  for (const [index, medicine] of medicines?.entries()) {
    data.push({
      style: 'medicineName',
      text: `${index + 1} ${medicine?.name}`
    })
    data.push({
      text: medicine?.composition,
      style: 'complaintDesc'
    })
    data.push({
      style: 'medicinceInstruction',
      text: medicine?.description
    })
  }
  return data
}

const doctorInfo = (pdfData: any) => {
  const docInfo: any = {
    columns: [
      [{ image: 'logo', width: 120, height: 40, marginBottom: 40 }],
      [
        {
          text: pdfData?.doc?.extraAttr?.doctorName,
          fontSize: 15,
          color: '#d1ce2a',
          bold: true
        },
        {
          text: pdfData?.doc?.extraAttr?.qualification,
          style: 'docSubDetails'
        },
        {
          text: pdfData?.doc?.extraAttr?.hospitalName,
          style: 'docSubDetails'
        },
        {
          text: pdfData?.doc?.extraAttr?.hospitalAddress,
          fontSize: 8
        },
        {
          text: `KMC NO: ${pdfData?.doc?.extraAttr?.regNo}`,
          fontSize: 8
        },
        {
          text: '',
          fontSize: 8
        },
        {
          text: 'WhatsApp: ' + pdfData?.doc?.extraAttr?.doctorWhatsappNumber,
          fontSize: 8
        },
        {
          text: 'Email: ' + pdfData?.doc?.email,
          fontSize: 8
        }
      ]
    ],
    columnGap: 70
  }

  return docInfo
}

export const docDefinition = (pdfData: any) => {
  console.log(pdfData)
  return {
    content: [
      doctorInfo(pdfData),
      {
        width: '60%',
        fontSize: 11,
        color: '#128a96',
        text: 'APPOINTMENT DETAILS'
      },
      {
        alignment: 'justify',
        columns: [
          [
            {
              text: `Patient/Customer Name:- ${pdfData?.patient?.name}`,
              style: 'userDetails',
              marginTop: 10
            },
            { text: `Contact:- ${pdfData?.patient?.mobileNo}`, style: 'userDetails' },
            { text: `Email:- ${pdfData?.patient?.email}`, style: 'userDetails' },
            { text: `Gender:- ${pdfData?.patient?.gender}`, style: 'userDetails' },
            { text: `Age:- ${pdfData?.patient?.age}`, style: 'userDetails' },
            { text: `APPT ID:- ${pdfData?.patient?.apptId}`, style: 'userDetails' }
          ],
          [
            {
              text: `Consult Date:- ${moment(pdfData?.consultingDate).format('DD/MM/YY')}`,
              style: 'userDetails'
            },
            { text: `Consult Type:- ${pdfData?.consultingType}`, style: 'userDetails' }
          ]
        ],
        columnGap: 100
      },
      // { image: 'rxIcon', width: 20, height: 20, marginTop: 7 },
      {
        text: 'Rx',
        style: 'medicationDetails'
      },
      {
        text: 'CHIEF COMPLAINTS',
        style: 'medicationDetails'
      },
      ...complaints(pdfData?.complaints),
      {
        text: 'VITALS',
        style: 'complaintTitle'
      },
      {
        text: `Weight:- ${pdfData?.vitals?.weight} kg | Height:- ${pdfData?.vitals?.height} cm | BP:- ${pdfData?.vitals?.bp} mmHg | Temperature:- ${pdfData?.vitals?.temperature} C`,
        style: 'complaintDesc'
      },

      {
        columns: [
          [{ image: 'docIcon', width: 20, height: 20, marginTop: 7 }],
          [
            {
              text: 'PROVISIONAL DIAGNOSIS',
              style: 'medicationDetails'
            }
          ]
        ],
        columnGap: -470
      },
      ...diagnosis(pdfData?.diagnosis),

      {
        columns: [
          [{ image: 'medicineIcon', width: 20, height: 20, marginTop: 7 }],
          [
            {
              text: 'MEDICATION PRESCRIBED',
              style: 'medicationDetails'
            }
          ]
        ],
        columnGap: -470
      },
      ...medicineList(pdfData?.medicines),
      {
        text: `Disclaimer: This prescription is issues based on your inputs during the teleconsultation, it is valid from the date of issue until the specific period/dosage of each medicine as advised.`,
        style: 'disclaimer'
      },
      {
        text: '',
        style: 'separator'
      },
      doctorInfo(pdfData)
    ],
    styles: {
      userDetails: {
        fontSize: 8
      },
      medicationDetails: {
        marginTop: 10,
        marginBottom: 2,
        fontSize: 12,
        color: '#128a96'
      },
      complaintTitle: {
        fontSize: 10,
        marginTop: 5
      },
      complaintDesc: {
        fontSize: 9,
        color: '#b2acac'
      },
      medicineName: {
        fontSize: 11,
        marginTop: 0,
        marginBottom: 8
      },
      medicineComposition: {
        fontSize: 9,
        marginBottom: 7,
        color: '#b2acac'
      },
      medicinceInstruction: {
        fontSize: 10,
        marginLeft: 8,
        marginTop: 5,
        marginBottom: 5,
        color: 'grey'
      },
      adviceItem: {
        fontSize: 10
      },
      adviceSubItem: {
        color: 'grey',
        marginLeft: 7,
        fontSize: 9
      },
      docSubDetails: {
        fontSize: 9,
        color: '#128a96'
      },
      disclaimer: {
        color: 'grey',
        marginTop: 50,
        fontSize: 9
      },
      separator: {
        marginTop: 100
      }
    },
    images: {
      logo: 'public/images/Davaindia.png',
      medicineIcon: 'public/images/medIcon.png',
      docIcon: 'public/images/doctor.png',
      rxIcon: 'public/images/rx.svg'
    }
  }
}
