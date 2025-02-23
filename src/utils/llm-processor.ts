// src/utils/llm-processor.ts
export async function processWithLLM(text: string): Promise<string> {
  try {
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

    const responseBody = await response.json();
    
    // Validate XML response
    if (!responseBody.response || typeof responseBody.response !== 'string') {
      throw new Error('Invalid response format from AI');
    }

    return responseBody.response;
  } catch (error) {
    console.error('Error processing with Cloudflare AI:', error);
    throw new Error('Failed to convert text to XML format');
  }
}