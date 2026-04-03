import { NUM_ACTIONS, STATE_SPACE_SIZE, type Action, ACTIONS } from './fighter';

export class FightAgent {
  qTable: Float32Array;
  epsilon: number;
  alpha: number;
  gamma: number;
  prevState: number;
  prevAction: number;

  constructor(epsilon = 0.3, alpha = 0.15, gamma = 0.95) {
    this.qTable = new Float32Array(STATE_SPACE_SIZE * NUM_ACTIONS);
    this.epsilon = epsilon;
    this.alpha = alpha;
    this.gamma = gamma;
    this.prevState = 0;
    this.prevAction = 0;
  }

  getQ(state: number, action: number): number {
    return this.qTable[state * NUM_ACTIONS + action];
  }

  setQ(state: number, action: number, value: number): void {
    this.qTable[state * NUM_ACTIONS + action] = value;
  }

  chooseAction(state: number): Action {
    if (Math.random() < this.epsilon) {
      return ACTIONS[Math.floor(Math.random() * NUM_ACTIONS)];
    }
    return ACTIONS[this.greedyAction(state)];
  }

  greedyAction(state: number): number {
    let best = 0;
    let bestVal = this.getQ(state, 0);
    for (let a = 1; a < NUM_ACTIONS; a++) {
      const v = this.getQ(state, a);
      if (v > bestVal) { bestVal = v; best = a; }
    }
    return best;
  }

  update(state: number, action: number, reward: number, nextState: number, done: boolean): void {
    const maxNext = done ? 0 : this.getQ(nextState, this.greedyAction(nextState));
    const current = this.getQ(state, action);
    const newVal = current + this.alpha * (reward + this.gamma * maxNext - current);
    this.setQ(state, action, newVal);
  }

  reset(): void {
    this.qTable.fill(0);
  }
}
