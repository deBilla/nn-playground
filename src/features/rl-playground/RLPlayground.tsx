import { useEffect, useRef, useCallback } from 'react';
import { useRLStore } from '../../stores/rlStore';
import { InfoBanner } from '../../components/InfoBanner';
import { GridCanvas } from './GridCanvas';
import { RLControls } from './RLControls';
import { EpisodeStats } from './EpisodeStats';
import { AlgorithmInfo } from './AlgorithmInfo';

export function RLPlayground() {
  const rafRef = useRef<number>(0);

  const loop = useCallback(() => {
    const state = useRLStore.getState();
    if (state.runState === 'running') {
      const stepsPerFrame = state.speed;
      for (let i = 0; i < stepsPerFrame; i++) {
        state.stepAgent();
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  return (
    <div className="h-full flex">
      {/* Left sidebar */}
      <div className="w-72 border-r border-slate-800 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-900/50">
        <RLControls />
        <RLInfoBanners />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 p-4 flex flex-col">
          {/* Grid legend */}
          <div className="flex items-center gap-4 mb-3 text-[10px] text-slate-500">
            <span className="font-medium text-slate-400">Grid Legend:</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-[#1e293b] border border-slate-700 inline-block"></span> Empty
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-[#374151] border border-slate-700 inline-block"></span> Wall
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-[#059669] border border-slate-700 inline-block"></span> Goal (+10)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm bg-[#dc2626] border border-slate-700 inline-block"></span> Pit (-10)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-[#fbbf24] border border-[#92400e] inline-block"></span> Agent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span> Policy arrow
            </span>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <GridCanvas />
          </div>
        </div>

        {/* Bottom panels */}
        <div className="h-56 border-t border-slate-800 flex">
          <div className="flex-1 p-4">
            <EpisodeStats />
          </div>
          <div className="w-96 border-l border-slate-800 p-4 overflow-y-auto">
            <AlgorithmInfo />
          </div>
        </div>
      </div>
    </div>
  );
}

function RLInfoBanners() {
  const { episode, episodeRewards, algorithmType } = useRLStore();

  const recentAvg = episodeRewards.length >= 20
    ? episodeRewards.slice(-20).reduce((a, b) => a + b, 0) / 20
    : null;

  return (
    <>
      <InfoBanner title="What is this?" variant="info" defaultOpen={true} dismissable>
        <p>
          This is a <strong className="text-slate-300">reinforcement learning</strong> agent learning to navigate a grid world.
          It starts knowing nothing and discovers the optimal path through trial and error.
        </p>
        <p>
          The agent (yellow circle) takes actions, receives rewards, and updates its
          <strong className="text-slate-300"> Q-table</strong> — a lookup table of "how good is each action in each cell."
        </p>
      </InfoBanner>

      {episode === 0 && (
        <InfoBanner title="Getting started" variant="tip" defaultOpen={true}>
          <p>Hit <strong className="text-slate-300">Play</strong> to start. The agent will explore randomly at first (epsilon = exploration rate), then gradually exploit what it has learned.</p>
          <p>Watch the <strong className="text-slate-300">Q-value triangles</strong> fill in — blue means "good direction", orange means "bad direction."</p>
        </InfoBanner>
      )}

      {episode > 0 && episode < 50 && (
        <InfoBanner title="Early exploration" variant="tip" defaultOpen={true}>
          <p>The agent is still exploring. It takes random actions {Math.round(useRLStore.getState().epsilon * 100)}% of the time. The Q-values are starting to spread backward from the goal.</p>
          <p>Notice how cells <strong className="text-slate-300">near the goal</strong> get good values first, then the knowledge slowly propagates to distant cells.</p>
        </InfoBanner>
      )}

      {recentAvg !== null && recentAvg > 5 && (
        <InfoBanner title="Agent has learned!" variant="tip" defaultOpen={true}>
          <p>The agent is consistently reaching the goal. Try setting <strong className="text-slate-300">epsilon to 0</strong> to see the pure learned policy — no more random exploration.</p>
          <p>Or try editing the grid (click cells) to see how it adapts to a new environment!</p>
        </InfoBanner>
      )}

      <InfoBanner title="What the visuals mean" variant="legend" defaultOpen={false}>
        <div className="space-y-1.5">
          <p><strong className="text-cyan-400">Q-Value triangles</strong> — Each cell has 4 triangles (up/right/down/left). The color and number show how valuable that action is. Blue = good, orange = bad.</p>
          <p><strong className="text-cyan-400">Policy arrows</strong> — Cyan arrows show the best action (highest Q-value) in each cell. This is the "greedy policy" — what the agent would do if it always exploited.</p>
          <p><strong className="text-cyan-400">State values</strong> — Toggle this to color cells by their value (max Q). Green = high value (near goal), red = low value (near pits).</p>
          <p><strong className="text-cyan-400">Episode</strong> — One complete run from start to goal/pit/timeout. Each episode resets the agent's position but keeps its learned Q-values.</p>
        </div>
      </InfoBanner>

      {algorithmType === 'qlearning' && (
        <InfoBanner title="Q-Learning vs SARSA" variant="legend" defaultOpen={false}>
          <p><strong className="text-slate-300">Q-Learning (current)</strong> updates using the best possible next action — even if the agent didn't take it. This is "off-policy" and finds the optimal path faster, but can be riskier near pits.</p>
          <p><strong className="text-slate-300">SARSA</strong> updates using the action actually taken next. This is "on-policy" and more conservative — the agent learns to avoid paths where random exploration might lead to pits.</p>
          <p>Try switching to SARSA and watch the policy near the pit change!</p>
        </InfoBanner>
      )}
    </>
  );
}
