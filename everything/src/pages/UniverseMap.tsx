import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Swords, Globe, ShieldAlert, Zap, Coins, Gem } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';

interface Planet {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
}

interface Stage {
  id: string;
  name: string;
  staminaCost: number;
  recommendedPower: number;
  rewards: { exp: number; gold: number; gems?: number };
}

export default function UniverseMap() {
  const navigate = useNavigate();
  const { galaxyId } = useParams<{ galaxyId: string }>();
  const { player, deck, updatePlayer } = useGameStore();
  
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [isBattling, setIsBattling] = useState(false);
  const [battleResult, setBattleResult] = useState<any>(null);

  useEffect(() => {
    if (galaxyId) {
      fetch(`/api/explore/galaxies/${galaxyId}/planets`)
        .then(res => res.json())
        .then(data => setPlanets(data))
        .catch(console.error);
    }
  }, [galaxyId]);

  const handlePlanetSelect = async (planet: Planet) => {
    // Check if planet is unlocked based on exploration_progress
    // For simplicity, we just let them click if they have the level, or we can check the progress
    // Let's assume they can click any planet they see for now, or we can add unlock logic later
    setSelectedPlanet(planet);
    try {
      const res = await fetch(`/api/explore/planets/${planet.id}/stages`);
      const data = await res.json();
      setStages(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleBattle = async (stage: Stage) => {
    const deckIds = deck.filter(c => c !== null).map(c => c!.id);
    if (deckIds.length === 0) {
      alert('请先在编队中配置卡牌！');
      return;
    }

    if (player.stamina < stage.staminaCost) {
      alert('体力不足！');
      return;
    }

    setIsBattling(true);
    try {
      const res = await fetch('/api/explore/battle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({
          planetId: selectedPlanet?.id,
          stageId: stage.id,
          deckIds
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setBattleResult(data);
        updatePlayer(data.player);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
      alert('战斗发生错误');
    } finally {
      setIsBattling(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#1A1C29] text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0B132B] to-black -z-10" />

      {/* Header */}
      <div className="flex items-center justify-between p-4 z-10">
        <button onClick={() => selectedPlanet ? setSelectedPlanet(null) : navigate(-1)} className="p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-4 bg-black/40 px-4 py-1.5 rounded-full border border-white/10">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-yellow-400" />
            <span className="text-sm font-mono">{player.stamina}/{player.maxStamina}</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-blue-400" />
            <span className="text-sm font-mono">Lv.{player.level}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-24 no-scrollbar">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            {selectedPlanet ? selectedPlanet.name : '星系探索'}
          </h1>
          <p className="text-sm text-indigo-300/60 mt-2 tracking-widest">
            {selectedPlanet ? selectedPlanet.description : '选择一个星球开始你的冒险'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!selectedPlanet ? (
            <motion.div 
              key="planets"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 gap-4 max-w-md mx-auto"
            >
              {planets.map((planet, idx) => (
                <button
                  key={planet.id}
                  onClick={() => handlePlanetSelect(planet)}
                  className={`relative overflow-hidden rounded-2xl p-6 text-left transition-all ${
                    player.level >= planet.requiredLevel
                      ? 'bg-gradient-to-r from-indigo-900/40 to-purple-900/20 border border-indigo-500/30 hover:border-indigo-400/60 shadow-[0_0_20px_rgba(79,70,229,0.15)]'
                      : 'bg-white/5 border border-white/5 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                        <Globe size={20} className={player.level >= planet.requiredLevel ? 'text-indigo-400' : 'text-gray-500'} />
                        {planet.name}
                      </h3>
                      <p className="text-xs text-white/50">{planet.description}</p>
                    </div>
                    {player.level < planet.requiredLevel && (
                      <div className="text-xs font-mono text-red-400 bg-red-400/10 px-2 py-1 rounded">
                        需 Lv.{planet.requiredLevel}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="stages"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 gap-4 max-w-md mx-auto"
            >
              {stages.map((stage) => (
                <div key={stage.id} className="bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg text-indigo-100">{stage.name}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/50 font-mono">
                        <span className="flex items-center gap-1"><Zap size={12} className="text-yellow-400" /> -{stage.staminaCost}</span>
                        <span className="flex items-center gap-1"><ShieldAlert size={12} className="text-blue-400" /> 推荐战力: {stage.recommendedPower}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBattle(stage)}
                      disabled={isBattling || player.stamina < stage.staminaCost}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-white/30 text-white px-4 py-2 rounded-xl font-bold tracking-wider text-sm transition-colors flex items-center gap-2"
                    >
                      {isBattling ? '战斗中...' : <><Swords size={16} /> 挑战</>}
                    </button>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-3 flex gap-4 text-xs">
                    <span className="text-white/40">可能掉落:</span>
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1 text-blue-300"><ShieldAlert size={12} /> EXP</span>
                      <span className="flex items-center gap-1 text-yellow-300"><Coins size={12} /> 金币</span>
                      {stage.rewards.gems && <span className="flex items-center gap-1 text-pink-300"><Gem size={12} /> 宝石</span>}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Battle Result Modal */}
      <AnimatePresence>
        {battleResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-6"
          >
            <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6 flex flex-col items-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-2 ${battleResult.win ? 'bg-green-500' : 'bg-red-500'}`} />
              
              <h2 className={`text-3xl font-bold tracking-widest mb-6 ${battleResult.win ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]'}`}>
                {battleResult.win ? '战斗胜利' : '战斗失败'}
              </h2>

              <div className="w-full bg-black/50 rounded-xl p-4 mb-6 font-mono text-sm text-white/70 space-y-2">
                {battleResult.battleLog.map((log: string, i: number) => (
                  <p key={i}>{log}</p>
                ))}
              </div>

              {battleResult.win && battleResult.rewards && (
                <div className="w-full mb-8">
                  <h3 className="text-sm font-bold text-white/50 mb-3 text-center">获得奖励</h3>
                  <div className="flex justify-center gap-4">
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-4 py-2 flex flex-col items-center">
                      <span className="text-xs text-blue-300 mb-1">EXP</span>
                      <span className="font-mono font-bold text-blue-100">+{battleResult.rewards.exp}</span>
                    </div>
                    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-4 py-2 flex flex-col items-center">
                      <span className="text-xs text-yellow-300 mb-1">金币</span>
                      <span className="font-mono font-bold text-yellow-100">+{battleResult.rewards.gold}</span>
                    </div>
                    {battleResult.rewards.gems && (
                      <div className="bg-pink-500/20 border border-pink-500/30 rounded-lg px-4 py-2 flex flex-col items-center">
                        <span className="text-xs text-pink-300 mb-1">宝石</span>
                        <span className="font-mono font-bold text-pink-100">+{battleResult.rewards.gems}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button 
                onClick={() => setBattleResult(null)}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold tracking-widest transition-all"
              >
                确认
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
