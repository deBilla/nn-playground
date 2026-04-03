import { useNNStore } from '../../stores/nnStore';
import { InfoBanner } from '../../components/InfoBanner';

const DATASETS = ['xor', 'circle', 'spiral', 'gaussian'];
const ACTIVATIONS = ['relu', 'sigmoid', 'tanh'];
const LAYER_PRESETS = [
  { label: '1 layer (4)', value: [4] },
  { label: '2 layers (4, 4)', value: [4, 4] },
  { label: '2 layers (8, 4)', value: [8, 4] },
  { label: '3 layers (6, 4, 3)', value: [6, 4, 3] },
  { label: '4 layers (8, 6, 4, 3)', value: [8, 6, 4, 3] },
];

const DATASET_DESCRIPTIONS: Record<string, string> = {
  xor: 'Classic XOR — linearly inseparable, needs at least 1 hidden layer',
  circle: 'Inner vs outer ring — tests radial decision boundaries',
  spiral: 'Two interleaved spirals — hard! Needs deeper networks',
  gaussian: 'Two gaussian blobs — easy, almost linearly separable',
};

const ACTIVATION_DESCRIPTIONS: Record<string, string> = {
  relu: 'ReLU — most common, fast training, can "die" (output 0)',
  sigmoid: 'Sigmoid — smooth 0-1 output, slower training, vanishing gradients',
  tanh: 'Tanh — like sigmoid but -1 to 1, often works better for hidden layers',
};

export function ControlPanel() {
  const {
    datasetType, setDataset,
    activationType, setActivation,
    hiddenLayers, setHiddenLayers,
    learningRate, setLearningRate,
  } = useNNStore();

  const handleChange = (fn: () => void) => {
    fn();
    setTimeout(() => useNNStore.getState().initNetwork(), 0);
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Configuration</h2>

      {/* Dataset */}
      <div>
        <label className="block text-xs text-slate-500 mb-1">Dataset</label>
        <div className="grid grid-cols-2 gap-1">
          {DATASETS.map(d => (
            <button
              key={d}
              onClick={() => handleChange(() => setDataset(d))}
              className={`px-2 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
                datasetType === d
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 mt-1">{DATASET_DESCRIPTIONS[datasetType]}</p>
      </div>

      {/* Hidden Layers */}
      <div>
        <label className="block text-xs text-slate-500 mb-1">Hidden Layers</label>
        <select
          value={JSON.stringify(hiddenLayers)}
          onChange={(e) => handleChange(() => setHiddenLayers(JSON.parse(e.target.value)))}
          className="w-full bg-slate-800 text-slate-200 rounded px-2 py-1.5 text-xs border border-slate-700"
        >
          {LAYER_PRESETS.map(p => (
            <option key={p.label} value={JSON.stringify(p.value)}>{p.label}</option>
          ))}
        </select>
        <p className="text-[10px] text-slate-600 mt-1">
          More layers = more complex patterns, but slower and harder to train
        </p>
      </div>

      {/* Activation */}
      <div>
        <label className="block text-xs text-slate-500 mb-1">Activation</label>
        <div className="flex gap-1">
          {ACTIVATIONS.map(a => (
            <button
              key={a}
              onClick={() => handleChange(() => setActivation(a))}
              className={`flex-1 px-2 py-1.5 rounded text-xs font-medium capitalize transition-colors ${
                activationType === a
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 mt-1">{ACTIVATION_DESCRIPTIONS[activationType]}</p>
      </div>

      {/* Learning Rate */}
      <div>
        <label className="block text-xs text-slate-500 mb-1">
          Learning Rate: {learningRate.toFixed(4)}
        </label>
        <input
          type="range"
          min={-4}
          max={0}
          step={0.1}
          value={Math.log10(learningRate)}
          onChange={(e) => {
            setLearningRate(10 ** Number(e.target.value));
          }}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>0.0001 (slow)</span>
          <span>1.0 (fast)</span>
        </div>
        <p className="text-[10px] text-slate-600 mt-1">
          Too high = unstable training. Too low = painfully slow. Start around 0.01-0.1.
        </p>
      </div>

      <InfoBanner title="How it works" variant="legend" defaultOpen={false}>
        <div className="space-y-1.5">
          <p><strong className="text-slate-300">Forward pass</strong> — Data flows left-to-right through the network. Each neuron computes: activation(weights * inputs + bias).</p>
          <p><strong className="text-slate-300">Loss</strong> — Measures how wrong the output is. The network tries to minimize this.</p>
          <p><strong className="text-slate-300">Backpropagation</strong> — The error flows right-to-left, computing how much each weight contributed to the error.</p>
          <p><strong className="text-slate-300">Weight update</strong> — Each weight is nudged in the direction that reduces loss, scaled by the learning rate.</p>
          <p><strong className="text-slate-300">Epoch</strong> — One pass through all training data points.</p>
        </div>
      </InfoBanner>
    </div>
  );
}
