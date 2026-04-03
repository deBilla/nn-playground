import { usePaperStore } from '../stores/paperStore';
import { SectionCard } from './SectionCard';
import { QuizCard } from './QuizCard';
import { RotateCcw, CheckCircle, Circle, BookOpen } from 'lucide-react';

export function PaperViewer() {
  const { analysis, activeSectionIndex, setActiveSectionIndex, completedSections, quizScores, reset } = usePaperStore();
  if (!analysis) return null;

  const totalSections = analysis.sections.length;
  const completion = totalSections > 0 ? Math.round((completedSections.length / totalSections) * 100) : 0;
  const quizTotal = Object.keys(quizScores).length;
  const quizCorrect = Object.values(quizScores).filter(Boolean).length;

  const activeSection = analysis.sections[activeSectionIndex];

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-72 border-r border-slate-800 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-900/50">
        <button onClick={reset}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <RotateCcw size={12} /> Upload another paper
        </button>

        {/* Paper info */}
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', margin: '0 0 4px', lineHeight: 1.3 }}>
            {analysis.title}
          </h2>
          <p style={{ fontSize: '10px', color: '#64748b' }}>{analysis.authors.join(', ')}</p>
        </div>

        {/* Progress */}
        <div style={{ background: '#1e293b', borderRadius: '8px', padding: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginBottom: '6px' }}>
            <span>Progress</span>
            <span>{completion}%</span>
          </div>
          <div style={{ height: '4px', background: '#0f172a', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${completion}%`, background: '#22c55e', borderRadius: '2px', transition: 'width 0.3s' }} />
          </div>
          {quizTotal > 0 && (
            <p style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>
              Quiz: {quizCorrect}/{quizTotal} correct
            </p>
          )}
        </div>

        {/* Section list */}
        <div className="flex flex-col gap-1">
          {analysis.sections.map((section, i) => {
            const isComplete = completedSections.includes(i);
            const isActive = i === activeSectionIndex;
            return (
              <button key={i} onClick={() => setActiveSectionIndex(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left',
                  padding: '8px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: isActive ? '#1e40af' : '#1e293b',
                  color: isActive ? '#fff' : '#94a3b8',
                  fontSize: '11px', transition: 'all 0.15s',
                }}>
                {isComplete
                  ? <CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} />
                  : <Circle size={14} style={{ color: '#475569', flexShrink: 0 }} />
                }
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {section.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Glossary */}
        {analysis.glossary.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <BookOpen size={12} style={{ color: '#64748b' }} />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Glossary</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {analysis.glossary.map((entry, i) => (
                <div key={i} style={{ fontSize: '10px' }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{entry.term}:</span>{' '}
                  <span style={{ color: '#64748b' }}>{entry.definition}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 overflow-auto p-6">
        {activeSection && (
          <div style={{ maxWidth: '800px' }}>
            <SectionCard section={activeSection} index={activeSectionIndex} />

            {activeSection.quizQuestion && (
              <div style={{ marginTop: '24px' }}>
                <QuizCard question={activeSection.quizQuestion} sectionIndex={activeSectionIndex} />
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <button onClick={() => setActiveSectionIndex(Math.max(0, activeSectionIndex - 1))}
                disabled={activeSectionIndex === 0}
                style={{
                  padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: '#1e293b', color: activeSectionIndex === 0 ? '#334155' : '#94a3b8',
                  fontSize: '12px',
                }}>
                ← Previous
              </button>
              <button onClick={() => {
                usePaperStore.getState().markSectionComplete(activeSectionIndex);
                if (activeSectionIndex < totalSections - 1) setActiveSectionIndex(activeSectionIndex + 1);
              }}
                style={{
                  padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: '#2563eb', color: '#fff', fontSize: '12px', fontWeight: 600,
                }}>
                {activeSectionIndex < totalSections - 1 ? 'Complete & Next →' : 'Complete ✓'}
              </button>
            </div>
          </div>
        )}

        {/* Results summary */}
        {analysis.results && analysis.results.length > 0 && (
          <div style={{ marginTop: '32px', maxWidth: '800px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1', marginBottom: '12px' }}>Key Results</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {analysis.results.map((r, i) => (
                <div key={i} style={{
                  background: '#1e293b', borderRadius: '8px', padding: '12px', flex: '1 1 180px',
                  borderLeft: `3px solid ${r.isBetter ? '#22c55e' : '#f59e0b'}`,
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: r.isBetter ? '#22c55e' : '#f59e0b', fontFamily: 'monospace' }}>{r.value}</div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{r.label}</div>
                  {r.comparison && <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{r.comparison}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
