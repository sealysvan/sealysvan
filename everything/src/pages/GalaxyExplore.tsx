import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock, Globe, Heart, Gem, CircleDollarSign } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

interface Galaxy {
  id: string;
  name: string;
  index: number;
  planets: string[];
  unlocked: boolean;
  condition?: string;
}

export default function GalaxyExplore() {
  const navigate = useNavigate();
  const { player } = useGameStore();
  const [galaxies, setGalaxies] = useState<Galaxy[]>([]);
  const [selectedGalaxy, setSelectedGalaxy] = useState<Galaxy | null>(null);

  const fetchGalaxies = async () => {
    try {
      const res = await fetch('/api/explore/galaxies');
      if (res.ok) {
        const data = await res.json();
        setGalaxies(data);
        // Default select the first one or the one currently unlocked
        setSelectedGalaxy(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch galaxies:', error);
    }
  };

  useEffect(() => {
    fetchGalaxies();
  }, []);

  const handleEnter = () => {
    if (selectedGalaxy && selectedGalaxy.unlocked) {
      navigate(`/universe/${selectedGalaxy.id}`);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#050510] text-white relative overflow-hidden">
      {/* Stars Background */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-[pulse_4s_ease-in-out_infinite]"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#0B132B]/80 backdrop-blur-sm border-b border-blue-900/50 shrink-0 relative z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-widest text-white">星系探索</h1>
        <div className="flex gap-2">
          <div className="flex items-center bg-[#111D3B] border border-blue-800/50 rounded-full px-2 py-1">
             <Heart size={12} className="text-red-500 mr-1" />
             <span className="text-xs font-mono">{player.stamina}</span>
          </div>
        </div>
      </div>

      {/* Main Content - Galaxy List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 scrollbar-hide">
        {galaxies.map((galaxy) => (
          <motion.div
            key={galaxy.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedGalaxy(galaxy)}
            className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
              selectedGalaxy?.id === galaxy.id 
                ? 'border-blue-500 bg-blue-900/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            } ${!galaxy.unlocked ? 'opacity-60 grayscale' : ''}`}
          >
            {/* Galaxy Graphic */}
            <div className="absolute right-[-20px] top-[-20px] w-32 h-32 opacity-20 pointer-events-none">
               <div className="w-full h-full rounded-full bg-blue-500 blur-2xl"></div>
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-full bg-black/50 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                {galaxy.id === 'solar' ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-red-600 shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-600 blur-[2px]"></div>
                )}
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white tracking-wider mb-1">{galaxy.name}</h2>
                <div className="flex items-center gap-2 text-xs text-blue-200/60">
                  <Globe size={12} />
                  <span>包含 {galaxy.planets.length} 个行星</span>
                </div>
              </div>

              {!galaxy.unlocked && (
                <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center shrink-0">
                  <Lock size={18} className="text-white/50" />
                </div>
              )}
            </div>

            {/* Condition Overlay */}
            {!galaxy.unlocked && selectedGalaxy?.id === galaxy.id && (
              <div className="mt-4 p-2 bg-red-900/30 border border-red-500/30 rounded text-xs text-red-200 flex items-center gap-2">
                <Lock size={12} />
                解锁条件: {galaxy.condition}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom Action Bar */}
      <div className="p-6 bg-[#0B132B]/90 backdrop-blur-md border-t border-blue-900/50 shrink-0 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">{selectedGalaxy?.name || '选择星系'}</h3>
            <p className="text-xs text-blue-300/60">
              {selectedGalaxy?.unlocked ? '已解锁，可以进行探索' : '未解锁'}
            </p>
          </div>
          {selectedGalaxy?.unlocked && (
            <div className="text-right">
              <div className="text-xs text-blue-300/60 mb-1">修复进度</div>
              <div className="text-lg font-mono font-bold text-green-400">
                {/* Placeholder for actual progress */}
                --%
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={handleEnter}
          disabled={!selectedGalaxy?.unlocked}
          className={`w-full py-4 rounded-xl font-bold text-lg tracking-widest transition-all ${
            selectedGalaxy?.unlocked
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
        >
          {selectedGalaxy?.unlocked ? '进入星系' : '未解锁'}
        </button>
      </div>
    </div>
  );
}
