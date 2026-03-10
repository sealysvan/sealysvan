import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore, type ElementType, type Card } from '../store/useGameStore';
import { Sparkles, Loader2, X, ChevronLeft, Star } from 'lucide-react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const socket = io();

const ELEMENTS: ElementType[] = ['金', '木', '水', '火', '土', '风', '雨', '雷', '电', '光明', '黑暗'];

export default function Synthesis() {
  const [selectedElements, setSelectedElements] = useState<ElementType[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [resultCard, setResultCard] = useState<Card | null>(null);
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const { addCardToInventory, player, updatePlayer } = useGameStore();
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("global:card_created", (data) => {
      // In a real app, you might show a toast notification here
      console.log("Global Broadcast:", data.message);
      alert(data.message); // Simple alert for now
    });

    return () => {
      socket.off("global:card_created");
    };
  }, []);

  // Update timestamp every minute to keep the slider current if not touched
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleElementClick = (element: ElementType) => {
    if (selectedElements.includes(element)) return; // Prevent duplicates
    if (selectedElements.length < 3) {
      setSelectedElements([...selectedElements, element]);
    }
  };

  const removeElement = (element: ElementType) => {
    setSelectedElements(selectedElements.filter(e => e !== element));
  };

  const synthesize = async () => {
    if (selectedElements.length === 0) return;
    setIsSynthesizing(true);
    setResultCard(null);

    try {
      const planet = '火星'; // Hardcoded for now, could be dynamic
      
      const response = await fetch('/api/generate-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': player.id // Assuming player has an id
        },
        body: JSON.stringify({
          elements: selectedElements,
          timestamp,
          planet
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to synthesize card');
      }

      const data = await response.json();
      const cardData = data.card;
      
      // Update player coins
      if (data.remainingCoins !== undefined) {
        updatePlayer({ gold: data.remainingCoins });
      }
      
      // Broadcast to all clients via socket if rarity is 5
      if (cardData.rarity >= 5) {
        socket.emit("card_created", {
          message: `恭喜玩家 ${data.creatorName} 在 ${new Date(timestamp).toLocaleString()} 合成传说卡牌 ${cardData.name}！`
        });
      }

      setResultCard(cardData);
    } catch (error: any) {
      console.error('Synthesis failed:', error);
      alert(error.message); // Show error to user
    } finally {
      setIsSynthesizing(false);
      setSelectedElements([]);
    }
  };

  const handleAddToDeck = () => {
    if (resultCard) {
      addCardToInventory(resultCard);
      setResultCard(null);
      // Optional: navigate to deck
      // navigate('/deck');
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const minTime = Date.now() - 24 * 60 * 60 * 1000;
  const maxTime = Date.now() + 24 * 60 * 60 * 1000;

  return (
    <div className="h-full w-full max-w-[720px] mx-auto flex flex-col relative overflow-hidden bg-black text-white font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-black to-black -z-10" />
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 pt-8 z-10">
        <button onClick={() => navigate('/')} className="p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-medium tracking-widest text-white/90">炼金工坊</h1>
          <p className="text-[10px] text-white/40 tracking-widest uppercase">The Forge</p>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      <div className="flex-1 flex flex-col px-6 pb-6 overflow-y-auto no-scrollbar">
        {/* Planet Label */}
        <div className="text-center mb-6">
          <div className="inline-block px-4 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm tracking-widest">
            当前星球: 火星
          </div>
        </div>

        {/* Selected Elements Area */}
        <div className="flex justify-between items-center mb-2 px-2">
          <span className="text-sm text-white/60">消耗: 100 金币</span>
          <span className="text-sm text-amber-400">拥有: {player.gold} 金币</span>
        </div>
        <div className="min-h-[80px] bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-center gap-3">
          <AnimatePresence mode="popLayout">
            {selectedElements.length === 0 ? (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-white/30 text-sm tracking-wider"
              >
                点击下方元素添加 (最多3个)
              </motion.p>
            ) : (
              selectedElements.map((el) => (
                <motion.div
                  key={el}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400"
                >
                  <span className="text-sm font-medium">{el}</span>
                  <button onClick={() => removeElement(el)} className="p-0.5 hover:bg-amber-500/20 rounded-full">
                    <X size={14} />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Element Grid (6x2) */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {ELEMENTS.map((el) => {
            const isSelected = selectedElements.includes(el);
            const isDisabled = selectedElements.length >= 3 && !isSelected;
            
            return (
              <button
                key={el}
                onClick={() => handleElementClick(el)}
                disabled={isDisabled || isSelected}
                className={`
                  aspect-square rounded-xl border flex flex-col items-center justify-center transition-all duration-300
                  ${isSelected ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 scale-95 opacity-50' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'}
                  ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className="text-lg font-medium mb-1">{el}</span>
              </button>
            );
          })}
        </div>

        {/* Time Slider */}
        <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-white/50 tracking-wider">选择时间节点</span>
            <span className="text-sm font-mono text-amber-400">{formatTime(timestamp)}</span>
          </div>
          <input 
            type="range" 
            min={minTime} 
            max={maxTime} 
            step={60000} // 1 minute steps
            value={timestamp}
            onChange={(e) => setTimestamp(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between mt-2 text-[10px] text-white/30">
            <span>-24h</span>
            <span>当前</span>
            <span>+24h</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={synthesize}
          disabled={selectedElements.length === 0 || isSynthesizing}
          className={`
            mt-auto py-4 rounded-2xl flex items-center justify-center gap-2 text-base tracking-widest font-medium transition-all
            ${selectedElements.length > 0 && !isSynthesizing 
              ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
              : 'bg-white/10 text-white/30 cursor-not-allowed'}
          `}
        >
          {isSynthesizing ? (
            <><Loader2 className="animate-spin" size={20} /> 合成中...</>
          ) : (
            <><Sparkles size={20} /> 开始合成</>
          )}
        </button>

        {/* Result Modal */}
        <AnimatePresence>
          {resultCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm relative overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />
                
                <div className="text-center mb-6 mt-2">
                  <div className="flex justify-center gap-1 mb-2">
                    {Array.from({ length: resultCard.rarity }).map((_, i) => (
                      <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <h2 className="text-2xl font-medium tracking-wide text-white">{resultCard.name}</h2>
                  <p className="text-xs text-white/40 mt-1">
                    {resultCard.elements.join(' · ')} | 战力 {resultCard.power}
                  </p>
                </div>
                
                <div className="flex-1 min-h-[200px] bg-black/50 rounded-2xl border border-white/5 mb-6 flex items-center justify-center p-4 relative overflow-hidden">
                  {/* Placeholder for Card Image */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/40 via-transparent to-transparent" />
                  <Sparkles size={48} className="text-amber-500/50" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-white/40 mb-1">攻击力 (ATK)</p>
                    <p className="text-lg font-mono text-white">{resultCard.attack}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-white/40 mb-1">生命值 (HP)</p>
                    <p className="text-lg font-mono text-white">{resultCard.hp}</p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-amber-400">{resultCard.skill.name}</span>
                    <span className="text-[10px] text-white/40 bg-white/10 px-2 py-0.5 rounded">CD: {resultCard.skill.cooldown}</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{resultCard.skill.effect}</p>
                </div>
                
                <div className="flex gap-3 mt-auto">
                  <button 
                    onClick={() => setResultCard(null)}
                    className="flex-1 py-4 border border-white/10 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5 transition-colors"
                  >
                    放弃
                  </button>
                  <button 
                    onClick={handleAddToDeck}
                    className="flex-[2] py-4 bg-amber-500 text-black rounded-xl text-sm font-medium hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  >
                    加入卡组
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
