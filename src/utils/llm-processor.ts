// src/utils/llm-processor.ts
export async function processWithLLM(text: string): Promise<string> {
  try {
    // posting request to google gemini ai
    const response = await fetch('/api/cloudflare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse the JSON response and extract the response field
    const responseBody = await response.json();
    // console.log(`[Chat] Response: ${responseBody.response}`);

    return responseBody.response || 'No response generated';
  } catch (error) {
    console.error('Error processing with Google Gemini AI:', error);
    return 'An error occurred while processing the text';
  }
}