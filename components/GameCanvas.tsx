import React, { useRef, useEffect } from 'react';
import { GameStatus, GameStats, ObstacleType, Obstacle, Collectible, Particle, GameSettings, GameMode, MapType, Character } from '../types.ts';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BASE_GROUND_Y, PLAYER_X, PLAYER_SIZE, THEMES } from '../constants.ts';
import { audioService } from '../services/AudioService.ts';

interface Props {
  status: GameStatus;
  mode: GameMode;
  mapType: MapType;
  character: Character;
  onGameOver: (stats: Partial<GameStats>) => void;
  onProgress: (stats: { distance: number; currency: number; smashed: number; speed: number }) => void;
  onMilestone: (msg: string) => void;
  onTutorialShow: () => void;
  onTutorialAction: () => void;
  showTutorial: boolean;
}

const GameCanvas: React.FC<Props> = ({ status, mode, mapType, character, onGameOver, onProgress, onMilestone, onTutorialShow, onTutorialAction, showTutorial }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastStatusRef = useRef<GameStatus>(status);
  const mousePosRef = useRef({ x: 0, y: 0 });

  const engineRef = useRef({
    distance: 0,
    currency: 0,
    smashed: 0,
    playerY: BASE_GROUND_Y - PLAYER_SIZE,
    playerRotation: 0,
    obstacles: [] as Obstacle[],
    collectibles: [] as Collectible[],
    bgOffset: 0,
    particles: [] as Particle[],
    speed: 5,
    obstacleTimer: 0,
    collectibleTimer: 0,
    lastMilestone: 0,
    screenShake: 0,
    flashRed: 0,
    frame: 0,
    theme: THEMES[mapType],
    nextTheme: THEMES[mapType],
    themeTransition: 1.0,
    hasTutorialTriggered: false,
    snowflakes: [] as { x: number, y: number, speed: number, size: number }[],
    spriteImage: null as HTMLImageElement | null,
    spriteLoaded: false
  });

  const settings: GameSettings = {
    speed: 5,
    baseSpeed: mode === 'HARD' ? 6 : 5,
    gravity: 0.8,
    obstacleSpawnRate: mode === 'HARD' ? 1600 : 2000,
    collectibleSpawnRate: 1200
  };

  const getGroundHeight = (canvasX: number, totalDistance: number) => {
    const worldX = canvasX + totalDistance * 100;
    const waveFactor = (mapType === 'ROAD' || mapType === 'BEACH') ? 0.2 : 1.0;
    const h1 = Math.sin(worldX / 800) * 40 * waveFactor;
    const h2 = Math.sin(worldX / 300) * 30 * waveFactor;
    const h3 = Math.sin(worldX / 150) * 15 * waveFactor;
    const h4 = Math.sin(worldX / 60) * 8 * waveFactor;
    const rawY = BASE_GROUND_Y + h1 + h2 + h3 + h4;
    return Math.min(CANVAS_HEIGHT - 60, Math.max(150, rawY));
  };

  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const resetEngine = () => {
    const snow = [];
    if (mapType === 'SNOW') {
      for (let i = 0; i < 50; i++) {
        snow.push({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          speed: 0.5 + Math.random() * 1.5,
          size: 2 + Math.random() * 3
        });
      }
    }

    engineRef.current = {
      distance: 0,
      currency: 0,
      smashed: 0,
      playerY: BASE_GROUND_Y - PLAYER_SIZE,
      playerRotation: 0,
      obstacles: [],
      collectibles: [],
      particles: [],
      bgOffset: 0,
      speed: settings.baseSpeed,
      obstacleTimer: 1000,
      collectibleTimer: 1500,
      lastMilestone: 0,
      screenShake: 0,
      flashRed: 0,
      frame: 0,
      theme: THEMES[mapType],
      nextTheme: THEMES[mapType],
      themeTransition: 1.0,
      hasTutorialTriggered: false,
      snowflakes: snow,
      spriteImage: engineRef.current.spriteImage, // Keep loaded image
      spriteLoaded: engineRef.current.spriteLoaded
    };
  };

  const spawnObstacle = () => {
    const types = [ObstacleType.CRATE, ObstacleType.ROCK, ObstacleType.LOG];
    const type = types[Math.floor(Math.random() * types.length)];
    let health = 1, width = 40, height = 40;

    const isIndustrial = mapType === 'ROAD';

    if (mapType === 'BEACH') {
      if (type === ObstacleType.CRATE) {
        width = 60; height = 45;
        health = 2;
      } else if (type === ObstacleType.ROCK) {
        width = 30; height = 30;
        health = 1;
      } else if (type === ObstacleType.LOG) {
        width = 110; height = 55;
        health = 3;
      }
    } else {
      if (type === ObstacleType.ROCK) {
        health = 2;
        width = isIndustrial ? 70 : 50;
        height = isIndustrial ? 35 : 55;
      }
      if (type === ObstacleType.LOG) {
        health = 3;
        width = isIndustrial ? 110 : 70;
        height = isIndustrial ? 55 : 80;
      }
    }

    if (mode === 'HARD') health += 1;

    let spawnX = CANVAS_WIDTH + 100;
    let isFalling = false;
    let startY = 0;

    // Hard Mode specific logic: crates fall from sky
    if (mode === 'HARD' && type === ObstacleType.CRATE) {
      isFalling = true;
      // Spawn it slightly randomly along the screen width but still ahead
      spawnX = CANVAS_WIDTH * (0.6 + Math.random() * 0.4);
      startY = -100;
    } else {
      const groundAtSpawn = getGroundHeight(spawnX, engineRef.current.distance);
      startY = groundAtSpawn - height;
    }

    const obs: Obstacle = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: spawnX,
      y: startY,
      width,
      height,
      health,
      maxHealth: health,
      smashed: false,
      particles: [],
      rotation: 0,
      isFalling
    };
    engineRef.current.obstacles.push(obs);

    if (!engineRef.current.hasTutorialTriggered) {
      engineRef.current.hasTutorialTriggered = true;
      onTutorialShow();
    }
  };

  const spawnCollectible = () => {
    const spawnX = CANVAS_WIDTH + 100;
    const groundAtSpawn = getGroundHeight(spawnX, engineRef.current.distance);
    const coll: Collectible = {
      id: Math.random().toString(36).substr(2, 9),
      x: spawnX,
      y: groundAtSpawn - 25 - Math.random() * 15,
      width: 20,
      height: 20,
      collected: false
    };
    engineRef.current.collectibles.push(coll);
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      engineRef.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 2) * 6,
        size: Math.random() * 5 + 2,
        color,
        life: 1.0
      });
    }
  };

  const processHit = (clickX: number, clickY: number) => {
    engineRef.current.obstacles.forEach(obs => {
      if (!obs.smashed &&
        clickX >= obs.x - 30 && clickX <= obs.x + obs.width + 30 &&
        clickY >= obs.y - 30 && clickY <= obs.y + obs.height + 30) {

        obs.health--;
        if (showTutorial) onTutorialAction();

        let partColor = '#333';
        if (mapType === 'ROAD') partColor = (obs.type === ObstacleType.CRATE ? '#e74c3c' : '#333');
        else if (mapType === 'SNOW') partColor = '#ffffff';
        else if (mapType === 'FOREST') partColor = '#8b4513';
        else if (mapType === 'BEACH') partColor = '#3498db';

        if (obs.health <= 0) {
          obs.smashed = true;
          engineRef.current.smashed++;
          createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, partColor, 15);
          audioService.playSmash();
        } else {
          createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, partColor, 5);
          audioService.playTap();
        }
      }
    });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    let moveX, moveY;
    if ('touches' in e && (e as any).touches.length > 0) {
      moveX = ((e as any).touches[0].clientX - rect.left) * scaleX;
      moveY = ((e as any).touches[0].clientY - rect.top) * scaleY;
    } else if ('clientX' in (e as any)) {
      moveX = ((e as any).clientX - rect.left) * scaleX;
      moveY = ((e as any).clientY - rect.top) * scaleY;
    } else return;

    mousePosRef.current = { x: moveX, y: moveY };
  };

  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (status !== 'PLAYING') return;
    handleMouseMove(e);
    processHit(mousePosRef.current.x, mousePosRef.current.y);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status === 'PLAYING' && e.code === 'Space') {
        e.preventDefault();
        processHit(mousePosRef.current.x, mousePosRef.current.y);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, showTutorial]);

  const update = (dt: number) => {
    const engine = engineRef.current;
    const deltaTimeMultiplier = dt / 16.67;

    engine.distance += engine.speed * 0.01 * deltaTimeMultiplier;
    engine.speed = settings.baseSpeed + (engine.distance / 250);

    const groundY = getGroundHeight(PLAYER_X + PLAYER_SIZE / 2, engine.distance);
    const groundYNext = getGroundHeight(PLAYER_X + PLAYER_SIZE / 2 + 10, engine.distance);
    engine.playerY = groundY - PLAYER_SIZE;
    engine.playerRotation = Math.atan2(groundYNext - groundY, 10);

    engine.obstacleTimer -= dt;
    if (engine.obstacleTimer <= 0) {
      spawnObstacle();
      engine.obstacleTimer = Math.max(900, settings.obstacleSpawnRate - (engine.speed * 30));
    }

    engine.collectibleTimer -= dt;
    if (engine.collectibleTimer <= 0) {
      spawnCollectible();
      engine.collectibleTimer = settings.collectibleSpawnRate;
    }

    if (mapType === 'SNOW') {
      engine.snowflakes.forEach(s => {
        s.y += s.speed * deltaTimeMultiplier;
        s.x -= (engine.speed * 0.5) * deltaTimeMultiplier;
        if (s.y > CANVAS_HEIGHT) { s.y = -10; s.x = Math.random() * CANVAS_WIDTH; }
        if (s.x < 0) s.x = CANVAS_WIDTH;
      });
    }

    const dFloor = Math.floor(engine.distance);
    if (dFloor > 0 && dFloor % 100 === 0 && dFloor > engine.lastMilestone) {
      engine.lastMilestone = dFloor;
      if (dFloor === 100) onMilestone('Keep smashing!');
      else if (dFloor === 500) onMilestone('Unstoppable runner!');
      else if (dFloor >= 1000) onMilestone('Legendary!');
    }

    engine.obstacles.forEach(obs => {
      let scrollMultiplier = 1;
      if (mode === 'HARD' && obs.type === ObstacleType.ROCK) {
        scrollMultiplier = 1.4;
        if (mapType !== 'ROAD' && mapType !== 'SNOW' && obs.rotation !== undefined) {
          obs.rotation -= 0.15 * deltaTimeMultiplier;
        }
      }

      obs.x -= engine.speed * scrollMultiplier * deltaTimeMultiplier;

      if (obs.isFalling) {
        // Falling speed
        obs.y += (engine.speed * 0.8) * deltaTimeMultiplier;
        const currentGround = getGroundHeight(obs.x + obs.width / 2, engine.distance);
        if (obs.y >= currentGround - obs.height) {
          obs.y = currentGround - obs.height;
          obs.isFalling = false;
          // Impact particles
          createParticles(obs.x + obs.width / 2, obs.y + obs.height, 'rgba(255,255,255,0.5)', 4);
        }
      } else {
        const currentGround = getGroundHeight(obs.x + obs.width / 2, engine.distance);
        obs.y = currentGround - obs.height;
      }

      if (!obs.smashed) {
        if (PLAYER_X + PLAYER_SIZE - 12 > obs.x && PLAYER_X + 12 < obs.x + obs.width &&
          engine.playerY + PLAYER_SIZE - 5 > obs.y && engine.playerY < obs.y + obs.height) {
          engine.screenShake = 15;
          engine.flashRed = 20;
          onGameOver({
            distance: Math.floor(engine.distance),
            currency: engine.currency,
            smashed: engine.smashed
          });
        }
      }
    });

    engine.collectibles.forEach(coll => {
      coll.x -= engine.speed * deltaTimeMultiplier;
      if (!coll.collected &&
        PLAYER_X + PLAYER_SIZE > coll.x && PLAYER_X < coll.x + coll.width &&
        engine.playerY + PLAYER_SIZE > coll.y && engine.playerY < coll.y + coll.height) {
        coll.collected = true;
        engine.currency += (mode === 'HARD' ? 2 : 1);
        audioService.playCoin();
        createParticles(coll.x, coll.y, '#ffd700', 8);
      }
    });

    engine.particles.forEach(p => {
      p.x += p.vx * deltaTimeMultiplier;
      p.y += p.vy * deltaTimeMultiplier;
      p.vy += 0.2 * deltaTimeMultiplier;
      p.life -= 0.02 * deltaTimeMultiplier;
    });

    engine.obstacles = engine.obstacles.filter(o => o.x > -300);
    engine.collectibles = engine.collectibles.filter(c => c.x > -300 && !c.collected);
    engine.particles = engine.particles.filter(p => p.life > 0);

    engine.screenShake = Math.max(0, engine.screenShake - 1);
    engine.flashRed = Math.max(0, engine.flashRed - 1);
    engine.frame++;

    if (engine.frame % 2 === 0) {
      onProgress({
        distance: engine.distance,
        currency: engine.currency,
        smashed: engine.smashed,
        speed: engine.speed
      });
    }
  };



  // Load sprite on mount or character change
  useEffect(() => {
    if (character.spriteSource) {
      const img = new Image();
      img.src = character.spriteSource;
      img.onload = () => {
        engineRef.current.spriteImage = img;
        engineRef.current.spriteLoaded = true;
      };
      img.onerror = () => {
        console.warn("Failed to load sprite:", character.spriteSource);
        engineRef.current.spriteLoaded = false;
      };
    } else {
      engineRef.current.spriteLoaded = false;
    }
  }, [character]);

  const drawPlayer = (ctx: CanvasRenderingContext2D, engine: any) => {
    ctx.save();
    ctx.translate(PLAYER_X + PLAYER_SIZE / 2, engine.playerY + PLAYER_SIZE / 2);
    ctx.rotate(engine.playerRotation);
    ctx.translate(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2);

    // If sprite is loaded, draw it
    if (engine.spriteLoaded && engine.spriteImage && character.spriteConfig) {
      const { frameWidth, frameHeight, frameCount, row } = character.spriteConfig;
      const currentFrame = Math.floor(engine.frame / 10) % frameCount;

      ctx.drawImage(
        engine.spriteImage,
        currentFrame * frameWidth, row * frameHeight, frameWidth, frameHeight,
        -10, -10, PLAYER_SIZE + 20, PLAYER_SIZE + 20 // Scale slightly up to fit hit box
      );
      ctx.restore();
      return;
    }

    // Fallback to procedural drawing
    const s = PLAYER_SIZE / 20;
    const walk = Math.sin(engine.frame * 0.3);
    const { colors } = character;

    ctx.fillStyle = colors.hair;
    ctx.fillRect(4 * s, 0, 12 * s, 7 * s);
    ctx.fillRect(2 * s, 2 * s, 2 * s, 4 * s);
    ctx.fillRect(16 * s, 3 * s, 2 * s, 4 * s);

    ctx.fillStyle = colors.skin;
    ctx.fillRect(5 * s, 5 * s, 10 * s, 7 * s);

    ctx.fillStyle = colors.eye || '#000000';
    ctx.fillRect(11 * s, 8 * s, 2 * s, 2 * s);

    ctx.fillStyle = colors.shirt;
    ctx.fillRect(4 * s, 11 * s, 12 * s, 5 * s);
    ctx.fillStyle = colors.detail;
    ctx.fillRect(10 * s, 13 * s, 6 * s, 2 * s);

    ctx.fillStyle = colors.pants;
    const l1Y = 16 * s + (walk > 0 ? 0 : 2 * s);
    ctx.fillRect(5 * s, l1Y, 4 * s, 4 * s);
    const l2Y = 16 * s + (walk <= 0 ? 0 : 2 * s);
    ctx.fillRect(11 * s, l2Y, 4 * s, 4 * s);

    ctx.restore();
  };

  const drawChaser = (ctx: CanvasRenderingContext2D, engine: any) => {
    const chaserX = PLAYER_X - 100;
    const chaserGroundY = getGroundHeight(chaserX + PLAYER_SIZE / 2, engine.distance);
    const chaserY = chaserGroundY - PLAYER_SIZE - 15;
    const walk = Math.sin(engine.frame * 0.25);
    const s = PLAYER_SIZE / 20;

    ctx.save();
    ctx.translate(chaserX, chaserY);

    if (mapType === 'FOREST') {
      ctx.fillStyle = '#7f8c8d'; ctx.fillRect(2 * s, 6 * s, 22 * s, 14 * s); ctx.fillRect(20 * s, 4 * s, 10 * s, 10 * s);
      ctx.fillStyle = '#95a5a6'; ctx.fillRect(18 * s, 3 * s, 6 * s, 8 * s);
      ctx.fillStyle = '#000'; ctx.fillRect(26 * s, 7 * s, 2 * s, 2 * s);
      ctx.fillStyle = '#7f8c8d'; ctx.fillRect(28 * s, 10 * s + Math.sin(engine.frame * 0.15) * 5, 4 * s, 10 * s);
      ctx.fillStyle = '#ecf0f1'; ctx.fillRect(26 * s, 12 * s, 3 * s, 2 * s);
      ctx.fillStyle = '#707b7c';
      const l1Y = 20 * s + (walk > 0 ? 0 : 3 * s); const l2Y = 20 * s + (walk <= 0 ? 0 : 3 * s);
      ctx.fillRect(4 * s, l1Y, 5 * s, 6 * s); ctx.fillRect(16 * s, l2Y, 5 * s, 6 * s);
    } else if (mapType === 'SNOW') {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 18 * s, 20 * s);
      ctx.fillStyle = '#ccf'; ctx.fillRect(10 * s, 5 * s, 6 * s, 6 * s);
      ctx.fillStyle = '#000'; ctx.fillRect(13 * s, 7 * s, 2 * s, 2 * s);
      ctx.fillStyle = '#eee';
      const l1Y = 20 * s + (walk > 0 ? 0 : 2 * s); const l2Y = 20 * s + (walk <= 0 ? 0 : 2 * s);
      ctx.fillRect(2 * s, l1Y, 6 * s, 4 * s); ctx.fillRect(10 * s, l2Y, 6 * s, 4 * s);
    } else if (mapType === 'BEACH') {
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(4 * s, 10 * s, 14 * s, 10 * s);
      ctx.fillRect(0, 8 * s + walk * 4, 6 * s, 6 * s);
      ctx.fillRect(16 * s, 8 * s - walk * 4, 6 * s, 6 * s);
      ctx.fillStyle = '#000';
      ctx.fillRect(8 * s, 8 * s, 2 * s, 2 * s);
      ctx.fillRect(12 * s, 8 * s, 2 * s, 2 * s);
      ctx.fillStyle = '#c0392b';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(4 * s + i * 4 * s, 20 * s + (i % 2 === 0 ? walk : -walk) * 2, 2 * s, 4 * s);
      }
    } else {
      ctx.fillStyle = '#002366'; ctx.fillRect(4 * s, 8 * s, 12 * s, 10 * s);
      ctx.fillStyle = '#000'; ctx.fillRect(8 * s, 0 * s, 8 * s, 3 * s);
      ctx.fillStyle = '#e0ac8a'; ctx.fillRect(8 * s, 3 * s, 8 * s, 5 * s);
      ctx.fillStyle = '#000'; ctx.fillRect(13 * s, 5 * s, 2 * s, 2 * s);
      ctx.fillStyle = engine.frame % 20 < 10 ? '#f00' : '#00f'; ctx.fillRect(14 * s, 0, 2 * s, 2 * s);
      ctx.fillStyle = '#001a4d';
      const l1Y = 18 * s + (walk > 0 ? 0 : 2 * s); const l2Y = 18 * s + (walk <= 0 ? 0 : 2 * s);
      ctx.fillRect(6 * s, l1Y, 3 * s, 4 * s); ctx.fillRect(11 * s, l2Y, 3 * s, 4 * s);
    }

    ctx.restore();
  };

  const drawObstacle = (ctx: CanvasRenderingContext2D, obs: Obstacle, engine: any) => {
    if (obs.smashed) return;

    // Draw shadow if falling
    if (obs.isFalling) {
      const groundY = getGroundHeight(obs.x + obs.width / 2, engine.distance);
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      const heightFromGround = groundY - obs.y - obs.height;
      const shadowScale = Math.max(0.3, 1 - heightFromGround / 300);
      ctx.ellipse(obs.x + obs.width / 2, groundY, (obs.width / 2) * shadowScale, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    const slope = Math.atan2(
      getGroundHeight(obs.x + obs.width, engine.distance) - getGroundHeight(obs.x, engine.distance),
      obs.width
    );
    ctx.translate(obs.x + obs.width / 2, obs.y + obs.height / 2);
    const currentRotation = (mapType === 'ROAD' || mapType === 'SNOW') ? 0 : (obs.rotation || 0);
    ctx.rotate(slope + currentRotation);
    ctx.translate(-(obs.width / 2), -(obs.height / 2));

    if (mapType === 'ROAD') {
      if (obs.type === ObstacleType.CRATE) {
        ctx.fillStyle = '#c0392b'; ctx.fillRect(0, obs.height - 10, obs.width, 10);
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(5, 0, 10, obs.height - 10); ctx.fillRect(obs.width - 15, 0, 10, obs.height - 10);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(5, 5, obs.width - 10, 8); ctx.fillRect(5, 20, obs.width - 10, 8);
        ctx.fillStyle = '#e74c3c';
        for (let i = 0; i < obs.width - 10; i += 12) {
          ctx.fillRect(8 + i, 5, 4, 8); ctx.fillRect(8 + i, 20, 4, 8);
        }
      } else if (obs.type === ObstacleType.ROCK) {
        ctx.fillStyle = '#2c3e50'; ctx.beginPath(); ctx.roundRect(0, 15, obs.width, obs.height - 25, 6); ctx.fill();
        ctx.fillStyle = '#34495e'; ctx.beginPath(); ctx.roundRect(10, 2, obs.width - 25, 18, 4); ctx.fill();
        ctx.fillStyle = '#d1f2eb'; ctx.fillRect(15, 6, obs.width - 35, 10);
        ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(15, obs.height - 8, 8, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(obs.width - 15, obs.height - 8, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f1c40f'; ctx.fillRect(obs.width - 5, 20, 5, 5);
      } else {
        ctx.fillStyle = '#7f8c8d'; ctx.fillRect(0, 5, obs.width - 35, obs.height - 15);
        ctx.strokeStyle = '#95a5a6'; ctx.strokeRect(4, 9, obs.width - 43, obs.height - 23);
        ctx.fillStyle = '#2980b9'; ctx.fillRect(obs.width - 35, 15, 30, obs.height - 25);
        ctx.fillStyle = '#d1f2eb'; ctx.fillRect(obs.width - 20, 18, 12, 10);
        ctx.fillStyle = '#111';[10, 35, obs.width - 20].forEach(wx => { ctx.beginPath(); ctx.arc(wx, obs.height - 8, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(wx, obs.height - 8, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#111'; });
      }
    } else if (mapType === 'SNOW') {
      if (obs.type === ObstacleType.CRATE) {
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(0, 0, obs.width, obs.height);
        ctx.fillStyle = '#f1c40f'; ctx.fillRect(obs.width / 2 - 4, 0, 8, obs.height); ctx.fillRect(0, obs.height / 2 - 4, obs.width, 8);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; ctx.fillRect(2, 2, 8, 8);
        ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.ellipse(obs.width / 2, 0, 10, 6, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(obs.width / 2, 0, 10, 6, -0.4, 0, Math.PI * 2); ctx.fill();
      } else if (obs.type === ObstacleType.ROCK) {
        const drawBall = (cx: number, cy: number, r: number) => {
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI); ctx.fill();
        };
        drawBall(obs.width / 2, obs.height - 15, 15); drawBall(obs.width / 2, obs.height - 35, 11); drawBall(obs.width / 2, obs.height - 50, 8);
        ctx.fillStyle = '#d35400'; ctx.beginPath(); ctx.moveTo(obs.width / 2, obs.height - 50); ctx.lineTo(obs.width / 2 + 8, obs.height - 48); ctx.lineTo(obs.width / 2, obs.height - 46); ctx.fill();
        ctx.fillStyle = '#000'; ctx.fillRect(obs.width / 2 - 4, obs.height - 54, 2, 2); ctx.fillRect(obs.width / 2 + 2, obs.height - 54, 2, 2);
        ctx.fillStyle = '#2c3e50'; ctx.fillRect(obs.width / 2 - 8, obs.height - 62, 16, 4); ctx.fillRect(obs.width / 2 - 5, obs.height - 72, 10, 10);
      } else {
        ctx.fillStyle = '#4b301c'; ctx.fillRect(obs.width / 2 - 5, obs.height - 12, 10, 12);
        const drawLayer = (y: number, w: number, h: number) => {
          ctx.fillStyle = '#1e3d1c'; ctx.beginPath(); ctx.moveTo(obs.width / 2 - w / 2, y + h); ctx.lineTo(obs.width / 2, y); ctx.lineTo(obs.width / 2 + w / 2, y + h); ctx.fill();
          ctx.fillStyle = '#ecf0f1'; ctx.beginPath(); ctx.moveTo(obs.width / 2 - w / 2, y + h); ctx.lineTo(obs.width / 2 - w / 2 + 6, y + h - 4); ctx.lineTo(obs.width / 2 - w / 2 + 12, y + h); ctx.fill();
        };
        drawLayer(obs.height - 40, obs.width, 30); drawLayer(obs.height - 60, obs.width - 15, 25); drawLayer(obs.height - 75, obs.width - 30, 20);
      }
    } else if (mapType === 'BEACH') {
      if (obs.type === ObstacleType.CRATE) {
        const drawChair = (x: number, color: string) => {
          ctx.save(); ctx.translate(x, 0);
          ctx.strokeStyle = '#ecf0f1'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, obs.height); ctx.lineTo(10, obs.height - 22); ctx.stroke(); ctx.beginPath(); ctx.moveTo(20, obs.height); ctx.lineTo(14, obs.height - 22); ctx.stroke();
          ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(2, obs.height - 22); ctx.lineTo(22, obs.height - 22); ctx.lineTo(19, 4); ctx.lineTo(5, 4); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#ecf0f1'; ctx.fillRect(2, 2, 20, 3); ctx.restore();
        }
        drawChair(5, '#3498db'); drawChair(32, '#e67e22');
      } else if (obs.type === ObstacleType.ROCK) {
        ctx.save(); ctx.translate(obs.width / 2, obs.height / 2);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, obs.width / 2, 0, Math.PI * 2); ctx.fill();
        const colors = ['#e74c3c', '#3498db', '#f1c40f'];
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = colors[i]; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, obs.width / 2, (i * Math.PI * 2 / 3), (i * Math.PI * 2 / 3) + Math.PI / 3); ctx.fill();
        }
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      } else {
        ctx.fillStyle = '#ecf0f1'; ctx.beginPath(); ctx.moveTo(5, obs.height - 2); ctx.lineTo(obs.width - 5, obs.height - 2); ctx.lineTo(obs.width, obs.height - 28); ctx.lineTo(15, obs.height - 28); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(10, obs.height - 15, obs.width - 20, 10);
        ctx.fillStyle = '#2980b9'; ctx.fillRect(8, obs.height - 24, obs.width - 12, 4);
        ctx.fillStyle = '#7f8c8d'; ctx.fillRect(obs.width / 2 - 3, 4, 6, obs.height - 30);
        ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.moveTo(obs.width / 2, 6); ctx.quadraticCurveTo(obs.width / 2 + 28, 18, obs.width / 2, 38); ctx.fill();
        ctx.strokeStyle = '#dcdde1'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.moveTo(obs.width / 2, 4); ctx.lineTo(obs.width / 2 + 18, 11); ctx.lineTo(obs.width / 2, 18); ctx.fill();
      }
    } else {
      if (obs.type === ObstacleType.CRATE) {
        ctx.fillStyle = '#8b4513'; ctx.fillRect(0, 0, obs.width, obs.height);
        ctx.strokeStyle = '#5d3b2a'; ctx.lineWidth = 2; ctx.strokeRect(3, 3, obs.width - 6, obs.height - 6);
        ctx.beginPath(); ctx.moveTo(0, obs.height / 2); ctx.lineTo(obs.width, obs.height / 2); ctx.moveTo(obs.width / 2, 0); ctx.lineTo(obs.width / 2, obs.height); ctx.stroke();
        ctx.fillStyle = '#333';[4, obs.width - 6].forEach(nx => [4, obs.height - 6].forEach(ny => ctx.fillRect(nx, ny, 2, 2)));
      } else if (obs.type === ObstacleType.ROCK) {
        ctx.fillStyle = '#7f8c8d'; ctx.beginPath(); ctx.arc(obs.width / 2, obs.height / 2, Math.min(obs.width, obs.height) / 2 - 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(obs.width / 2, obs.height / 2 + 2, Math.min(obs.width, obs.height) / 2 - 2, 0, Math.PI); ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; ctx.beginPath(); ctx.arc(obs.width / 2 - 5, obs.height / 2 - 5, 5, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#3a2012'; ctx.beginPath(); ctx.roundRect(0, 0, obs.width, obs.height, 6); ctx.fill();
        ctx.fillStyle = '#d2b48c'; ctx.beginPath(); ctx.arc(8, obs.height / 2, 12, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#8b4513'; ctx.beginPath(); ctx.arc(8, obs.height / 2, 8, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        for (let i = 20; i < obs.width - 10; i += 15) { ctx.beginPath(); ctx.moveTo(i, 5); ctx.lineTo(i + 5, obs.height - 5); ctx.stroke(); }
      }
    }

    if (obs.health < obs.maxHealth) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(obs.width / 2, 5); ctx.lineTo(obs.width / 2 - 5, obs.height / 2); ctx.lineTo(obs.width / 2 + 5, obs.height - 5); ctx.stroke();
    }
    ctx.restore();
  }

  const draw = (ctx: CanvasRenderingContext2D) => {
    const engine = engineRef.current;
    const theme = THEMES[mapType];

    ctx.save();
    if (engine.screenShake > 0) ctx.translate((Math.random() - 0.5) * engine.screenShake, (Math.random() - 0.5) * engine.screenShake);

    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, theme.bgTop);
    grad.addColorStop(1, theme.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const farParallaxX = engine.distance * 15;
    ctx.fillStyle = theme.farTrees;
    for (let i = -1; i < 8; i++) {
      const x = (i * 150) - (farParallaxX % 150);
      const seed = Math.floor((farParallaxX + i * 150) / 150) + 10;
      const rnd = pseudoRandom(seed);

      if (mapType === 'ROAD') {
        const bWidth = 60 + rnd * 60;
        const bHeight = 150 + rnd * 150;
        ctx.fillStyle = theme.farTrees; ctx.fillRect(x, BASE_GROUND_Y - bHeight, bWidth, bHeight);
        ctx.fillStyle = 'rgba(255, 255, 224, 0.1)';
        for (let wy = 15; wy < bHeight - 20; wy += 25) {
          for (let wx = 10; wx < bWidth - 10; wx += 20) { ctx.fillRect(x + wx, BASE_GROUND_Y - bHeight + wy, 6, 10); }
        }
      } else {
        ctx.fillStyle = theme.farTrees; ctx.beginPath(); ctx.moveTo(x, CANVAS_HEIGHT); ctx.lineTo(x + 50 + rnd * 50, BASE_GROUND_Y - 100 - rnd * 100); ctx.lineTo(x + 100 + rnd * 100, CANVAS_HEIGHT); ctx.fill();
      }
    }

    if (mapType === 'BEACH') {
      ctx.fillStyle = '#3498db';
      const waterY = BASE_GROUND_Y + 20;
      ctx.fillRect(0, waterY, CANVAS_WIDTH, CANVAS_HEIGHT - waterY);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < CANVAS_WIDTH; i += 100) {
        const wx = (i - (engine.distance * 150) % 100);
        ctx.fillRect(wx, waterY - 5 + Math.sin(engine.frame * 0.05 + i) * 5, 40, 4);
      }
    }

    ctx.fillStyle = theme.ground; ctx.beginPath(); ctx.moveTo(0, CANVAS_HEIGHT);
    for (let x = 0; x <= CANVAS_WIDTH; x += 10) { ctx.lineTo(x, getGroundHeight(x, engine.distance)); }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT); ctx.fill();

    ctx.strokeStyle = theme.grass; ctx.lineWidth = 6;
    if (mapType === 'ROAD') { ctx.setLineDash([40, 40]); ctx.lineDashOffset = (engine.distance * 100) % 80; }
    ctx.beginPath();
    for (let x = 0; x <= CANVAS_WIDTH; x += 10) {
      const gy = getGroundHeight(x, engine.distance);
      if (x === 0) ctx.moveTo(x, gy); else ctx.lineTo(x, gy);
    }
    ctx.stroke(); ctx.setLineDash([]);

    engine.collectibles.forEach(coll => {
      ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(coll.x + 10, coll.y + 10 + Math.sin(engine.frame * 0.1) * 5, 8, 0, Math.PI * 2); ctx.fill();
    });

    engine.obstacles.forEach(obs => drawObstacle(ctx, obs, engine));
    engine.particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });
    ctx.globalAlpha = 1.0;

    drawChaser(ctx, engine);
    drawPlayer(ctx, engine);

    if (status === 'PLAYING') {
      const { x, y } = mousePosRef.current;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x + 10, y); ctx.moveTo(x, y - 10); ctx.lineTo(x, y + 10); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.stroke();
    }

    ctx.restore();
    if (engine.flashRed > 0) { ctx.fillStyle = `rgba(255, 0, 0, ${engine.flashRed / 40})`; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animFrame: number;
    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = time - lastTime; lastTime = time;
      if (status === 'PLAYING') update(Math.min(dt, 50));
      draw(ctx);
      animFrame = requestAnimationFrame(loop);
    };
    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [status, mode, mapType, character]);

  useEffect(() => {
    if (status === 'PLAYING' && (lastStatusRef.current === 'GAMEOVER' || lastStatusRef.current === 'START')) resetEngine();
    lastStatusRef.current = status;
  }, [status]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full h-full cursor-none"
      onMouseDown={handleCanvasClick}
      onTouchStart={handleCanvasClick}
      onMouseMove={handleMouseMove}
    />
  );
};

export default GameCanvas;
