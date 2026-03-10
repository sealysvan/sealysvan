import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Gem, PackageOpen, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, type Card } from '../store/useGameStore';

export default function CardPack() {
  const navigate = useNavigate();
  const { player, updatePlayer, addCardToInventory } = useGameStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnCards, setDrawnCards] = useState<Card[]>([]);
  const [freeDrawAvailable, setFreeDrawAvailable] = useState(false);
  const [pityCounter, setPityCounter] = useState({ fourStar: 0, fiveStar: 0 });

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch('/api/gacha/info', {
          headers: { 'x-user-id': player.id }
        });
        if (res.ok) {
          const data = await res.json();
          setFreeDrawAvailable(data.freeDrawAvailable);
          setPityCounter(data.pity);
        }
      } catch (error) {
        console.error('Failed to fetch gacha info:', error);
      }
    };
    fetchInfo();
  }, [player.id]);

  const handleDraw = async (type: 'free' | 'gem', count: number) => {
    if (type === 'gem' && player.gems < 200 * count) {
      alert('宝石不足');
      return;
    }

    if (type === 'free' && !freeDrawAvailable) {
      alert('今日免费次数已用完');
      return;
    }

    setIsDrawing(true);

    try {
      const response = await fetch('/api/gacha/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id
        },
        body: JSON.stringify({ type, count })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to draw cards');
      }

      const data = await response.json();
      
      // Update resources and pity
      if (type === 'gem') {
        updatePlayer({ gems: data.remainingGems });
      } else {
        setFreeDrawAvailable(false);
      }
      
      setPityCounter(data.pity);
      setDrawnCards(data.cards);
      
      // Add to inventory
      data.cards.forEach((card: Card) => addCardToInventory(card));
      
    } catch (error: any) {
      console.error('Draw failed:', error);
      alert(error.message);
    } finally {
      setIsDrawing(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#1A1C29] text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#0B132B] to-black -z-10" />

      {/* Header */}
      <div className="flex items-center justify-between p-4 z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-pink-500/30">
          <Gem size={16} className="text-pink-500" />
          <span className="text-sm font-mono font-bold">{player.gems}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            星辰召唤
          </h1>
          <p className="text-sm text-blue-300/60 mt-2 tracking-widest">抽取来自宇宙深处的神秘力量</p>
        </div>

        {/* Banners */}
        <div className="w-full max-w-sm space-y-6">
          {/* Free Banner */}
          <div className="relative bg-gradient-to-b from-[#1E3A8A]/40 to-[#0F172A] border border-blue-500/30 rounded-2xl p-6 overflow-hidden shadow-[0_0_30px_rgba(30,58,138,0.3)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-blue-100 mb-1">基础卡池</h3>
                <p className="text-xs text-blue-300/60">最高可获得3星卡牌</p>
              </div>
              <PackageOpen size={40} className="text-blue-400/50" />
            </div>
            <button 
              onClick={() => handleDraw('free', 1)}
              disabled={!freeDrawAvailable || isDrawing}
              className={`w-full mt-6 py-3 rounded-xl font-bold tracking-widest transition-all ${
                freeDrawAvailable && !isDrawing
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              {isDrawing ? <Loader2 size={20} className="animate-spin mx-auto" /> : freeDrawAvailable ? '免费召唤 1 次' : '今日已召唤'}
            </button>
          </div>

          {/* Gem Banner */}
          <div className="relative bg-gradient-to-b from-[#831843]/40 to-[#0F172A] border border-pink-500/30 rounded-2xl p-6 overflow-hidden shadow-[0_0_30px_rgba(131,24,67,0.3)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-pink-100 mb-1">高级卡池</h3>
                <p className="text-xs text-pink-300/60">包含所有稀有度卡牌</p>
              </div>
              <Sparkles size={40} className="text-pink-400/50" />
            </div>

            {/* Pity Info */}
            <div className="bg-black/40 rounded-lg p-3 mb-6 border border-white/5">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-purple-300">距离必出4星: <span className="font-mono text-white">{10 - pityCounter.fourStar}</span> 抽</span>
                <span className="text-yellow-300">距离必出5星: <span className="font-mono text-white">{50 - pityCounter.fiveStar}</span> 抽</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-yellow-500" style={{ width: `${(pityCounter.fiveStar / 50) * 100}%` }} />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => handleDraw('gem', 1)}
                disabled={isDrawing || player.gems < 200}
                className={`flex-1 py-3 rounded-xl font-bold tracking-widest flex flex-col items-center justify-center transition-all ${
                  !isDrawing && player.gems >= 200
                    ? 'bg-white/10 hover:bg-white/20 text-pink-100 border border-pink-500/50'
                    : 'bg-white/5 text-white/30 cursor-not-allowed border border-transparent'
                }`}
              >
                <span>召唤 1 次</span>
                <span className="text-[10px] font-mono flex items-center gap-1 mt-0.5 opacity-80"><Gem size={10} /> 200</span>
              </button>
              <button 
                onClick={() => handleDraw('gem', 10)}
                disabled={isDrawing || player.gems < 2000}
                className={`flex-[1.5] py-3 rounded-xl font-bold tracking-widest flex flex-col items-center justify-center transition-all ${
                  !isDrawing && player.gems >= 2000
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(219,39,119,0.4)]'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                <span>召唤 10 次</span>
                <span className="text-[10px] font-mono flex items-center gap-1 mt-0.5 opacity-80"><Gem size={10} /> 2000</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {drawnCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-6"
          >
            <div className="w-full max-w-md flex flex-col items-center">
              <h2 className="text-2xl font-bold tracking-widest text-white mb-8 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                获得卡牌
              </h2>
              
              <div className="grid grid-cols-2 gap-4 w-full mb-8 max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
                {drawnCards.map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0.5, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, type: 'spring' }}
                    className={`aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center p-4 relative overflow-hidden ${
                      card.rarity === 5 ? 'border-yellow-400 bg-yellow-900/40 shadow-[0_0_20px_rgba(250,204,21,0.5)]' :
                      card.rarity === 4 ? 'border-purple-400 bg-purple-900/40 shadow-[0_0_15px_rgba(192,132,252,0.4)]' :
                      card.rarity === 3 ? 'border-blue-400 bg-blue-900/40' :
                      'border-gray-500 bg-gray-800/40'
                    }`}
                  >
                    <div className="absolute top-2 left-2 flex gap-0.5">
                      {Array.from({ length: card.rarity }).map((_, i) => (
                        <Sparkles key={i} size={10} className={card.rarity >= 4 ? 'text-yellow-400' : 'text-white/50'} />
                      ))}
                    </div>
                    <PackageOpen size={40} className="mb-2 opacity-50" />
                    <span className="text-sm font-bold text-center">{card.name}</span>
                  </motion.div>
                ))}
              </div>

              <button 
                onClick={() => setDrawnCards([])}
                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold tracking-widest transition-all"
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
