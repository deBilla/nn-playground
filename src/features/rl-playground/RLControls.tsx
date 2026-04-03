import { Play, Pause, RotateCcw, Brain } from 'lucide-react';
import { useRLStore } from '../../stores/rlStore';

export function RLControls() {
  const {
    runState, play, pause, reset, resetAgent,
    algorithmType, setAlgorithm,
    speed, setSpeed,
    epsilon, setEpsilon,
    alpha, setAlpha,
    gamma, setGamma,
    showQValues, setShowQValues,
    showPolicy, setShowPolicy,
    showStateValues, setShowStateValues,
    episode, stepCount,
  } = useRLStore();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">RL Controls</h2>

      {/* Play controls */}
      <div className="flex gap-2">
        {runState === 'running' ? (
          <button onClick={pause} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors">
            <Pause size={14} /> Pause
          </button>
        ) : (
          <button onClick={play} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors">
            <Play size={14} /> Play
          </button>
        )}
        <button onClick={resetAgent} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors" title="Reset Agent (clear Q-table, keep grid)">
          <Brain size={14} />
        </button>
        <button onClick={reset} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors" title="Reset Everything">
          <RotateCcw size={14} />
        </button>
      </div>
      <div className="flex gap-4 text-[10px] text-slate-600">
        <span>Brain = reset Q-table only</span>
        <span>Arrow = reset everything</span>
      </div>

      {/* Stats */}
      <div className="bg-slate-800/50 rounded-lg p-3 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Episode</span>
          <span className="text-slate-300 font-mono">{episode}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Step</span>
          <span className="text-slate-300 font-mono">{stepCount}</span>
        </div>
      </div>

      {/* Algorithm */}
      <div>
        <label className="block text-xs text-slate-500 mb-1">Algorithm</label>
        <div className="flex gap-1">
          {(['qlearning', 'sarsa'] as const).map(a => (
            <button
              key={a}
              onClick={() => setAlgorithm(a)}
              className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                algorithmType === a ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {a === 'qlearning' ? 'Q-Learning' : 'SARSA'}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 mt-1">
          {algorithmType === 'qlearning'
            ? 'Off-policy: learns optimal path regardless of exploration'
            : 'On-policy: learns safer paths that account for exploration'}
        </p>
      </div>

      {/* Speed */}
      <div>
        <label className="block text-xs text-slate-500 mb-1">Speed: {speed} steps/frame</label>
        <div className="flex gap-1">
          {[1, 5, 10, 50, 200].map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`flex-1 px-1 py-1 rounded text-xs transition-colors ${
                speed === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Hyperparameters */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            Epsilon (exploration): {epsilon.toFixed(2)}
          </label>
          <input type="range" min={0} max={1} step={0.01} value={epsilon} onChange={e => setEpsilon(Number(e.target.value))} className="w-full accent-blue-500" />
          <p className="text-[10px] text-slate-600 mt-0.5">
            {epsilon > 0.5 ? 'High — agent explores a lot (mostly random moves)'
              : epsilon > 0.1 ? 'Balanced — mix of exploration and exploitation'
              : epsilon > 0 ? 'Low — agent mostly follows learned policy'
              : 'Zero — pure exploitation, no random exploration'}
          </p>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            Alpha (learning rate): {alpha.toFixed(2)}
          </label>
          <input type="range" min={0.01} max={1} step={0.01} value={alpha} onChange={e => setAlpha(Number(e.target.value))} className="w-full accent-blue-500" />
          <p className="text-[10px] text-slate-600 mt-0.5">
            How fast Q-values change. High = fast but noisy. Low = stable but slow.
          </p>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            Gamma (discount): {gamma.toFixed(2)}
          </label>
          <input type="range" min={0} max={1} step={0.01} value={gamma} onChange={e => setGamma(Number(e.target.value))} className="w-full accent-blue-500" />
          <p className="text-[10px] text-slate-600 mt-0.5">
            {gamma > 0.9 ? 'High — agent plans far ahead, values future rewards'
              : gamma > 0.5 ? 'Medium — balances immediate and future rewards'
              : 'Low — agent is short-sighted, mostly cares about immediate rewards'}
          </p>
        </div>
      </div>

      {/* Visualization toggles */}
      <div className="space-y-1">
        <label className="text-xs text-slate-500 block">Visualization</label>
        {[
          { label: 'Q-Values', value: showQValues, set: setShowQValues, desc: 'Show action values as triangles in each cell' },
          { label: 'Policy Arrows', value: showPolicy, set: setShowPolicy, desc: 'Show best action direction in each cell' },
          { label: 'State Values', value: showStateValues, set: setShowStateValues, desc: 'Color cells by how valuable they are' },
        ].map(({ label, value, set, desc }) => (
          <div key={label}>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={value} onChange={e => set(e.target.checked)} className="accent-blue-500" />
              {label}
            </label>
            <p className="text-[10px] text-slate-600 ml-5">{desc}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-600 bg-slate-800/30 rounded px-2 py-1.5">
        Click cells on the grid to cycle: empty → wall → pit → goal
      </p>
    </div>
  );
}
