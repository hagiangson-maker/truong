
import React, { useEffect, useState, useCallback, useRef } from 'react';
import GameMap from './components/GameMap';
import UI from './components/UI';
import { getPersistentSkin, PLAYER_MAX_HEALTH, SKILLS_CONFIG, LEVEL_MILESTONES } from './constants';
import { SkillState, SkillType, User } from './types';

const STORAGE_KEY_BEST_KILLS = 'forest_survival_best_kills';
const STORAGE_KEY_BEST_DIAMONDS = 'forest_survival_best_diamonds';

const App: React.FC = () => {
  const [skin, setSkin] = useState<string | null>(null);
  const [health, setHealth] = useState(PLAYER_MAX_HEALTH);
  
  // Auth State
  const [user, setUser] = useState<User>({ username: '', isAdmin: false, isLoggedIn: false });

  // Game State
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0); // Score = Kills
  const [diamonds, setDiamonds] = useState(0); // Diamonds = XP
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
    godMode: 0,
    apocalypse: 0
  });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [skillOptions, setSkillOptions] = useState<SkillType[]>([]);

  // Key to force remount on restart
  const [gameKey, setGameKey] = useState(0);
  
  // Track next milestone index
  const milestoneIndexRef = useRef(0);

  useEffect(() => {
    const savedSkin = getPersistentSkin();
    setSkin(savedSkin);

    // Load High Scores
    const k = localStorage.getItem(STORAGE_KEY_BEST_KILLS);
    const d = localStorage.getItem(STORAGE_KEY_BEST_DIAMONDS);
    if(k) setBestKills(parseInt(k));
    if(d) setBestDiamonds(parseInt(d));
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

  // Check for Level Up
  const handleDiamondCollected = useCallback((count: number) => {
    setDiamonds(count);
    
    // Check if current count matches next milestone
    const currentMilestone = LEVEL_MILESTONES[milestoneIndexRef.current];
    if (currentMilestone && count >= currentMilestone) {
        milestoneIndexRef.current += 1;
        triggerLevelUp();
    }
  }, [skills]);

  const triggerLevelUp = () => {
    setIsPaused(true);
    
    // Pick 3 random skills
    const allSkills = (Object.keys(SKILLS_CONFIG) as SkillType[]);
    
    // Filter out: Maxed skills AND Admin skills if not admin
    const availableSkills = allSkills.filter(key => {
       const config = SKILLS_CONFIG[key];
       if (config.adminOnly && !user.isAdmin) return false;
       return skills[key] < config.maxLevel;
    });

    if (availableSkills.length === 0) {
        setIsPaused(false);
        return;
    }

    // Shuffle and pick 3
    const shuffled = availableSkills.sort(() => 0.5 - Math.random());
    setSkillOptions(shuffled.slice(0, 3));
    setShowLevelUp(true);
  };

  const selectSkill = (skill: SkillType) => {
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
    // Reset Skills but keep user logged in
    setSkills({ 
        autoHeal: 0, spinningAxes: 0, laser: 0, defense: 0, weapon: 0, 
        freezeNova: 0, shockwave: 0, godMode: 0, apocalypse: 0 
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
            skills={skills}
            isPaused={isGameLoopPaused}
        />
      )}
      <UI 
        skinColor={skin}
        health={health}
        score={score}
        diamonds={diamonds}
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
