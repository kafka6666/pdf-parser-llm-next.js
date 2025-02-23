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
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-2-7b-chat-int8`,
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
              content:
                'You are a helpful assistant that analyzes and summarizes text from PDFs.',
            },
            {
              role: 'user',
              content: `Please provide a concise summary and key insights from the following text:\n\n${text}`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudflare API Error:', errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json({ response: result.result.response });
  } catch (error) {
    console.error('Error processing with Cloudflare AI:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the text.' },
      { status: 500 }
    );
  }
}