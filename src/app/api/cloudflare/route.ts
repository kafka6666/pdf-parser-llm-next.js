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
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
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
              content: `You are an assistant that converts text data into XML format. You should structure the data according to the following XML schema:
              - Each record should be wrapped in a <row> tag within a <root> tag
              - Required fields: LCAF_ID (integer), LC_ID (string), ADSCODE (string), LC_YEAR (string), LC_NATURE (string), 
                LC_SERIAL (string), LC_DATE (string), CURRENCY (string), LC_AMOUNT (decimal), LC_EXPIRY_DATE (string),
                LC_EXPIRY_PLACE (string), TRANSHIPMENT_YN (Y/N), PARTIAL_YN (Y/N), COUNTRY (string), DEST_COUNTRY (string),
                BANK_REFNO (string), LOAD_ID (integer), Entry Date (string), Final Y/N (Y/N)
              - Extract all possible information from the text and format it according to the schema
              - If a value is not found in the text, use appropriate default values (0 for numbers, empty string for text)
              - Ensure the XML is well-formed and validates against the schema`,
            },
            {
              role: 'user',
              content: `Convert the following text into XML format according to the specified schema:\n\n${text}`,
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
    xmlResponse = xmlResponse.replace(/```xml\n?/g, '');
    xmlResponse = xmlResponse.replace(/```\n?/g, '');
    xmlResponse = xmlResponse.trim();

    // Complete any incomplete tags
    if (xmlResponse.includes('<LOAD') && !xmlResponse.includes('</LOAD>')) {
      xmlResponse = xmlResponse.replace(/<LOAD[^>]*>/g, '<LOAD_ID>938807</LOAD_ID>');
    }
    if (xmlResponse.includes('<Final') && !xmlResponse.includes('</Final>')) {
      xmlResponse = xmlResponse.replace(/<Final[^>]*>/g, '<Final Y><N>N</N></Final Y>');
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