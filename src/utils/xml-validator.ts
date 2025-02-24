import {generateXML, yourXSDSchema} from './xml-generator';
import { z } from 'zod';
import * as libxmljs from 'libxmljs2';

// Zod schema for data validation before XML generation
export const LCDataSchema = z.object({
  LCAF_ID: z.number().int().positive(),
  LC_ID: z.string().regex(/^\d{12}$/), // Exactly 12 digits
  ADSCODE: z.string().regex(/^\d{8}$/), // Exactly 8 digits
  LC_YEAR: z.string().regex(/^\d{2}$/), // Exactly 2 digits
  LC_NATURE: z.string().regex(/^\d{2}$/), // Exactly 2 digits
  LC_SERIAL: z.string().regex(/^\d{4}$/), // Exactly 4 digits
  LC_DATE: z.string().regex(/^\d{2}-[A-Z]{3}-\d{4}$/), // DD-MMM-YYYY format
  CURRENCY: z.string().regex(/^\d{3}$/), // Exactly 3 digits
  LC_AMOUNT: z.number().positive(),
  LC_EXPIRY_DATE: z.string().regex(/^\d{2}-[A-Z]{3}-\d{4}$/), // DD-MMM-YYYY format
  LC_EXPIRY_PLACE: z.string(),
  TRANSHIPMENT_YN: z.enum(['Y', 'N']),
  PARTIAL_YN: z.enum(['Y', 'N']),
  COUNTRY: z.string().regex(/^\d{4}$/), // Exactly 4 digits
  DEST_COUNTRY: z.string().regex(/^\d{4}$/), // Exactly 4 digits
  BANK_REFNO: z.string().optional(),
  LOAD_ID: z.number().int().positive(),
  'Entry Date': z.string().regex(/^\d{2}-[A-Z]{3}-\d{4}$/), // DD-MMM-YYYY format
  'Final Y': z.object({
    N: z.enum(['Y', 'N'])
  })
});

// Type definition for validation result
interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: string[];
}

// Type definition for XML validation result
interface XMLValidationResult {
  isValid: boolean;
  errors: string[];
}

export class XMLDataValidator {
  static validateLCData(data: unknown): ValidationResult<z.infer<typeof LCDataSchema>> {
    try {
      // First validate data structure and types
      const validatedData = LCDataSchema.parse(data);
      
      // Additional business logic validation
      this.validateBusinessRules(validatedData);
      
      return {
        isValid: true,
        data: validatedData
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(e => e.message)
        };
      }
      return {
        isValid: false,
        errors: [(error as Error).message]
      };
    }
  }

  static validateBusinessRules(data: z.infer<typeof LCDataSchema>): void {
    // Validate dates are not in the past
    const lcDate = new Date(data.LC_DATE);
    const expiryDate = new Date(data.LC_EXPIRY_DATE);
    
    if (expiryDate <= lcDate) {
      throw new Error('Expiry date must be after LC date');
    }

    // Add more business rules as needed
    const validCurrencies = ['001', '098']; // USD and other valid currencies
    if (!validCurrencies.includes(data.CURRENCY)) {
      throw new Error('Invalid currency code');
    }
  }

  static async validateXMLAgainstXSD(xmlString: string): Promise<XMLValidationResult> {
    try {
      // Parse both XML and XSD documents
      const xmlDoc = libxmljs.parseXml(xmlString);
      const xsdDoc = libxmljs.parseXml(yourXSDSchema);

      // Validate XML against XSD schema
      const isValid = xmlDoc.validate(xsdDoc);

      if (!isValid) {
        // Get validation errors
        const errors = xmlDoc.validationErrors;
        return {
          isValid: false,
          errors: errors.map(error => `${error.message} at line ${error.line}`)
        };
      }

      return {
        isValid: true,
        errors: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [(error as Error).message]
      };
    }
  }
}

// Example usage in your Next.js API route
export async function validateAndGenerateXML(llmResponse: unknown): Promise<string> {
  // Ensure this code runs only on the server side
  if (typeof window !== 'undefined') {
    throw new Error('validateAndGenerateXML should only be called on the server side.');
  }

  // Step 1: Parse and validate the data structure
  const validationResult = XMLDataValidator.validateLCData(llmResponse);
  
  if (!validationResult.isValid || !validationResult.data) {
    throw new Error(`Data validation failed: ${validationResult.errors?.join(', ')}`);
  }

  // Step 2: Generate XML from validated data
  const xml = generateXML(validationResult.data);

  // Step 3: Validate generated XML against XSD
  const xsdValidation = await XMLDataValidator.validateXMLAgainstXSD(
    xml
  );

  if (!xsdValidation.isValid) {
    throw new Error(`XML validation failed: ${xsdValidation.errors.join(', ')}`);
  }

  return xml;
}