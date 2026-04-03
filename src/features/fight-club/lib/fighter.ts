export const ACTIONS = ['moveLeft', 'moveRight', 'punch', 'kick', 'block', 'dodge'] as const;
export type Action = (typeof ACTIONS)[number];
export const NUM_ACTIONS = ACTIONS.length;

export const ARENA_WIDTH = 800;
export const FLOOR_Y = 320;
export const ROBOT_WIDTH = 40;
export const ROBOT_HEIGHT = 70;
export const MOVE_SPEED = 6;
export const DODGE_SPEED = 14;
export const PUNCH_RANGE = 55;
export const KICK_RANGE = 75;
export const PUNCH_DAMAGE = 10;
export const KICK_DAMAGE = 15;
export const BLOCK_REDUCTION = 0.8;
export const PUNCH_COOLDOWN = 8;
export const KICK_COOLDOWN = 14;
export const BLOCK_DURATION = 10;
export const DODGE_COOLDOWN = 12;
export const STUN_DURATION = 6;
export const MAX_HP = 100;
export const KNOCKBACK = 12;

export type AnimState = 'idle' | 'punching' | 'kicking' | 'blocking' | 'dodging' | 'stunned' | 'hit';

export interface FighterState {
  x: number;
  hp: number;
  facing: 1 | -1; // 1 = right, -1 = left
  animState: AnimState;
  animTimer: number;
  cooldown: number;
  isBlocking: boolean;
  lastAction: Action;
  roundReward: number;
  hitFlash: number; // frames remaining for hit flash
  damageNumbers: { value: number; x: number; y: number; age: number }[];
}

export function createFighter(x: number, facing: 1 | -1): FighterState {
  return {
    x, hp: MAX_HP, facing, animState: 'idle', animTimer: 0,
    cooldown: 0, isBlocking: false, lastAction: 'moveLeft',
    roundReward: 0, hitFlash: 0, damageNumbers: [],
  };
}

// Discretize state for Q-table
export function discretizeState(self: FighterState, opponent: FighterState): number {
  const posZone = Math.min(9, Math.floor(self.x / (ARENA_WIDTH / 10)));
  const hpLevel = self.hp > 75 ? 0 : self.hp > 50 ? 1 : self.hp > 25 ? 2 : 3;
  const dist = Math.abs(self.x - opponent.x);
  const distLevel = dist < 50 ? 0 : dist < 100 ? 1 : dist < 200 ? 2 : dist < 400 ? 3 : 4;
  const oppAction = opponent.animState === 'punching' || opponent.animState === 'kicking' ? 1
    : opponent.isBlocking ? 2 : opponent.animState === 'stunned' ? 3 : 0;
  const ready = self.cooldown <= 0 ? 0 : 1;

  return posZone * 160 + hpLevel * 40 + distLevel * 8 + oppAction * 2 + ready;
}

export const STATE_SPACE_SIZE = 10 * 4 * 5 * 4 * 2; // 1600
