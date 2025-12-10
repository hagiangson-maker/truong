
export interface Position {
  x: number;
  y: number;
}

export interface PlayerState {
  position: Position;
  rotation: number;
  skinColor: string;
}

export interface Tree {
  id: number;
  x: number;
  y: number;
  scale: number;
  type: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  angle: number;
  distanceTraveled: number;
  penetration: number;
  hitIds: number[]; // Track zombies hit to prevent multi-frame hits on same target
}

export interface Zombie {
  id: number;
  x: number;
  y: number;
  rotation: number;
  health: number;
  maxHealth: number;
  attackFrame: number;
  lastTakenDamageTime: number;
  isBoss?: boolean;
  freezeTimer?: number; // Time until unfreeze
}

export interface Diamond {
  id: number;
  x: number;
  y: number;
  value: number;
  isAttracted?: boolean;
}

export interface Coin {
  id: number;
  x: number;
  y: number;
  value: number;
  isAttracted?: boolean;
}

export interface Bomb {
  id: number;
  x: number;
  y: number;
}

export interface Magnet {
  id: number;
  x: number;
  y: number;
}

export type SkillType = 'autoHeal' | 'spinningAxes' | 'laser' | 'defense' | 'weapon' | 'freezeNova' | 'shockwave' | 'godMode' | 'apocalypse' | 'chainLightning' | 'poisonGas' | 'blackHole' | 'meteorShower';

export interface SkillState {
  autoHeal: number;
  spinningAxes: number;
  laser: number;
  defense: number;
  weapon: number;
  freezeNova: number;
  shockwave: number;
  godMode: number;
  apocalypse: number;
  chainLightning: number;
  poisonGas: number;
  blackHole: number;
  meteorShower: number;
}

export interface GameConfig {
  mapWidth: number;
  mapHeight: number;
  treeCount: number;
}

export interface User {
  username: string;
  isAdmin: boolean;
  isLoggedIn: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isAdmin?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  diamonds: number;
}
