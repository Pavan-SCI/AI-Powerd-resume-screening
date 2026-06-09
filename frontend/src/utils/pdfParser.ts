import * as pdfjsLib from 'pdfjs-dist';

// Use a stable CDN for the PDF.js worker. This ensures it works seamlessly client-side 
// without complex Vite worker configuration.
const PDFJS_VERSION = '4.3.136';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;

/**
 * Extracts raw text from a PDF file uploaded by the user.
 * @param file The PDF File object
 * @returns A promise resolving to the extracted text
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      if (!event.target?.result) {
        return reject(new Error('Could not read file contents.'));
      }
      
      try {
        const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: typedarray });
        const pdf = await loadingTask.promise;
        
        let extractedText = '';
        
        // Loop through and extract text page by page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // Map individual text items and join them
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
            
          extractedText += `${pageText}\n`;
        }
        
        if (!extractedText.trim()) {
          reject(new Error('The PDF appears to be empty or contains only images (scanned document).'));
        } else {
          resolve(extractedText);
        }
      } catch (error) {
        console.error('PDF parsing error:', error);
        reject(new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the file.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}
