import { useNNStore } from '../../stores/nnStore';

export function LossChart() {
  const { lossHistory } = useNNStore();

  if (lossHistory.length < 2) {
    return (
      <div className="h-full flex flex-col">
        <h3 className="text-xs font-medium text-slate-500 mb-2">Loss</h3>
        <div className="flex-1 flex items-center justify-center text-xs text-slate-600 text-center px-4">
          Start training to see the loss curve.<br/>
          <span className="text-slate-700 text-[10px]">Loss measures how wrong the network's predictions are — lower is better.</span>
        </div>
      </div>
    );
  }

  const width = 260;
  const height = 160;
  const padding = { top: 10, right: 10, bottom: 20, left: 40 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const data = lossHistory.slice(-500);
  const maxLoss = Math.max(...data);
  const minLoss = Math.min(...data);
  const range = maxLoss - minLoss || 1;

  const points = data.map((loss, i) => {
    const x = padding.left + (i / (data.length - 1)) * plotW;
    const y = padding.top + (1 - (loss - minLoss) / range) * plotH;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-xs font-medium text-slate-500">Loss</h3>
        <span className="text-[10px] text-slate-600">— should decrease as the network learns</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="flex-1 w-full">
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotH} stroke="#334155" strokeWidth={1} />
        <line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH} stroke="#334155" strokeWidth={1} />

        <text x={padding.left - 4} y={padding.top + 4} textAnchor="end" className="text-[8px] fill-slate-500">{maxLoss.toFixed(3)}</text>
        <text x={padding.left - 4} y={padding.top + plotH} textAnchor="end" className="text-[8px] fill-slate-500">{minLoss.toFixed(3)}</text>

        <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth={1.5} />

        <text x={padding.left + plotW / 2} y={height - 2} textAnchor="middle" className="text-[8px] fill-slate-500">Epoch</text>
      </svg>
    </div>
  );
}
