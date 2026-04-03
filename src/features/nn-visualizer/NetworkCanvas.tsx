import { useMemo } from 'react';
import { useNNStore } from '../../stores/nnStore';

function valueToColor(value: number): string {
  // Map value to blue (negative) -> white (zero) -> orange (positive)
  const clamped = Math.max(-1, Math.min(1, value));
  if (clamped < 0) {
    const t = -clamped;
    const r = Math.round(59 + (255 - 59) * (1 - t));
    const g = Math.round(130 + (255 - 130) * (1 - t));
    const b = 246;
    return `rgb(${r},${g},${b})`;
  } else {
    const t = clamped;
    const r = 249;
    const g = Math.round(115 + (255 - 115) * (1 - t));
    const b = Math.round(22 + (255 - 22) * (1 - t));
    return `rgb(${r},${g},${b})`;
  }
}

function weightToColor(weight: number): string {
  return weight > 0 ? '#3b82f6' : '#f97316';
}

export function NetworkCanvas() {
  const { network, snapshot, hiddenLayers } = useNNStore();

  const layerSizes = network ? network.layerSizes : [2, ...hiddenLayers, 1];

  const layout = useMemo(() => {
    const padding = 40;
    const maxNeurons = Math.max(...layerSizes);
    const numLayers = layerSizes.length;

    return {
      layerSizes,
      numLayers,
      maxNeurons,
      padding,
    };
  }, [layerSizes]);

  const neuronRadius = 16;
  const svgWidth = 800;
  const svgHeight = 400;

  const layerX = (i: number) =>
    layout.padding + ((svgWidth - 2 * layout.padding) / (layout.numLayers - 1)) * i;

  const neuronY = (layerIdx: number, neuronIdx: number) => {
    const size = layout.layerSizes[layerIdx];
    const totalHeight = (size - 1) * 50;
    const startY = (svgHeight - totalHeight) / 2;
    return startY + neuronIdx * 50;
  };

  const getNeuronValue = (layerIdx: number, neuronIdx: number): number => {
    if (layerIdx === 0) return 0;
    const snapIdx = layerIdx - 1;
    if (snapshot[snapIdx] && snapshot[snapIdx].outputs[neuronIdx] !== undefined) {
      return snapshot[snapIdx].outputs[neuronIdx];
    }
    return 0;
  };

  const getWeight = (fromLayer: number, fromNeuron: number, toNeuron: number): number => {
    if (snapshot[fromLayer] && snapshot[fromLayer].weights[toNeuron]) {
      return snapshot[fromLayer].weights[toNeuron][fromNeuron] || 0;
    }
    return 0;
  };

  const layerLabels = [
    'Input',
    ...hiddenLayers.map((_, i) => `Hidden ${i + 1}`),
    'Output',
  ];

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs font-medium text-slate-500 mb-2">Network Architecture</h3>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="flex-1 w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Connections */}
        {layout.layerSizes.slice(0, -1).map((size, li) =>
          Array.from({ length: size }, (_, fi) =>
            Array.from({ length: layout.layerSizes[li + 1] }, (_, ti) => {
              const w = getWeight(li, fi, ti);
              const absW = Math.abs(w);
              return (
                <line
                  key={`${li}-${fi}-${ti}`}
                  x1={layerX(li)}
                  y1={neuronY(li, fi)}
                  x2={layerX(li + 1)}
                  y2={neuronY(li + 1, ti)}
                  stroke={weightToColor(w)}
                  strokeWidth={Math.max(0.5, Math.min(3, absW * 2))}
                  opacity={Math.max(0.1, Math.min(0.8, absW))}
                />
              );
            })
          )
        )}

        {/* Neurons */}
        {layout.layerSizes.map((size, li) =>
          Array.from({ length: size }, (_, ni) => {
            const val = getNeuronValue(li, ni);
            return (
              <g key={`neuron-${li}-${ni}`}>
                <circle
                  cx={layerX(li)}
                  cy={neuronY(li, ni)}
                  r={neuronRadius}
                  fill={li === 0 ? '#1e293b' : valueToColor(val)}
                  stroke="#475569"
                  strokeWidth={1.5}
                />
                <text
                  x={layerX(li)}
                  y={neuronY(li, ni) + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[9px] font-mono fill-slate-300 pointer-events-none select-none"
                >
                  {li === 0
                    ? ['x', 'y'][ni]
                    : val.toFixed(2)}
                </text>
              </g>
            );
          })
        )}

        {/* Layer labels */}
        {layerLabels.map((label, li) => (
          <text
            key={`label-${li}`}
            x={layerX(li)}
            y={svgHeight - 10}
            textAnchor="middle"
            className="text-[10px] fill-slate-500 select-none"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
