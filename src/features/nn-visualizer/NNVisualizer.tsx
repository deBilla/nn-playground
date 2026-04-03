import { useEffect, useRef, useCallback } from 'react';
import { useNNStore } from '../../stores/nnStore';
import { InfoBanner } from '../../components/InfoBanner';
import { ControlPanel } from './ControlPanel';
import { NetworkCanvas } from './NetworkCanvas';
import { DecisionBoundary } from './DecisionBoundary';
import { LossChart } from './LossChart';
import { TrainingControls } from './TrainingControls';

export function NNVisualizer() {
  const { initNetwork, epoch, lossHistory } = useNNStore();
  const rafRef = useRef<number>(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initNetwork();
      initialized.current = true;
    }
  }, [initNetwork]);

  const loop = useCallback(() => {
    const state = useNNStore.getState();
    if (state.trainingState === 'running') {
      for (let i = 0; i < 5; i++) {
        state.trainStep();
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  const currentLoss = lossHistory.length > 0 ? lossHistory[lossHistory.length - 1] : null;

  return (
    <div className="h-full flex">
      {/* Left sidebar */}
      <div className="w-72 border-r border-slate-800 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-900/50">
        <InfoBanner title="What is this?" variant="info" defaultOpen={true} dismissable>
          <p>
            This is a <strong className="text-slate-300">live neural network</strong> training in your browser.
            Pick a dataset, configure the network, and hit Play to watch it learn.
          </p>
          <p>
            The network learns to classify 2D points into two classes (blue vs orange)
            by adjusting its weights through <strong className="text-slate-300">backpropagation</strong>.
          </p>
        </InfoBanner>

        <ControlPanel />
        <TrainingControls />

        {/* Dynamic tips based on training state */}
        {epoch === 0 && (
          <InfoBanner title="Getting started" variant="tip" defaultOpen={true}>
            <p>Hit <strong className="text-slate-300">Play</strong> to start training, or <strong className="text-slate-300">Step</strong> to advance one epoch at a time.</p>
            <p>Try the <strong className="text-slate-300">spiral</strong> dataset — it needs more hidden layers to solve!</p>
          </InfoBanner>
        )}

        {epoch > 50 && currentLoss !== null && currentLoss > 0.4 && (
          <InfoBanner title="Training seems stuck" variant="tip" defaultOpen={true}>
            <p>Loss is still high after {epoch} epochs. Try:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Increasing the number of hidden layers or neurons</li>
              <li>Switching activation function (try <strong className="text-slate-300">tanh</strong> or <strong className="text-slate-300">relu</strong>)</li>
              <li>Adjusting the learning rate</li>
              <li>Hitting <strong className="text-slate-300">Reset</strong> to try a new random initialization</li>
            </ul>
          </InfoBanner>
        )}

        {epoch > 20 && currentLoss !== null && currentLoss < 0.05 && (
          <InfoBanner title="Network has converged!" variant="tip" defaultOpen={true}>
            <p>Loss is very low — the network has learned to classify this dataset well. Look at the <strong className="text-slate-300">decision boundary</strong> below to see how it separates the two classes.</p>
            <p>Try a harder dataset or fewer neurons to see it struggle!</p>
          </InfoBanner>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Network visualization */}
        <div className="flex-1 min-h-0 p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xs font-medium text-slate-500">Network Architecture</h3>
            <div className="flex items-center gap-3 text-[10px] text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-blue-500 inline-block rounded"></span> positive weight
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-orange-500 inline-block rounded"></span> negative weight
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"></span> low value
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block"></span> high value
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <NetworkCanvas />
          </div>
        </div>

        {/* Bottom panels */}
        <div className="h-64 border-t border-slate-800 flex">
          <div className="flex-1 p-4">
            <DecisionBoundary />
          </div>
          <div className="w-80 border-l border-slate-800 p-4">
            <LossChart />
          </div>
        </div>
      </div>
    </div>
  );
}
