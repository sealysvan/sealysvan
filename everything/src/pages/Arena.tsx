import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Swords, Trophy, Crown, Star, Shield, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';

type ArenaTier = 'daily' | 'elite' | 'king' | 'peak';

interface ArenaInfo {
  id: ArenaTier;
  name: string;
  icon: any;
  color: string;
  bgGradient: string;
  borderColor: string;
  indicatorColor: string;
  unlocked: boolean;
  unlockCondition: string;
  description: string;
  rewards: string[];
  points: number;
  rank: number;
  tier: string;
}

export default function Arena() {
  const navigate = useNavigate();
  const { player, deck } = useGameStore();
  const [activeTier, setActiveTier] = useState<ArenaTier>('daily');
  const [isMatching, setIsMatching] = useState(false);
  const [arenaData, setArenaData] = useState<any>(null);
  const [battleResult, setBattleResult] = useState<any>(null);

  useEffect(() => {
    fetchArenaInfo();
  }, []);

  const fetchArenaInfo = async () => {
    try {
      const res = await fetch('/api/arena/info', {
        headers: { 'x-user-id': player.id }
      });
      if (res.ok) {
        const data = await res.json();
        setArenaData(data);
      }
    } catch (error) {
      console.error('Failed to fetch arena info:', error);
    }
  };

  const arenas: Record<ArenaTier, ArenaInfo> = {
      daily: {
        id: 'daily',
        name: '日常竞技场',
        icon: Swords,
        color: 'text-blue-400',
        bgGradient: 'from-blue-900/40 to-blue-950',
        borderColor: 'border-blue-500/50',
        indicatorColor: 'bg-blue-500',
        unlocked: true, // Unlocked after 3rd planet
        unlockCondition: '解锁地球后开放',
        description: '异步PVP，积分制。参与即可获得金币和赛季积分。',
        rewards: ['金币', '赛季积分'],
        points: arenaData?.points || 0,
        rank: 0,
        tier: arenaData?.tier || '未定级'
      },
    elite: {
      id: 'elite',
      name: '精英决斗场',
      icon: Shield,
      color: 'text-purple-400',
      bgGradient: 'from-purple-900/40 to-purple-950',
      borderColor: 'border-purple-500/50',
      indicatorColor: 'bg-purple-500',
      unlocked: false,
      unlockCondition: '日常竞技场达到黄金段位',
      description: '高强度异步PVP。胜利可获得宝石和卡牌碎片。',
      rewards: ['宝石', '卡牌碎片'],
      points: 0,
      rank: 0,
      tier: '未定级'
    },
    king: {
      id: 'king',
      name: '王者争霸',
      icon: Crown,
      color: 'text-yellow-400',
      bgGradient: 'from-yellow-900/40 to-yellow-950',
      borderColor: 'border-yellow-500/50',
      indicatorColor: 'bg-yellow-500',
      unlocked: false,
      unlockCondition: '精英决斗场达到钻石段位',
      description: '实时匹配对战。争夺稀有卡牌和大量宝石。',
      rewards: ['稀有卡牌', '大量宝石'],
      points: 0,
      rank: 0,
      tier: '未定级'
    },
    peak: {
      id: 'peak',
      name: '巅峰决斗',
      icon: Trophy,
      color: 'text-red-400',
      bgGradient: 'from-red-900/40 to-red-950',
      borderColor: 'border-red-500/50',
      indicatorColor: 'bg-red-500',
      unlocked: false,
      unlockCondition: '王者争霸排名前100',
      description: '锦标赛模式。最强者的舞台，赢取限定卡牌和专属称号。',
      rewards: ['限定卡牌', '专属称号'],
      points: 0,
      rank: 0,
      tier: '未定级'
    }
  };

  const handleMatch = async () => {
    if (!arenas[activeTier].unlocked) return;
    
    const deckIds = deck.filter(c => c !== null).map(c => c!.id);
    if (deckIds.length === 0) {
      alert('请先在编队中配置卡牌！');
      return;
    }

    setIsMatching(true);
    
    try {
      const res = await fetch('/api/arena/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ deckIds })
      });
      
      const data = await res.json();
      if (res.ok) {
        setBattleResult(data);
        fetchArenaInfo(); // Refresh points and tier
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Match failed:', error);
      alert('匹配失败');
    } finally {
      setIsMatching(false);
    }
  };

  const activeArena = arenas[activeTier];
  const ActiveIcon = activeArena.icon;

  return (
    <div className="h-full w-full flex flex-col bg-[#0B132B] text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-900/50 shrink-0 bg-[#1A1C29] z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10">
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-bold tracking-widest text-white">竞技大厅</h1>
          <span className="text-[10px] text-blue-300/50 tracking-widest uppercase">S1 赛季进行中</span>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tiers */}
        <div className="w-24 shrink-0 bg-[#111D3B] border-r border-blue-900/50 flex flex-col py-4 gap-2 overflow-y-auto no-scrollbar">
          {(Object.keys(arenas) as ArenaTier[]).map((tier) => {
            const arena = arenas[tier];
            const Icon = arena.icon;
            const isActive = activeTier === tier;
            
            return (
              <button
                key={tier}
                onClick={() => setActiveTier(tier)}
                className={`relative flex flex-col items-center justify-center py-4 px-2 mx-2 rounded-xl transition-all ${
                  isActive 
                    ? `bg-gradient-to-b ${arena.bgGradient} border ${arena.borderColor} shadow-[0_0_15px_rgba(0,0,0,0.5)]` 
                    : 'bg-white/5 border border-transparent hover:bg-white/10 opacity-60'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${arena.indicatorColor}`}
                  />
                )}
                <Icon size={24} className={`mb-2 ${isActive ? arena.color : 'text-white/50'}`} />
                <span className={`text-[10px] font-bold tracking-widest text-center leading-tight ${isActive ? 'text-white' : 'text-white/50'}`}>
                  {arena.name.split('').map((char, i) => <span key={i} className="block">{char}</span>)}
                </span>
                
                {!arena.unlocked && (
                  <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                    <Shield size={16} className="text-white/30" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTier}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col p-6 overflow-y-auto"
            >
              {/* Arena Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activeArena.bgGradient} border border-white/10 flex items-center justify-center shadow-lg`}>
                  <ActiveIcon size={32} className={activeArena.color} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-widest mb-1">{activeArena.name}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded border ${activeArena.unlocked ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'}`}>
                      {activeArena.unlocked ? '已解锁' : '未解锁'}
                    </span>
                    {!activeArena.unlocked && (
                      <span className="text-[10px] text-white/40">{activeArena.unlockCondition}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#111D3B] border border-blue-900/50 rounded-xl p-4 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-blue-300/60 mb-1 tracking-widest uppercase">当前段位</span>
                  <div className="flex items-center gap-2">
                    <Medal size={16} className={activeArena.color} />
                    <span className="text-lg font-bold">{activeArena.tier}</span>
                  </div>
                </div>
                <div className="bg-[#111D3B] border border-blue-900/50 rounded-xl p-4 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-blue-300/60 mb-1 tracking-widest uppercase">赛季积分</span>
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-yellow-400" />
                    <span className="text-lg font-mono font-bold">{activeArena.points}</span>
                  </div>
                </div>
                <div className="col-span-2 bg-[#111D3B] border border-blue-900/50 rounded-xl p-4 flex justify-between items-center">
                  <span className="text-xs text-blue-300/60 tracking-widest">全服排名</span>
                  <span className="text-xl font-mono font-bold text-white">
                    {activeArena.rank > 0 ? `#${activeArena.rank}` : '-'}
                  </span>
                </div>
              </div>

              {/* Description & Rewards */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-blue-300 mb-2 tracking-widest">规则说明</h3>
                <p className="text-xs text-white/60 leading-relaxed mb-6">{activeArena.description}</p>
                
                <h3 className="text-sm font-bold text-blue-300 mb-2 tracking-widest">赛季奖励</h3>
                <div className="flex gap-2">
                  {activeArena.rewards.map((reward, i) => (
                    <div key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80">
                      {reward}
                    </div>
                  ))}
                </div>
              </div>

              {/* Match Button */}
              <div className="mt-auto pt-4">
                <button
                  onClick={handleMatch}
                  disabled={!activeArena.unlocked || isMatching}
                  className={`w-full py-4 rounded-xl font-bold tracking-widest text-lg flex items-center justify-center gap-2 transition-all ${
                    !activeArena.unlocked
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : isMatching
                      ? 'bg-blue-600 text-white cursor-wait'
                      : `bg-gradient-to-r ${activeArena.bgGradient} border ${activeArena.borderColor} text-white hover:brightness-110 shadow-[0_0_20px_rgba(0,0,0,0.3)]`
                  }`}
                >
                  {isMatching ? (
                    <span className="animate-pulse">寻找对手中...</span>
                  ) : !activeArena.unlocked ? (
                    '未解锁'
                  ) : (
                    <>
                      <Swords size={20} />
                      开始匹配
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
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
