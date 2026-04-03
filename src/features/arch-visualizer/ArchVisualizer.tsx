import { useArchStore, presetNames } from '../../stores/archStore';
import { InfoBanner } from '../../components/InfoBanner';
import { ArchDiagram } from './ArchDiagram';
import { SummaryTable } from './SummaryTable';
import { ModelEditor } from './ModelEditor';

export function ArchVisualizer() {
  const { model, presetName, selectPreset } = useArchStore();

  return (
    <div className="h-full flex">
      {/* Left sidebar */}
      <div className="w-72 border-r border-slate-800 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-900/50">
        <InfoBanner title="What is this?" variant="info" defaultOpen={true} dismissable>
          <p>
            This visualizes the <strong className="text-slate-300">architecture</strong> of a neural network —
            how layers are stacked, what types they are, and how many parameters each has.
          </p>
          <p>
            Select a preset model or build your own by adding layers. Click any layer in the diagram to inspect and edit it.
          </p>
        </InfoBanner>

        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Model Presets</h2>
        <div className="flex flex-col gap-1">
          {presetNames.map(name => (
            <button
              key={name}
              onClick={() => selectPreset(name)}
              className={`text-left px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                presetName === name
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {name === 'lenet5' ? 'LeNet-5' : name}
            </button>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-4">
          <ModelEditor />
        </div>

        <InfoBanner title="Layer types explained" variant="legend" defaultOpen={false}>
          <div className="space-y-1.5">
            <p><strong className="text-indigo-400">Input</strong> — Where data enters the network. Shape depends on your data (e.g., 784 for a 28x28 image flattened).</p>
            <p><strong className="text-blue-400">Dense</strong> — Fully connected layer. Every neuron connects to every neuron in the previous layer. Most parameters live here.</p>
            <p><strong className="text-emerald-400">Conv2D</strong> — Convolutional layer. Scans the input with small filters to detect patterns like edges, textures. Much fewer parameters than Dense for images.</p>
            <p><strong className="text-violet-400">MaxPool2D</strong> — Downsamples by taking the maximum value in each window. Reduces spatial size, no learnable parameters.</p>
            <p><strong className="text-amber-400">Flatten</strong> — Reshapes multi-dimensional data into a 1D vector. Needed before Dense layers when coming from Conv layers.</p>
            <p><strong className="text-gray-400">Dropout</strong> — Randomly zeros out neurons during training to prevent overfitting. No parameters.</p>
            <p><strong className="text-pink-400">BatchNorm</strong> — Normalizes layer outputs for faster, more stable training.</p>
          </div>
        </InfoBanner>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">{model.name}</h2>
          <p className="text-sm text-slate-400">{model.description}</p>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Architecture diagram */}
          <div className="flex-1 overflow-auto p-4">
            <InfoBanner title="Reading the diagram" variant="tip" defaultOpen={false} dismissable>
              <p>Data flows <strong className="text-slate-300">top to bottom</strong>. Each block is a layer — the color indicates its type. Click a block to select and edit it in the sidebar.</p>
              <p>The <strong className="text-slate-300">output shape</strong> shows the data dimensions after that layer. <strong className="text-slate-300">Params</strong> is the number of learnable weights — more params = more capacity but also more compute and risk of overfitting.</p>
            </InfoBanner>
            <div className="mt-3">
              <ArchDiagram />
            </div>
          </div>

          {/* Summary table */}
          <div className="w-96 border-l border-slate-800 overflow-auto p-4">
            <SummaryTable />
          </div>
        </div>
      </div>
    </div>
  );
}
