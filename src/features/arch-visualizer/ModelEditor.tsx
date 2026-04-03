import { Plus, Trash2 } from 'lucide-react';
import { useArchStore, type LayerType } from '../../stores/archStore';
import { useState } from 'react';

const ADDABLE_TYPES: LayerType[] = ['dense', 'conv2d', 'maxpool2d', 'flatten', 'dropout', 'batchnorm'];

export function ModelEditor() {
  const { model, selectedLayerIdx, addLayer, removeLayer, updateLayerParams } = useArchStore();
  const [addType, setAddType] = useState<LayerType>('dense');

  const selectedLayer = selectedLayerIdx !== null ? model.layers[selectedLayerIdx] : null;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Editor</h2>

      {/* Add layer */}
      <div className="flex gap-1">
        <select
          value={addType}
          onChange={(e) => setAddType(e.target.value as LayerType)}
          className="flex-1 bg-slate-800 text-slate-200 rounded px-2 py-1.5 text-xs border border-slate-700"
        >
          {ADDABLE_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button
          onClick={() => {
            const idx = selectedLayerIdx !== null ? selectedLayerIdx + 1 : model.layers.length - 1;
            addLayer(addType, idx);
          }}
          className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs flex items-center gap-1"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {/* Selected layer editor */}
      {selectedLayer && selectedLayerIdx !== null && (
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-300">{selectedLayer.name}</span>
            {selectedLayer.type !== 'input' && (
              <button
                onClick={() => removeLayer(selectedLayerIdx)}
                className="p-1 text-red-400 hover:text-red-300"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>

          {/* Editable params */}
          {Object.entries(selectedLayer.params).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <label className="text-[10px] text-slate-500 w-16">{key}</label>
              {key === 'activation' ? (
                <select
                  value={String(value)}
                  onChange={(e) => updateLayerParams(selectedLayerIdx, { [key]: e.target.value })}
                  className="flex-1 bg-slate-700 text-slate-200 rounded px-2 py-1 text-xs border border-slate-600"
                >
                  {['relu', 'sigmoid', 'tanh', 'softmax', 'linear'].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={Number(value)}
                  onChange={(e) => updateLayerParams(selectedLayerIdx, { [key]: Number(e.target.value) })}
                  className="flex-1 bg-slate-700 text-slate-200 rounded px-2 py-1 text-xs border border-slate-600"
                />
              )}
            </div>
          ))}

          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-700">
            Input: [{selectedLayer.inputShape.join(', ')}] → Output: [{selectedLayer.outputShape.join(', ')}]
          </div>
        </div>
      )}

      {!selectedLayer && (
        <p className="text-xs text-slate-600">Click a layer in the diagram to edit it</p>
      )}
    </div>
  );
}
