import {
  type FighterState, type Action, createFighter, discretizeState,
  ARENA_WIDTH, PUNCH_RANGE, KICK_RANGE, ACTIONS,
} from './fighter';
import { stepArena, resetRound } from './arena';
import { FightAgent } from './fightAgent';

// Hardcoded expert heuristic — not optimal, but competent
export function expertAction(self: FighterState, opponent: FighterState): Action {
  const dist = Math.abs(self.x - opponent.x);
  const oppAttacking = opponent.animState === 'punching' || opponent.animState === 'kicking';
  const oppStunned = opponent.animState === 'stunned';
  const canAct = self.cooldown <= 0 && self.animState !== 'stunned';

  // Low HP + opponent attacking → dodge
  if (self.hp < 30 && oppAttacking && canAct) return 'dodge';

  // Opponent attacking and close → block
  if (oppAttacking && dist < KICK_RANGE && canAct) return 'block';

  // Very close + opponent stunned or idle → punch (fast damage)
  if (dist < PUNCH_RANGE && canAct && (oppStunned || !oppAttacking)) return 'punch';

  // Medium range + can kick → kick
  if (dist < KICK_RANGE && dist >= PUNCH_RANGE && canAct) return 'kick';

  // Far away → move toward opponent
  if (dist >= KICK_RANGE) {
    return self.x < opponent.x ? 'moveRight' : 'moveLeft';
  }

  // Default: move toward
  return self.x < opponent.x ? 'moveRight' : 'moveLeft';
}

// Run expert vs expert for N episodes to pre-fill a Q-table
export function warmStartAgent(agent: FightAgent, episodes: number = 300) {
  const red = createFighter(150, 1);
  const blue = createFighter(ARENA_WIDTH - 150, -1);

  for (let ep = 0; ep < episodes; ep++) {
    resetRound(red, blue);
    let steps = 0;

    while (steps < 500) {
      const state = discretizeState(red, blue);
      const action = expertAction(red, blue);
      const actionIdx = ACTIONS.indexOf(action);

      // Blue also uses expert policy
      const blueAction = expertAction(blue, red);
      const result = stepArena(red, blue, action, blueAction);

      const nextState = discretizeState(red, blue);
      agent.update(state, actionIdx, result.redReward, nextState, result.roundOver);

      steps++;
      if (result.roundOver) break;
    }
  }
}
