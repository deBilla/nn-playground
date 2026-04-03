import { useRef, useEffect } from 'react';
import { useFightStore } from '../stores/fightStore';
import { ARENA_WIDTH, FLOOR_Y, ROBOT_WIDTH, ROBOT_HEIGHT, type FighterState } from '../lib/fighter';

const CANVAS_H = 400;

function drawRobot(ctx: CanvasRenderingContext2D, f: FighterState, color: string, label: string) {
  const x = f.x;
  const y = FLOOR_Y;
  const flash = f.hitFlash > 0;
  const bodyColor = flash ? '#ffffff' : color;
  const darkColor = flash ? '#cccccc' : (color === '#ef4444' ? '#991b1b' : '#1e3a5f');

  ctx.save();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + 5, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = darkColor;
  if (f.animState === 'kicking') {
    // Kick leg extended
    ctx.fillRect(x - 8, y - 20, 8, 22);
    ctx.fillRect(x + (f.facing === 1 ? 5 : -35), y - 15, 30, 8);
  } else {
    ctx.fillRect(x - 10, y - 22, 8, 22);
    ctx.fillRect(x + 2, y - 22, 8, 22);
  }

  // Body
  ctx.fillStyle = bodyColor;
  const bodyY = y - ROBOT_HEIGHT;
  ctx.fillRect(x - ROBOT_WIDTH / 2 + 5, bodyY + 10, ROBOT_WIDTH - 10, 35);

  // Arms
  if (f.animState === 'blocking') {
    // Arms crossed
    ctx.fillStyle = darkColor;
    ctx.fillRect(x - 18, bodyY + 15, 36, 8);
    // Shield glow
    ctx.strokeStyle = `${color}88`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, bodyY + 25, 25, 0, Math.PI * 2);
    ctx.stroke();
  } else if (f.animState === 'punching') {
    // Punch arm extended
    ctx.fillStyle = darkColor;
    ctx.fillRect(x - 6, bodyY + 15, 8, 18); // back arm
    ctx.fillRect(x + (f.facing === 1 ? 10 : -35), bodyY + 16, 30, 8); // punch arm
  } else if (f.animState === 'dodging') {
    ctx.fillStyle = darkColor;
    ctx.fillRect(x - 14, bodyY + 18, 8, 16);
    ctx.fillRect(x + 6, bodyY + 18, 8, 16);
  } else {
    ctx.fillStyle = darkColor;
    ctx.fillRect(x - 14, bodyY + 15, 8, 20);
    ctx.fillRect(x + 6, bodyY + 15, 8, 20);
  }

  // Head
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(x, bodyY + 2, 12, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = f.animState === 'stunned' ? '#fbbf24' : '#000';
  const eyeDir = f.facing;
  if (f.animState === 'stunned') {
    // X eyes
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('X X', x, bodyY + 5);
  } else {
    ctx.beginPath();
    ctx.arc(x + eyeDir * 4 - 3, bodyY, 2, 0, Math.PI * 2);
    ctx.arc(x + eyeDir * 4 + 3, bodyY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Label
  ctx.fillStyle = color;
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, bodyY - 20);

  // HP bar above robot
  const barW = 44;
  const barH = 5;
  const barX = x - barW / 2;
  const barY = bodyY - 14;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(barX, barY, barW, barH);
  const hpRatio = Math.max(0, f.hp / 100);
  ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(barX, barY, barW * hpRatio, barH);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(barX, barY, barW, barH);

  // Damage numbers
  for (const d of f.damageNumbers) {
    const alpha = Math.max(0, 1 - d.age / 30);
    ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
    ctx.font = `bold ${12 + d.age * 0.2}px system-ui`;
    ctx.textAlign = 'center';
    ctx.fillText(`-${d.value}`, d.x, FLOOR_Y - ROBOT_HEIGHT - 30 - d.age * 1.5);
  }

  ctx.restore();
}

export function ArenaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { red, blue, round, stepCount, lastWinner, announceTimer } = useFightStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(0.7, '#0f172a');
    grad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ARENA_WIDTH, CANVAS_H);

    // Spotlight
    const spotGrad = ctx.createRadialGradient(ARENA_WIDTH / 2, 0, 50, ARENA_WIDTH / 2, FLOOR_Y, 400);
    spotGrad.addColorStop(0, 'rgba(255,255,255,0.03)');
    spotGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, ARENA_WIDTH, CANVAS_H);

    // Floor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, FLOOR_Y + 5, ARENA_WIDTH, CANVAS_H - FLOOR_Y);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y + 5);
    ctx.lineTo(ARENA_WIDTH, FLOOR_Y + 5);
    ctx.stroke();

    // Ring ropes (decorative)
    ctx.strokeStyle = '#47515944';
    ctx.lineWidth = 1;
    [FLOOR_Y - 60, FLOOR_Y - 30].forEach(ry => {
      ctx.beginPath();
      ctx.moveTo(10, ry);
      ctx.lineTo(ARENA_WIDTH - 10, ry);
      ctx.stroke();
    });

    // Draw robots
    drawRobot(ctx, red, '#ef4444', 'RED');
    drawRobot(ctx, blue, '#3b82f6', 'BLUE');

    // Round info
    ctx.fillStyle = '#475569';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`Round ${round}  |  Step ${stepCount}`, ARENA_WIDTH / 2, 20);

    // Winner announcement
    if (lastWinner && announceTimer > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, CANVAS_H / 2 - 40, ARENA_WIDTH, 80);

      ctx.font = 'bold 28px system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = lastWinner === 'red' ? '#ef4444' : lastWinner === 'blue' ? '#3b82f6' : '#f59e0b';
      const text = lastWinner === 'draw' ? 'DRAW!' : `${lastWinner.toUpperCase()} WINS!`;
      ctx.fillText(text, ARENA_WIDTH / 2, CANVAS_H / 2 + 8);
    }

  }, [red, blue, round, stepCount, lastWinner, announceTimer]);

  return (
    <canvas
      ref={canvasRef}
      width={ARENA_WIDTH}
      height={CANVAS_H}
      style={{ width: '100%', maxWidth: ARENA_WIDTH, borderRadius: '8px', border: '1px solid #1e293b' }}
    />
  );
}
