import { create } from 'zustand';
import { createFighter, discretizeState, ACTIONS, ARENA_WIDTH, type FighterState } from '../lib/fighter';
import { stepArena, resetRound } from '../lib/arena';
import { FightAgent } from '../lib/fightAgent';

interface FightState {
  redAgent: FightAgent;
  blueAgent: FightAgent;
  red: FighterState;
  blue: FighterState;
  round: number;
  stepCount: number;
  maxSteps: number;
  redWins: number;
  blueWins: number;
  draws: number;
  roundRewards: { red: number; blue: number }[];
  runState: 'idle' | 'running' | 'paused';
  speed: number;
  epsilon: number;
  alpha: number;
  gamma: number;
  lastWinner: 'red' | 'blue' | 'draw' | null;
  announceTimer: number;

  step: () => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  resetAgents: () => void;
  setSpeed: (s: number) => void;
  setEpsilon: (v: number) => void;
  setAlpha: (v: number) => void;
  setGamma: (v: number) => void;
}

export const useFightStore = create<FightState>((set, get) => ({
  redAgent: new FightAgent(0.5, 0.2, 0.9),
  blueAgent: new FightAgent(0.5, 0.2, 0.9),
  red: createFighter(150, 1),
  blue: createFighter(ARENA_WIDTH - 150, -1),
  round: 1,
  stepCount: 0,
  maxSteps: 500,
  redWins: 0,
  blueWins: 0,
  draws: 0,
  roundRewards: [],
  runState: 'idle',
  speed: 1000,
  epsilon: 0.5,
  alpha: 0.2,
  gamma: 0.9,
  lastWinner: null,
  announceTimer: 0,

  step: () => {
    const { red, blue, redAgent, blueAgent, stepCount, maxSteps, round, redWins, blueWins, draws, roundRewards, announceTimer } = get();

    if (announceTimer > 0) {
      set({ announceTimer: announceTimer - 1 });
      if (announceTimer <= 1) {
        resetRound(red, blue);
        set({ red: { ...red }, blue: { ...blue }, stepCount: 0, lastWinner: null });
      }
      return;
    }

    // Get states
    const redState = discretizeState(red, blue);
    const blueState = discretizeState(blue, red);

    // Choose actions
    const redAction = redAgent.chooseAction(redState);
    const blueAction = blueAgent.chooseAction(blueState);

    // Step arena
    const result = stepArena(red, blue, redAction, blueAction);

    // Get new states
    const newRedState = discretizeState(red, blue);
    const newBlueState = discretizeState(blue, red);

    // Update Q-tables
    const redActionIdx = ACTIONS.indexOf(redAction);
    const blueActionIdx = ACTIONS.indexOf(blueAction);
    redAgent.update(redState, redActionIdx, result.redReward, newRedState, result.roundOver);
    blueAgent.update(blueState, blueActionIdx, result.blueReward, newBlueState, result.roundOver);

    const newStepCount = stepCount + 1;
    let roundOver = result.roundOver || newStepCount >= maxSteps;
    let winner = result.winner;
    if (newStepCount >= maxSteps && !result.roundOver) {
      winner = 'draw';
      roundOver = true;
    }

    if (roundOver) {
      set({
        red: { ...red },
        blue: { ...blue },
        stepCount: newStepCount,
        round: round + 1,
        redWins: redWins + (winner === 'red' ? 1 : 0),
        blueWins: blueWins + (winner === 'blue' ? 1 : 0),
        draws: draws + (winner === 'draw' ? 1 : 0),
        roundRewards: [...roundRewards, { red: red.roundReward, blue: blue.roundReward }],
        lastWinner: winner,
        announceTimer: 40, // show result for ~40 frames
      });
    } else {
      set({ red: { ...red }, blue: { ...blue }, stepCount: newStepCount });
    }
  },

  play: () => set({ runState: 'running' }),
  pause: () => set({ runState: 'paused' }),

  reset: () => {
    const { epsilon, alpha, gamma } = get();
    const redAgent = new FightAgent(epsilon, alpha, gamma);
    const blueAgent = new FightAgent(epsilon, alpha, gamma);
    set({
      redAgent, blueAgent,
      red: createFighter(150, 1),
      blue: createFighter(ARENA_WIDTH - 150, -1),
      round: 1, stepCount: 0, redWins: 0, blueWins: 0, draws: 0,
      roundRewards: [], runState: 'idle', lastWinner: null, announceTimer: 0,
    });
  },

  resetAgents: () => {
    get().redAgent.reset();
    get().blueAgent.reset();
    set({
      red: createFighter(150, 1),
      blue: createFighter(ARENA_WIDTH - 150, -1),
      round: 1, stepCount: 0, redWins: 0, blueWins: 0, draws: 0,
      roundRewards: [], lastWinner: null, announceTimer: 0,
    });
  },

  setSpeed: (s) => set({ speed: s }),
  setEpsilon: (v) => { get().redAgent.epsilon = v; get().blueAgent.epsilon = v; set({ epsilon: v }); },
  setAlpha: (v) => { get().redAgent.alpha = v; get().blueAgent.alpha = v; set({ alpha: v }); },
  setGamma: (v) => { get().redAgent.gamma = v; get().blueAgent.gamma = v; set({ gamma: v }); },
}));
