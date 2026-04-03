import { useCallback } from 'react';
import { usePdfExtractor } from './usePdfExtractor';
import { useLLM } from './useLLM';
import { parseAnalysisResponse } from '../lib/prompts';
import { usePaperStore } from '../stores/paperStore';

export function usePaperAnalysis() {
  const { extract } = usePdfExtractor();
  const { generate, cancel } = useLLM();

  const analyze = useCallback(async (file: File) => {
    const store = usePaperStore.getState();
    const { llmProvider, apiKey } = store;

    store.setStatus('extracting', 'Extracting text from PDF...');
    store.setFile(file);

    try {
      const text = await extract(file, (page, total) => {
        store.setProgress(`Extracting text... page ${page}/${total}`);
      });

      store.setExtractedText(text);
      store.setStatus('analyzing', 'Starting analysis...');

      const rawResponse = await generate(text, llmProvider, apiKey, (msg) => {
        store.setProgress(msg);
      });

      store.setProgress('Parsing analysis results...');
      const analysis = parseAnalysisResponse(rawResponse);

      store.setAnalysis(analysis);
    } catch (err: any) {
      store.setError(err.message || 'Analysis failed');
    }
  }, [extract, generate]);

  return { analyze, cancel };
}
