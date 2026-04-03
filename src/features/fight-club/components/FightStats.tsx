import { useFightStore } from '../stores/fightStore';

export function FightStats() {
  const { roundRewards, redWins, blueWins, draws } = useFightStore();

  if (roundRewards.length < 2) {
    return (
      <div className="h-full flex flex-col">
        <h3 style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Round Rewards</h3>
        <div className="flex-1 flex items-center justify-center" style={{ fontSize: '11px', color: '#334155' }}>
          Start fighting to see reward trends
        </div>
      </div>
    );
  }

  const data = roundRewards.slice(-200);
  const width = 500;
  const height = 160;
  const pad = { top: 10, right: 10, bottom: 20, left: 45 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const allVals = data.flatMap(d => [d.red, d.blue]);
  const maxV = Math.max(...allVals);
  const minV = Math.min(...allVals);
  const range = maxV - minV || 1;

  const toY = (v: number) => pad.top + (1 - (v - minV) / range) * plotH;

  const redPts = data.map((d, i) => `${pad.left + (i / (data.length - 1)) * plotW},${toY(d.red)}`).join(' ');
  const bluePts = data.map((d, i) => `${pad.left + (i / (data.length - 1)) * plotW},${toY(d.blue)}`).join(' ');

  const totalFights = redWins + blueWins + draws;
  const redRate = totalFights > 0 ? Math.round(redWins / totalFights * 100) : 0;
  const blueRate = totalFights > 0 ? Math.round(blueWins / totalFights * 100) : 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <h3 style={{ fontSize: '11px', color: '#64748b' }}>Round Rewards ({roundRewards.length} rounds)</h3>
        <div style={{ fontSize: '10px', color: '#475569' }}>
          Win rate: <span style={{ color: '#ef4444' }}>Red {redRate}%</span> | <span style={{ color: '#3b82f6' }}>Blue {blueRate}%</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="flex-1 w-full">
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + plotH} stroke="#1e293b" />
        <line x1={pad.left} y1={pad.top + plotH} x2={pad.left + plotW} y2={pad.top + plotH} stroke="#1e293b" />
        {/* Zero line */}
        <line x1={pad.left} y1={toY(0)} x2={pad.left + plotW} y2={toY(0)} stroke="#334155" strokeDasharray="3,3" />
        <text x={pad.left - 4} y={toY(0) + 3} textAnchor="end" style={{ fontSize: '8px', fill: '#475569' }}>0</text>
        <text x={pad.left - 4} y={pad.top + 4} textAnchor="end" style={{ fontSize: '8px', fill: '#475569' }}>{maxV.toFixed(0)}</text>
        <text x={pad.left - 4} y={pad.top + plotH} textAnchor="end" style={{ fontSize: '8px', fill: '#475569' }}>{minV.toFixed(0)}</text>

        <polyline points={redPts} fill="none" stroke="#ef4444" strokeWidth={1.5} opacity={0.7} />
        <polyline points={bluePts} fill="none" stroke="#3b82f6" strokeWidth={1.5} opacity={0.7} />

        <text x={pad.left + plotW / 2} y={height - 4} textAnchor="middle" style={{ fontSize: '8px', fill: '#475569' }}>Round</text>

        {/* Legend */}
        <line x1={pad.left + 8} y1={pad.top + 6} x2={pad.left + 20} y2={pad.top + 6} stroke="#ef4444" strokeWidth={2} />
        <text x={pad.left + 24} y={pad.top + 9} style={{ fontSize: '8px', fill: '#94a3b8' }}>Red</text>
        <line x1={pad.left + 48} y1={pad.top + 6} x2={pad.left + 60} y2={pad.top + 6} stroke="#3b82f6" strokeWidth={2} />
        <text x={pad.left + 64} y={pad.top + 9} style={{ fontSize: '8px', fill: '#94a3b8' }}>Blue</text>
      </svg>
    </div>
  );
}
