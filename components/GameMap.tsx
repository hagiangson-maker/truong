
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
    MAP_WIDTH, MAP_HEIGHT, TREE_COUNT, PLAYER_SPEED, 
    ZOMBIE_COUNT, ZOMBIE_SPEED, ZOMBIE_RADIUS,
    BULLET_SPEED, BULLET_MAX_DIST, BULLET_RADIUS,
    PLAYER_MAX_HEALTH, ZOMBIE_DAMAGE, DAMAGE_COOLDOWN_MS, PLAYER_RADIUS,
    GAME_SCALE, BOMB_COUNT, BOMB_RADIUS, MAGNET_COUNT, MAGNET_RADIUS,
    PICKUP_RADIUS, DIAMOND_RADIUS, FIRE_RATE_MS, SKILLS_CONFIG, ZOMBIE_MAX_HEALTH,
    ZOMBIE_SPAWN_INTERVAL, BOSS_HP, BOSS_DAMAGE, BOSS_SCALE, BOSS_MILESTONE_INTERVAL
} from '../constants';
import { PlayerState, Tree, Position, Bullet, Zombie, Diamond, Bomb, Magnet, SkillState } from '../types';

interface GameMapProps {
  initialSkin: string;
  setHealth: (health: number) => void;
  onGameOver: () => void;
  onZombieKilled: (count?: number) => void;
  onDiamondCollected: (count: number) => void;
  skills: SkillState;
  isPaused: boolean;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
}

