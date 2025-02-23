'use client';

import { useState } from 'react';
import { processPDF } from '../utils/pdf-parser';
import { processWithLLM } from '../utils/llm-processor';

export default function Home() {
  const [extractedText, setExtractedText] = useState<string>('');
  const [llmResponse, setLLMResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setIsLoading(true);
      
      try {
        // Extract text from PDF
        const text = await processPDF(uploadedFile);
        setExtractedText(text);

        // Process with LLM
        const response = await processWithLLM(text);
        setLLMResponse(response);
      } catch (error) {
        console.error('Error processing PDF:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          PDF Text Processor with LLM
        </h1>
        
        <div className="mb-8">
          <input 
            type="file" 
            accept=".pdf"
            onChange={handleFileUpload}
            className="w-full p-2 border rounded"
          />
        </div>

        {isLoading && (
          <div className="text-center mb-4">Processing...</div>
        )}

        {extractedText && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Extracted Text:</h2>
            <textarea 
              value={extractedText} 
              readOnly 
              className="w-full h-40 p-2 border rounded bg-gray-100 text-black"
            />
          </div>
        )}

        {llmResponse && (
          <div>
            <h2 className="text-xl font-semibold mb-2">LLM Response:</h2>
            <div className="w-full p-2 border rounded bg-gray-50 text-black">
              {llmResponse}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
