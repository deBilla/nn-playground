import { useArchStore, type LayerType } from '../../stores/archStore';

const LAYER_COLORS: Record<LayerType, string> = {
  input: '#6366f1',
  dense: '#3b82f6',
  conv2d: '#10b981',
  maxpool2d: '#8b5cf6',
  flatten: '#f59e0b',
  dropout: '#6b7280',
  batchnorm: '#ec4899',
  output: '#ef4444',
};

const BLOCK_WIDTH = 220;
const BLOCK_HEIGHT = 70;
const GAP = 20;

export function ArchDiagram() {
  const { model, selectedLayerIdx, selectLayer } = useArchStore();
  const layers = model.layers;

  const svgHeight = layers.length * (BLOCK_HEIGHT + GAP) + 40;
  const svgWidth = BLOCK_WIDTH + 80;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full max-w-sm mx-auto"
      style={{ minHeight: svgHeight }}
    >
      {layers.map((layer, i) => {
        const x = (svgWidth - BLOCK_WIDTH) / 2;
        const y = 20 + i * (BLOCK_HEIGHT + GAP);
        const color = LAYER_COLORS[layer.type];
        const isSelected = selectedLayerIdx === i;

        return (
          <g key={layer.id} onClick={() => selectLayer(isSelected ? null : i)} className="cursor-pointer">
            {/* Arrow from previous layer */}
            {i > 0 && (
              <line
                x1={svgWidth / 2}
                y1={y - GAP}
                x2={svgWidth / 2}
                y2={y}
                stroke="#475569"
                strokeWidth={2}
                markerEnd="url(#arrowhead)"
              />
            )}

            {/* Block */}
            <rect
              x={x}
              y={y}
              width={BLOCK_WIDTH}
              height={BLOCK_HEIGHT}
              rx={8}
              fill={isSelected ? color : `${color}33`}
              stroke={color}
              strokeWidth={isSelected ? 2.5 : 1.5}
            />

            {/* Layer type + name */}
            <text
              x={x + 12}
              y={y + 22}
              className="text-[11px] font-semibold fill-white select-none"
            >
              {layer.name}
              <tspan className="fill-slate-400 font-normal"> ({layer.type})</tspan>
            </text>

            {/* Output shape */}
            <text
              x={x + 12}
              y={y + 40}
              className="text-[10px] fill-slate-400 select-none"
            >
              Output: [{layer.outputShape.join(', ')}]
            </text>

            {/* Param count */}
            <text
              x={x + 12}
              y={y + 56}
              className="text-[10px] fill-slate-500 select-none"
            >
              Params: {layer.paramCount.toLocaleString()}
            </text>

            {/* Activation badge */}
            {layer.params.activation && (
              <text
                x={x + BLOCK_WIDTH - 12}
                y={y + 22}
                textAnchor="end"
                className="text-[9px] fill-slate-400 select-none"
              >
                {String(layer.params.activation)}
              </text>
            )}
          </g>
        );
      })}

      {/* Arrow marker */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#475569" />
        </marker>
      </defs>
    </svg>
  );
}
