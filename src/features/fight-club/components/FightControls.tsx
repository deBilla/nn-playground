import { Play, Pause, RotateCcw, Brain } from 'lucide-react';
import { useFightStore } from '../stores/fightStore';

export function FightControls() {
  const {
    runState, play, pause, reset, resetAgents,
    speed, setSpeed, epsilon, setEpsilon, alpha, setAlpha, gamma, setGamma,
    round, redWins, blueWins, draws,
  } = useFightStore();

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
      </div>

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
            { label: 'Learn Fast', desc: 'First ~500 rounds', e: 0.5, a: 0.2, g: 0.9, s: 1000, color: '#f59e0b' },
            { label: 'Refine', desc: '500-2000 rounds', e: 0.1, a: 0.1, g: 0.95, s: 1000, color: '#3b82f6' },
            { label: 'Showtime', desc: 'Watch the pros', e: 0.02, a: 0.05, g: 0.95, s: 1, color: '#22c55e' },
          ].map(p => (
            <button key={p.label}
              onClick={() => { setEpsilon(p.e); setAlpha(p.a); setGamma(p.g); setSpeed(p.s); }}
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
        <div className="flex gap-1">
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
          <p style={{ fontSize: '9px', color: '#475569' }}>
            {epsilon > 0.3 ? 'High — lots of random moves, learning fast' : epsilon > 0.05 ? 'Moderate — mix of learning and exploiting' : 'Low — mostly using learned strategy'}
          </p>
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
