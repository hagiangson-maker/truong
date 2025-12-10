
import React, { useEffect, useState, useCallback, useRef } from 'react';
import GameMap from './components/GameMap';
import UI from './components/UI';
import { getPersistentSkin, PLAYER_MAX_HEALTH, SKILLS_CONFIG, LEVEL_MILESTONES } from './constants';
import { SkillState, SkillType, User } from './types';
import { playGameover, playLevelUp } from './audio';

const STORAGE_KEY_BEST_KILLS = 'forest_survival_best_kills';
const STORAGE_KEY_BEST_DIAMONDS = 'forest_survival_best_diamonds';
const STORAGE_KEY_COINS = 'forest_survival_coins';

const App: React.FC = () => {
  const [skin, setSkin] = useState<string | null>(null);
  const [health, setHealth] = useState(PLAYER_MAX_HEALTH);
  
  // Auth State
  const [user, setUser] = useState<User>({ username: '', isAdmin: false, isLoggedIn: false });

  // Game State
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0); // Score = Kills
  const [diamonds, setDiamonds] = useState(0); // Diamonds = XP
  const [coins, setCoins] = useState(0); // Persistent Currency
  const [isAfk, setIsAfk] = useState(false); // AFK Pause State
  const [isPaused, setIsPaused] = useState(false); // Logic Pause (Level Up / Game Over)
  
  // High Scores
  const [bestKills, setBestKills] = useState(0);
  const [bestDiamonds, setBestDiamonds] = useState(0);

  // Skills State
  const [skills, setSkills] = useState<SkillState>({
    autoHeal: 0,
    spinningAxes: 0,
    laser: 0,
    defense: 0,
    weapon: 0,
    freezeNova: 0,
    shockwave: 0,
    chainLightning: 0,
    poisonGas: 0,
    blackHole: 0,
    meteorShower: 0,
    godMode: 0,
    apocalypse: 0
  });
  const [showLevelUp, setShowLevelUp] = useState(false);
  // Options: [Standard, Standard, Standard, Premium(OP)]
  const [skillOptions, setSkillOptions] = useState<SkillType[]>([]);

  // Key to force remount on restart
  const [gameKey, setGameKey] = useState(0);
  
  // Track next milestone index
  const milestoneIndexRef = useRef(0);

  useEffect(() => {
    const savedSkin = getPersistentSkin();
    setSkin(savedSkin);

    // Load High Scores & Coins
    const k = localStorage.getItem(STORAGE_KEY_BEST_KILLS);
    const d = localStorage.getItem(STORAGE_KEY_BEST_DIAMONDS);
    const c = localStorage.getItem(STORAGE_KEY_COINS);
    if(k) setBestKills(parseInt(k));
    if(d) setBestDiamonds(parseInt(d));
    if(c) setCoins(parseInt(c));
  }, []);

  // Handle AFK Toggle with Escape (Only if logged in)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isGameOver && !showLevelUp && user.isLoggedIn) {
          setIsAfk(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, showLevelUp, user.isLoggedIn]);

  const handleLogin = (username: string, isAdmin: boolean) => {
      setUser({ username, isAdmin, isLoggedIn: true });
  };

  const handleGameOver = useCallback(() => {
    setIsGameOver(true);
    setIsPaused(true);
    playGameover();

    // Update High Scores
    if (score > bestKills) {
        setBestKills(score);
        localStorage.setItem(STORAGE_KEY_BEST_KILLS, score.toString());
    }
    if (diamonds > bestDiamonds) {
        setBestDiamonds(diamonds);
        localStorage.setItem(STORAGE_KEY_BEST_DIAMONDS, diamonds.toString());
    }
  }, [score, diamonds, bestKills, bestDiamonds]);

  const handleZombieKill = useCallback(() => {
    setScore(prev => prev + 1);
  }, []);

  const handleDiamondCollected = useCallback((count: number) => {
    setDiamonds(count);
    
    // Check if current count matches next milestone
    const currentMilestone = LEVEL_MILESTONES[milestoneIndexRef.current];
    if (currentMilestone && count >= currentMilestone) {
        milestoneIndexRef.current += 1;
        triggerLevelUp();
    }
  }, [skills, user.isAdmin]); // Added user.isAdmin dependency for triggerLevelUp

  const handleCoinCollected = useCallback((amount: number) => {
      setCoins(prev => {
          const newVal = prev + amount;
          localStorage.setItem(STORAGE_KEY_COINS, newVal.toString());
          return newVal;
      });
  }, []);

  const handleTopUp = () => {
      setCoins(prev => {
          const newVal = prev + 10;
          localStorage.setItem(STORAGE_KEY_COINS, newVal.toString());
          return newVal;
      });
  };

  const triggerLevelUp = () => {
    setIsPaused(true);
    playLevelUp();
    
    const allSkills = (Object.keys(SKILLS_CONFIG) as SkillType[]);
    
    // 1. Standard Pool:
    // - NOT Premium (Coins)
    // - NOT Admin Only (unless User IS Admin)
    // - NOT Maxed
    const standardSkills = allSkills.filter(key => {
       const config = SKILLS_CONFIG[key];
       if (config.isPremium) return false; // Premium skills go to slot 4
       if (config.adminOnly && !user.isAdmin) return false; // Hide admin skills from normies
       return skills[key] < config.maxLevel;
    });

    // 2. Premium Pool (Coins):
    // - IS Premium
    // - NOT Maxed
    const premiumSkills = allSkills.filter(key => {
        const config = SKILLS_CONFIG[key];
        return config.isPremium && skills[key] < config.maxLevel;
    });

    if (standardSkills.length === 0 && premiumSkills.length === 0) {
        setIsPaused(false);
        return;
    }

    // Pick 3 Standard
    const shuffledStandard = standardSkills.sort(() => 0.5 - Math.random());
    const selected = shuffledStandard.slice(0, 3);

    // Pick 1 Premium (if available) to append as the 4th slot
    if (premiumSkills.length > 0) {
        const randomPremium = premiumSkills[Math.floor(Math.random() * premiumSkills.length)];
        selected.push(randomPremium); 
    }

    setSkillOptions(selected);
    setShowLevelUp(true);
  };

  const selectSkill = (skill: SkillType, cost: number = 0) => {
    if (cost > 0) {
        if (coins < cost) return; 
        setCoins(prev => {
            const newVal = prev - cost;
            localStorage.setItem(STORAGE_KEY_COINS, newVal.toString());
            return newVal;
        });
    }

    setSkills(prev => ({
        ...prev,
        [skill]: prev[skill] + 1
    }));
    setShowLevelUp(false);
    setIsPaused(false);
  };

  const handleRestart = useCallback(() => {
    setIsGameOver(false);
    setIsPaused(false);
    setIsAfk(false);
    setScore(0);
    setDiamonds(0);
    setHealth(PLAYER_MAX_HEALTH);
    // Reset Skills but keep user logged in & coins
    setSkills({ 
        autoHeal: 0, spinningAxes: 0, laser: 0, defense: 0, weapon: 0, 
        freezeNova: 0, shockwave: 0, godMode: 0, apocalypse: 0,
        chainLightning: 0, poisonGas: 0, blackHole: 0, meteorShower: 0
    });
    setShowLevelUp(false);
    milestoneIndexRef.current = 0;
    setGameKey(prev => prev + 1);
  }, []);

  if (!skin) {
    return <div className="h-screen w-full bg-black flex items-center justify-center text-green-500 font-mono">Loading World...</div>;
  }

  // Combined pause state for the game loop
  const isGameLoopPaused = isPaused || isAfk || isGameOver || !user.isLoggedIn;

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-900">
      {user.isLoggedIn && (
        <GameMap 
            key={gameKey} 
            initialSkin={skin} 
            setHealth={setHealth}
            onGameOver={handleGameOver}
            onZombieKilled={handleZombieKill}
            onDiamondCollected={handleDiamondCollected}
            onCoinCollected={handleCoinCollected}
            skills={skills}
            isPaused={isGameLoopPaused}
        />
      )}
      <UI 
        skinColor={skin}
        health={health}
        score={score}
        diamonds={diamonds}
        coins={coins}
        onTopUp={handleTopUp}
        bestKills={bestKills}
        bestDiamonds={bestDiamonds}
        isGameOver={isGameOver}
        isAfk={isAfk}
        setIsAfk={setIsAfk}
        onRestart={handleRestart}
        showLevelUp={showLevelUp}
        skillOptions={skillOptions}
        currentSkills={skills}
        onSelectSkill={selectSkill}
        user={user}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default App;
