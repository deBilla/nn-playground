import { useEffect, useRef, useCallback } from 'react';
import { useFightStore } from './stores/fightStore';
import { ArenaCanvas } from './components/ArenaCanvas';
import { FightControls } from './components/FightControls';
import { FightStats } from './components/FightStats';
import { BettingPanel } from './components/BettingPanel';
import { InfoBanner } from '../../components/InfoBanner';

export function FightClub() {
  const rafRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loop = useCallback(() => {
    const state = useFightStore.getState();
    if (state.runState === 'running') {
      const spd = state.speed;
      if (spd <= 3) {
        const interval = spd === 1 ? 6 : 2;
        frameCountRef.current++;
        if (frameCountRef.current >= interval) {
          state.step();
          frameCountRef.current = 0;
        }
      } else {
        for (let i = 0; i < spd; i++) {
          state.step();
        }
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  const isShowtime = useFightStore(s => s.isShowtime);

  return (
    <div className="h-full flex">
      {/* Left sidebar — controls */}
      <div className="w-72 border-r border-slate-800 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-900/50">
        <InfoBanner title="Robot Fight Club" variant="info" defaultOpen={!isShowtime} dismissable>
          <p>Two RL agents learn to fight through Q-learning. They start with zero knowledge — every punch, block, and dodge is discovered through trial and error.</p>
          <p>Watch their strategies evolve: early rounds are random flailing, but after hundreds of fights, real combat patterns emerge.</p>
        </InfoBanner>
        <FightControls canvasRef={canvasRef} />
        <InfoBanner title="How it works" variant="legend" defaultOpen={false}>
          <p><strong style={{ color: '#ef4444' }}>Red</strong> and <strong style={{ color: '#3b82f6' }}>Blue</strong> each have a Q-table mapping fight situations to action values.</p>
          <p><strong style={{ color: '#cbd5e1' }}>State:</strong> Position, HP, distance to opponent, opponent's action, cooldown status.</p>
          <p><strong style={{ color: '#cbd5e1' }}>Actions:</strong> Move left/right, punch (close, fast), kick (far, slow), block (reduce damage 80%), dodge (backstep).</p>
          <p><strong style={{ color: '#cbd5e1' }}>Rewards:</strong> +10/15 for hits, -10/15 for getting hit, +5 for blocking, +100 for winning, -100 for losing.</p>
        </InfoBanner>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 p-4 flex items-center justify-center">
          <ArenaCanvas ref={canvasRef} />
        </div>
        <div className="h-48 border-t border-slate-800 p-4">
          <FightStats />
        </div>
      </div>

      {/* Right sidebar — betting (showtime only) */}
      {isShowtime && (
        <div className="w-64 border-l border-slate-800 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-900/50">
          <BettingPanel />
        </div>
      )}
    </div>
  );
}
