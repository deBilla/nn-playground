import {
  type FighterState, type Action, createFighter,
  ARENA_WIDTH, ROBOT_WIDTH, MOVE_SPEED, DODGE_SPEED,
  PUNCH_RANGE, KICK_RANGE, PUNCH_DAMAGE, KICK_DAMAGE,
  BLOCK_REDUCTION, PUNCH_COOLDOWN, KICK_COOLDOWN,
  BLOCK_DURATION, DODGE_COOLDOWN, STUN_DURATION,
  KNOCKBACK,
} from './fighter';

export interface StepResult {
  redReward: number;
  blueReward: number;
  roundOver: boolean;
  winner: 'red' | 'blue' | 'draw' | null;
  redLanded: boolean;
  blueLanded: boolean;
}

// Both fighters resolve blocks FIRST, then check damage against updated block state
function resolveSimultaneous(
  red: FighterState, blue: FighterState,
  redAction: Action, blueAction: Action,
): { redDamage: number; blueDamage: number; redBlocked: boolean; blueBlocked: boolean } {

  // First, determine if either fighter is blocking this frame
  const redWillBlock = redAction === 'block' && red.animState !== 'stunned';
  const blueWillBlock = blueAction === 'block' && blue.animState !== 'stunned';

  // Check red's attack against blue (considering blue's simultaneous block)
  let redDamage = 0;
  let redBlocked = false;
  if ((redAction === 'punch' || redAction === 'kick') && red.cooldown <= 0 && red.animState !== 'stunned') {
    const dist = Math.abs(red.x - blue.x);
    const range = redAction === 'punch' ? PUNCH_RANGE : KICK_RANGE;
    if (dist < range) {
      const baseDmg = redAction === 'punch' ? PUNCH_DAMAGE : KICK_DAMAGE;
      if (blue.isBlocking || blueWillBlock) {
        redDamage = Math.round(baseDmg * (1 - BLOCK_REDUCTION));
        redBlocked = true;
      } else {
        redDamage = baseDmg;
      }
    }
  }

  // Check blue's attack against red (considering red's simultaneous block)
  let blueDamage = 0;
  let blueBlocked = false;
  if ((blueAction === 'punch' || blueAction === 'kick') && blue.cooldown <= 0 && blue.animState !== 'stunned') {
    const dist = Math.abs(red.x - blue.x);
    const range = blueAction === 'punch' ? PUNCH_RANGE : KICK_RANGE;
    if (dist < range) {
      const baseDmg = blueAction === 'punch' ? PUNCH_DAMAGE : KICK_DAMAGE;
      if (red.isBlocking || redWillBlock) {
        blueDamage = Math.round(baseDmg * (1 - BLOCK_REDUCTION));
        blueBlocked = true;
      } else {
        blueDamage = baseDmg;
      }
    }
  }

  return { redDamage, blueDamage, redBlocked, blueBlocked };
}

// Phase 3: Apply state changes
function applyState(fighter: FighterState, action: Action, opponent: FighterState) {
  fighter.lastAction = action;

  // Decrease timers
  if (fighter.animTimer > 0) fighter.animTimer--;
  if (fighter.cooldown > 0) fighter.cooldown--;
  if (fighter.hitFlash > 0) fighter.hitFlash--;

  // Age damage numbers
  fighter.damageNumbers = fighter.damageNumbers
    .map(d => ({ ...d, age: d.age + 1, y: d.y - 1 }))
    .filter(d => d.age < 30);

  // Can't act while stunned
  if (fighter.animState === 'stunned') {
    if (fighter.animTimer <= 0) fighter.animState = 'idle';
    return;
  }

  // Reset anim state if timer expired
  if (fighter.animTimer <= 0 && fighter.animState !== 'idle') {
    fighter.animState = 'idle';
  }

  fighter.isBlocking = false;

  switch (action) {
    case 'moveLeft':
      fighter.x = Math.max(ROBOT_WIDTH / 2, fighter.x - MOVE_SPEED);
      break;
    case 'moveRight':
      fighter.x = Math.min(ARENA_WIDTH - ROBOT_WIDTH / 2, fighter.x + MOVE_SPEED);
      break;
    case 'punch':
      if (fighter.cooldown <= 0) {
        fighter.animState = 'punching';
        fighter.animTimer = 4;
        fighter.cooldown = PUNCH_COOLDOWN;
      }
      break;
    case 'kick':
      if (fighter.cooldown <= 0) {
        fighter.animState = 'kicking';
        fighter.animTimer = 6;
        fighter.cooldown = KICK_COOLDOWN;
      }
      break;
    case 'block':
      fighter.isBlocking = true;
      fighter.animState = 'blocking';
      fighter.animTimer = BLOCK_DURATION;
      break;
    case 'dodge':
      if (fighter.cooldown <= 0) {
        fighter.animState = 'dodging';
        fighter.animTimer = 4;
        fighter.cooldown = DODGE_COOLDOWN;
        const dir = fighter.x < opponent.x ? -1 : 1;
        fighter.x = Math.max(ROBOT_WIDTH / 2, Math.min(ARENA_WIDTH - ROBOT_WIDTH / 2, fighter.x + dir * DODGE_SPEED));
      }
      break;
  }
}

