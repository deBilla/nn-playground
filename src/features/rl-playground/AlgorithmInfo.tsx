import { useRLStore } from '../../stores/rlStore';
import { ACTION_NAMES } from '../../lib/rl/gridWorld';

export function AlgorithmInfo() {
  const { algorithmType, lastUpdate, epsilon, alpha, gamma } = useRLStore();

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        {algorithmType === 'qlearning' ? 'Q-Learning' : 'SARSA'} Update
      </h3>

      {/* Formula */}
      <div className="bg-slate-800/50 rounded-lg p-3">
        <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
          {algorithmType === 'qlearning' ? (
            <>Q(s,a) ← Q(s,a) + α[r + γ·max<sub>a'</sub>Q(s',a') - Q(s,a)]</>
          ) : (
            <>Q(s,a) ← Q(s,a) + α[r + γ·Q(s',a') - Q(s,a)]</>
          )}
        </p>
      </div>

      {/* Last update */}
      {lastUpdate && (
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-1.5">
          <p className="text-[10px] text-slate-500 font-medium">Last Update:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
            <span className="text-slate-500">State (s)</span>
            <span className="text-slate-300 font-mono">({lastUpdate.row}, {lastUpdate.col})</span>

            <span className="text-slate-500">Action (a)</span>
            <span className="text-slate-300 font-mono">{ACTION_NAMES[lastUpdate.action]}</span>

            <span className="text-slate-500">Reward (r)</span>
            <span className="text-slate-300 font-mono">{lastUpdate.reward.toFixed(2)}</span>

            <span className="text-slate-500">Next State (s')</span>
            <span className="text-slate-300 font-mono">({lastUpdate.nextRow}, {lastUpdate.nextCol})</span>

            <span className="text-slate-500">Old Q(s,a)</span>
            <span className="text-slate-300 font-mono">{lastUpdate.oldQ.toFixed(4)}</span>

            <span className="text-slate-500">New Q(s,a)</span>
            <span className="text-blue-400 font-mono font-medium">{lastUpdate.newQ.toFixed(4)}</span>
          </div>

          <div className="pt-1.5 border-t border-slate-700">
            <p className="text-[9px] text-slate-500 font-mono">
              Q = {lastUpdate.oldQ.toFixed(3)} + {alpha} × [{lastUpdate.reward.toFixed(1)} + {gamma} × {((lastUpdate.target - lastUpdate.reward) / gamma).toFixed(3)} - {lastUpdate.oldQ.toFixed(3)}] = {lastUpdate.newQ.toFixed(3)}
            </p>
          </div>
        </div>
      )}

      {/* Hyperparameters */}
      <div className="bg-slate-800/50 rounded-lg p-3 space-y-1">
        <p className="text-[10px] text-slate-500 font-medium">Parameters:</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <span className="text-slate-500">ε (epsilon)</span>
          <span className="text-slate-300 font-mono">{epsilon.toFixed(2)} — exploration rate</span>
          <span className="text-slate-500">α (alpha)</span>
          <span className="text-slate-300 font-mono">{alpha.toFixed(2)} — learning rate</span>
          <span className="text-slate-500">γ (gamma)</span>
          <span className="text-slate-300 font-mono">{gamma.toFixed(2)} — discount factor</span>
        </div>
      </div>

      {/* Explanation */}
      <div className="text-[10px] text-slate-600 leading-relaxed">
        {algorithmType === 'qlearning' ? (
          <p><strong className="text-slate-500">Q-Learning</strong> is an off-policy algorithm. It updates using the maximum Q-value of the next state, regardless of which action was actually taken. This makes it more aggressive in finding optimal paths.</p>
        ) : (
          <p><strong className="text-slate-500">SARSA</strong> is an on-policy algorithm. It updates using the Q-value of the action actually taken in the next state. This makes it more conservative and safer, as it accounts for exploration in its value estimates.</p>
        )}
      </div>
    </div>
  );
}
