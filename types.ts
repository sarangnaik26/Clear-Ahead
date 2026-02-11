
export type GameStatus = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';
export type GameMode = 'EASY' | 'HARD';
export type MapType = 'FOREST' | 'SNOW' | 'ROAD' | 'BEACH';

export interface CharacterColors {
  hair: string;
  skin: string;
  shirt: string;
  detail: string;
  pants: string;
  eye?: string;
}

export interface Character {
  id: string;
  name: string;
  price: number;
  colors: CharacterColors;
  spriteSource?: string; // Path to sprite sheet
  spriteConfig?: {
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    row: number; // Row in the sprite sheet
  };
}

export interface MapItem {
  id: MapType;
  name: string;
  price: number;
  description: string;
  bgImage?: string; // Path to background
  groundImage?: string; // Path to ground tile
  obstacleSprites?: {
    [key in ObstacleType]?: {
      source: string;
      frameWidth: number;
      frameHeight: number;
    }
  };
}

export interface GameStats {
  distance: number;
  currency: number;
  smashed: number;
  highScore: number;
  speed?: number;
}

export enum ObstacleType {
  CRATE = 'CRATE', // 1 tap
  ROCK = 'ROCK',   // 2 taps
  LOG = 'LOG'      // 3 taps
}

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  smashed: boolean;
  particles: Particle[];
  rotation?: number;
  isFalling?: boolean;
}

export interface Collectible {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
}

export interface GameSettings {
  speed: number;
  baseSpeed: number;
  gravity: number;
  obstacleSpawnRate: number;
  collectibleSpawnRate: number;
}
