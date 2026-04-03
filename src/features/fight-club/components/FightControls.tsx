import { Play, Pause, RotateCcw, Brain, Circle } from 'lucide-react';
import { useFightStore } from '../stores/fightStore';
import { useCanvasRecorder } from '../hooks/useCanvasRecorder';

export function FightControls({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const {
    runState, play, pause, reset, resetAgents,
    speed, setSpeed, epsilon, setEpsilon, alpha, setAlpha, gamma, setGamma,
    round, redWins, blueWins, draws,
    useExpertStart, setUseExpertStart, setShowtime,
  } = useFightStore();

  const { isRecording, startRecording, stopRecording } = useCanvasRecorder(canvasRef);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Fight Controls</h2>

      {/* Play controls */}
      <div className="flex gap-2">
        {runState === 'running' ? (
          <button onClick={pause} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors">
            <Pause size={14} /> Pause
          </button>
        ) : (
          <button onClick={play} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors">
            <Play size={14} /> Fight!
          </button>
        )}
        <button onClick={resetAgents} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors" title="Reset Agents (clear Q-tables)">
          <Brain size={14} />
        </button>
        <button onClick={reset} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors" title="Reset Everything">
          <RotateCcw size={14} />
        </button>
        {/* Record button */}
        <button onClick={isRecording ? stopRecording : startRecording}
          style={{
            padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: isRecording ? '#991b1b' : '#1e293b',
            color: isRecording ? '#fca5a5' : '#64748b',
            display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px',
          }}
          title={isRecording ? 'Stop recording & download' : 'Record fight as video'}>
          <Circle size={10} fill={isRecording ? '#ef4444' : 'none'} style={{ color: isRecording ? '#ef4444' : '#64748b' }} />
          {isRecording ? 'Stop' : 'Rec'}
        </button>
      </div>

      {/* Expert start toggle */}
      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
        <input type="checkbox" checked={useExpertStart} onChange={e => setUseExpertStart(e.target.checked)} className="accent-blue-500" />
        Start with expert knowledge (imitation learning)
      </label>
      {useExpertStart && (
        <p style={{ fontSize: '9px', color: '#475569', marginTop: '-8px' }}>
          Q-tables pre-filled with 300 expert-vs-expert episodes. Reset to apply.
        </p>
      )}

      {/* Scoreboard */}
      <div style={{ background: '#1e293b', borderRadius: '8px', padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', color: '#64748b' }}>Round {round}</span>
          <span style={{ fontSize: '10px', color: '#64748b' }}>{redWins + blueWins + draws} fights</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#ef4444', fontFamily: 'monospace' }}>{redWins}</div>
            <div style={{ fontSize: '10px', color: '#ef4444' }}>RED</div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#64748b', fontFamily: 'monospace' }}>{draws}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>DRAW</div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace' }}>{blueWins}</div>
            <div style={{ fontSize: '10px', color: '#3b82f6' }}>BLUE</div>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div>
        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Training Phase Presets</label>
        <div className="flex flex-col gap-1">
          {[
            { label: 'Learn Fast', desc: 'First ~500 rounds', e: 0.5, a: 0.2, g: 0.9, s: 1000, showtime: false, color: '#f59e0b' },
            { label: 'Refine', desc: '500-2000 rounds', e: 0.1, a: 0.1, g: 0.95, s: 1000, showtime: false, color: '#3b82f6' },
            { label: 'Showtime', desc: 'Watch the pros (2000 steps)', e: 0.02, a: 0.05, g: 0.95, s: 1, showtime: true, color: '#22c55e' },
          ].map(p => (
            <button key={p.label}
              onClick={() => { setEpsilon(p.e); setAlpha(p.a); setGamma(p.g); setSpeed(p.s); setShowtime(p.showtime); }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: '#1e293b', color: '#94a3b8', fontSize: '11px', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#243044'}
              onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
            >
              <div>
                <span style={{ color: p.color, fontWeight: 600 }}>{p.label}</span>
                <span style={{ color: '#475569', marginLeft: '6px' }}>{p.desc}</span>
              </div>
              <span style={{ fontSize: '9px', color: '#475569', fontFamily: 'monospace' }}>
                ε{p.e} α{p.a} γ{p.g}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Speed */}
      <div>
        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Speed: {speed} steps/frame</label>
        <div className="flex gap-1 flex-wrap">
          {[1, 3, 10, 50, 200, 500, 1000].map(s => (
            <button key={s} onClick={() => setSpeed(s)}
              className={`flex-1 px-1 py-1 rounded text-xs transition-colors ${
                speed === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Hyperparameters */}
      <div className="space-y-3">
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
            Epsilon (exploration): {epsilon.toFixed(2)}
          </label>
          <input type="range" min={0} max={1} step={0.01} value={epsilon} onChange={e => setEpsilon(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
            Alpha (learning rate): {alpha.toFixed(2)}
          </label>
          <input type="range" min={0.01} max={0.5} step={0.01} value={alpha} onChange={e => setAlpha(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
            Gamma (discount): {gamma.toFixed(2)}
          </label>
          <input type="range" min={0} max={1} step={0.01} value={gamma} onChange={e => setGamma(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>
      </div>
    </div>
  );
}
