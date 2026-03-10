import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore, Card } from '../store/useGameStore';
import { useNavigate } from 'react-router-dom';
import { Shield, Sword, Zap, ChevronLeft } from 'lucide-react';
import { calculateDamage } from '../utils/ElementUtil';

interface BattleCardData extends Card {
  currentHp: number;
  maxHp: number;
  isEnemy: boolean;
}

export default function Battle() {
  const { deck } = useGameStore();
  const navigate = useNavigate();

  const [turn, setTurn] = useState(1);
  const [phase, setPhase] = useState<'player' | 'enemy' | 'result'>('player');
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  
  const [playerField, setPlayerField] = useState<(BattleCardData | null)[]>([...deck].map(c => c ? { ...c, currentHp: c.hp || c.health || 100, maxHp: c.hp || c.health || 100, isEnemy: false } : null));
  const [enemyField, setEnemyField] = useState<(BattleCardData | null)[]>([
    { id: 'e1', name: '火星岩浆怪', description: '', attack: 40, hp: 150, currentHp: 150, maxHp: 150, rarity: 1, elements: ['火'], power: 150, skill: {name: '火球', effect: '', cooldown: 1}, discoveryTime: Date.now(), isEnemy: true },
    { id: 'e2', name: '火星岩浆怪', description: '', attack: 40, hp: 150, currentHp: 150, maxHp: 150, rarity: 1, elements: ['火'], power: 150, skill: {name: '火球', effect: '', cooldown: 1}, discoveryTime: Date.now(), isEnemy: true },
    null, null, null
  ]);

  const [animatingCard, setAnimatingCard] = useState<{ index: number, isEnemy: boolean, targetIndex: number } | null>(null);
  const [damageText, setDamageText] = useState<{ index: number, isEnemy: boolean, amount: number, isCrit: boolean } | null>(null);

  useEffect(() => {
    if (!deck.some(c => c !== null)) {
      navigate('/deck');
    }
  }, [deck, navigate]);

  const checkWinCondition = () => {
    const playerAlive = playerField.some(c => c !== null && c.currentHp > 0);
    const enemyAlive = enemyField.some(c => c !== null && c.currentHp > 0);
    
    if (!enemyAlive) {
      setResult('win');
      setPhase('result');
      return true;
    }
    if (!playerAlive) {
      setResult('lose');
      setPhase('result');
      return true;
    }
    return false;
  };

  const executeAttack = async (attacker: BattleCardData, attackerIndex: number, isEnemyAttacking: boolean) => {
    const targetField = isEnemyAttacking ? playerField : enemyField;
    const setTargetField = isEnemyAttacking ? setPlayerField : setEnemyField;
    
    // Find first alive target
    const targetIndex = targetField.findIndex(c => c !== null && c.currentHp > 0);
    if (targetIndex === -1) return;
    
    const target = targetField[targetIndex]!;
    
    // Animation
    setAnimatingCard({ index: attackerIndex, isEnemy: isEnemyAttacking, targetIndex });
    await new Promise(r => setTimeout(r, 500));
    
    // Calculate damage
    const damage = calculateDamage(attacker, target);
    const isCrit = damage > attacker.attack;
    
    // Show damage text
    setDamageText({ index: targetIndex, isEnemy: !isEnemyAttacking, amount: damage, isCrit });
    
    // Apply damage
    setTargetField(prev => {
      const next = [...prev];
      if (next[targetIndex]) {
        next[targetIndex]!.currentHp -= damage;
        if (next[targetIndex]!.currentHp <= 0) {
          next[targetIndex] = null; // Card dies
        }
      }
      return next;
    });
    
    await new Promise(r => setTimeout(r, 500));
    setAnimatingCard(null);
    setDamageText(null);
  };

  const handleEndTurn = async () => {
    if (phase !== 'player') return;
    setPhase('enemy');

    // Player attacks
    for (let i = 0; i < playerField.length; i++) {
      const card = playerField[i];
      if (card && card.currentHp > 0) {
        await executeAttack(card, i, false);
        if (checkWinCondition()) return;
      }
    }

    // Enemy attacks
    for (let i = 0; i < enemyField.length; i++) {
      const card = enemyField[i];
      if (card && card.currentHp > 0) {
        await executeAttack(card, i, true);
        if (checkWinCondition()) return;
      }
    }

    setTurn(t => t + 1);
    setPhase('player');
  };

  if (phase === 'result') {
    return (
      <div className="h-full w-full max-w-[720px] mx-auto flex flex-col items-center justify-center p-6 bg-black relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#112_0%,_#000_100%)]"></div>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="z-10 text-center bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm w-full max-w-sm">
          <h1 className={`text-5xl font-bold tracking-widest mb-4 ${result === 'win' ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'text-white/50'}`}>
            {result === 'win' ? '胜利' : '失败'}
          </h1>
          <p className="text-white/60 mb-8 tracking-widest">回合数: {turn}</p>
          <button 
            onClick={() => navigate('/deck')}
            className="w-full bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl font-medium tracking-widest hover:bg-white/20 transition-colors"
          >
            返回编队
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full w-full max-w-[720px] mx-auto flex flex-col relative overflow-hidden bg-black text-white font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#211_0%,_#000_100%)]"></div>
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between p-4 pt-8 z-10">
        <button onClick={() => navigate('/deck')} className="p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-medium tracking-widest text-white/90">战斗中</h1>
          <p className="text-[10px] text-red-400 tracking-widest uppercase">Battle Phase</p>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      <div className="z-10 flex justify-between items-center px-6 mb-4">
        <div className="text-white text-sm font-medium tracking-widest bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
          回合 {turn}
        </div>
        <div className="text-[10px] text-amber-400/80 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20 tracking-wider">
          水克火，火克金
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-8 px-6 w-full">
        {/* Enemy Area */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-center gap-3">
            {[2, 3, 4].map(i => (
              <BattleSlot key={`e-${i}`} card={enemyField[i]} isEnemy={true} index={i} animatingCard={animatingCard} damageText={damageText} />
            ))}
          </div>
          <div className="flex justify-center gap-3">
            {[0, 1].map(i => (
              <BattleSlot key={`e-${i}`} card={enemyField[i]} isEnemy={true} index={i} animatingCard={animatingCard} damageText={damageText} />
            ))}
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center relative py-2">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
          <div className="absolute bg-black px-4 text-red-500/80 font-bold italic tracking-widest text-xl">VS</div>
        </div>

        {/* Player Area */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-center gap-3">
            {[0, 1].map(i => (
              <BattleSlot key={`p-${i}`} card={playerField[i]} isEnemy={false} index={i} animatingCard={animatingCard} damageText={damageText} />
            ))}
          </div>
          <div className="flex justify-center gap-3">
            {[2, 3, 4].map(i => (
              <BattleSlot key={`p-${i}`} card={playerField[i]} isEnemy={false} index={i} animatingCard={animatingCard} damageText={damageText} />
            ))}
          </div>
        </div>
      </div>

      <div className="z-10 mt-auto p-6 w-full">
        <button 
          onClick={handleEndTurn}
          disabled={phase !== 'player'}
          className={`w-full py-4 rounded-2xl font-medium tracking-widest text-base transition-all ${
            phase === 'player' 
              ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:bg-red-500' 
              : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          {phase === 'player' ? '结束回合' : '敌方行动中...'}
        </button>
      </div>
    </div>
  );
}

function BattleSlot({ card, isEnemy, index, animatingCard, damageText }: { key?: string | number, card: BattleCardData | null, isEnemy: boolean, index: number, animatingCard: any, damageText: any }) {
  const isAnimating = animatingCard?.index === index && animatingCard?.isEnemy === isEnemy;
  const hasDamage = damageText?.index === index && damageText?.isEnemy === isEnemy;

  return (
    <div className="w-[80px] aspect-[3/4] relative">
      <AnimatePresence>
        {card && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: isAnimating ? (isEnemy ? 30 : -30) : 0,
              zIndex: isAnimating ? 10 : 1
            }}
            exit={{ opacity: 0, scale: 0, rotate: 15 }}
            transition={{ duration: 0.2 }}
            className={`absolute inset-0 rounded-xl border flex flex-col p-1.5 bg-black/80 ${
              isEnemy ? 'border-red-900/50 shadow-[inset_0_0_15px_rgba(220,38,38,0.15)]' : 'border-blue-900/50 shadow-[inset_0_0_15px_rgba(59,130,246,0.15)]'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] text-amber-400/80 bg-amber-400/10 px-1 rounded">{card.elements?.[0] || card.element || '未知'}</span>
            </div>
            <div className="text-[10px] font-medium text-white text-center flex-1 flex items-center justify-center leading-tight px-0.5">{card.name}</div>
            
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-auto mb-1.5 overflow-hidden">
              <div 
                className={`h-full ${isEnemy ? 'bg-red-500' : 'bg-green-500'} transition-all duration-300`} 
                style={{ width: `${Math.max(0, (card.currentHp / card.maxHp) * 100)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center w-full px-0.5">
              <span className="text-[9px] text-red-400 font-mono flex items-center"><Sword size={8} className="mr-0.5"/>{card.attack}</span>
              <span className="text-[9px] text-green-400 font-mono flex items-center"><Shield size={8} className="mr-0.5"/>{card.currentHp}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasDamage && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -20, scale: damageText.isCrit ? 1.5 : 1 }}
            exit={{ opacity: 0 }}
            className={`absolute top-0 left-1/2 -translate-x-1/2 font-bold z-20 whitespace-nowrap ${
              damageText.isCrit ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-red-500 drop-shadow-[0_0_4px_rgba(0,0,0,1)]'
            }`}
          >
            -{damageText.amount}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
