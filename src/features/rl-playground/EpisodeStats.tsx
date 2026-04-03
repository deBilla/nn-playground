import { useRLStore } from '../../stores/rlStore';

export function EpisodeStats() {
  const { episodeRewards } = useRLStore();

  if (episodeRewards.length < 2) {
    return (
      <div className="h-full flex flex-col">
        <h3 className="text-xs font-medium text-slate-500 mb-2">Episode Stats</h3>
        <div className="flex-1 flex items-center justify-center text-xs text-slate-600">
          Start training to see episode statistics
        </div>
      </div>
    );
  }

  const width = 500;
  const height = 140;
  const padding = { top: 10, right: 10, bottom: 20, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Show last 200 episodes
  const data = episodeRewards.slice(-200);
  const maxR = Math.max(...data);
  const minR = Math.min(...data);
  const range = maxR - minR || 1;

  const points = data.map((reward, i) => {
    const x = padding.left + (i / (data.length - 1)) * plotW;
    const y = padding.top + (1 - (reward - minR) / range) * plotH;
    return `${x},${y}`;
  }).join(' ');

  // Moving average
  const windowSize = Math.min(20, Math.floor(data.length / 3));
  const avgPoints: string[] = [];
  if (windowSize > 1) {
    for (let i = windowSize - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = i - windowSize + 1; j <= i; j++) sum += data[j];
      const avg = sum / windowSize;
      const x = padding.left + (i / (data.length - 1)) * plotW;
      const y = padding.top + (1 - (avg - minR) / range) * plotH;
      avgPoints.push(`${x},${y}`);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xs font-medium text-slate-500 mb-2">
        Episode Rewards
        <span className="text-slate-600 ml-2">({episodeRewards.length} episodes)</span>
      </h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="flex-1 w-full">
        {/* Axes */}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotH} stroke="#334155" />
        <line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH} stroke="#334155" />

        {/* Y labels */}
        <text x={padding.left - 4} y={padding.top + 4} textAnchor="end" className="text-[8px] fill-slate-500">{maxR.toFixed(1)}</text>
        <text x={padding.left - 4} y={padding.top + plotH} textAnchor="end" className="text-[8px] fill-slate-500">{minR.toFixed(1)}</text>

        {/* Raw data */}
        <polyline points={points} fill="none" stroke="#475569" strokeWidth={0.5} />

        {/* Moving average */}
        {avgPoints.length > 1 && (
          <polyline points={avgPoints.join(' ')} fill="none" stroke="#22d3ee" strokeWidth={2} />
        )}

        <text x={padding.left + plotW / 2} y={height - 2} textAnchor="middle" className="text-[8px] fill-slate-500">Episode</text>
      </svg>
    </div>
  );
}
