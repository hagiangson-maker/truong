import React, { useState, useEffect } from 'react';
import { PLAYER_MAX_HEALTH, SKILLS_CONFIG, LEVEL_MILESTONES } from '../constants';
import { SkillState, SkillType } from '../types';

interface UIProps {
  skinColor: string;
  health: number;
  score: number;
  diamonds: number;
  isGameOver: boolean;
  isAfk: boolean;
  setIsAfk: (val: boolean) => void;
  onRestart: () => void;
  showLevelUp: boolean;
  skillOptions: SkillType[];
  currentSkills: SkillState;
  onSelectSkill: (skill: SkillType) => void;
}

const UI: React.FC<UIProps> = ({ 
  skinColor, 
  health, 
  score, 
  diamonds,
  isGameOver, 
  isAfk,
  setIsAfk,
  onRestart,
  showLevelUp,
  skillOptions,
  currentSkills,
  onSelectSkill
}) => {
  const [showInstructions, setShowInstructions] = useState(true);

  // Toggle Instructions with 'P'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'p') {
            setShowInstructions(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate health percentage for width
  const healthPercent = Math.max(0, (health / PLAYER_MAX_HEALTH) * 100);

  // Get Next Milestone for UI
  const nextMilestone = LEVEL_MILESTONES.find(m => m > diamonds) || 'MAX';

  // Get active skills for HUD
  const activeSkills = (Object.keys(currentSkills) as SkillType[]).filter(s => currentSkills[s] > 0);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-50 flex flex-col justify-between p-6">
        {/* Top Left: Controls info & Health */}
        <div className="flex flex-col gap-4">
          {showInstructions && (
              <div className="bg-black/50 backdrop-blur-sm text-white p-4 rounded-xl border border-white/10 shadow-xl max-w-xs transition-opacity duration-300">
                  <h1 className="text-xl font-bold mb-2 text-green-400">Forest Suviral</h1>
                  <div className="space-y-1 text-sm text-gray-300">
                  <p><kbd className="bg-gray-700 px-2 py-0.5 rounded">WASD / Arrows</kbd> Move</p>
                  <p><kbd className="bg-gray-700 px-2 py-0.5 rounded">I / O</kbd> Zoom</p>
                  <p><kbd className="bg-gray-700 px-2 py-0.5 rounded">P</kbd> Toggle Guide</p>
                  <p><kbd className="bg-gray-700 px-2 py-0.5 rounded">Esc</kbd> AFK / Pause</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-gray-400">Skin</span>
                        <div 
                            className="w-4 h-4 rounded-full shadow-inner border border-white/20" 
                            style={{ backgroundColor: skinColor }}
                        />
                      </div>
                  </div>
              </div>
          )}

          {/* Health Bar */}
          <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-red-900/50 shadow-xl max-w-xs w-64 pointer-events-auto">
               <div className="flex justify-between text-xs font-bold text-red-400 mb-1 uppercase tracking-widest">
                  <span>Health</span>
                  <span>{Math.ceil(health)}%</span>
               </div>
               <div className="w-full h-4 bg-gray-900 rounded-full overflow-hidden border border-white/10">
                  <div 
                      className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300 ease-out"
                      style={{ width: `${healthPercent}%` }}
                  />
               </div>
          </div>
        </div>

        {/* Bottom Center: Skills HUD */}
        {activeSkills.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto">
            {activeSkills.map(skill => (
              <div key={skill} className="flex flex-col items-center bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/10">
                <div className="w-12 h-12 flex items-center justify-center text-2xl bg-gray-800 rounded-lg mb-1 border border-white/5">
                    {skill === 'autoHeal' && '❤️'}
                    {skill === 'spinningAxes' && '🪓'}
                    {skill === 'laser' && '⚡'}
                    {skill === 'defense' && '🛡️'}
                </div>
                <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">
                  Lv. {currentSkills[skill]}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Right: Kills & Diamonds */}
        <div className="self-end flex flex-col gap-2 items-end">
            {/* Kill Count */}
            <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-gray-600/50 shadow-2xl flex items-center gap-4 w-48 justify-between">
                 <span className="text-3xl">💀</span> 
                 <div className="flex flex-col items-end">
                    <span className="text-2xl font-bold text-white leading-none">{score}</span>
                    <span className="text-[10px] uppercase text-gray-400 tracking-wider">Kills</span>
                 </div>
            </div>

            {/* Diamond Count */}
            <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-blue-500/50 shadow-2xl flex items-center gap-4 w-48 justify-between relative overflow-hidden">
                <span className="text-3xl animate-pulse">💎</span> 
                <div className="flex flex-col items-end">
                    <span className="text-blue-400 font-mono text-2xl font-bold leading-none">{diamonds}</span>
                    <span className="text-[10px] text-blue-300 font-mono uppercase tracking-widest">Next: {nextMilestone}</span>
                </div>
            </div>
        </div>
      </div>

      {/* AFK / PAUSE SCREEN */}
      {isAfk && !isGameOver && (
          <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center backdrop-blur-sm pointer-events-auto">
              <div className="bg-gray-800 border border-gray-600 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
                  <h2 className="text-4xl font-black text-gray-200 mb-6 uppercase tracking-widest">AFK Mode</h2>
                  <div className="flex flex-col gap-4">
                      <button 
                          onClick={() => setIsAfk(false)}
                          className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors uppercase tracking-widest"
                      >
                          Continue
                      </button>
                      <button 
                          onClick={onRestart}
                          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors uppercase tracking-widest"
                      >
                          New Level
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* SKILL SELECTION MODAL */}
      {showLevelUp && (
        <div className="fixed inset-0 z-[150] bg-black/80 flex flex-col items-center justify-center backdrop-blur-md pointer-events-auto">
             <h2 className="text-4xl font-black text-yellow-400 mb-8 uppercase tracking-widest animate-bounce">Level Up!</h2>
             <div className="flex flex-wrap justify-center gap-6 max-w-5xl">
                {skillOptions.map(skill => {
                    const config = SKILLS_CONFIG[skill];
                    const nextLvl = currentSkills[skill] + 1;
                    return (
                        <button 
                            key={skill}
                            onClick={() => onSelectSkill(skill)}
                            className="bg-gray-800 hover:bg-gray-700 border-2 border-yellow-500/50 hover:border-yellow-400 p-6 rounded-2xl w-64 flex flex-col items-center text-center transition-all hover:scale-105 shadow-xl group"
                        >
                            <div className="text-3xl mb-3 group-hover:animate-spin">
                                {skill === 'autoHeal' && '❤️'}
                                {skill === 'spinningAxes' && '🪓'}
                                {skill === 'laser' && '⚡'}
                                {skill === 'defense' && '🛡️'}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{config.name}</h3>
                            <div className="text-xs font-bold bg-yellow-900/50 text-yellow-500 px-2 py-1 rounded mb-4">
                                Level {nextLvl} / {config.maxLevel}
                            </div>
                            <p className="text-sm text-gray-400">{config.description}</p>
                        </button>
                    );
                })}
             </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {isGameOver && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm pointer-events-auto">
          <div className="bg-gray-900 border-2 border-red-800 p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(220,38,38,0.5)]">
            <h2 className="text-5xl font-black text-red-600 mb-2 uppercase tracking-tighter">You Died</h2>
            <div className="text-gray-400 mb-6">The forest has consumed you.</div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Kills</div>
                <div className="text-2xl font-bold text-white">💀 {score}</div>
                </div>
                <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Diamonds</div>
                <div className="text-2xl font-bold text-blue-400">💎 {diamonds}</div>
                </div>
            </div>

            <button 
              onClick={onRestart}
              className="px-8 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg text-xl transition-colors w-full uppercase tracking-widest shadow-lg"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UI;