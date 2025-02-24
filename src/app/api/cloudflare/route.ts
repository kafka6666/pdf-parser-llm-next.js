// app/api/cloudflare/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: true,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    const accountId = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.NEXT_PUBLIC_CLOUDFLARE_API_TOKEN;

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct-fp8`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a precise data extraction assistant that converts text into XML format. Follow these strict rules:

              1. ONLY extract information that is explicitly present in the input text
              2. For any field where information is not found in the text:
                 - Use "0" for numeric fields (LCAF_ID, LC_AMOUNT, LOAD_ID)
                 - Use "N/A" for string fields
                 - Use "N" for Y/N fields (TRANSHIPMENT_YN, PARTIAL_YN)
              3. DO NOT make assumptions or generate data that isn't in the source text
              4. If a date is found, maintain its exact format as present in the text
              5. For currency amounts, extract only explicit numeric values
              6. Format rules:
                 - LCAF_ID must be a valid integer
                 - LC_AMOUNT must be a decimal number
                 - LOAD_ID must be a valid integer
                 - Y/N fields must only contain "Y" or "N"

              XML Schema Requirements:
              <root>
                <row>
                  - Each record should be wrapped in a <row> tag within a <root> tag
                  - Required fields: LCAF_ID (integer), LC_ID (string), ADSCODE (string), LC_YEAR (string), LC_NATURE (string), 
                    LC_SERIAL (string), LC_DATE (string), CURRENCY (string), LC_AMOUNT (decimal), LC_EXPIRY_DATE (string),
                    LC_EXPIRY_PLACE (string), TRANSHIPMENT_YN (Y/N), PARTIAL_YN (Y/N), COUNTRY (string), DEST_COUNTRY (string),
                    BANK_REFNO (string), LOAD_ID (integer), Entry Date (string), Final Y/N (Y/N)
                  - Extract all possible information from the text and format it according to the schema
                  - The <LC_DATE> and <Entry_Date> tags always need to have the Date of Issue found in the text provided below in the format YYYY-MM-DD
                  - The <Final Y> tag always needs to have a children tag <N>Y</N>, but don't repeat the <N> tag
                  - Ensure each and every <row> tag has a closing </row> tag
                  - If a value is not found in the text, use appropriate default values (0 for numbers, empty string for text)
                  - Ensure the XML is well-formed and validates against the schema
                </row>
              </root>

              If you're unsure about any value, use the default values mentioned above instead of guessing.`,
            },
            {
              role: 'user',
              content: `Extract ONLY the factual information present in this text and convert to XML. Do not add any information that is not explicitly stated:\n\n${text}`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Cloudflare API Error:', errorData);
          errorMessage = errorData.errors?.[0]?.message || errorMessage;
        } else {
          const textError = await response.text();
          console.error('Cloudflare API Error (non-JSON):', textError);
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();

    // Get the raw response and clean it up
    let xmlResponse = result.result.response.trim();
    
    // Remove any text before the first XML declaration or root tag
    xmlResponse = xmlResponse.replace(/^[\s\S]*?(?=(<\?xml|<root))/m, '');
    
    // If there are multiple XML declarations, keep only the first one
    const xmlDeclarations = xmlResponse.match(/<\?xml[^>]*\?>/g) || [];
    if (xmlDeclarations.length > 1) {
      xmlResponse = xmlResponse.replace(/<\?xml[^>]*\?>/g, '');
      xmlResponse = xmlDeclarations[0] + '\n' + xmlResponse;
    } else if (xmlDeclarations.length === 0) {
      xmlResponse = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlResponse;
    }

    // Clean up markdown code blocks
    // xmlResponse = xmlResponse.replace(/```xml\n?/g, '');
    // xmlResponse = xmlResponse.replace(/```\n?/g, '');
    // xmlResponse = xmlResponse.trim();

    // Fix LOAD_ID tag to remove duplicates and ensure proper format
    if (xmlResponse.includes('<LOAD')) {
      // First, clean up any malformed LOAD_ID tags
      xmlResponse = xmlResponse.replace(/<LOAD_ID>[^<]*<\/LOAD_ID>[^<]*<\/LOAD_ID>/, '<LOAD_ID>0</LOAD_ID>');
      // Then ensure the tag exists with proper format
      if (!xmlResponse.includes('</LOAD_ID>')) {
        xmlResponse = xmlResponse.replace(/<LOAD[^>]*>/, '<LOAD_ID>0</LOAD_ID>');
      }
    }
    
    // Handle Final Y tag with proper closing
    if (xmlResponse.includes('<Final Y>') && !xmlResponse.includes('</Final Y>')) {
      xmlResponse = xmlResponse.replace(/<Final Y>[^<]*<\/Final>|<Final Y>[^<]*(?=<|$)/, '<Final Y><N>Y</N></Final Y>');
    } else if (!xmlResponse.includes('<Final Y>')) {
      xmlResponse = xmlResponse.replace(/(<\/row>)/, '<Final Y><N>Y</N></Final Y>$1');
    }

    // Ensure Entry_Date tag is properly closed with today's date if incomplete
    if (xmlResponse.includes('<Entry_Date>') && !xmlResponse.includes('</Entry_Date>')) {
      const today = new Date().toISOString().split('T')[0];  // Format: YYYY-MM-DD
      xmlResponse = xmlResponse.replace(/<Entry_Date>[^<]*/, `<Entry_Date>${today}`);
      if (!xmlResponse.includes('</Entry_Date>')) {
        xmlResponse = xmlResponse.replace(/(<Entry_Date>[^<]*?)(?=<|$)/, `$1</Entry_Date>`);
      }
    }

    // Ensure root tag is properly closed if needed
    if (xmlResponse.includes('<root>') && !xmlResponse.includes('</root>')) {
      xmlResponse += '\n    </row>\n</root>';
    }

    console.log('[Cloudflare] Cleaned XML Response:', xmlResponse);

    // Validate basic XML structure
    if (!xmlResponse.includes('<root>') || !xmlResponse.includes('</root>')) {
      console.error('Invalid XML structure. Raw response:', result.result.response);
      throw new Error('Failed to generate valid XML structure. Please try again.');
    }

    return NextResponse.json({ response: xmlResponse });
  } catch (error) {
    console.error('Error processing with Cloudflare AI:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the text.' },
      { status: 500 }
    );
  }
}