import { Play, Pause, RotateCcw, StepForward } from 'lucide-react';
import { useNNStore } from '../../stores/nnStore';

export function TrainingControls() {
  const { trainingState, epoch, lossHistory, play, pause, reset, trainStep } = useNNStore();
  const currentLoss = lossHistory.length > 0 ? lossHistory[lossHistory.length - 1] : 0;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Training</h2>

      <div className="flex gap-2">
        {trainingState === 'running' ? (
          <button
            onClick={pause}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Pause size={14} /> Pause
          </button>
        ) : (
          <button
            onClick={play}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Play size={14} /> Play
          </button>
        )}
        <button
          onClick={() => trainStep()}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
          title="Step"
        >
          <StepForward size={14} />
        </button>
        <button
          onClick={reset}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
          title="Reset"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-3 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Epoch</span>
          <span className="text-slate-300 font-mono">{epoch}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Loss</span>
          <span className="text-slate-300 font-mono">{currentLoss.toFixed(6)}</span>
        </div>
      </div>
    </div>
  );
}
