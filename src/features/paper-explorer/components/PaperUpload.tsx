import { useState, useRef } from 'react';
import { Upload, FileText, Cpu, Cloud, AlertTriangle, Globe } from 'lucide-react';
import { usePaperStore } from '../stores/paperStore';
import { usePaperAnalysis } from '../hooks/usePaperAnalysis';
import { useWebGPUSupported, clearWebLLMCache } from '../hooks/useLLM';
import type { LLMProvider } from '../lib/types';

export function PaperUpload() {
  const { llmProvider, apiKey, setLLMConfig, error } = usePaperStore();
  const { analyze } = usePaperAnalysis();
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const hasWebGPU = useWebGPUSupported();

  const handleFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }
    analyze(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="h-full overflow-auto" style={{ background: '#0f172a' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <FileText size={40} style={{ color: '#3b82f6', margin: '0 auto 12px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px' }}>
            Paper Explorer
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
            Upload a research paper and get interactive visualizations, step-by-step explanations, and quizzes — all powered by AI running in your browser.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#3b82f6' : '#334155'}`,
            borderRadius: '12px', padding: '48px 24px', textAlign: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            background: dragging ? 'rgba(59,130,246,0.05)' : '#1e293b',
          }}
        >
          <Upload size={32} style={{ color: dragging ? '#3b82f6' : '#475569', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 4px' }}>
            {dragging ? 'Drop your PDF here' : 'Drag & drop a PDF, or click to browse'}
          </p>
          <p style={{ fontSize: '11px', color: '#475569' }}>PDF files only, max ~20 pages recommended</p>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: '#450a0a', border: '1px solid #dc2626', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12px', color: '#fca5a5' }}>{error}</div>
          </div>
        )}

        {/* LLM Config */}
        <div style={{ marginTop: '24px', background: '#1e293b', borderRadius: '10px', padding: '20px', border: '1px solid #334155' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', margin: '0 0 12px' }}>AI Provider</h3>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {([
              { id: 'webllm' as LLMProvider, label: 'Browser AI', icon: Cpu, desc: 'Free, runs locally' },
              { id: 'openrouter' as LLMProvider, label: 'OpenRouter', icon: Globe, desc: 'Many models, one key' },
              { id: 'gemini' as LLMProvider, label: 'Gemini', icon: Cloud, desc: 'Free tier available' },
              { id: 'claude' as LLMProvider, label: 'Claude', icon: Cloud, desc: 'Best quality' },
              { id: 'openai' as LLMProvider, label: 'OpenAI', icon: Cloud, desc: 'API key needed' },
            ]).map(p => (
              <button key={p.id} onClick={() => setLLMConfig(p.id, apiKey)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: llmProvider === p.id ? '#1e40af' : '#0f172a',
                  color: llmProvider === p.id ? '#fff' : '#94a3b8',
                  textAlign: 'center', transition: 'all 0.15s', minWidth: '120px',
                }}>
                <p.icon size={18} style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{p.label}</div>
                <div style={{ fontSize: '10px', opacity: 0.7 }}>{p.desc}</div>
              </button>
            ))}
          </div>

          {llmProvider === 'webllm' && (
            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
              {hasWebGPU ? (
                <>
                  <p style={{ color: '#22c55e' }}>WebGPU supported. The model (~1.5GB) downloads on first use and is cached in your browser. For better results on complex papers, try Claude or Gemini.</p>
                  <button
                    onClick={async () => {
                      const cleared = await clearWebLLMCache();
                      alert(cleared ? 'Model cache cleared. It will re-download on next use.' : 'No cache found to clear.');
                    }}
                    style={{
                      marginTop: '6px', padding: '4px 10px', borderRadius: '4px', border: '1px solid #334155',
                      background: '#0f172a', color: '#64748b', fontSize: '10px', cursor: 'pointer',
                    }}>
                    Clear model cache
                  </button>
                </>
              ) : (
                <p style={{ color: '#f59e0b' }}>WebGPU not detected in this browser. Try Chrome or Edge, or use Gemini/Claude/OpenAI instead.</p>
              )}
            </div>
          )}

          {llmProvider === 'gemini' && !apiKey && (
            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
              <p>Get a free Gemini API key at <span style={{ color: '#60a5fa' }}>aistudio.google.com</span>. The free tier is generous for paper analysis.</p>
            </div>
          )}

          {(llmProvider === 'claude' || llmProvider === 'openai' || llmProvider === 'gemini' || llmProvider === 'openrouter') && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                {llmProvider === 'claude' ? 'Anthropic' : llmProvider === 'gemini' ? 'Google' : llmProvider === 'openrouter' ? 'OpenRouter' : 'OpenAI'} API Key
              </label>
              <input type="password" value={apiKey}
                onChange={e => setLLMConfig(llmProvider, e.target.value)}
                placeholder={llmProvider === 'claude' ? 'sk-ant-...' : llmProvider === 'gemini' ? 'AIza...' : llmProvider === 'openrouter' ? 'sk-or-...' : 'sk-...'}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '6px', fontSize: '12px',
                  background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0',
                  outline: 'none', boxSizing: 'border-box',
                }} />
              <p style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>
                Stored locally in your browser. Never sent anywhere except the API.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
