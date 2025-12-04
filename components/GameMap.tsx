import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
    MAP_WIDTH, MAP_HEIGHT, TREE_COUNT, PLAYER_SPEED, 
    ZOMBIE_COUNT, ZOMBIE_SPEED, ZOMBIE_RADIUS,
    BULLET_SPEED, BULLET_MAX_DIST, BULLET_RADIUS,
    PLAYER_MAX_HEALTH, ZOMBIE_DAMAGE, DAMAGE_COOLDOWN_MS, PLAYER_RADIUS,
    GAME_SCALE, BOMB_COUNT, BOMB_RADIUS,
    PICKUP_RADIUS, DIAMOND_RADIUS, FIRE_RATE_MS, SKILLS_CONFIG, ZOMBIE_MAX_HEALTH
} from '../constants';
import { PlayerState, Tree, Position, Bullet, Zombie, Diamond, Bomb, SkillState } from '../types';

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
  
  const bulletsRef = useRef<Bullet[]>([]);
  const zombiesRef = useRef<Zombie[]>([]);
  const diamondsRef = useRef<Diamond[]>([]);
  const bombsRef = useRef<Bomb[]>([]);
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
  const isShootingRef = useRef(false);
  
  // Input Refs
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mousePos = useRef<Position>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  
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
            lastTakenDamageTime: 0
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
  }, []);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false; };
    const handleMouseMove = (e: MouseEvent) => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    
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

    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', handleResize);
    
    // Initial size
    handleResize();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
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

  const getNearestZombie = (px: number, py: number, zombiesList: Zombie[]) => {
      let nearest = null;
      let minDist = Infinity;
      for (const z of zombiesList) {
          const dist = Math.hypot(z.x - px, z.y - py);
          if (dist < minDist) {
              minDist = dist;
              nearest = z;
          }
      }
      if (minDist > 1500) return null;
      return nearest;
  };

  // --- Canvas Drawing Helpers ---
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

      // Leaves (3 layers)
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
      ctx.rotate(z.rotation);

      // Attack Animation Offset
      if (z.attackFrame > 0) {
          ctx.translate(5, 0); // Lunge forward
      }

      // Body
      ctx.fillStyle = '#14532d'; // green-900
      ctx.beginPath();
      ctx.arc(0, 0, ZOMBIE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Head/Shoulders visual
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(0, 0, ZOMBIE_RADIUS * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = 'red';
      ctx.shadowColor = 'red';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(10, -8, 3, 0, Math.PI * 2);
      ctx.arc(10, 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Arms (for attack visualization)
      if (z.attackFrame > 0) {
          ctx.strokeStyle = '#14532d';
          ctx.lineWidth = 4;
          // Left arm
          ctx.beginPath();
          ctx.moveTo(5, -15);
          ctx.lineTo(20, -20);
          ctx.stroke();
          // Right arm
          ctx.beginPath();
          ctx.moveTo(5, 15);
          ctx.lineTo(20, 20);
          ctx.stroke();
      }

      // Health Bar if damaged
      if (z.health < z.maxHealth) {
          ctx.rotate(-z.rotation); // un-rotate for bar
          ctx.translate(0, -35);
          ctx.fillStyle = 'black';
          ctx.fillRect(-15, 0, 30, 4);
          ctx.fillStyle = 'red';
          ctx.fillRect(-15, 0, 30 * (z.health / z.maxHealth), 4);
      }

      ctx.restore();
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, p: PlayerState, defenseLevel: number, isShooting: boolean) => {
      ctx.save();
      ctx.translate(p.position.x, p.position.y);
      ctx.rotate(p.rotation);

      // Body
      ctx.fillStyle = p.skinColor;
      ctx.beginPath();
      ctx.arc(0, 0, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.stroke();

      // Shield visual
      if (defenseLevel > 0) {
          ctx.strokeStyle = `rgba(96, 165, 250, ${0.3 + (defenseLevel * 0.2)})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, PLAYER_RADIUS + 5, 0, Math.PI * 2);
          ctx.stroke();
      }

      // Hands
      ctx.fillStyle = p.skinColor;
      // Left hand
      ctx.beginPath();
      ctx.arc(10, -15, 6, 0, Math.PI * 2);
      ctx.fill();
      // Right hand (holding gun)
      ctx.beginPath();
      ctx.arc(10, 15, 6, 0, Math.PI * 2);
      ctx.fill();

      // Gun
      ctx.save();
      ctx.translate(15, 15);
      // Recoil
      if (isShooting) ctx.translate(-5, 0);
      
      ctx.fillStyle = '#374151'; // Gun metal
      ctx.fillRect(0, -3, 25, 6);
      
      // Muzzle flash
      if (isShooting) {
          ctx.fillStyle = '#facc15';
          ctx.shadowColor = 'orange';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(30, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
      }
      ctx.restore();

      ctx.restore();
  };

  // --- Main Game Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const loop = (time: number) => {
        if (!isPaused && healthRef.current > 0) {
            
            // --- LOGIC ---

            // 0. Zoom Control (I/O)
            const zoomSpeed = 1.02;
            const minScale = GAME_SCALE / 4;
            const maxScale = canvas.width / (10 * PLAYER_RADIUS * 2);

            if (keysPressed.current['i']) {
                scaleRef.current = Math.min(maxScale, scaleRef.current * zoomSpeed);
            }
            if (keysPressed.current['o']) {
                scaleRef.current = Math.max(minScale, scaleRef.current / zoomSpeed);
            }

            // 1. Player Movement
            let { x, y } = playerRef.current.position;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            // Angle to mouse
            let angle = Math.atan2(mousePos.current.y - centerY, mousePos.current.x - centerX);

            let dx = 0, dy = 0;
            if (keysPressed.current['w'] || keysPressed.current['arrowup']) { dx += Math.cos(angle); dy += Math.sin(angle); }
            if (keysPressed.current['s'] || keysPressed.current['arrowdown']) { dx -= Math.cos(angle); dy -= Math.sin(angle); }
            if (keysPressed.current['d'] || keysPressed.current['arrowright']) { dx += Math.cos(angle + Math.PI / 2); dy += Math.sin(angle + Math.PI / 2); }
            if (keysPressed.current['a'] || keysPressed.current['arrowleft']) { dx += Math.cos(angle - Math.PI / 2); dy += Math.sin(angle - Math.PI / 2); }

            if (dx !== 0 || dy !== 0) {
                const length = Math.sqrt(dx * dx + dy * dy);
                x += (dx / length) * PLAYER_SPEED;
                y += (dy / length) * PLAYER_SPEED;
                x = Math.max(50, Math.min(MAP_WIDTH - 50, x));
                y = Math.max(50, Math.min(MAP_HEIGHT - 50, y));
            }
            playerRef.current.position = { x, y };
            playerRef.current.rotation = angle;

            // 2. Auto-Fire
            if (time - lastShotTimeRef.current > FIRE_RATE_MS) {
                const target = getNearestZombie(x, y, zombiesRef.current);
                if (target) {
                    lastShotTimeRef.current = time;
                    isShootingRef.current = true;
                    // Reset shooting visual after 100ms
                    setTimeout(() => isShootingRef.current = false, 100);

                    const aimAngle = Math.atan2(target.y - y, target.x - x);
                    const offsetDist = 30;
                    bulletsRef.current.push({
                        id: Date.now() + Math.random(),
                        x: x + Math.cos(aimAngle) * offsetDist,
                        y: y + Math.sin(aimAngle) * offsetDist,
                        angle: aimAngle,
                        distanceTraveled: 0
                    });
                }
            }

            // 3. Skills
            // Auto Heal
            if (skills.autoHeal > 0) {
                const interval = SKILLS_CONFIG.autoHeal.levels[skills.autoHeal - 1];
                if (time - lastHealTimeRef.current > interval) {
                    lastHealTimeRef.current = time;
                    healthRef.current = Math.min(PLAYER_MAX_HEALTH, healthRef.current + 10);
                    setHealth(healthRef.current);
                }
            }
            // Axes
            if (skills.spinningAxes > 0) {
                axeRotationRef.current += 0.05;
            }
            // Laser
            if (skills.laser > 0) {
                if (time - lastLaserTimeRef.current > 3000) {
                    lastLaserTimeRef.current = time;
                    isLaserActiveRef.current = true;
                    setTimeout(() => isLaserActiveRef.current = false, 500);
                }
            }

            // 4. Update Entities
            // Bullets
            bulletsRef.current = bulletsRef.current.map(b => ({
                ...b,
                x: b.x + Math.cos(b.angle) * BULLET_SPEED,
                y: b.y + Math.sin(b.angle) * BULLET_SPEED,
                distanceTraveled: b.distanceTraveled + BULLET_SPEED
            })).filter(b => b.distanceTraveled < BULLET_MAX_DIST);

            // Particles
            particlesRef.current = particlesRef.current.map(p => ({
                ...p,
                x: p.x + p.vx,
                y: p.y + p.vy,
                life: p.life - 0.05
            })).filter(p => p.life > 0);

            // Zombies
            zombiesRef.current = zombiesRef.current.map(z => {
                const diffX = playerRef.current.position.x - z.x;
                const diffY = playerRef.current.position.y - z.y;
                const dist = Math.hypot(diffX, diffY);
                let moveX = 0, moveY = 0, rot = z.rotation;
                if (dist > 10) {
                    moveX = (diffX / dist) * ZOMBIE_SPEED;
                    moveY = (diffY / dist) * ZOMBIE_SPEED;
                    rot = Math.atan2(diffY, diffX);
                }
                
                // Attack animation decay
                const newAttackFrame = z.attackFrame > 0 ? z.attackFrame - 1 : 0;
                
                return { ...z, x: z.x + moveX, y: z.y + moveY, rotation: rot, attackFrame: newAttackFrame };
            });

            // 5. Collisions
            const deadZombieIds = new Set<number>();
            const deadBulletIds = new Set<number>();

            // Bullet vs Zombie
            for (const b of bulletsRef.current) {
                if (deadBulletIds.has(b.id)) continue;
                for (const z of zombiesRef.current) {
                    if (deadZombieIds.has(z.id)) continue;
                    if (Math.hypot(b.x - z.x, b.y - z.y) < (ZOMBIE_RADIUS + BULLET_RADIUS)) {
                        deadBulletIds.add(b.id);
                        
                        // Damage Logic: 20% of Max Health
                        z.health -= (z.maxHealth * 0.2);
                        z.lastTakenDamageTime = time;
                        
                        if (z.health <= 0) {
                            deadZombieIds.add(z.id);
                            spawnDiamond(z.x, z.y);
                            onZombieKilled(1);
                        }
                        break;
                    }
                }
            }

            // Axe vs Zombie
            if (skills.spinningAxes > 0) {
                const count = SKILLS_CONFIG.spinningAxes.levels[skills.spinningAxes - 1];
                const level = skills.spinningAxes;
                for(let i=0; i<count; i++) {
                    const ang = axeRotationRef.current + (i * (2 * Math.PI / count));
                    const ax = playerRef.current.position.x + Math.cos(ang) * 100;
                    const ay = playerRef.current.position.y + Math.sin(ang) * 100;
                    for (const z of zombiesRef.current) {
                        if (deadZombieIds.has(z.id)) continue;
                        
                        if (Math.hypot(ax - z.x, ay - z.y) < (ZOMBIE_RADIUS + 35)) {
                            // Hit
                            // Level 1: 50% dmg
                            // Level 2: Instant Kill (100% dmg)
                            // Level 3: 50% dmg (per prompt) but red + sparks
                            
                            // To prevent instant melting per frame, debounce or rely on low health
                            if (time - z.lastTakenDamageTime > 200) {
                                z.lastTakenDamageTime = time;
                                if (level === 2) {
                                    z.health = 0;
                                } else {
                                    z.health -= (z.maxHealth * 0.5);
                                    if (level === 3) {
                                        // Spawn sparks on hit
                                        spawnParticles(z.x, z.y, '#fca5a5', 5);
                                    }
                                }

                                if (z.health <= 0) {
                                    deadZombieIds.add(z.id);
                                    spawnDiamond(z.x, z.y);
                                    onZombieKilled(1);
                                }
                            }
                        }
                    }
                    // If level 3, always spawn some trail sparks
                    if (level === 3 && Math.random() < 0.3) {
                        spawnParticles(ax, ay, '#ef4444', 1);
                    }
                }
            }

            // Laser vs Zombie
            if (isLaserActiveRef.current && skills.laser > 0) {
                const count = SKILLS_CONFIG.laser.levels[skills.laser - 1];
                const level = skills.laser;
                const range = level === 3 ? 1200 : 600;
                const damagePct = level === 3 ? 0.5 : 0.3;

                const baseRot = time / 1000;
                for(let i=0; i<count; i++) {
                    const ang = baseRot + (i * (2 * Math.PI / count));
                    for(const z of zombiesRef.current) {
                        if (deadZombieIds.has(z.id)) continue;
                        
                        // Check if recently hit by laser
                        if (time - z.lastTakenDamageTime < 500) continue;

                        const dx = z.x - playerRef.current.position.x;
                        const dy = z.y - playerRef.current.position.y;
                        const dist = Math.hypot(dx, dy);
                        if (dist < range) {
                            const zAng = Math.atan2(dy, dx);
                            let diff = Math.abs(zAng - ang);
                            while(diff > Math.PI) diff -= 2*Math.PI;
                            while(diff < -Math.PI) diff += 2*Math.PI;
                            if (Math.abs(diff) < (level === 3 ? 0.3 : 0.2)) { // Lvl 3 wider beam check
                                z.health -= (z.maxHealth * damagePct);
                                z.lastTakenDamageTime = time;
                                
                                if (z.health <= 0) {
                                    deadZombieIds.add(z.id);
                                    spawnDiamond(z.x, z.y);
                                    onZombieKilled(1);
                                }
                            }
                        }
                    }
                }
            }

            // Cleanup Dead
            bulletsRef.current = bulletsRef.current.filter(b => !deadBulletIds.has(b.id));
            zombiesRef.current = zombiesRef.current.filter(z => !deadZombieIds.has(z.id));

            // Respawn Logic
            // Dynamic spawn interval based on diamonds
            // Base: 500ms (0.5s). Reduce 10ms for every 10 diamonds. Min 100ms.
            // "50s1 lần" logic interpreted as 0.5s base decreasing.
            const spawnReduction = Math.floor(diamondsCountRef.current / 10) * 10;
            const dynamicInterval = Math.max(100, 500 - spawnReduction);

            if (zombiesRef.current.length < ZOMBIE_COUNT && time - lastSpawnTimeRef.current > dynamicInterval) {
                lastSpawnTimeRef.current = time;
                let rx, ry, rdist;
                do {
                    rx = Math.random() * MAP_WIDTH;
                    ry = Math.random() * MAP_HEIGHT;
                    rdist = Math.hypot(rx - playerRef.current.position.x, ry - playerRef.current.position.y);
                } while (rdist < 800);
                zombiesRef.current.push({ 
                    id: Date.now() + Math.random(), 
                    x: rx, y: ry, rotation: 0,
                    health: ZOMBIE_MAX_HEALTH,
                    maxHealth: ZOMBIE_MAX_HEALTH,
                    attackFrame: 0,
                    lastTakenDamageTime: 0
                });
            }

            // Player Damage
            const defenseLevel = skills.defense;
            const reduction = defenseLevel > 0 ? SKILLS_CONFIG.defense.levels[defenseLevel - 1] : 0;
            const damage = ZOMBIE_DAMAGE * (1 - reduction);
            
            for (const z of zombiesRef.current) {
                if (Math.hypot(z.x - playerRef.current.position.x, z.y - playerRef.current.position.y) < (ZOMBIE_RADIUS + PLAYER_RADIUS)) {
                    if (time - (playerRef.current as any).lastHit > DAMAGE_COOLDOWN_MS || !(playerRef.current as any).lastHit) {
                        healthRef.current -= damage;
                        setHealth(Math.max(0, healthRef.current));
                        (playerRef.current as any).lastHit = time;
                        
                        // Trigger Zombie Attack Animation
                        z.attackFrame = 15; // ~0.25 seconds at 60fps

                        if (healthRef.current <= 0) {
                            onGameOver();
                            return; // Stop loop
                        }
                    }
                }
            }

            // Pickups
            const newDiamonds: Diamond[] = [];
            let collected = 0;
            for (const d of diamondsRef.current) {
                if (Math.hypot(d.x - playerRef.current.position.x, d.y - playerRef.current.position.y) < PICKUP_RADIUS) {
                    collected++;
                } else {
                    newDiamonds.push(d);
                }
            }
            if (collected > 0) {
                diamondsCountRef.current += collected;
                diamondsRef.current = newDiamonds;
                onDiamondCollected(diamondsCountRef.current);
            }

            // Bombs
            let bombTriggered = false;
            let killedByBomb = 0;
            const remainingBombs: Bomb[] = [];
            for (const b of bombsRef.current) {
                 if (Math.hypot(b.x - playerRef.current.position.x, b.y - playerRef.current.position.y) < PICKUP_RADIUS) {
                     bombTriggered = true;
                     const halfW = (canvas.width / 2) / scaleRef.current;
                     const halfH = (canvas.height / 2) / scaleRef.current;
                     const minX = playerRef.current.position.x - halfW;
                     const maxX = playerRef.current.position.x + halfW;
                     const minY = playerRef.current.position.y - halfH;
                     const maxY = playerRef.current.position.y + halfH;
                     
                     const survivors: Zombie[] = [];
                     zombiesRef.current.forEach(z => {
                         if (z.x >= minX && z.x <= maxX && z.y >= minY && z.y <= maxY) {
                             killedByBomb++;
                             spawnDiamond(z.x, z.y);
                         } else {
                             survivors.push(z);
                         }
                     });
                     zombiesRef.current = survivors;
                     remainingBombs.push({ id: Date.now()+Math.random(), x: Math.random()*MAP_WIDTH, y: Math.random()*MAP_HEIGHT });
                 } else {
                     remainingBombs.push(b);
                 }
            }
            if (bombTriggered) {
                bombsRef.current = remainingBombs;
                if (killedByBomb > 0) onZombieKilled(killedByBomb);
            }
        }

        // --- RENDER ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background
        ctx.fillStyle = '#1a2e1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Camera Transform
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scaleRef.current, scaleRef.current);
        ctx.translate(-playerRef.current.position.x, -playerRef.current.position.y);

        // Grid
        ctx.strokeStyle = '#223822';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= MAP_WIDTH; x += 100) { ctx.moveTo(x, 0); ctx.lineTo(x, MAP_HEIGHT); }
        for (let y = 0; y <= MAP_HEIGHT; y += 100) { ctx.moveTo(0, y); ctx.lineTo(MAP_WIDTH, y); }
        ctx.stroke();

        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 50;
        ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

        // Items (Diamonds, Bombs) - Ground Level
        // Diamonds
        for (const d of diamondsRef.current) {
            ctx.save();
            ctx.translate(d.x, d.y);
            const scale = 1 + Math.sin(time / 200) * 0.1;
            ctx.scale(scale, scale);
            ctx.fillStyle = '#60a5fa';
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(0, -25); ctx.lineTo(25, 0); ctx.lineTo(0, 25); ctx.lineTo(-25, 0);
            ctx.fill();
            ctx.restore();
        }

        // Bombs
        for (const b of bombsRef.current) {
            ctx.save();
            ctx.translate(b.x, b.y);
            const scale = 1 + Math.sin(time / 100) * 0.1;
            ctx.scale(scale, scale);
            ctx.fillStyle = 'black';
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, BOMB_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = 'red';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('BOMB', 0, 0);
            ctx.restore();
        }

        // Bullets
        ctx.fillStyle = '#fde047';
        for (const b of bulletsRef.current) {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.angle);
            ctx.beginPath();
            ctx.roundRect(-6, -2, 12, 4, 2);
            ctx.fill();
            ctx.restore();
        }

        // Particles
        for (const p of particlesRef.current) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // Entities Depth Sort
        type RenderItem = 
            | { type: 'tree', obj: Tree, y: number }
            | { type: 'zombie', obj: Zombie, y: number }
            | { type: 'player', obj: PlayerState, y: number };

        const renderList: RenderItem[] = [
            { type: 'player', obj: playerRef.current, y: playerRef.current.position.y },
            ...zombiesRef.current.map(z => ({ type: 'zombie' as const, obj: z, y: z.y })),
            ...trees.map(t => ({ type: 'tree' as const, obj: t, y: t.y }))
        ];

        renderList.sort((a, b) => a.y - b.y);

        for (const item of renderList) {
            if (item.type === 'tree') {
                drawTree(ctx, item.obj);
            } else if (item.type === 'zombie') {
                drawZombie(ctx, item.obj);
            } else if (item.type === 'player') {
                drawPlayer(ctx, item.obj, skills.defense, isShootingRef.current);
            }
        }

        // Skill Effects Overlay (Axes, Laser)
        // Axes
        if (skills.spinningAxes > 0) {
            const count = SKILLS_CONFIG.spinningAxes.levels[skills.spinningAxes - 1];
            const isMax = skills.spinningAxes === 3;
            const axeColor = isMax ? '#ef4444' : '#94a3b8'; // Red for max
            const bladeColor = isMax ? '#b91c1c' : '#475569';

            for(let i=0; i<count; i++) {
                const ang = axeRotationRef.current + (i * (2 * Math.PI / count));
                const ax = playerRef.current.position.x + Math.cos(ang) * 100;
                const ay = playerRef.current.position.y + Math.sin(ang) * 100;
                
                ctx.save();
                ctx.translate(ax, ay);
                ctx.rotate(time / 200); // Axe self spin
                
                // Blade
                ctx.fillStyle = axeColor;
                ctx.beginPath();
                ctx.arc(0, 0, 25, 0, Math.PI*2);
                ctx.fill();
                
                // Handle
                ctx.fillStyle = bladeColor;
                ctx.fillRect(-7, -30, 14, 60);
                
                // Sparks visual for max level
                if (isMax) {
                     ctx.shadowColor = '#fca5a5';
                     ctx.shadowBlur = 10;
                     ctx.fillStyle = '#fee2e2';
                     ctx.beginPath();
                     ctx.arc(10, 10, 4, 0, Math.PI*2);
                     ctx.fill();
                     ctx.shadowBlur = 0;
                }
                
                ctx.restore();
            }
        }

        // Lasers
        if (isLaserActiveRef.current && skills.laser > 0) {
            const count = SKILLS_CONFIG.laser.levels[skills.laser - 1];
            const isMax = skills.laser === 3;
            const baseRot = time / 1000;
            const length = isMax ? 1200 : 600;
            const width = isMax ? 16 : 8;
            const color = isMax ? 'rgba(239, 68, 68, 0.5)' : 'rgba(6, 182, 212, 0.5)'; // Red vs Cyan
            
            ctx.globalCompositeOperation = 'screen';
            for(let i=0; i<count; i++) {
                const ang = baseRot + (i * (2 * Math.PI / count));
                ctx.save();
                ctx.translate(playerRef.current.position.x, playerRef.current.position.y);
                ctx.rotate(ang);
                
                // Beam
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(length, 0); 
                ctx.lineWidth = width;
                ctx.strokeStyle = color;
                ctx.stroke();
                
                // Inner white core
                ctx.lineWidth = width / 2.6;
                ctx.strokeStyle = '#fff';
                ctx.stroke();
                ctx.restore();
            }
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.restore(); // End Camera

        animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [skills, isPaused, trees, onDiamondCollected, onGameOver, onZombieKilled, setHealth]);

  return (
    <canvas 
        ref={canvasRef}
        className="block w-full h-full bg-[#1a2e1a] cursor-crosshair"
    />
  );
};

export default GameMap;