import { create } from 'zustand';
import { createFighter, discretizeState, ACTIONS, ARENA_WIDTH, type FighterState } from '../lib/fighter';
import { stepArena, resetRound } from '../lib/arena';
import { FightAgent } from '../lib/fightAgent';
import { warmStartAgent } from '../lib/expertPolicy';

export interface Bet {
  name: string;
  pick: 'red' | 'blue';
  amount: number;
}

export interface SettlementResult {
  name: string;
  pick: 'red' | 'blue';
  amount: number;
  won: boolean;
  draw: boolean;
}

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
  useExpertStart: boolean;
  isShowtime: boolean;
  redHitsThisRound: number;
  blueHitsThisRound: number;

  // Betting
  bets: Bet[];
  lastSettlement: SettlementResult[] | null;

  step: () => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  resetAgents: () => void;
  setSpeed: (s: number) => void;
  setEpsilon: (v: number) => void;
  setAlpha: (v: number) => void;
  setGamma: (v: number) => void;
  setUseExpertStart: (v: boolean) => void;
  setShowtime: (v: boolean) => void;
  addBet: (name: string, pick: 'red' | 'blue', amount: number) => void;
  removeBet: (index: number) => void;
  clearBets: () => void;
}

function createAgents(epsilon: number, alpha: number, gamma: number, useExpert: boolean): { red: FightAgent; blue: FightAgent } {
  const red = new FightAgent(epsilon, alpha, gamma);
  const blue = new FightAgent(epsilon, alpha, gamma);
  if (useExpert) {
    warmStartAgent(red, 300);
    warmStartAgent(blue, 300);
  }
  return { red, blue };
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
  useExpertStart: false,
  isShowtime: false,
  redHitsThisRound: 0,
  blueHitsThisRound: 0,
  bets: [],
  lastSettlement: null,

  step: () => {
    const { red, blue, redAgent, blueAgent, stepCount, maxSteps, round, redWins, blueWins, draws, roundRewards, announceTimer, bets, isShowtime, redHitsThisRound, blueHitsThisRound } = get();

    if (announceTimer > 0) {
      set({ announceTimer: announceTimer - 1 });
      if (announceTimer <= 1) {
        resetRound(red, blue);
        set({ red: { ...red }, blue: { ...blue }, stepCount: 0, lastWinner: null, redHitsThisRound: 0, blueHitsThisRound: 0 });
      }
      return;
    }

    const redState = discretizeState(red, blue);
    const blueState = discretizeState(blue, red);
    const redAction = redAgent.chooseAction(redState);
    const blueAction = blueAgent.chooseAction(blueState);
    const result = stepArena(red, blue, redAction, blueAction);
    const newRedState = discretizeState(red, blue);
    const newBlueState = discretizeState(blue, red);
    const redActionIdx = ACTIONS.indexOf(redAction);
    const blueActionIdx = ACTIONS.indexOf(blueAction);
    redAgent.update(redState, redActionIdx, result.redReward, newRedState, result.roundOver);
    blueAgent.update(blueState, blueActionIdx, result.blueReward, newBlueState, result.roundOver);

    // Track hits for showtime scoreboard
    const newRedHits = redHitsThisRound + (result.redLanded ? 1 : 0);
    const newBlueHits = blueHitsThisRound + (result.blueLanded ? 1 : 0);

    const newStepCount = stepCount + 1;
    let roundOver = result.roundOver || newStepCount >= maxSteps;
    let winner = result.winner;
    if (newStepCount >= maxSteps && !result.roundOver) {
      winner = 'draw';
      roundOver = true;
    }

    if (roundOver) {
      // Settle bets if showtime
      let settlement: SettlementResult[] | null = null;
      if (isShowtime && bets.length > 0 && winner) {
        settlement = bets.map(bet => ({
          name: bet.name,
          pick: bet.pick,
          amount: bet.amount,
          won: bet.pick === winner,
          draw: winner === 'draw',
        }));
      }

      set({
        red: { ...red }, blue: { ...blue }, stepCount: newStepCount,
        redHitsThisRound: newRedHits, blueHitsThisRound: newBlueHits,
        round: round + 1,
        redWins: redWins + (winner === 'red' ? 1 : 0),
        blueWins: blueWins + (winner === 'blue' ? 1 : 0),
        draws: draws + (winner === 'draw' ? 1 : 0),
        roundRewards: [...roundRewards, { red: red.roundReward, blue: blue.roundReward }],
        lastWinner: winner,
        announceTimer: isShowtime ? 80 : 40,
        lastSettlement: settlement,
      });
    } else {
      set({ red: { ...red }, blue: { ...blue }, stepCount: newStepCount, redHitsThisRound: newRedHits, blueHitsThisRound: newBlueHits });
    }
  },

  play: () => set({ runState: 'running' }),
  pause: () => set({ runState: 'paused' }),

  reset: () => {
    const { epsilon, alpha, gamma, useExpertStart } = get();
    const agents = createAgents(epsilon, alpha, gamma, useExpertStart);
    set({
      redAgent: agents.red, blueAgent: agents.blue,
      red: createFighter(150, 1), blue: createFighter(ARENA_WIDTH - 150, -1),
      round: 1, stepCount: 0, redWins: 0, blueWins: 0, draws: 0,
      roundRewards: [], runState: 'idle', lastWinner: null, announceTimer: 0,
      lastSettlement: null,
    });
  },

  resetAgents: () => {
    const { useExpertStart, epsilon, alpha, gamma } = get();
    const agents = createAgents(epsilon, alpha, gamma, useExpertStart);
    set({
      redAgent: agents.red, blueAgent: agents.blue,
      red: createFighter(150, 1), blue: createFighter(ARENA_WIDTH - 150, -1),
      round: 1, stepCount: 0, redWins: 0, blueWins: 0, draws: 0,
      roundRewards: [], lastWinner: null, announceTimer: 0, lastSettlement: null,
    });
  },

  setSpeed: (s) => set({ speed: s }),
  setEpsilon: (v) => { get().redAgent.epsilon = v; get().blueAgent.epsilon = v; set({ epsilon: v }); },
  setAlpha: (v) => { get().redAgent.alpha = v; get().blueAgent.alpha = v; set({ alpha: v }); },
  setGamma: (v) => { get().redAgent.gamma = v; get().blueAgent.gamma = v; set({ gamma: v }); },
  setUseExpertStart: (v) => set({ useExpertStart: v }),
  setShowtime: (v) => set({ isShowtime: v, maxSteps: v ? 2000 : 500 }),

  addBet: (name, pick, amount) => set({ bets: [...get().bets, { name, pick, amount }], lastSettlement: null }),
  removeBet: (index) => set({ bets: get().bets.filter((_, i) => i !== index) }),
  clearBets: () => set({ bets: [], lastSettlement: null }),
}));
