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
}

export interface Diamond {
  id: number;
  x: number;
  y: number;
  value: number;
}

export interface Bomb {
  id: number;
  x: number;
  y: number;
}

export type SkillType = 'autoHeal' | 'spinningAxes' | 'laser' | 'defense';

export interface SkillState {
  autoHeal: number;
  spinningAxes: number;
  laser: number;
  defense: number;
}

export interface GameConfig {
  mapWidth: number;
  mapHeight: number;
  treeCount: number;
}