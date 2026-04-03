import { useArchStore } from '../../stores/archStore';

export function SummaryTable() {
  const { model } = useArchStore();
  const totalParams = model.layers.reduce((sum, l) => sum + l.paramCount, 0);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Model Summary</h3>

      <div className="bg-slate-800/50 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-800">
              <th className="text-left px-3 py-2 text-slate-400 font-medium">Layer</th>
              <th className="text-left px-3 py-2 text-slate-400 font-medium">Type</th>
              <th className="text-left px-3 py-2 text-slate-400 font-medium">Output Shape</th>
              <th className="text-right px-3 py-2 text-slate-400 font-medium">Params</th>
            </tr>
          </thead>
          <tbody>
            {model.layers.map((layer) => (
              <tr key={layer.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                <td className="px-3 py-2 text-slate-300">{layer.name}</td>
                <td className="px-3 py-2 text-slate-500">{layer.type}</td>
                <td className="px-3 py-2 text-slate-400 font-mono">[{layer.outputShape.join(', ')}]</td>
                <td className="px-3 py-2 text-slate-400 font-mono text-right">{layer.paramCount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-700 bg-slate-800">
              <td colSpan={3} className="px-3 py-2 text-slate-300 font-medium">Total Parameters</td>
              <td className="px-3 py-2 text-white font-mono text-right font-semibold">{totalParams.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Additional info */}
      <div className="bg-slate-800/50 rounded-lg p-3 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Total layers</span>
          <span className="text-slate-300">{model.layers.length}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Trainable params</span>
          <span className="text-slate-300">{totalParams.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Estimated size</span>
          <span className="text-slate-300">{(totalParams * 4 / 1024 / 1024).toFixed(2)} MB</span>
        </div>
      </div>
    </div>
  );
}
