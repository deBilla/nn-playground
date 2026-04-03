import { useState } from 'react';
import { usePaperStore } from '../stores/paperStore';
import type { QuizQuestion } from '../lib/types';
import { HelpCircle, CheckCircle, XCircle } from 'lucide-react';

export function QuizCard({ question, sectionIndex }: { question: QuizQuestion; sectionIndex: number }) {
  const { quizScores, recordQuizAnswer } = usePaperStore();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const answered = sectionIndex in quizScores;
  const isCorrect = quizScores[sectionIndex];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedOption(idx);
    recordQuizAnswer(sectionIndex, idx === question.correctIndex);
  };

  return (
    <div style={{
      background: '#1e293b', borderRadius: '10px', padding: '20px',
      border: `1px solid ${answered ? (isCorrect ? '#166534' : '#991b1b') : '#334155'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <HelpCircle size={16} style={{ color: '#3b82f6' }} />
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6' }}>QUIZ</span>
      </div>

      <p style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '14px', lineHeight: 1.5 }}>
        {question.question}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {question.options.map((option, i) => {
          const isSelected = selectedOption === i;
          const isRight = i === question.correctIndex;
          let bg = '#0f172a';
          let border = '#334155';
          let color = '#94a3b8';

          if (answered) {
            if (isRight) { bg = '#052e16'; border = '#22c55e'; color = '#86efac'; }
            else if (isSelected && !isRight) { bg = '#450a0a'; border = '#dc2626'; color = '#fca5a5'; }
          } else if (isSelected) {
            bg = '#1e40af'; border = '#3b82f6'; color = '#fff';
          }

          return (
            <button key={i} onClick={() => handleSelect(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: '6px', textAlign: 'left',
                background: bg, border: `1px solid ${border}`, color,
                fontSize: '12px', cursor: answered ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSelected || (answered && isRight) ? border : '#1e293b',
                color: isSelected || (answered && isRight) ? '#fff' : '#64748b',
                fontSize: '10px', fontWeight: 600, flexShrink: 0,
              }}>
                {answered && isRight ? <CheckCircle size={12} /> : answered && isSelected ? <XCircle size={12} /> : String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {answered && (
        <div style={{
          marginTop: '14px', padding: '12px', borderRadius: '6px',
          background: isCorrect ? '#052e16' : '#450a0a',
          border: `1px solid ${isCorrect ? '#166534' : '#991b1b'}`,
          fontSize: '12px', lineHeight: 1.5,
        }}>
          <span style={{ fontWeight: 600, color: isCorrect ? '#22c55e' : '#ef4444' }}>
            {isCorrect ? 'Correct!' : 'Incorrect.'}
          </span>{' '}
          <span style={{ color: '#94a3b8' }}>{question.explanation}</span>
        </div>
      )}
    </div>
  );
}
