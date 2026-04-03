import { useState } from 'react';
import { Brain, Layers, Gamepad2 } from 'lucide-react';
import { NNVisualizer } from './features/nn-visualizer/NNVisualizer';
import { ArchVisualizer } from './features/arch-visualizer/ArchVisualizer';
import { RLPlayground } from './features/rl-playground/RLPlayground';

const tabs = [
  { id: 'nn', label: 'Neural Network', icon: Brain },
  { id: 'arch', label: 'Architecture', icon: Layers },
  { id: 'rl', label: 'RL Playground', icon: Gamepad2 },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('nn');

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
        <h1 className="text-lg font-semibold text-white tracking-tight">
          NN Playground
        </h1>
        <nav className="flex gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'nn' && <NNVisualizer />}
        {activeTab === 'arch' && <ArchVisualizer />}
        {activeTab === 'rl' && <RLPlayground />}
      </main>
    </div>
  );
}