export function stepArena(red: FighterState, blue: FighterState, redAction: Action, blueAction: Action): StepResult {
  let redReward = -0.1;
  let blueReward = -0.1;

  // Phase 1: Resolve damage simultaneously (both attacks check against pre-step state)
  const { redDamage, blueDamage, redBlocked, blueBlocked } = resolveSimultaneous(red, blue, redAction, blueAction);

  // Phase 2: Apply movement and animation state changes
  applyState(red, redAction, blue);
  applyState(blue, blueAction, red);

  // Phase 3: Apply damage simultaneously
  if (redDamage > 0) {
    blue.hp = Math.max(0, blue.hp - redDamage);
    blue.hitFlash = 4;
    blue.damageNumbers.push({ value: redDamage, x: blue.x, y: blue.x - 30, age: 0 });
    const dir = red.x < blue.x ? 1 : -1;
    blue.x = Math.max(ROBOT_WIDTH / 2, Math.min(ARENA_WIDTH - ROBOT_WIDTH / 2, blue.x + dir * KNOCKBACK));
    if (!blue.isBlocking) { blue.animState = 'stunned'; blue.animTimer = STUN_DURATION; }

    redReward += redBlocked ? 3 : (redDamage >= KICK_DAMAGE ? 15 : 10);
    blueReward -= redBlocked ? 2 : (redDamage >= KICK_DAMAGE ? 15 : 10);
    if (redBlocked) blueReward += 5;
  }

  if (blueDamage > 0) {
    red.hp = Math.max(0, red.hp - blueDamage);
    red.hitFlash = 4;
    red.damageNumbers.push({ value: blueDamage, x: red.x, y: red.x - 30, age: 0 });
    const dir = blue.x < red.x ? 1 : -1;
    red.x = Math.max(ROBOT_WIDTH / 2, Math.min(ARENA_WIDTH - ROBOT_WIDTH / 2, red.x + dir * KNOCKBACK));
    if (!red.isBlocking) { red.animState = 'stunned'; red.animTimer = STUN_DURATION; }

    blueReward += blueBlocked ? 3 : (blueDamage >= KICK_DAMAGE ? 15 : 10);
    redReward -= blueBlocked ? 2 : (blueDamage >= KICK_DAMAGE ? 15 : 10);
    if (blueBlocked) redReward += 5;
  }

  // Penalize passivity
  if (redAction === 'moveLeft' && red.x <= ROBOT_WIDTH / 2 + 1) redReward -= 0.5;
  if (blueAction === 'moveRight' && blue.x >= ARENA_WIDTH - ROBOT_WIDTH / 2 - 1) blueReward -= 0.5;

  // Check round end
  let roundOver = false;
  let winner: 'red' | 'blue' | 'draw' | null = null;

  if (red.hp <= 0 || blue.hp <= 0) {
    roundOver = true;
    if (red.hp <= 0 && blue.hp <= 0) {
      winner = 'draw';
    } else if (red.hp <= 0) {
      winner = 'blue';
      blueReward += 100;
      redReward -= 100;
    } else {
      winner = 'red';
      redReward += 100;
      blueReward -= 100;
    }
  }

  red.roundReward += redReward;
  blue.roundReward += blueReward;

  return { redReward, blueReward, roundOver, winner, redLanded: redDamage > 0, blueLanded: blueDamage > 0 };
}

export function resetRound(red: FighterState, blue: FighterState) {
  Object.assign(red, createFighter(150, 1));
  Object.assign(blue, createFighter(ARENA_WIDTH - 150, -1));
}
