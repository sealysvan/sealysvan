import { useGameStore, Card } from '../store/useGameStore';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sword, X, ChevronLeft } from 'lucide-react';

export default function Deck() {
  const { inventory, deck, setDeckSlot, clearDeck } = useGameStore();
  const navigate = useNavigate();

  const handleCardClick = (card: Card) => {
    // Check if card is already in deck
    if (deck.some(c => c?.id === card.id)) return;

    // Find first empty slot
    const emptySlotIndex = deck.findIndex(c => c === null);
    if (emptySlotIndex !== -1) {
      setDeckSlot(emptySlotIndex, card);
    }
  };

  const handleSlotClick = (index: number) => {
    if (deck[index]) {
      setDeckSlot(index, null);
    }
  };

  const handleStartBattle = () => {
    const hasCards = deck.some(c => c !== null);
    if (hasCards) {
      navigate('/battle');
    }
  };

  return (
    <div className="h-full w-full max-w-[720px] mx-auto flex flex-col relative overflow-hidden bg-black text-white font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#112_0%,_#000_100%)] -z-10"></div>
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 pt-8 z-10">
        <button onClick={() => navigate('/')} className="p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-medium tracking-widest text-white/90">编队上阵</h1>
          <p className="text-[10px] text-blue-400 tracking-widest uppercase">Deck Formation</p>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      <div className="flex-1 flex flex-col px-6 pb-6 overflow-y-auto no-scrollbar z-10">
        <div className="text-center mb-6">
          <p className="text-xs text-white/50 tracking-widest">点击下方卡牌上阵，点击槽位下阵</p>
        </div>

        {/* Deck Slots Area */}
        <div className="bg-white/5 border border-blue-900/50 rounded-2xl p-5 mb-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-medium text-white tracking-widest">当前阵容</span>
            <button onClick={clearDeck} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded bg-red-400/10">
              <X size={14} /> 一键下阵
            </button>
          </div>
          
          <div className="flex flex-col gap-5">
            {/* Front Row (2 slots) */}
            <div className="flex justify-center gap-5">
              {[0, 1].map(i => (
                <DeckSlot key={i} index={i} card={deck[i]} onClick={() => handleSlotClick(i)} label="前排" />
              ))}
            </div>
            {/* Back Row (3 slots) */}
            <div className="flex justify-center gap-5">
              {[2, 3, 4].map(i => (
                <DeckSlot key={i} index={i} card={deck[i]} onClick={() => handleSlotClick(i)} label="后排" />
              ))}
            </div>
          </div>

          <button 
            onClick={handleStartBattle}
            disabled={!deck.some(c => c !== null)}
            className={`w-full mt-8 py-4 rounded-xl text-sm tracking-widest font-medium transition-all ${
              deck.some(c => c !== null) 
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            确认出战
          </button>
        </div>

        {/* Inventory Area */}
        <div className="flex-1 bg-white/5 border border-blue-900/50 rounded-2xl p-5 flex flex-col min-h-[300px]">
          <h2 className="text-sm font-medium text-white tracking-widest mb-4">我的卡牌</h2>
          
          {inventory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/30 text-sm tracking-widest border border-dashed border-white/10 rounded-xl">
              暂无卡牌
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 overflow-y-auto no-scrollbar pr-1 pb-2">
              {inventory.map((card) => {
                const isSelected = deck.some(c => c?.id === card.id);
                return (
                  <motion.div
                    key={card.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCardClick(card)}
                    className={`relative rounded-xl border p-3 cursor-pointer transition-all flex flex-col aspect-[3/4] ${
                      isSelected 
                        ? 'bg-blue-900/40 border-blue-500 opacity-50' 
                        : 'bg-black/40 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 rounded-xl">
                        <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded font-medium tracking-widest">已上阵</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded">{card.elements?.[0] || card.element || '未知'}</span>
                      <span className="text-[10px] text-white/40">★{card.rarity}</span>
                    </div>
                    <h3 className="text-xs font-medium text-white mb-1 line-clamp-2 leading-tight">{card.name}</h3>
                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1 text-red-400">
                        <Sword size={10} />
                        <span className="text-[10px] font-mono">{card.attack}</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-400">
                        <Shield size={10} />
                        <span className="text-[10px] font-mono">{card.hp || card.health}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeckSlot({ index, card, onClick, label }: { key?: string | number, index: number, card: Card | null, onClick: () => void, label: string }) {
  return (
    <motion.div 
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`w-24 aspect-[3/4] rounded-xl border flex flex-col items-center justify-center relative cursor-pointer overflow-hidden transition-all ${
        card ? 'border-blue-500 bg-blue-900/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.15)]' : 'border-dashed border-white/20 bg-white/5 hover:bg-white/10'
      }`}
    >
      {!card ? (
        <span className="text-xs text-white/30 tracking-widest">{label}</span>
      ) : (
        <div className="w-full h-full p-2 flex flex-col">
          <div className="text-[10px] text-amber-400/80 mb-1 text-center">{card.elements?.[0] || card.element || '未知'}</div>
          <div className="text-xs font-medium text-white text-center flex-1 flex items-center justify-center leading-tight px-1">{card.name}</div>
          <div className="flex justify-between items-center w-full mt-auto pt-1 border-t border-white/10">
            <div className="flex items-center gap-0.5 text-red-400">
              <Sword size={8} />
              <span className="text-[10px] font-mono">{card.attack}</span>
            </div>
            <div className="flex items-center gap-0.5 text-green-400">
              <Shield size={8} />
              <span className="text-[10px] font-mono">{card.hp || card.health}</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
