

export const MAP_WIDTH = 4000;
export const MAP_HEIGHT = 4000;
export const GAME_SCALE = 0.25; // 4x smaller objects (Zoom out)
export const TREE_COUNT = 120;
export const PLAYER_SPEED = 6;

// Auto Fire settings
export const FIRE_RATE_MS = 400; // Time between shots

export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_RADIUS = 20;

export const ZOMBIE_MAX_HEALTH = 100;
export const ZOMBIE_DAMAGE = 2; // Base damage
export const DAMAGE_COOLDOWN_MS = 1000; // Invulnerability time after hit

export const BOSS_HP = 2000;
export const BOSS_DAMAGE = 10;
export const BOSS_SCALE = 2.5; // Visual scale multiplier
export const BOSS_MILESTONE_INTERVAL = 50; // Diamonds needed

export const PICKUP_RADIUS = 40;

export const BOMB_COUNT = 5;
export const BOMB_RADIUS = 25;

export const MAGNET_COUNT = 3;
export const MAGNET_RADIUS = 25;

export const ZOMBIE_COUNT = 20;
export const ZOMBIE_SPEED = 1.5;
export const ZOMBIE_SPAWN_INTERVAL = 750;
export const ZOMBIE_RADIUS = 22;
export const BULLET_SPEED = 25;
export const BULLET_MAX_DIST = 1000;
export const BULLET_RADIUS = 10;

export const DIAMOND_RADIUS = 30;
export const LEVEL_MILESTONES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 200, 250, 300, 350, 400, 500];

// Skills Configuration
export const SKILLS_CONFIG = {
  autoHeal: {
    name: 'Auto Heal',
    description: 'Recover 10% HP periodically.',
    maxLevel: 3,
    levels: [20000, 10000, 5000], // Milliseconds
    adminOnly: false
  },
  spinningAxes: {
    name: 'Spinning Axes',
    description: 'Axes orbit you. Lvl 2: Instant Kill. Lvl 3: Red Axes + Sparks.',
    maxLevel: 3,
    levels: [1, 3, 5], // Number of axes
    adminOnly: false
  },
  laser: {
    name: 'Rotating Laser',
    description: 'Fires lasers. Lvl 3: Giant Red Laser (50% Dmg).',
    maxLevel: 3,
    levels: [1, 3, 5], // Number of beams
    adminOnly: false
  },
  defense: {
    name: 'Defense Up',
    description: 'Reduces incoming zombie damage.',
    maxLevel: 3,
    levels: [0.3, 0.6, 0.9], // Damage reduction percentage
    adminOnly: false
  },
  weapon: {
    name: 'Magnum Upgrade',
    description: 'Gun Power. Lvl 1: Rapid Fire. Lvl 2: Penetration. Lvl 3: Double Shot.',
    maxLevel: 3,
    levels: [1, 2, 3], // Just level indicator, logic handles mechanics
    adminOnly: false
  },
  freezeNova: {
    name: 'Freeze Nova',
    description: 'Periodically freezes all zombies in place.',
    maxLevel: 3,
    levels: [2000, 3000, 4000], // Freeze duration (ms)
    adminOnly: false
  },
  shockwave: {
    name: 'Shockwave',
    description: 'Periodically pushes enemies away.',
    maxLevel: 3,
    levels: [150, 250, 400], // Push distance
    adminOnly: false
  },
  // ADMIN ONLY SKILLS
  godMode: {
    name: '[ADMIN] God Mode',
    description: 'Invincibility + 10x Damage.',
    maxLevel: 1,
    levels: [1],
    adminOnly: true
  },
  apocalypse: {
    name: '[ADMIN] Apocalypse',
    description: 'Kills everything on screen every 5 seconds.',
    maxLevel: 1,
    levels: [1],
    adminOnly: true
  }
};

export const SKIN_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#eab308', // Yellow
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

// Helper to get persistent skin
export const getPersistentSkin = (): string => {
  const STORAGE_KEY = 'player_skin_color';
  const savedSkin = localStorage.getItem(STORAGE_KEY);
  
  if (savedSkin && SKIN_COLORS.includes(savedSkin)) {
    return savedSkin;
  }
  
  const newSkin = SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)];
  localStorage.setItem(STORAGE_KEY, newSkin);
  return newSkin;
};

// MOCK DATA
const MOCK_USERNAMES = [
  'ShadowHunter', 'ZombieSlayer', 'ForestKing', 'NightStalker', 'DoomBringer',
  'Luna', 'Kratos', 'Viper', 'Ghost', 'Ranger',
  'SniperWolf', 'TankTop', 'IronHeart', 'PixelWarrior', 'Glitch',
  'Neo', 'Trinity', 'Morpheus', 'Link', 'Zelda',
  'AshKetchum', 'Naruto', 'Sasuke', 'Goku', 'Vegeta',
  'Luffy', 'Zoro', 'Sanji', 'Nami', 'Chopper',
  'Robin', 'Franky', 'Brook', 'Jinbe', 'Ace',
  'Sabo', 'Law', 'Kid', 'Killer', 'Bege',
  'Bonney', 'Urouge', 'Hawkins', 'Drake', 'Apoo',
  'Blackbeard', 'Whitebeard', 'Shanks', 'BigMom', 'Kaido',
  'TitonFan', 'ProGamer123', 'NoobMaster69', 'ChickenDinner', 'LaggingBad',
  'StarLord', 'Gamora', 'Drax', 'Rocket', 'Groot'
];

export const MOCK_LEADERBOARD = Array.from({ length: 49 }, (_, i) => ({
  rank: i + 1,
  username: MOCK_USERNAMES[i % MOCK_USERNAMES.length],
  score: Math.floor(10000 / (i + 1)) + Math.floor(Math.random() * 50),
  diamonds: Math.floor(5000 / (i + 1)) + Math.floor(Math.random() * 50)
}));
