// app/api/chat/route.ts
import { NextRequest } from 'next/server';
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-2.0-flash-lite-preview-02-05'),
    messages,
  });

  return result.toDataStreamResponse();
}