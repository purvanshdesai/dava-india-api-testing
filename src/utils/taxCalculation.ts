export const calculateTaxes = (price: number, taxes: any[]) => {
  // // Calculate the base price before tax
  // const totalRate = taxes.reduce((sum, tax) => sum + parseFloat(tax.rate) / 100, 0)
  // const basePrice = price / (1 + totalRate)

  // console.log(totalRate, price, basePrice)

  // // Calculate each tax amount based on the base price
  // return taxes.map((tax) => ({
  //   name: tax.name,
  //   rate: tax.rate,
  //   amount: +((basePrice * parseFloat(tax.rate)) / 100).toFixed(2)
  // }))

  return taxes.map((tax) => ({
    name: tax.name,
    rate: tax.rate,
    amount: +((price * parseFloat(tax.rate)) / 100).toFixed(2) // Apply tax on original price
  }))
}

export const getProductTaxDetails = (product: any) => {
  // Initialize GST details
  let taxDetails: any = {
    totalRate: 0,
    rateType: '',
    totalAmount: 0,
    components: []
  }

  const taxableAmount = product?.finalPrice * (product?.quantity ?? 1) - (product?.discountedAmount ?? 0)
  const taxes: Array<any> = product?.taxes ?? []

  taxes?.forEach((tax) => {
    if (tax.type.toLowerCase() === 'gst') {
      // Update total rate and rate type
      taxDetails.totalRate += parseFloat(tax.rate)
      taxDetails.rateType = tax.rateType

      // Corrected tax calculation (apply tax directly)
      const price = +((taxableAmount * parseFloat(tax.rate)) / 100).toFixed(2)

      // Calculate total tax amount for GST
      taxDetails.totalAmount += Number(price)

      const valuePerPart = Number(price) / parseFloat(tax.rate)

      // Calculate component amounts
      tax?.components?.forEach((component: any) => {
        const componentAmount = +(parseFloat(component.rate) * valuePerPart).toFixed(2)

        taxDetails.components.push({
          name: component.name,
          rate: component.rate,
          rateType: component.rateType,
          totalAmount: Number(componentAmount)
        })
      })
    }
  })

  return taxDetails
}
