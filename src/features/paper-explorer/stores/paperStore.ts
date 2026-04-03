import { create } from 'zustand';
import type { PaperAnalysis, LLMProvider } from '../lib/types';

const LLM_CONFIG_KEY = 'nn-playground-llm-config';

function loadLLMConfig(): { provider: LLMProvider; apiKey: string } {
  try {
    const stored = localStorage.getItem(LLM_CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { provider: 'webllm', apiKey: '' };
}

function saveLLMConfig(provider: LLMProvider, apiKey: string) {
  try { localStorage.setItem(LLM_CONFIG_KEY, JSON.stringify({ provider, apiKey })); } catch {}
}

interface PaperState {
  // LLM config
  llmProvider: LLMProvider;
  apiKey: string;

  // Paper state
  uploadedFile: File | null;
  extractedText: string;
  analysis: PaperAnalysis | null;

  // Progress
  status: 'idle' | 'extracting' | 'analyzing' | 'done' | 'error';
  progress: string;
  error: string | null;

  // Interaction state
  activeSectionIndex: number;
  completedSections: number[];
  quizScores: Record<number, boolean>;

  // Pure state setters
  setLLMConfig: (provider: LLMProvider, apiKey: string) => void;
  setFile: (file: File) => void;
  setExtractedText: (text: string) => void;
  setAnalysis: (analysis: PaperAnalysis) => void;
  setStatus: (status: PaperState['status'], progress?: string) => void;
  setProgress: (progress: string) => void;
  setError: (error: string) => void;
  setActiveSectionIndex: (i: number) => void;
  markSectionComplete: (i: number) => void;
  recordQuizAnswer: (sectionIdx: number, correct: boolean) => void;
  reset: () => void;
}

export const usePaperStore = create<PaperState>((set, get) => {
  const config = loadLLMConfig();

  return {
    llmProvider: config.provider,
    apiKey: config.apiKey,
    uploadedFile: null,
    extractedText: '',
    analysis: null,
    status: 'idle',
    progress: '',
    error: null,
    activeSectionIndex: 0,
    completedSections: [],
    quizScores: {},

    setLLMConfig: (provider, apiKey) => {
      saveLLMConfig(provider, apiKey);
      set({ llmProvider: provider, apiKey });
    },

    setFile: (file) => set({ uploadedFile: file, error: null, analysis: null }),
    setExtractedText: (text) => set({ extractedText: text }),
    setAnalysis: (analysis) => set({ analysis, status: 'done', progress: 'Analysis complete!' }),
    setStatus: (status, progress) => set({ status, progress: progress ?? '', error: null }),
    setProgress: (progress) => set({ progress }),
    setError: (error) => set({ status: 'error', error, progress: '' }),

    setActiveSectionIndex: (i) => set({ activeSectionIndex: i }),

    markSectionComplete: (i) => {
      const { completedSections } = get();
      if (!completedSections.includes(i)) {
        set({ completedSections: [...completedSections, i] });
      }
    },

    recordQuizAnswer: (sectionIdx, correct) => {
      set({ quizScores: { ...get().quizScores, [sectionIdx]: correct } });
    },

    reset: () => set({
      uploadedFile: null, extractedText: '', analysis: null,
      status: 'idle', progress: '', error: null,
      activeSectionIndex: 0, completedSections: [], quizScores: {},
    }),
  };
});
