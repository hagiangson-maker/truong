
import React, { useState, useEffect, useRef } from 'react';
import { PLAYER_MAX_HEALTH, SKILLS_CONFIG, LEVEL_MILESTONES } from '../constants';
import { SkillState, SkillType, User, ChatMessage } from '../types';
import { initAudio } from '../audio';

interface UIProps {
  skinColor: string;
  health: number;
  score: number;
  diamonds: number;
  coins: number;
  onTopUp: () => void;
  bestKills: number;
  bestDiamonds: number;
  isGameOver: boolean;
  isAfk: boolean;
  setIsAfk: (val: boolean) => void;
  onRestart: () => void;
  showLevelUp: boolean;
  skillOptions: SkillType[];
  currentSkills: SkillState;
  onSelectSkill: (skill: SkillType, cost?: number) => void;
  user: User;
  onLogin: (username: string, isAdmin: boolean) => void;
}

const UI: React.FC<UIProps> = ({ 
  skinColor, 
  health, 
  score, 
  diamonds,
  coins,
  onTopUp,
  bestKills,
  bestDiamonds,
  isGameOver, 
  isAfk,
  setIsAfk,
  onRestart,
  showLevelUp,
  skillOptions,
  currentSkills,
  onSelectSkill,
  user,
  onLogin
}) => {
  const [showInstructions, setShowInstructions] = useState(true);
  
  // Login State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Register State
  const [isRegistering, setIsRegistering] = useState(false);
  const [confirmPass, setConfirmPass] = useState('');

  // AFK Tab State
  const [activeTab, setActiveTab] = useState<'menu' | 'chat' | 'leaderboard'>('menu');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
      { id: '1', sender: 'System', text: 'Welcome to Forest Suviral Global Chat!', timestamp: Date.now() },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Toggle Instructions with 'P'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'p' && user.isLoggedIn) {
            setShowInstructions(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user.isLoggedIn]);

  // Scroll chat to bottom
  useEffect(() => {
      if (activeTab === 'chat' && chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
  }, [chatMessages, activeTab]);

  const handleLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!loginUser || !loginPass) {
          setLoginError('Please enter username and password');
          return;
      }

      const u = loginUser.toLowerCase();

      // Registration Logic
      if (isRegistering) {
        if (loginPass !== confirmPass) {
            setLoginError('Passwords do not match');
            return;
        }
        if (u === 'titon_gaming') {
            setLoginError('Cannot register as reserved Admin username');
            return;
        }
      }
      
      let isAdmin = false;
      // Check for hardcoded admin credentials - ONLY titon_gaming ALLOWED
      if (u === 'titon_gaming') {
          if (loginPass === 'titon@123%978') {
              isAdmin = true;
          } else {
              setLoginError('Invalid Admin Password');
              return;
          }
      }
      
      initAudio(); // Start Audio Context on user interaction
      onLogin(loginUser, isAdmin);
  };

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim()) return;

      const newMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: user.username,
          text: chatInput,
          timestamp: Date.now(),
          isAdmin: user.isAdmin
      };

      setChatMessages(prev => [...prev, newMessage]);
      setChatInput('');
  };

  if (!user.isLoggedIn) {
      return (
          <div className="fixed inset-0 z-[300] bg-gray-900 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
              <div className="bg-black/80 p-8 rounded-3xl border-2 border-green-800 shadow-2xl max-w-md w-full backdrop-blur-lg">
                  <h1 className="text-4xl font-black text-center text-green-500 mb-2 tracking-widest uppercase">Forest Suviral</h1>
                  <p className="text-center text-gray-400 mb-6 text-sm">Enter the wilderness. Survive the night.</p>
                  
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div>
                          <label className="block text-gray-400 text-xs uppercase font-bold mb-1">Username</label>
                          <input 
                            type="text" 
                            value={loginUser}
                            onChange={(e) => setLoginUser(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                            placeholder="Display Name"
                          />
                      </div>
                      <div>
                          <label className="block text-gray-400 text-xs uppercase font-bold mb-1">Password</label>
                          <input 
                            type="password" 
                            value={loginPass}
                            onChange={(e) => setLoginPass(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                            placeholder="********"
                          />
                      </div>

                      {isRegistering && (
                          <div className="animate-fade-in-down">
                              <label className="block text-gray-400 text-xs uppercase font-bold mb-1">Confirm Password</label>
                              <input 
                                type="password" 
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-green-500 transition-colors"
                                placeholder="********"
                              />
                          </div>
                      )}

                      {loginError && <div className="text-red-500 text-sm text-center font-bold">{loginError}</div>}
                      
                      <button type="submit" className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:scale-[1.02]">
                          {isRegistering ? 'CREATE ACCOUNT & PLAY' : 'ENTER GAME'}
                      </button>
                      <div className="text-xs text-center text-gray-500 mt-4 opacity-50">
                          v1.0.5 - Secure Login
                      </div>

                      <div className="text-center mt-2 pt-2 border-t border-gray-700/50">
                          <span className="text-gray-400 text-sm mr-2">
                              {isRegistering ? 'Already have an account?' : 'No account?'}
                          </span>
                          <button 
                            type="button"
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setLoginError('');
                                setConfirmPass('');
                            }}
                            className="text-green-500 hover:text-green-400 text-sm font-bold hover:underline transition-colors"
                          >
                              {isRegistering ? 'Login here' : 'Register now'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      );
  }

  // Calculate health percentage for width
  const healthPercent = Math.max(0, (health / PLAYER_MAX_HEALTH) * 100);

  // Get Next Milestone for UI
  const nextMilestone = LEVEL_MILESTONES.find(m => m > diamonds) || 'MAX';

  // Get active skills for HUD
  const activeSkills = (Object.keys(currentSkills) as SkillType[]).filter(s => currentSkills[s] > 0);

  // Prepare Leaderboard Data (Single player mode)
  const fullLeaderboard = [
      { rank: 1, username: user.username, score: score, diamonds: diamonds }
  ];

  const getSkillIcon = (skill: SkillType) => {
    switch(skill) {
      case 'autoHeal': return '❤️';
      case 'spinningAxes': return '🪓';
      case 'laser': return '⚡';
      case 'defense': return '🛡️';
      case 'weapon': return '🔫';
      case 'freezeNova': return '❄️';
      case 'shockwave': return '💥';
      case 'chainLightning': return '🌩️';
      case 'poisonGas': return '☠️';
      case 'blackHole': return '⚫';
      case 'meteorShower': return '☄️';
      case 'godMode': return '👑';
      case 'apocalypse': return '☢️';
      default: return '?';
    }
  };

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-50 flex flex-col justify-between p-6">
        {/* Top Left: Controls & User Info */}
        <div className="flex flex-col gap-4 pointer-events-auto">
          {showInstructions && (
              <div className="bg-black/50 backdrop-blur-sm text-white p-4 rounded-xl border border-white/10 shadow-xl max-w-xs transition-opacity duration-300">
                  <h1 className="text-xl font-bold mb-2 text-green-400">Forest Suviral</h1>
                  <div className="space-y-1 text-sm text-gray-300">
                  <p><kbd className="bg-gray-700 px-2 py-0.5 rounded">WASD / Arrows</kbd> Move</p>
                  <p><kbd className="bg-gray-700 px-2 py-0.5 rounded">Mouse</kbd> Aim</p>
                  <p><kbd className="bg-gray-700 px-2 py-0.5 rounded">Auto</kbd> Fire</p>
                  <p><kbd className="bg-gray-700 px-2 py-0.5 rounded">I / O</kbd> Zoom</p>
                  <p><kbd className="bg-gray-700 px-2 py-0.5 rounded">P</kbd> Guide</p>
                  <p><kbd className="bg-gray-700 px-2 py-0.5 rounded">Esc</kbd> Menu / Chat</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                            className="w-4 h-4 rounded-full shadow-inner border border-white/20" 
                            style={{ backgroundColor: skinColor }}
                        />
                        <span className={`text-sm font-bold ${user.isAdmin ? 'text-yellow-400' : 'text-white'}`}>
                            {user.username} {user.isAdmin && '👑'}
                        </span>
                      </div>
                  </div>
              </div>
          )}
        </div>

        {/* Top Right: Coin HUD */}
        <div className="fixed top-6 right-6 pointer-events-auto flex items-center gap-2">
            <div className="bg-black/60 backdrop-blur-md p-2 px-4 rounded-full border border-yellow-500/50 shadow-xl flex items-center gap-2">
                <span className="text-xl">🪙</span>
                <span className="text-yellow-400 font-bold font-mono text-xl">{coins}</span>
            </div>
            <button 
                onClick={onTopUp}
                className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                title="Top Up Coins"
            >
                +
            </button>
        </div>

        {/* Bottom Right: Stacked UI */}
        <div className="self-end flex flex-col gap-2 items-end pointer-events-auto">
            
            {/* Records */}
            <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-yellow-500/30 shadow-xl w-64 mb-2">
                <div className="flex justify-between items-center border-b border-white/10 pb-1 mb-1">
                    <span className="text-yellow-500 font-bold uppercase tracking-widest text-[10px]">Records</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-300">Best Kills</span>
                    <span className="text-white font-mono font-bold">💀 {bestKills}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-300">Best XP</span>
                    <span className="text-blue-400 font-mono font-bold">💎 {bestDiamonds}</span>
                </div>
            </div>

            {/* Health Bar */}
            <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-red-900/50 shadow-xl w-64 mb-2">
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

            {/* Skills HUD */}
            {activeSkills.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap justify-end max-w-md">
                {activeSkills.map(skill => (
                  <div key={skill} className={`flex flex-col items-center bg-black/60 backdrop-blur-md p-2 rounded-lg border ${SKILLS_CONFIG[skill].adminOnly ? 'border-yellow-500' : 'border-white/10'}`}>
                    <div className="w-8 h-8 flex items-center justify-center text-lg bg-gray-800 rounded-lg mb-1 border border-white/5">
                        {getSkillIcon(skill)}
                    </div>
                    <div className="text-[8px] font-bold text-yellow-500 uppercase tracking-wider">
                      Lv.{currentSkills[skill]}
                    </div>
                  </div>
                ))}
              </div>
            )}

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

      {/* HUB / PAUSE SCREEN */}
      {isAfk && !isGameOver && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center backdrop-blur-sm pointer-events-auto">
              <div className="bg-gray-800 border border-gray-600 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col h-[600px]">
                  
                  {/* Tabs */}
                  <div className="flex border-b border-gray-700">
                      <button 
                        onClick={() => setActiveTab('menu')}
                        className={`flex-1 py-4 font-bold uppercase tracking-widest transition-colors ${activeTab === 'menu' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-750'}`}
                      >
                          Menu
                      </button>
                      <button 
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 py-4 font-bold uppercase tracking-widest transition-colors ${activeTab === 'chat' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-750'}`}
                      >
                          Global Chat
                      </button>
                      <button 
                        onClick={() => setActiveTab('leaderboard')}
                        className={`flex-1 py-4 font-bold uppercase tracking-widest transition-colors ${activeTab === 'leaderboard' ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-750'}`}
                      >
                          Top 50
                      </button>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-hidden relative">
                      
                      {/* MENU TAB */}
                      {activeTab === 'menu' && (
                          <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
                              <h2 className="text-4xl font-black text-gray-200 uppercase tracking-widest">Paused</h2>
                              <button 
                                  onClick={() => setIsAfk(false)}
                                  className="w-64 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors uppercase tracking-widest shadow-lg"
                              >
                                  Resume Game
                              </button>
                              <button 
                                  onClick={onRestart}
                                  className="w-64 py-4 bg-red-800 hover:bg-red-700 text-white font-bold rounded-lg transition-colors uppercase tracking-widest shadow-lg"
                              >
                                  Restart / New Level
                              </button>
                          </div>
                      )}

                      {/* CHAT TAB */}
                      {activeTab === 'chat' && (
                          <div className="h-full flex flex-col">
                              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900/50">
                                  {chatMessages.map(msg => (
                                      <div key={msg.id} className="flex flex-col">
                                          <div className="flex items-baseline gap-2">
                                              <span className={`text-xs font-bold ${msg.sender === user.username ? 'text-green-400' : (msg.isAdmin ? 'text-yellow-400' : 'text-blue-400')}`}>
                                                  {msg.sender} {msg.isAdmin && '👑'}
                                              </span>
                                              <span className="text-[10px] text-gray-500">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          </div>
                                          <p className="text-sm text-gray-200 break-words bg-black/20 p-2 rounded-lg inline-block self-start max-w-[90%]">
                                              {msg.text}
                                          </p>
                                      </div>
                                  ))}
                              </div>
                              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 bg-gray-800 flex gap-2">
                                  <input 
                                      type="text" 
                                      value={chatInput}
                                      onChange={(e) => setChatInput(e.target.value)}
                                      className="flex-1 bg-gray-900 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500"
                                      placeholder="Type a message..."
                                  />
                                  <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 rounded transition-colors">
                                      SEND
                                  </button>
                              </form>
                          </div>
                      )}

                      {/* LEADERBOARD TAB */}
                      {activeTab === 'leaderboard' && (
                          <div className="h-full overflow-y-auto p-0">
                              <table className="w-full text-left border-collapse">
                                  <thead className="bg-gray-900 sticky top-0 text-gray-400 text-xs uppercase font-bold tracking-wider">
                                      <tr>
                                          <th className="p-4 border-b border-gray-700">Rank</th>
                                          <th className="p-4 border-b border-gray-700">Player</th>
                                          <th className="p-4 border-b border-gray-700 text-right">Kills</th>
                                          <th className="p-4 border-b border-gray-700 text-right">Diamonds</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-700/50">
                                      {fullLeaderboard.map(entry => (
                                          <tr key={entry.rank} className={`${entry.username === user.username ? 'bg-green-900/20' : 'hover:bg-white/5'} transition-colors`}>
                                              <td className="p-4 text-gray-400 font-mono">#{entry.rank}</td>
                                              <td className={`p-4 font-bold ${entry.username === user.username ? 'text-green-400' : 'text-white'}`}>
                                                  {entry.username}
                                              </td>
                                              <td className="p-4 text-right text-gray-300 font-mono">{entry.score}</td>
                                              <td className="p-4 text-right text-blue-400 font-mono">{entry.diamonds}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* SKILL SELECTION MODAL */}
      {showLevelUp && (
        <div className="fixed inset-0 z-[150] bg-black/80 flex flex-col items-center justify-center backdrop-blur-md pointer-events-auto">
             <h2 className="text-4xl font-black text-yellow-400 mb-8 uppercase tracking-widest animate-bounce">Level Up!</h2>
             <div className="flex flex-wrap justify-center gap-6 max-w-6xl">
                {skillOptions.map((skill, index) => {
                    const config = SKILLS_CONFIG[skill];
                    const nextLvl = currentSkills[skill] + 1;
                    const isPremium = config.isPremium; // Use config property instead of index
                    const canAfford = !isPremium || coins >= 2;
                    
                    return (
                        <button 
                            key={skill}
                            disabled={isPremium && !canAfford}
                            onClick={() => onSelectSkill(skill, isPremium ? 2 : 0)}
                            className={`
                                relative p-6 rounded-2xl w-60 flex flex-col items-center text-center transition-all shadow-xl group border-2
                                ${isPremium 
                                    ? (canAfford ? 'bg-gradient-to-br from-gray-900 to-yellow-900 border-yellow-400 hover:scale-105 cursor-pointer' : 'bg-gray-900 border-gray-700 opacity-50 cursor-not-allowed grayscale')
                                    : 'bg-gray-800 hover:bg-gray-700 border-yellow-500/50 hover:border-yellow-400 hover:scale-105'
                                }
                            `}
                        >
                            {isPremium && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black font-black px-3 py-1 rounded-full text-xs shadow-lg z-10 whitespace-nowrap">
                                    PREMIUM - 2 COINS
                                </div>
                            )}

                            <div className="text-3xl mb-3 group-hover:animate-spin">
                                {getSkillIcon(skill)}
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${isPremium ? 'text-yellow-300' : 'text-white'}`}>{config.name}</h3>
                            <div className="text-xs font-bold bg-yellow-900/50 text-yellow-500 px-2 py-1 rounded mb-4">
                                Level {nextLvl} / {config.maxLevel}
                            </div>
                            <p className="text-sm text-gray-400">{config.description}</p>
                            
                            {isPremium && !canAfford && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                                    <span className="text-red-500 font-bold uppercase border-2 border-red-500 px-2 py-1 transform -rotate-12">Not Enough Coins</span>
                                </div>
                            )}
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
                {score >= bestKills && score > 0 && <div className="text-xs text-yellow-400 font-bold mt-1">NEW RECORD!</div>}
                </div>
                <div className="bg-black/40 rounded-lg p-4 border border-white/5">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Diamonds</div>
                <div className="text-2xl font-bold text-blue-400">💎 {diamonds}</div>
                {diamonds >= bestDiamonds && diamonds > 0 && <div className="text-xs text-yellow-400 font-bold mt-1">NEW RECORD!</div>}
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
