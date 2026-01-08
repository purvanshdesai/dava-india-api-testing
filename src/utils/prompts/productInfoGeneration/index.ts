export const prompts = {
  aboutProduct: ({
    productComposition,
    productDescription,
    productName
  }: {
    productName: string
    productDescription: string
    productComposition: string
  }) => [
    {
      role: 'system',
      content:
        'You are an assistant that generates structured information for medical products based on provided details. Respond with JSON in a parseable format, without any escape characters or extra formatting.'
    },
    {
      role: 'user',
      content: `Generate product information for the following medical product. Respond only with JSON in a format that can be parsed directly by JavaScript\'s JSON.parse() method. Use the following structure to generate information:\n\n{\n  "info": string(),\n "drugInteraction": string(),\n "suitableFor": array(string()),\n  "dosage": array(string()),\n  "cautions": array(string()),\n  "benefits": array(string()),\n  "sideEffects": array(string()),\n  "productInfo": string(),\n  "directionsForUse": string()\n}\n\n \n\nProduct name: ${productName}\nProduct description: ${productDescription}\nProduct composition: ${productComposition}\n\nThe response should:\n- Generated data for all fields based provided Product name, Product description, Product composition .\n \n- Be in pure JSON format without additional escape characters.\n \n- Contain only the JSON structure with no additional text or formatting.`
    }
  ]
}
