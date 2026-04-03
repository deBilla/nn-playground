import { useCallback, useRef } from 'react';
import type { LLMProvider } from '../lib/types';
import { buildAnalysisPrompt } from '../lib/prompts';

type ProgressCallback = (msg: string) => void;

// Shared WebLLM engine singleton
let webllmEngine: any = null;

const WEBLLM_MODEL_ID = 'Phi-3.5-mini-instruct-q4f16_1-MLC';
const MAX_RETRIES = 2;
const RETRY_DELAY = 3000;

export async function clearWebLLMCache(): Promise<boolean> {
  try {
    const keys = await caches.keys();
    let cleared = false;
    for (const key of keys) {
      // WebLLM caches use "webllm/model" or similar naming
      if (key.includes('webllm') || key.includes('mlc') || key.includes('Phi') || key.includes('wasm')) {
        await caches.delete(key);
        cleared = true;
      }
    }
    // Also reset the engine singleton so it re-downloads
    webllmEngine = null;
    return cleared;
  } catch {
    return false;
  }
}

async function getWebLLMEngine(onProgress: ProgressCallback) {
  if (webllmEngine) return webllmEngine;

  onProgress('Loading WebLLM engine...');
  const webllm = await import('@mlc-ai/web-llm');

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      onProgress(
        attempt === 1
          ? 'Downloading model (first time only, ~1.5GB)...'
          : `Retry ${attempt}/${MAX_RETRIES} — re-downloading model...`
      );

      webllmEngine = await webllm.CreateMLCEngine(WEBLLM_MODEL_ID, {
        initProgressCallback: (report: any) => {
          if (report.text) onProgress(report.text);
        },
      });

      return webllmEngine;
    } catch (err: any) {
      lastError = err;
      const isNetworkError = err.message?.includes('network error') ||
        err.message?.includes('Cache.add') ||
        err.message?.includes('ERR_FAILED') ||
        err.message?.includes('fetch');

      if (isNetworkError && attempt < MAX_RETRIES) {
        onProgress(`Download failed (network error). Clearing cache and retrying in ${RETRY_DELAY / 1000}s...`);
        await clearWebLLMCache();
        await new Promise(r => setTimeout(r, RETRY_DELAY));
      } else {
        break;
      }
    }
  }

  throw new Error(
    `Browser AI model download failed after ${MAX_RETRIES} attempts.\n\n` +
    'This is usually a temporary network issue with the model host (HuggingFace).\n\n' +
    'Try:\n' +
    '1. Click "Clear model cache" and try again\n' +
    '2. Switch to Gemini (free) or Claude for now\n' +
    '3. Try again later when the network issue resolves\n\n' +
    `Error: ${lastError?.message || 'Unknown'}`
  );
}

function useWebLLM() {
  return useCallback(async (text: string, onProgress: ProgressCallback): Promise<string> => {
    const engine = await getWebLLMEngine(onProgress);
    onProgress('Analyzing paper with local AI...');
    const response = await engine.chat.completions.create({
      messages: [{ role: 'user', content: buildAnalysisPrompt(text) }],
      max_tokens: 4096,
      temperature: 0.1,
    });
    return response.choices[0]?.message?.content || '';
  }, []);
}

function useClaude() {
  return useCallback(async (text: string, apiKey: string, onProgress: ProgressCallback): Promise<string> => {
    onProgress('Sending to Claude API...');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: buildAnalysisPrompt(text) }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.content?.[0]?.text || '';
  }, []);
}

function useOpenAI() {
  return useCallback(async (text: string, apiKey: string, onProgress: ProgressCallback): Promise<string> => {
    onProgress('Sending to OpenAI API...');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 8000,
        temperature: 0.1,
        messages: [{ role: 'user', content: buildAnalysisPrompt(text) }],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }, []);
}

function useGemini() {
  return useCallback(async (text: string, apiKey: string, onProgress: ProgressCallback): Promise<string> => {
    onProgress('Sending to Gemini API...');
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildAnalysisPrompt(text) }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8000 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }, []);
}

function useOpenRouter() {
  return useCallback(async (text: string, apiKey: string, onProgress: ProgressCallback): Promise<string> => {
    onProgress('Sending to OpenRouter API...');
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        max_tokens: 8000,
        temperature: 0.1,
        messages: [{ role: 'user', content: buildAnalysisPrompt(text) }],
      }),
    });
    if (!res.ok) throw new Error(`OpenRouter API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }, []);
}

function useCustomEndpoint() {
  return useCallback(async (text: string, apiKey: string, onProgress: ProgressCallback): Promise<string> => {
    const config = loadCustomConfig();
    onProgress(`Sending to ${config.baseUrl}...`);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const res = await fetch(`${config.baseUrl.replace(/\/+$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        max_tokens: 8000,
        temperature: 0.1,
        messages: [{ role: 'user', content: buildAnalysisPrompt(text) }],
      }),
    });
    if (!res.ok) throw new Error(`Custom API error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }, []);
}

const CUSTOM_CONFIG_KEY = 'nn-playground-custom-llm';

export interface CustomLLMConfig {
  baseUrl: string;
  model: string;
}

function loadCustomConfig(): CustomLLMConfig {
  try {
    const stored = localStorage.getItem(CUSTOM_CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { baseUrl: 'http://localhost:11434', model: 'llama3.2' };
}

export function saveCustomConfig(config: CustomLLMConfig) {
  try { localStorage.setItem(CUSTOM_CONFIG_KEY, JSON.stringify(config)); } catch {}
}

export function getCustomConfig(): CustomLLMConfig {
  return loadCustomConfig();
}

export function useLLM() {
  const webllm = useWebLLM();
  const claude = useClaude();
  const openai = useOpenAI();
  const gemini = useGemini();
  const openrouter = useOpenRouter();
  const custom = useCustomEndpoint();
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (
    text: string,
    provider: LLMProvider,
    apiKey: string,
    onProgress: ProgressCallback,
  ): Promise<string> => {
    abortRef.current = new AbortController();

    switch (provider) {
      case 'webllm': return webllm(text, onProgress);
      case 'claude': return claude(text, apiKey, onProgress);
      case 'openai': return openai(text, apiKey, onProgress);
      case 'gemini': return gemini(text, apiKey, onProgress);
      case 'openrouter': return openrouter(text, apiKey, onProgress);
      case 'custom': return custom(text, apiKey, onProgress);
      default: throw new Error(`Unknown provider: ${provider}`);
    }
  }, [webllm, claude, openai, gemini, openrouter, custom]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { generate, cancel };
}

export function useWebGPUSupported(): boolean {
  return 'gpu' in navigator;
}
