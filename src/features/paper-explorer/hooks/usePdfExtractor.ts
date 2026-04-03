import { useCallback } from 'react';
import { extractTextFromPDF } from '../lib/pdfParser';

export function usePdfExtractor() {
  const extract = useCallback(async (
    file: File,
    onProgress?: (page: number, total: number) => void,
  ): Promise<string> => {
    return extractTextFromPDF(file, onProgress);
  }, []);

  return { extract };
}
