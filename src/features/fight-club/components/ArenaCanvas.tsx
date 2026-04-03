import { useEffect, forwardRef } from 'react';
import { useFightStore } from '../stores/fightStore';
import { ARENA_WIDTH, FLOOR_Y, ROBOT_WIDTH, ROBOT_HEIGHT, MAX_HP, type FighterState } from '../lib/fighter';

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
    ctx.fillStyle = darkColor;
    ctx.fillRect(x - 18, bodyY + 15, 36, 8);
    ctx.strokeStyle = `${color}88`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, bodyY + 25, 25, 0, Math.PI * 2);
    ctx.stroke();
  } else if (f.animState === 'punching') {
    ctx.fillStyle = darkColor;
    ctx.fillRect(x - 6, bodyY + 15, 8, 18);
    ctx.fillRect(x + (f.facing === 1 ? 10 : -35), bodyY + 16, 30, 8);
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

  // HP bar
  const barW = 44;
  const barH = 5;
  const barX = x - barW / 2;
  const barY = bodyY - 14;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(barX, barY, barW, barH);
  const hpRatio = Math.max(0, f.hp / MAX_HP);
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

function drawShowtimeScoreboard(ctx: CanvasRenderingContext2D, redHits: number, blueHits: number, red: FighterState, blue: FighterState, round: number, stepCount: number, isRecording: boolean) {
  const cx = ARENA_WIDTH / 2;

  // Scoreboard background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  const sbW = 460, sbH = 52;
  ctx.beginPath();
  ctx.roundRect(cx - sbW / 2, 4, sbW, sbH, 10);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.stroke();

  // RED side
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ef4444';
  ctx.fillText('RED', cx - 80, 24);

  ctx.font = 'bold 28px system-ui';
  ctx.fillStyle = '#ef4444';
  ctx.fillText(String(redHits), cx - 30, 42);

  // "HITS" label
  ctx.font = '9px system-ui';
  ctx.fillStyle = '#64748b';
  ctx.fillText('hits', cx - 80, 44);

  // VS separator
  ctx.font = 'bold 14px system-ui';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#475569';
  ctx.fillText('VS', cx, 36);

  // BLUE side
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#3b82f6';
  ctx.fillText('BLUE', cx + 80, 24);

  ctx.font = 'bold 28px system-ui';
  ctx.fillStyle = '#3b82f6';
  ctx.fillText(String(blueHits), cx + 30, 42);

  ctx.font = '9px system-ui';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  ctx.fillText('hits', cx + 80, 44);

  // Round + step below scoreboard
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#475569';
  ctx.fillText(`Round ${round}  •  Step ${stepCount}`, cx, 68);

  // Big HP bars
  const hpBarW = 160, hpBarH = 8, hpY = 74;
  // Red HP (right-aligned from center)
  const redHp = Math.max(0, red.hp / MAX_HP);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx - 10 - hpBarW, hpY, hpBarW, hpBarH);
  ctx.fillStyle = redHp > 0.5 ? '#22c55e' : redHp > 0.25 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(cx - 10 - hpBarW + hpBarW * (1 - redHp), hpY, hpBarW * redHp, hpBarH);

  // Blue HP (left-aligned from center)
  const blueHp = Math.max(0, blue.hp / MAX_HP);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx + 10, hpY, hpBarW, hpBarH);
  ctx.fillStyle = blueHp > 0.5 ? '#22c55e' : blueHp > 0.25 ? '#f59e0b' : '#ef4444';
  ctx.fillRect(cx + 10, hpY, hpBarW * blueHp, hpBarH);

  // HP text
  ctx.font = '9px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'right';
  ctx.fillText(`${red.hp} HP`, cx - 14 - hpBarW, hpY + 7);
  ctx.textAlign = 'left';
  ctx.fillText(`${blue.hp} HP`, cx + 14 + hpBarW, hpY + 7);

  // Recording indicator
  if (isRecording) {
    ctx.beginPath();
    ctx.arc(ARENA_WIDTH - 20, 20, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.font = '9px system-ui';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('REC', ARENA_WIDTH - 30, 24);
  }
}

export const ArenaCanvas = forwardRef<HTMLCanvasElement>(function ArenaCanvas(_, ref) {
  const { red, blue, round, stepCount, lastWinner, announceTimer, isShowtime, redHitsThisRound, blueHitsThisRound } = useFightStore();

  // Check if recording is active via a simple global
  const isRecording = typeof document !== 'undefined' && document.querySelector('[data-recording="true"]') !== null;

  useEffect(() => {
    const canvas = typeof ref === 'function' ? null : ref?.current;
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

    // Ring ropes
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

    // Showtime scoreboard or simple round info
    if (isShowtime) {
      drawShowtimeScoreboard(ctx, redHitsThisRound, blueHitsThisRound, red, blue, round, stepCount, isRecording);
    } else {
      ctx.fillStyle = '#475569';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`Round ${round}  |  Step ${stepCount}`, ARENA_WIDTH / 2, 20);
    }

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

  }, [red, blue, round, stepCount, lastWinner, announceTimer, isShowtime, redHitsThisRound, blueHitsThisRound, ref, isRecording]);

  return (
    <canvas
      ref={ref}
      width={ARENA_WIDTH}
      height={CANVAS_H}
      style={{ width: '100%', maxWidth: ARENA_WIDTH, borderRadius: '8px', border: '1px solid #1e293b' }}
    />
  );
});
