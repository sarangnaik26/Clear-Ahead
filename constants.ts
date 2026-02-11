
import { Character, MapItem } from './types.ts';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;
export const BASE_GROUND_Y = 320;
export const PLAYER_X = 100;
export const PLAYER_SIZE = 40;

export const THEMES = {
  FOREST: {
    bgTop: '#08081a',
    bgBottom: '#14142b',
    nearTrees: '#1e2a1e',
    midTrees: '#131d13',
    farTrees: '#0d140d',
    ground: '#2d3e2d',
    grass: '#4a7a4a'
  },
  SNOW: {
    bgTop: '#101a26',
    bgBottom: '#243447',
    nearTrees: '#2c3e50',
    midTrees: '#1e2a36',
    farTrees: '#101a26',
    ground: '#ecf0f1',
    grass: '#bdc3c7'
  },
  ROAD: {
    bgTop: '#1a1a2e',
    bgBottom: '#16213e',
    nearTrees: '#2c3e50',
    midTrees: '#1a1a2e',
    farTrees: '#0f3460',
    ground: '#333333',
    grass: '#ffcc00'
  },
  BEACH: {
    bgTop: '#1e90ff',
    bgBottom: '#87ceeb',
    nearTrees: '#f4a460',
    midTrees: '#deb887',
    farTrees: '#d2b48c',
    ground: '#f0e68c',
    grass: '#3498db'
  }
};

export const CHARACTER_DATA: Character[] = [
  {
    id: 'char1',
    name: 'RUNNER',
    price: 0,
    colors: { hair: '#4a3728', skin: '#e0ac8a', shirt: '#6b263b', detail: '#a03030', pants: '#2c3e50', eye: '#1a1a1a' },
    spriteSource: '/assets/sprites/characters.png',
    spriteConfig: { frameWidth: 64, frameHeight: 64, frameCount: 4, row: 0 }
  },
  {
    id: 'char2',
    name: 'FROST',
    price: 250,
    colors: { hair: '#ffffff', skin: '#f0f0f0', shirt: '#3498db', detail: '#ffffff', pants: '#2980b9', eye: '#000000' },
    spriteSource: '/assets/sprites/characters.png',
    spriteConfig: { frameWidth: 64, frameHeight: 64, frameCount: 4, row: 1 }
  },
  {
    id: 'char3',
    name: 'BLAZE',
    price: 500,
    colors: { hair: '#e67e22', skin: '#d35400', shirt: '#c0392b', detail: '#f1c40f', pants: '#2c3e50', eye: '#ffffff' },
    spriteSource: '/assets/sprites/characters.png',
    spriteConfig: { frameWidth: 64, frameHeight: 64, frameCount: 4, row: 2 }
  },
  {
    id: 'char4',
    name: 'NEON',
    price: 1000,
    colors: { hair: '#ec4899', skin: '#f472b6', shirt: '#06b6d4', detail: '#ffffff', pants: '#1e293b', eye: '#ffffff' },
    spriteSource: '/assets/sprites/characters.png',
    spriteConfig: { frameWidth: 64, frameHeight: 64, frameCount: 4, row: 3 }
  },
  {
    id: 'char5',
    name: 'NINJA',
    price: 2500,
    colors: { hair: '#1a1a1a', skin: '#333333', shirt: '#1a1a1a', detail: '#e74c3c', pants: '#1a1a1a', eye: '#e74c3c' },
    spriteSource: '/assets/sprites/characters.png',
    spriteConfig: { frameWidth: 64, frameHeight: 64, frameCount: 4, row: 4 }
  },
  {
    id: 'char6',
    name: 'GOLDEN',
    price: 5000,
    colors: { hair: '#f39c12', skin: '#f1c40f', shirt: '#f1c40f', detail: '#ffffff', pants: '#d35400', eye: '#000000' },
    spriteSource: '/assets/sprites/characters.png',
    spriteConfig: { frameWidth: 64, frameHeight: 64, frameCount: 4, row: 5 }
  }
];

export const MAP_DATA: MapItem[] = [
  { id: 'FOREST', name: 'FOREST', price: 0, description: 'The original dark woods.' },
  { id: 'SNOW', name: 'SNOW', price: 750, description: 'Icy peaks and gift crates.' },
  { id: 'ROAD', name: 'ROAD', price: 1500, description: 'Industrial city barriers.' },
  { id: 'BEACH', name: 'BEACH', price: 3000, description: 'Tropical shore hazards.' }
];
