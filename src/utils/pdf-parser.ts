// src/utils/pdf-parser.ts
import * as pdfjsLib from 'pdfjs-dist';
import { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs-dist/pdf.worker.min.js';
}

export async function processPDF(file: File): Promise<string> {
  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  
  // Load PDF document
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  
  // Extract text from all pages
  let extractedText = '';
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const pageText = textContent.items
      .map((item: TextItem | TextMarkedContent) => {
        if ('str' in item) {
          return item.str;
        }
        return '';
      })
      .join(' ');
    
    extractedText += pageText + '\n';
  }
  
  return extractedText.trim();
}