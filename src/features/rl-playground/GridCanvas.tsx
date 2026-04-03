import { useRef, useEffect } from 'react';
import { useRLStore } from '../../stores/rlStore';
import { ACTION_DELTAS, type CellType } from '../../lib/rl/gridWorld';

const CELL_SIZE = 70;

const CELL_COLORS: Record<CellType, string> = {
  empty: '#1e293b',
  wall: '#374151',
  goal: '#059669',
  pit: '#dc2626',
};

export function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    grid, agentPos, agent, showQValues, showPolicy, showStateValues,
    setCellType, episode, stepCount,
  } = useRLStore();

  const width = grid.width * CELL_SIZE;
  const height = grid.height * CELL_SIZE;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);

    // Draw cells
    for (let r = 0; r < grid.height; r++) {
      for (let c = 0; c < grid.width; c++) {
        const x = c * CELL_SIZE;
        const y = r * CELL_SIZE;
        const cell = grid.cells[r][c];

        // State value background
        if (showStateValues && cell !== 'wall') {
          const values = agent.getStateValues();
          const v = values[r][c];
          const maxV = 10;
          const t = Math.max(0, Math.min(1, (v + maxV) / (2 * maxV)));
          const red = Math.round(239 * (1 - t) + 34 * t);
          const green = Math.round(68 * (1 - t) + 197 * t);
          const blue = Math.round(68 * (1 - t) + 94 * t);
          ctx.fillStyle = `rgb(${red},${green},${blue})`;
        } else {
          ctx.fillStyle = CELL_COLORS[cell as CellType];
        }
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

        // Cell label
        if (cell === 'goal') {
          ctx.fillStyle = '#fff';
          ctx.font = '11px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('GOAL', x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 4);
        } else if (cell === 'pit') {
          ctx.fillStyle = '#fff';
          ctx.font = '11px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('PIT', x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 4);
        } else if (cell === 'wall') {
          ctx.fillStyle = '#9ca3af';
          ctx.font = '10px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('WALL', x + CELL_SIZE / 2, y + CELL_SIZE / 2 + 4);
        }

        // Q-value triangles
        if (showQValues && cell === 'empty') {
          const qValues = agent.qTable[r][c];
          const maxQ = Math.max(...qValues.map(Math.abs), 0.01);

          // Draw 4 triangles (up, right, down, left)
          const cx = x + CELL_SIZE / 2;
          const cy = y + CELL_SIZE / 2;
          const triangles = [
            [[cx, y], [x, y], [x + CELL_SIZE, y]], // up
            [[x + CELL_SIZE, y], [x + CELL_SIZE, y + CELL_SIZE], [cx, cy]], // right
            [[x, y + CELL_SIZE], [x + CELL_SIZE, y + CELL_SIZE], [cx, cy]], // down
            [[x, y], [x, y + CELL_SIZE], [cx, cy]], // left
          ];

          for (let a = 0; a < 4; a++) {
            const q = qValues[a];
            const intensity = Math.abs(q) / maxQ;
            if (q > 0) {
              ctx.fillStyle = `rgba(59, 130, 246, ${intensity * 0.4})`;
            } else {
              ctx.fillStyle = `rgba(249, 115, 22, ${intensity * 0.4})`;
            }
            ctx.beginPath();
            ctx.moveTo(triangles[a][0][0], triangles[a][0][1]);
            ctx.lineTo(triangles[a][1][0], triangles[a][1][1]);
            ctx.lineTo(triangles[a][2][0], triangles[a][2][1]);
            ctx.closePath();
            ctx.fill();

            // Q-value text
            const textPos = [
              [cx, y + 14],           // up
              [x + CELL_SIZE - 8, cy], // right
              [cx, y + CELL_SIZE - 6], // down
              [x + 8, cy],            // left
            ];
            ctx.fillStyle = '#94a3b8';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(q.toFixed(1), textPos[a][0], textPos[a][1]);
          }
        }

        // Policy arrows
        if (showPolicy && cell === 'empty') {
          const policy = agent.getPolicy();
          const action = policy[r][c];
          const [dr, dc] = ACTION_DELTAS[action];
          const cx = x + CELL_SIZE / 2;
          const cy = y + CELL_SIZE / 2;
          const arrowLen = 15;

          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - dc * arrowLen, cy - dr * arrowLen);
          ctx.lineTo(cx + dc * arrowLen, cy + dr * arrowLen);
          ctx.stroke();

          // Arrowhead
          const angle = Math.atan2(dr, dc);
          ctx.beginPath();
          ctx.moveTo(cx + dc * arrowLen, cy + dr * arrowLen);
          ctx.lineTo(
            cx + dc * arrowLen - 6 * Math.cos(angle - Math.PI / 6),
            cy + dr * arrowLen - 6 * Math.sin(angle - Math.PI / 6),
          );
          ctx.moveTo(cx + dc * arrowLen, cy + dr * arrowLen);
          ctx.lineTo(
            cx + dc * arrowLen - 6 * Math.cos(angle + Math.PI / 6),
            cy + dr * arrowLen - 6 * Math.sin(angle + Math.PI / 6),
          );
          ctx.stroke();
        }
      }
    }

    // Draw agent
    const ax = agentPos[1] * CELL_SIZE + CELL_SIZE / 2;
    const ay = agentPos[0] * CELL_SIZE + CELL_SIZE / 2;
    ctx.beginPath();
    ctx.arc(ax, ay, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Agent eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(ax - 4, ay - 3, 2, 0, Math.PI * 2);
    ctx.arc(ax + 4, ay - 3, 2, 0, Math.PI * 2);
    ctx.fill();

  }, [grid, agentPos, agent, showQValues, showPolicy, showStateValues, episode, stepCount]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const col = Math.floor((e.clientX - rect.left) * scaleX / CELL_SIZE);
    const row = Math.floor((e.clientY - rect.top) * scaleY / CELL_SIZE);

    if (row < 0 || row >= grid.height || col < 0 || col >= grid.width) return;
    if (row === grid.startPos[0] && col === grid.startPos[1]) return;

    const current = grid.cells[row][col];
    const cycle: CellType[] = ['empty', 'wall', 'pit', 'goal'];
    const nextIdx = (cycle.indexOf(current) + 1) % cycle.length;
    setCellType(row, col, cycle[nextIdx]);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      className="rounded-lg border border-slate-700 cursor-pointer"
      style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: `${grid.width}/${grid.height}` }}
    />
  );
}
