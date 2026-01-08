import Joi from 'joi';

// Helper function to validate ObjectId format (24-character alphanumeric)
const policyIdValidation = Joi.string().alphanum().length(24).required()
.messages({
  'string.base': `"policyId" should be a valid string`,
  'string.alphanum': `"policyId" should contain only alphanumeric characters`,
  'string.length': `"policyId" must be exactly 24 characters long`,
  'any.required': `"policyId" is a required field`
});;

// Helper function for an array of policy IDs
export const policyIdArrayValidation = Joi.array().items(policyIdValidation).min(1).required()
  .messages({
    'array.base': `"policyIds" should be an array`,
    'array.min': `"policyIds" must contain at least one valid policy ID`,
    'array.includesRequiredUnknowns': `"policyIds" should contain valid 24-character alphanumeric IDs`
  });

// Helper function to validate storeId (same as policyId structure)
const storeIdValidation = Joi.string().alphanum().length(24).required()
.messages({
  'string.base': `"storeId" should be a valid string`,
  'string.alphanum': `"storeId" should contain only alphanumeric characters`,
  'string.length': `"storeId" must be exactly 24 characters long`,
  'any.required': `"storeId" is a required field`
});

// Helper function to validate latitude and longitude
const coordinatesValidation = Joi.object({
  lat: Joi.number().min(-90).max(90).required()
    .messages({
      'number.base': `"lat" should be a number`,
      'number.min': `"lat" should be between -90 and 90`,
      'number.max': `"lat" should be between -90 and 90`,
      'any.required': `"lat" is a required field`
    }),
  lon: Joi.number().min(-180).max(180).required()
    .messages({
      'number.base': `"lon" should be a number`,
      'number.min': `"lon" should be between -180 and 180`,
      'number.max': `"lon" should be between -180 and 180`,
      'any.required': `"lon" is a required field`
    })
});

// Helper function to validate zip codes (6-digit strings)
const zipCodeValidation = Joi.string().length(6).required();

// Helper function to validate zipCodes in an array
const zipCodeArrayValidation = Joi.array().items(zipCodeValidation).optional()
.messages({
  'array.base': `"zipCodes" should be an array`,
  'array.includesRequiredUnknowns': `"zipCodes" should contain valid zip codes`,
  'any.required': `"zipCodes" is a required field`
})

// Schema to validate store with delivery policy data
export const deliveryPolicySchema = Joi.object({
  policyId: policyIdValidation,
  zipCodes: zipCodeArrayValidation.optional()
});

// Schema to validate store data
export const storeSchema = Joi.object({
  storeId: storeIdValidation,
  coordinates: coordinatesValidation.optional(),  // Use object format for coordinates
  zipCodes: zipCodeArrayValidation.optional()
});

// Schema to validate objects containing policyIds and zipCodes
export const policyZipArraySchema = Joi.object({
  policyIds: policyIdArrayValidation,
  zipCodes: zipCodeArrayValidation
});
