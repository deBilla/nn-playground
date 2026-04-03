import { FileText, Loader2 } from 'lucide-react';
import { usePaperStore } from '../stores/paperStore';

export function AnalysisProgress() {
  const { uploadedFile, status, progress, error } = usePaperStore();

  const steps = [
    { key: 'extracting', label: 'Extracting text from PDF' },
    { key: 'analyzing', label: 'Analyzing with AI' },
  ];

  return (
    <div className="h-full flex items-center justify-center" style={{ background: '#0f172a' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px', padding: '24px' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '16px', background: '#1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
        }}>
          <FileText size={28} style={{ color: '#3b82f6' }} />
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', margin: '0 0 4px' }}>
          Analyzing Paper
        </h2>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 24px' }}>
          {uploadedFile?.name}
        </p>

        {/* Step indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginBottom: '20px' }}>
          {steps.map((step, i) => {
            const isActive = status === step.key;
            const isDone = steps.findIndex(s => s.key === status) > i;
            return (
              <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isDone ? '#166534' : isActive ? '#1e40af' : '#1e293b',
                  border: `1px solid ${isDone ? '#22c55e' : isActive ? '#3b82f6' : '#334155'}`,
                }}>
                  {isActive ? (
                    <Loader2 size={12} style={{ color: '#60a5fa', animation: 'spin 1s linear infinite' }} />
                  ) : isDone ? (
                    <span style={{ color: '#22c55e', fontSize: '12px' }}>✓</span>
                  ) : (
                    <span style={{ color: '#475569', fontSize: '10px' }}>{i + 1}</span>
                  )}
                </div>
                <span style={{ fontSize: '13px', color: isActive ? '#e2e8f0' : isDone ? '#94a3b8' : '#475569' }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress message */}
        <div style={{
          background: '#1e293b', borderRadius: '8px', padding: '12px',
          fontSize: '11px', color: '#94a3b8', minHeight: '40px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {progress || 'Starting...'}
        </div>

        {error && (
          <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', background: '#450a0a', border: '1px solid #dc2626', fontSize: '12px', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