const GameMap: React.FC<GameMapProps> = ({ 
  initialSkin, 
  setHealth,
  onGameOver,
  onZombieKilled,
  onDiamondCollected,
  skills,
  isPaused
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Game State (Refs for performance) ---
  const playerRef = useRef<PlayerState>({
    position: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 },
    rotation: 0,
    skinColor: initialSkin,
  });
  
  // Dynamic Zoom Scale (Starts at GAME_SCALE, which is 0.25)
  const scaleRef = useRef(GAME_SCALE);
  const mousePosRef = useRef({ x: 0, y: 0 }); // Track mouse relative to screen center
  
  const bulletsRef = useRef<Bullet[]>([]);
  const zombiesRef = useRef<Zombie[]>([]);
  const diamondsRef = useRef<Diamond[]>([]);
  const bombsRef = useRef<Bomb[]>([]);
  const magnetsRef = useRef<Magnet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  // Game Logic Refs
  const healthRef = useRef(PLAYER_MAX_HEALTH);
  const lastSpawnTimeRef = useRef(0);
  const lastShotTimeRef = useRef(0);
  const lastHealTimeRef = useRef(0);
  const lastLaserTimeRef = useRef(0);
  const isLaserActiveRef = useRef(false);
  const axeRotationRef = useRef(0);
  const diamondsCountRef = useRef(0);
  const lastBossSpawnRef = useRef(0); 

  // New Skill Timers
  const lastFreezeTimeRef = useRef(0);
  const lastShockwaveTimeRef = useRef(0);
  const lastApocalypseTimeRef = useRef(0);
  
  // Input Refs
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  
  // Generate Trees Once
  const trees = useMemo(() => {
    const generatedTrees: Tree[] = [];
    for (let i = 0; i < TREE_COUNT; i++) {
      generatedTrees.push({
        id: i,
        x: Math.random() * MAP_WIDTH,
        y: Math.random() * MAP_HEIGHT,
        scale: 0.8 + Math.random() * 0.6,
        type: Math.floor(Math.random() * 3),
      });
    }
    return generatedTrees;
  }, []);

  // --- Initialization ---
  useEffect(() => {
    // Initial Zombies
    const initialZombies: Zombie[] = [];
    for(let i=0; i<ZOMBIE_COUNT; i++) {
        let x, y, dist;
        do {
            x = Math.random() * MAP_WIDTH;
            y = Math.random() * MAP_HEIGHT;
            dist = Math.hypot(x - MAP_WIDTH/2, y - MAP_HEIGHT/2);
        } while (dist < 800);
        initialZombies.push({ 
            id: i, x, y, rotation: 0, 
            health: ZOMBIE_MAX_HEALTH, 
            maxHealth: ZOMBIE_MAX_HEALTH,
            attackFrame: 0,
            lastTakenDamageTime: 0,
            freezeTimer: 0
        });
    }
    zombiesRef.current = initialZombies;

    // Initial Bombs
    const initialBombs: Bomb[] = [];
    for(let i=0; i<BOMB_COUNT; i++) {
        initialBombs.push({
            id: i,
            x: Math.random() * MAP_WIDTH,
            y: Math.random() * MAP_HEIGHT
        });
    }
    bombsRef.current = initialBombs;

    // Initial Magnets
    const initialMagnets: Magnet[] = [];
    for(let i=0; i<MAGNET_COUNT; i++) {
        initialMagnets.push({
            id: i,
            x: Math.random() * MAP_WIDTH,
            y: Math.random() * MAP_HEIGHT
        });
    }
    magnetsRef.current = initialMagnets;
  }, []);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false; };
    
    // Zoom Handler
    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        
        const canvasWidth = canvasRef.current ? canvasRef.current.width : window.innerWidth;
        const minScale = GAME_SCALE / 4;
        const maxScale = canvasWidth / (10 * PLAYER_RADIUS * 2);

        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity * scaleRef.current;
        
        let newScale = scaleRef.current + delta;
        newScale = Math.max(minScale, Math.min(maxScale, newScale));
        
        scaleRef.current = newScale;
    };

    const handleMouseMove = (e: MouseEvent) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        mousePosRef.current = { 
            x: e.clientX - centerX, 
            y: e.clientY - centerY 
        };
    };

    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    
    handleResize();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // --- Helper Functions ---
  const spawnDiamond = (x: number, y: number) => {
      const newDiamond: Diamond = {
          id: Date.now() + Math.random(),
          x, y, value: 1
      };
      diamondsRef.current.push(newDiamond);
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 1;
          particlesRef.current.push({
              x, y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1.0,
              color
          });
      }
  };

  // --- Drawing Helpers ---
  const drawTree = (ctx: CanvasRenderingContext2D, tree: Tree) => {
      ctx.save();
      ctx.translate(tree.x, tree.y);
      ctx.scale(tree.scale, tree.scale);
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 40, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trunk
      ctx.fillStyle = '#3E2723';
      ctx.fillRect(-5, -10, 10, 20);

      // Leaves
      const layers = [
          { y: -10, w: 40, h: 60, c: '#1B5E20' },
          { y: -30, w: 35, h: 50, c: '#2E7D32' },
          { y: -50, w: 30, h: 40, c: '#4CAF50' },
      ];
      layers.forEach(l => {
          ctx.fillStyle = l.c;
          ctx.beginPath();
          ctx.moveTo(0, l.y - l.h);
          ctx.lineTo(l.w, l.y);
          ctx.lineTo(-l.w, l.y);
          ctx.fill();
      });
      ctx.restore();
  };

  const drawZombie = (ctx: CanvasRenderingContext2D, z: Zombie) => {
      ctx.save();
      ctx.translate(z.x, z.y);
      
      if (z.isBoss) {
          ctx.scale(BOSS_SCALE, BOSS_SCALE);
      }
      
      ctx.rotate(z.rotation);

      if (z.attackFrame > 0) ctx.translate(5, 0);

      // Frozen effect
      if (z.freezeTimer && z.freezeTimer > 0) {
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 10;
      }

      // Body
      ctx.fillStyle = (z.freezeTimer && z.freezeTimer > 0) ? '#0891b2' : (z.isBoss ? '#581c87' : '#14532d');
      ctx.beginPath();
      ctx.arc(0, 0, ZOMBIE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = z.isBoss ? '#facc15' : '#052e16';
      ctx.lineWidth = z.isBoss ? 3 : 2;
      ctx.stroke();

      // Arms
      ctx.fillStyle = (z.freezeTimer && z.freezeTimer > 0) ? '#0891b2' : (z.isBoss ? '#581c87' : '#14532d');
      ctx.beginPath();
      ctx.ellipse(15, -15, 10, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(15, 15, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(10, -8, 3, 0, Math.PI * 2);
      ctx.arc(10, 8, 3, 0, Math.PI * 2);
      ctx.fill();

      // Boss Crown
      if (z.isBoss) {
          ctx.rotate(-z.rotation);
          ctx.fillStyle = '#facc15'; 
          ctx.beginPath();
          ctx.moveTo(-10, -25);
          ctx.lineTo(-5, -15);
          ctx.lineTo(0, -25);
          ctx.lineTo(5, -15);
          ctx.lineTo(10, -25);
          ctx.lineTo(10, -10);
          ctx.lineTo(-10, -10);
          ctx.closePath();
          ctx.fill();
          ctx.rotate(z.rotation);
      }

      ctx.rotate(-z.rotation);
      if (z.health < z.maxHealth) {
          const barWidth = 40;
          const barHeight = 4;
          const hpPct = z.health / z.maxHealth;
          const yOffset = z.isBoss ? -ZOMBIE_RADIUS * 1.5 : -ZOMBIE_RADIUS - 10;
          ctx.fillStyle = '#333';
          ctx.fillRect(-barWidth/2, yOffset, barWidth, barHeight);
          ctx.fillStyle = z.isBoss ? '#9333ea' : '#ef4444';
          ctx.fillRect(-barWidth/2, yOffset, barWidth * hpPct, barHeight);
      }
      ctx.restore();
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, p: PlayerState) => {
      ctx.save();
      ctx.translate(p.position.x, p.position.y);
      ctx.rotate(p.rotation);

      // God Mode Aura
      if (skills.godMode > 0) {
          ctx.shadowColor = '#facc15'; // Gold glow
          ctx.shadowBlur = 20;
      }

      ctx.fillStyle = p.skinColor;
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Revolver
      ctx.save();
      ctx.translate(15, 8); 
      ctx.fillStyle = '#5D4037'; ctx.fillRect(-5, -3, 10, 6);
      ctx.fillStyle = '#455A64'; ctx.beginPath(); ctx.arc(8, 0, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#37474F'; ctx.fillRect(8, -2, 18, 4);
      ctx.fillStyle = '#000'; ctx.fillRect(24, -3, 2, 2);
      ctx.restore();

      ctx.fillStyle = p.skinColor;
      ctx.beginPath();
      ctx.arc(15, 8, 5, 0, Math.PI * 2);
      ctx.arc(8, -10, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
  };

  const drawDiamond = (ctx: CanvasRenderingContext2D, d: Diamond) => {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.scale(1.5, 1.5);
    ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(8, 0); ctx.lineTo(0, 10); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#93c5fd';
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(4, -3); ctx.lineTo(0, 0); ctx.lineTo(-4, -3); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  const drawBomb = (ctx: CanvasRenderingContext2D, b: Bomb) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(-5, -5, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#d97706'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -15); ctx.quadraticCurveTo(5, -20, 10, -18); ctx.stroke();
      const time = Date.now() / 100;
      if (Math.floor(time) % 2 === 0) {
          ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(10, -18, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#fff'; ctx.font = '10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('☠️', 0, 2);
      ctx.restore();
  };

  const drawMagnet = (ctx: CanvasRenderingContext2D, m: Magnet) => {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.scale(1.2, 1.2);
      ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, 0, 12, Math.PI, 0); ctx.lineTo(12, 10); ctx.lineTo(6, 10); ctx.lineTo(6, 0); ctx.arc(0, 0, 6, 0, Math.PI, true); ctx.lineTo(-6, 10); ctx.lineTo(-12, 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(-12, 10, 6, 4); ctx.fillRect(6, 10, 6, 4);
      ctx.restore();
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
      particlesRef.current.forEach(p => {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
      });
  };

  // --- Main Game Loop ---
  useEffect(() => {
    let animationFrameId: number;

    const loop = (timestamp: number) => {
      if (isPaused) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x: px, y: py } = playerRef.current.position;

      // ZOOM INPUT
      if (keysPressed.current['i']) {
         const canvasWidth = canvas.width;
         const maxScale = canvasWidth / (10 * PLAYER_RADIUS * 2);
         scaleRef.current = Math.min(maxScale, scaleRef.current + 0.005);
      }
      if (keysPressed.current['o']) {
         const minScale = GAME_SCALE / 4;
         scaleRef.current = Math.max(minScale, scaleRef.current - 0.005);
      }

      // ROTATION & MOVEMENT
      const mouseDx = mousePosRef.current.x;
      const mouseDy = mousePosRef.current.y;
      playerRef.current.rotation = Math.atan2(mouseDy, mouseDx);
      const facingAngle = playerRef.current.rotation;

      let moveX = 0;
      let moveY = 0;
      const fwdX = Math.cos(facingAngle);
      const fwdY = Math.sin(facingAngle);
      const rightX = Math.cos(facingAngle + Math.PI/2);
      const rightY = Math.sin(facingAngle + Math.PI/2);

      if (keysPressed.current['w'] || keysPressed.current['arrowup']) { moveX += fwdX; moveY += fwdY; }
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) { moveX -= fwdX; moveY -= fwdY; }
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) { moveX += rightX; moveY += rightY; }
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) { moveX -= rightX; moveY -= rightY; }

      if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        moveX = (moveX / len) * PLAYER_SPEED;
        moveY = (moveY / len) * PLAYER_SPEED;
      }

      let newX = px + moveX;
      let newY = py + moveY;
      newX = Math.max(PLAYER_RADIUS, Math.min(MAP_WIDTH - PLAYER_RADIUS, newX));
      newY = Math.max(PLAYER_RADIUS, Math.min(MAP_HEIGHT - PLAYER_RADIUS, newY));
      playerRef.current.position = { x: newX, y: newY };

      // --- LOGIC UPDATES ---

      // SKILL: FREEZE NOVA
      if (skills.freezeNova > 0) {
          if (timestamp - lastFreezeTimeRef.current > 10000) { // Cooldown 10s
              lastFreezeTimeRef.current = timestamp;
              const duration = SKILLS_CONFIG.freezeNova.levels[skills.freezeNova - 1];
              zombiesRef.current.forEach(z => {
                  z.freezeTimer = duration;
              });
              spawnParticles(newX, newY, '#06b6d4', 30);
          }
      }

      // SKILL: SHOCKWAVE
      if (skills.shockwave > 0) {
          if (timestamp - lastShockwaveTimeRef.current > 5000) { // Cooldown 5s
              lastShockwaveTimeRef.current = timestamp;
              const pushDist = SKILLS_CONFIG.shockwave.levels[skills.shockwave - 1];
              zombiesRef.current.forEach(z => {
                  const ang = Math.atan2(z.y - newY, z.x - newX);
                  z.x += Math.cos(ang) * pushDist;
                  z.y += Math.sin(ang) * pushDist;
              });
              spawnParticles(newX, newY, '#ffffff', 30);
          }
      }

      // SKILL: ADMIN APOCALYPSE
      if (skills.apocalypse > 0) {
          if (timestamp - lastApocalypseTimeRef.current > 5000) {
              lastApocalypseTimeRef.current = timestamp;
              zombiesRef.current.forEach(z => {
                  z.health = -999;
                  spawnParticles(z.x, z.y, '#000000', 10);
              });
              // Visual Flash
              ctx.fillStyle = 'white';
              ctx.fillRect(0,0, canvas.width, canvas.height);
          }
      }

      // SPAWNING
      const currentMilestone = Math.floor(diamondsCountRef.current / BOSS_MILESTONE_INTERVAL);
      if (currentMilestone > 0 && currentMilestone > lastBossSpawnRef.current) {
          lastBossSpawnRef.current = currentMilestone;
          let zx, zy, dist;
          do { zx = Math.random() * MAP_WIDTH; zy = Math.random() * MAP_HEIGHT; dist = Math.hypot(zx - newX, zy - newY); } while (dist < 800);
          zombiesRef.current.push({ id: Date.now(), x: zx, y: zy, rotation: 0, health: BOSS_HP, maxHealth: BOSS_HP, attackFrame: 0, lastTakenDamageTime: 0, isBoss: true, freezeTimer: 0 });
      }

      const currentSpawnInterval = Math.max(100, ZOMBIE_SPAWN_INTERVAL - Math.floor(diamondsCountRef.current / 10) * 10);
      if (timestamp - lastSpawnTimeRef.current > currentSpawnInterval && zombiesRef.current.length < ZOMBIE_COUNT) {
          lastSpawnTimeRef.current = timestamp;
          let zx, zy, dist;
          do { zx = Math.random() * MAP_WIDTH; zy = Math.random() * MAP_HEIGHT; dist = Math.hypot(zx - newX, zy - newY); } while (dist < 800);
          zombiesRef.current.push({ id: Date.now() + Math.random(), x: zx, y: zy, rotation: 0, health: ZOMBIE_MAX_HEALTH, maxHealth: ZOMBIE_MAX_HEALTH, attackFrame: 0, lastTakenDamageTime: 0, freezeTimer: 0 });
      }

      // SKILLS Logic (Heal, Laser, Axe) - Existing
      if (skills.autoHeal > 0) {
          if (timestamp - lastHealTimeRef.current > SKILLS_CONFIG.autoHeal.levels[skills.autoHeal - 1]) {
              lastHealTimeRef.current = timestamp;
              if (healthRef.current < PLAYER_MAX_HEALTH) {
                  setHealth(Math.min(PLAYER_MAX_HEALTH, healthRef.current + 10));
                  healthRef.current = Math.min(PLAYER_MAX_HEALTH, healthRef.current + 10);
                  spawnParticles(newX, newY, '#22c55e', 10);
              }
          }
      }
      
      let laserBeams: any[] = [];
      if (skills.laser > 0) {
          if (timestamp - lastLaserTimeRef.current > 3000) {
              lastLaserTimeRef.current = timestamp;
              isLaserActiveRef.current = true;
              setTimeout(() => { isLaserActiveRef.current = false; }, 500);
          }
          if (isLaserActiveRef.current) {
               const count = SKILLS_CONFIG.laser.levels[skills.laser - 1];
               const isRed = skills.laser === 3;
               const angleStep = (Math.PI * 2) / count;
               const baseAngle = (timestamp / 1000) % (Math.PI * 2);
               for(let i=0; i<count; i++) {
                   const angle = baseAngle + i * angleStep;
                   const lx = newX + Math.cos(angle) * (isRed ? 1200 : 600);
                   const ly = newY + Math.sin(angle) * (isRed ? 1200 : 600);
                   laserBeams.push({ x1: newX, y1: newY, x2: lx, y2: ly, isRed });
               }
          }
      }

      const axeHitboxes: any[] = [];
      if (skills.spinningAxes > 0) {
          axeRotationRef.current += 0.05;
          const count = SKILLS_CONFIG.spinningAxes.levels[skills.spinningAxes - 1];
          const angleStep = (Math.PI * 2) / count;
          for(let i=0; i<count; i++) {
              const angle = axeRotationRef.current + i * angleStep;
              axeHitboxes.push({ x: newX + Math.cos(angle) * 100, y: newY + Math.sin(angle) * 100, r: 35, level: skills.spinningAxes });
          }
      }

      // BULLETS
      if (timestamp - lastShotTimeRef.current > (skills.weapon >= 1 ? 300 : FIRE_RATE_MS)) {
          lastShotTimeRef.current = timestamp;
          let targetAngle = playerRef.current.rotation;
          let closest = null, minD = Infinity;
          zombiesRef.current.forEach(z => { const d = Math.hypot(z.x - newX, z.y - newY); if(d < minD){ minD = d; closest = z; }});
          if (closest) targetAngle = Math.atan2(closest.y - newY, closest.x - newX);
          
          const bx = newX + Math.cos(playerRef.current.rotation) * 25;
          const by = newY + Math.sin(playerRef.current.rotation) * 25;
          const createB = (off: number) => ({ id: Date.now()+Math.random(), x: bx, y: by, angle: targetAngle+off, distanceTraveled: 0, penetration: skills.weapon>=2?1:0, hitIds: [] });
          
          bulletsRef.current.push(createB(0));
          if (skills.weapon >= 3) { bulletsRef.current.push(createB(-0.1)); bulletsRef.current.push(createB(0.1)); }
      }

      bulletsRef.current = bulletsRef.current.filter(b => {
          b.x += Math.cos(b.angle) * BULLET_SPEED; b.y += Math.sin(b.angle) * BULLET_SPEED;
          b.distanceTraveled += BULLET_SPEED;
          return b.distanceTraveled < BULLET_MAX_DIST && b.x > 0 && b.x < MAP_WIDTH && b.y > 0 && b.y < MAP_HEIGHT;
      });

      // INTERACTIONS
      magnetsRef.current = magnetsRef.current.filter(m => {
          if (Math.hypot(m.x - newX, m.y - newY) < PICKUP_RADIUS + MAGNET_RADIUS) {
              diamondsRef.current.forEach(d => d.isAttracted = true);
              spawnParticles(newX, newY, '#3b82f6', 20);
              setTimeout(() => magnetsRef.current.push({ id: Date.now(), x: Math.random()*MAP_WIDTH, y: Math.random()*MAP_HEIGHT }), 30000);
              return false;
          }
          return true;
      });

      bombsRef.current = bombsRef.current.filter(b => {
          if (Math.hypot(b.x - newX, b.y - newY) < PICKUP_RADIUS + BOMB_RADIUS) {
               const vWidth = canvas.width / scaleRef.current;
               const vHeight = canvas.height / scaleRef.current;
               let killed = 0;
               zombiesRef.current = zombiesRef.current.filter(z => {
                   if(z.isBoss) return true;
                   if(Math.abs(z.x - newX) < vWidth/2 && Math.abs(z.y - newY) < vHeight/2) {
                       spawnDiamond(z.x, z.y); killed++; return false;
                   }
                   return true;
               });
               if(killed > 0) { onZombieKilled(killed); spawnParticles(newX, newY, '#fbbf24', 30); }
               setTimeout(() => bombsRef.current.push({ id: Date.now(), x: Math.random()*MAP_WIDTH, y: Math.random()*MAP_HEIGHT }), 10000);
               return false;
          }
          return true;
      });

      let collected = 0;
      diamondsRef.current = diamondsRef.current.filter(d => {
          if (d.isAttracted) { const a = Math.atan2(newY - d.y, newX - d.x); d.x += Math.cos(a)*15; d.y += Math.sin(a)*15; }
          if (Math.hypot(d.x - newX, d.y - newY) < PICKUP_RADIUS) { collected += d.value; return false; }
          return true;
      });
      if(collected > 0) { diamondsCountRef.current += collected; onDiamondCollected(diamondsCountRef.current); }

      // ZOMBIE UPDATE
      zombiesRef.current.forEach(z => {
          // Freeze Logic
          if (z.freezeTimer && z.freezeTimer > 0) {
              z.freezeTimer -= 16; // Approx frame time
          } else {
              const dx = newX - z.x;
              const dy = newY - z.y;
              z.rotation = Math.atan2(dy, dx);
              const zR = z.isBoss ? ZOMBIE_RADIUS * BOSS_SCALE : ZOMBIE_RADIUS;
              if (Math.hypot(dx, dy) > PLAYER_RADIUS + zR) {
                  const s = z.isBoss ? ZOMBIE_SPEED * 0.7 : ZOMBIE_SPEED;
                  z.x += Math.cos(z.rotation) * s;
                  z.y += Math.sin(z.rotation) * s;
                  z.attackFrame = 0;
              } else {
                  if (timestamp - z.attackFrame > 500) z.attackFrame = timestamp;
                  if (timestamp - z.lastTakenDamageTime > DAMAGE_COOLDOWN_MS) {
                       // GOD MODE CHECK
                       if (skills.godMode === 0) {
                           const red = skills.defense > 0 ? SKILLS_CONFIG.defense.levels[skills.defense-1] : 0;
                           const dmg = (z.isBoss ? BOSS_DAMAGE : ZOMBIE_DAMAGE) * (1 - red);
                           healthRef.current -= dmg;
                           setHealth(healthRef.current);
                           if (healthRef.current <= 0) onGameOver();
                       }
                  }
              }
          }

          // Collisions
          for(let i=bulletsRef.current.length-1; i>=0; i--) {
              const b = bulletsRef.current[i];
              if(b.hitIds.includes(z.id)) continue;
              if(Math.hypot(b.x - z.x, b.y - z.y) < (z.isBoss ? ZOMBIE_RADIUS*BOSS_SCALE : ZOMBIE_RADIUS) + BULLET_RADIUS) {
                  let dmg = ZOMBIE_MAX_HEALTH * 0.2;
                  if (skills.godMode > 0) dmg *= 10; // Admin OP Damage
                  z.health -= dmg;
                  z.lastTakenDamageTime = timestamp;
                  b.hitIds.push(z.id);
                  spawnParticles(z.x, z.y, '#14532d', 3);
                  if(b.penetration > 0) b.penetration--; else bulletsRef.current.splice(i, 1);
                  if(z.health <= 0) break;
              }
          }

          axeHitboxes.forEach(a => {
              if(Math.hypot(a.x - z.x, a.y - z.y) < a.r + ZOMBIE_RADIUS) {
                  if(timestamp - z.lastTakenDamageTime > 500) {
                      z.lastTakenDamageTime = timestamp;
                      let dmg = a.level === 2 ? ZOMBIE_MAX_HEALTH : ZOMBIE_MAX_HEALTH * 0.5;
                      if (z.isBoss && a.level === 2) dmg = 200;
                      if (skills.godMode > 0) dmg = 9999;
                      z.health -= dmg;
                      spawnParticles(z.x, z.y, '#fbbf24', 5);
                  }
              }
          });

          laserBeams.forEach(l => {
              // Simple Line Collision Logic reused
              const labx = l.x2 - l.x1; const laby = l.y2 - l.y1;
              const lacx = z.x - l.x1; const lacy = z.y - l.y1;
              let t = (lacx*labx + lacy*laby) / (labx*labx + laby*laby);
              t = Math.max(0, Math.min(1, t));
              const px = l.x1 + t*labx; const py = l.y1 + t*laby;
              if (Math.hypot(z.x - px, z.y - py) < ZOMBIE_RADIUS + (l.isRed ? 20 : 5)) {
                  if (timestamp - z.lastTakenDamageTime > 200) {
                      z.lastTakenDamageTime = timestamp;
                      let dmg = ZOMBIE_MAX_HEALTH * (l.isRed ? 0.5 : 0.3);
                      if (skills.godMode > 0) dmg *= 10;
                      z.health -= dmg;
                      spawnParticles(z.x, z.y, l.isRed ? '#ef4444' : '#06b6d4', 3);
                  }
              }
          });
      });

      // Cleanup Dead
      const countBefore = zombiesRef.current.length;
      zombiesRef.current.forEach(z => { if(z.health <= 0 && z.maxHealth > -999) { 
          spawnDiamond(z.x, z.y); 
          if(z.isBoss) for(let i=0;i<10;i++) spawnDiamond(z.x+Math.random()*40-20, z.y+Math.random()*40-20);
          z.maxHealth = -9999; 
      }});
      zombiesRef.current = zombiesRef.current.filter(z => z.health > 0);
      if (countBefore - zombiesRef.current.length > 0) onZombieKilled(countBefore - zombiesRef.current.length);

      // --- RENDERING ---
      ctx.fillStyle = '#1a2e1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      const scale = scaleRef.current;
      ctx.translate(-newX * scale + canvas.width/2, -newY * scale + canvas.height/2);
      ctx.scale(scale, scale);

      ctx.fillStyle = '#233823';
      for(let i=0; i<20; i++) {
         const gx = (Math.floor(newX / 500) * 500) + (i%5)*200;
         const gy = (Math.floor(newY / 500) * 500) + (Math.floor(i/5))*200;
         ctx.fillRect(gx, gy, 10, 10);
      }

      magnetsRef.current.forEach(m => drawMagnet(ctx, m));
      bombsRef.current.forEach(b => drawBomb(ctx, b));
      diamondsRef.current.forEach(d => drawDiamond(ctx, d));

      const renderList = [
          ...trees.map(t => ({ y: t.y, draw: () => drawTree(ctx, t) })),
          ...zombiesRef.current.map(z => ({ y: z.y, draw: () => drawZombie(ctx, z) })),
          { y: newY, draw: () => drawPlayer(ctx, playerRef.current) }
      ].sort((a,b) => a.y - b.y);

      // Cull View
      const vw = canvas.width/scale, vh = canvas.height/scale;
      renderList.forEach(item => {
           // Simple culling could go here, but logic is tied to objects not positions in this list directly easily without refactor
           item.draw();
      });

      // Axes
      axeHitboxes.forEach(a => {
          ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(timestamp/100);
          ctx.shadowColor = a.level === 3 ? '#ef4444' : '#fff'; ctx.shadowBlur = 10;
          ctx.fillStyle = a.level === 3 ? '#b91c1c' : '#9ca3af';
          ctx.beginPath(); ctx.arc(0, -10, 25, 0, Math.PI, true); ctx.lineTo(0, 10); ctx.fill();
          ctx.fillStyle = '#4b2c20'; ctx.fillRect(-2, -10, 4, 60);
          ctx.restore();
      });

      // Lasers
      laserBeams.forEach(l => {
          ctx.beginPath(); ctx.strokeStyle = l.isRed ? '#ef4444' : '#06b6d4';
          ctx.lineWidth = l.isRed ? 15 : 5; ctx.lineCap = 'round';
          ctx.shadowColor = l.isRed ? '#f87171' : '#67e8f9'; ctx.shadowBlur = 15;
          ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke(); ctx.shadowBlur = 0;
      });

      bulletsRef.current.forEach(b => { ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(b.x, b.y, BULLET_RADIUS, 0, Math.PI*2); ctx.fill(); });
      drawParticles(ctx);

      ctx.restore();
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, skills, trees, initialSkin]);

  return <canvas ref={canvasRef} className="block bg-gray-900 cursor-crosshair" />;
};

export default GameMap;
