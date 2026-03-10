import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { User, Heart, Gem, CircleDollarSign, Plus, Volume2, Globe, Box, Moon, ClipboardList, Swords, Layers } from 'lucide-react';
import { io } from 'socket.io-client';

import { useGameStore } from '../store/useGameStore';

const socket = io();

const PLANETS = [
  { name: '水星', size: 20, angle: 0, texture: 'linear-gradient(90deg, #888 0%, #bbb 25%, #888 50%, #bbb 75%, #888 100%)' },
  { name: '金星', size: 28, angle: 45, texture: 'linear-gradient(90deg, #FCD34D 0%, #F59E0B 25%, #FCD34D 50%, #F59E0B 75%, #FCD34D 100%)' },
  { name: '地球', size: 32, angle: 90, texture: 'linear-gradient(90deg, #1D4ED8 0%, #4ADE80 25%, #1D4ED8 50%, #4ADE80 75%, #1D4ED8 100%)' },
  { name: '火星', size: 26, angle: 135, texture: 'linear-gradient(90deg, #B91C1C 0%, #EA580C 25%, #B91C1C 50%, #EA580C 75%, #B91C1C 100%)' },
  { name: '木星', size: 48, angle: 180, texture: 'linear-gradient(90deg, #D97706 0%, #FDE68A 15%, #92400E 30%, #D97706 50%, #FDE68A 65%, #92400E 80%, #D97706 100%)' },
  { name: '土星', size: 44, angle: 225, texture: 'linear-gradient(90deg, #FDE047 0%, #CA8A04 25%, #FDE047 50%, #CA8A04 75%, #FDE047 100%)', ring: true },
  { name: '天王星', size: 36, angle: 270, texture: 'linear-gradient(90deg, #2DD4BF 0%, #0D9488 25%, #2DD4BF 50%, #0D9488 75%, #2DD4BF 100%)' },
  { name: '海王星', size: 36, angle: 315, texture: 'linear-gradient(90deg, #1E3A8A 0%, #312E81 25%, #1E3A8A 50%, #312E81 75%, #1E3A8A 100%)' },
];

function Planet({ name, size, angle, texture, ring }: any) {
  return (
    <div 
      className="absolute top-1/2 left-1/2"
      style={{ 
        transformStyle: 'preserve-3d',
        transform: `rotateZ(${angle}deg) translateY(-170px)`,
        width: size,
        height: size,
        marginLeft: -size/2,
        marginTop: -size/2
      }}
    >
      <div className="w-full h-full" style={{ transformStyle: 'preserve-3d', animation: 'orbit-spin-reverse 40s linear infinite' }}>
        <div className="w-full h-full relative" style={{ transformStyle: 'preserve-3d', transform: `rotateZ(-${angle}deg) rotateX(-70deg)` }}>
          {/* Planet Sphere */}
          <div 
            className="w-full h-full rounded-full absolute inset-0"
            style={{
              background: texture,
              backgroundSize: '200% 100%',
              animation: 'texture-spin 5s linear infinite',
              boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.8), 0 0 10px rgba(255,255,255,0.2)'
            }}
          />
          {/* Ring for Saturn */}
          {ring && (
            <div 
              className="absolute top-1/2 left-1/2 border-[6px] border-[#C4B581]/60 rounded-full"
              style={{
                width: size * 2.4,
                height: size * 0.8,
                marginLeft: -size * 1.2,
                marginTop: -size * 0.4,
                transform: 'rotateX(70deg) rotateY(-20deg)',
                boxShadow: '0 0 8px rgba(0,0,0,0.8), inset 0 0 8px rgba(0,0,0,0.8)'
              }}
            />
          )}
          {/* Label */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white font-bold tracking-widest whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,1)] bg-black/40 px-1.5 rounded">
            {name}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceBadge({ icon, value, onClick }: { icon: React.ReactNode, value: string, onClick?: () => void }) {
  return (
    <div 
      className={`flex items-center bg-[#111D3B] border border-blue-800/50 rounded-full px-1 py-0.5 relative ml-2 min-w-[60px] ${onClick ? 'cursor-pointer hover:brightness-110' : ''}`}
      onClick={onClick}
    >
      <div className="absolute -left-3 flex items-center justify-center w-5 h-5">
        {icon}
      </div>
      <span className="text-[10px] text-white ml-2 font-mono">{value}</span>
      <div className="absolute -bottom-1 left-0 w-3 h-3 bg-green-500 rounded-full border border-black flex items-center justify-center">
        <Plus size={8} className="text-white" />
      </div>
    </div>
  );
}

function NavButton({ title, icon, bgClass, borderClass, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex flex-col items-center justify-between p-1 rounded-lg border-t-2 ${borderClass} bg-gradient-to-b ${bgClass} shadow-lg cursor-pointer hover:brightness-110 transition-all h-24`}
    >
      <div className="w-full flex-1 bg-black/20 rounded flex items-center justify-center mb-1 shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
        {icon}
      </div>
      <span className="text-white text-xs font-bold tracking-widest pb-1">{title}</span>
    </div>
  );
}

export default function Lobby() {
  const navigate = useNavigate();
  const { player, updatePlayer } = useGameStore();
  const [announcement, setAnnouncement] = useState("全服公告:玩家XX合成了特殊卡牌！");
  const [showEnergyModal, setShowEnergyModal] = useState(false);

  useEffect(() => {
    socket.on('global:card_created', (data) => {
      setAnnouncement(`全服公告:玩家在${data.planet}合成了【${data.card.name}】！`);
    });
    return () => {
      socket.off('global:card_created');
    };
  }, []);

  const handleWatchAd = async () => {
    try {
      const res = await fetch('/api/user/energy/ad', {
        method: 'POST',
        headers: { 'x-user-id': player.id }
      });
      if (res.ok) {
        const data = await res.json();
        updatePlayer(data.player);
        alert('观看广告成功，恢复20点体力！');
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBuyEnergy = async () => {
    try {
      const res = await fetch('/api/user/energy/gem', {
        method: 'POST',
        headers: { 'x-user-id': player.id }
      });
      if (res.ok) {
        const data = await res.json();
        updatePlayer(data.player);
        alert('购买成功，恢复50点体力！');
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1C29]">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-[#0B132B] px-2 py-1 h-12 border-b border-blue-900/50 shrink-0">
        {/* Player Info */}
        <div className="flex items-center gap-2">
          <div 
            onClick={() => navigate('/profile')}
            className="w-8 h-8 bg-[#1A233A] rounded border border-blue-800 relative flex items-center justify-center cursor-pointer hover:brightness-110"
          >
            <User size={20} className="text-blue-500" />
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-[8px] px-1 rounded text-white font-bold">{player.level}</div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white leading-none">{player.name}</span>
            <span className="text-[8px] text-blue-300 leading-none mt-1">ID:{player.id}</span>
            <div className="w-16 h-1 bg-gray-800 rounded-full mt-1 relative">
              <div className="absolute top-0 left-0 h-full bg-blue-400 rounded-full" style={{ width: `${player.exp}%` }}></div>
              <span className="absolute -right-4 -top-1 text-[6px] text-blue-300">EXP</span>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="flex gap-1 items-center">
          <ResourceBadge icon={<Heart size={12} className="text-red-500 fill-red-500" />} value={`${player.stamina}/${player.maxStamina || 120}`} onClick={() => setShowEnergyModal(true)} />
          <ResourceBadge icon={<Gem size={12} className="text-pink-500 fill-pink-500" />} value={player.gems.toString()} />
          <ResourceBadge icon={<CircleDollarSign size={12} className="text-yellow-400 fill-yellow-400" />} value={player.gold.toString()} />
          <div 
            onClick={() => navigate('/task')}
            className="ml-2 w-8 h-8 bg-[#1A233A] rounded border border-blue-800 flex items-center justify-center cursor-pointer hover:brightness-110 relative"
          >
            <ClipboardList size={16} className="text-blue-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-black"></div>
          </div>
        </div>
      </div>

      {/* Solar System Area */}
      <div className="relative w-full flex-1 bg-black overflow-hidden min-h-[350px]">
        {/* Stars Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#111_0%,_#000_100%)]"></div>
        
        {/* 3D Scene Container */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}>
          
          {/* Sun */}
          <div className="absolute w-36 h-36 rounded-full" style={{ transform: 'translateZ(0)', transformStyle: 'preserve-3d' }}>
            <div 
              className="w-full h-full rounded-full" 
              style={{ 
                background: 'radial-gradient(circle at 30% 30%, #FFFDE7 0%, #FFD700 20%, #FF4500 70%, #8B0000 100%)',
                animation: 'sun-spin 20s linear infinite',
                boxShadow: '0 0 80px #FF4500, inset -10px -10px 20px rgba(0,0,0,0.5)'
              }}
            ></div>
          </div>

          {/* Orbit Plane */}
          <div className="absolute w-[340px] h-[340px] border border-white/10 rounded-full" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(70deg)' }}>
            <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d', animation: 'orbit-spin 40s linear infinite' }}>
              {PLANETS.map(p => (
                <Planet key={p.name} {...p} />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-[#4A148C] to-[#311B92] text-white text-xs p-1.5 flex items-center gap-2 border-y border-[#7E57C2] relative overflow-hidden shrink-0">
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#311B92] to-transparent z-10"></div>
        <Volume2 size={16} className="text-white shrink-0 ml-1" />
        <div className="whitespace-nowrap animate-[marquee_10s_linear_infinite]">
          {announcement}
        </div>
      </div>

      {/* Action Buttons Area */}
      <div className="bg-[#1A1C29] shrink-0">
        {/* 6 Grid Buttons (2x3) */}
        <div className="grid grid-cols-3 gap-2 p-2">
          <NavButton 
            color="blue" 
            title="闯关" 
            icon={<Globe size={28} className="text-blue-300" />} 
            bgClass="from-[#1E3A8A] to-[#1E40AF]"
            borderClass="border-[#3B82F6]"
            onClick={() => navigate('/galaxy')}
          />
          <NavButton 
            color="orange" 
            title="合成" 
            icon={<div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500"><div className="absolute top-1/2 left-1/2 w-10 h-2.5 border-2 border-yellow-200/80 rounded-[50%] -translate-x-1/2 -translate-y-1/2 rotate-[-20deg]"></div></div>} 
            bgClass="from-[#9A3412] to-[#C2410C]"
            borderClass="border-[#F97316]"
            onClick={() => navigate('/synthesis')}
          />
          <NavButton 
            color="purple" 
            title="卡组" 
            icon={<Layers size={28} className="text-purple-300" />} 
            bgClass="from-[#581C87] to-[#7E22CE]"
            borderClass="border-[#A855F7]"
            onClick={() => navigate('/deck')}
          />
          <NavButton 
            color="red" 
            title="竞技场" 
            icon={<Swords size={28} className="text-red-300" />} 
            bgClass="from-[#7F1D1D] to-[#B91C1C]"
            borderClass="border-[#EF4444]"
            onClick={() => navigate('/arena')}
          />
          <NavButton 
            color="gold" 
            title="拍卖行" 
            icon={<Box size={28} className="text-yellow-300" />} 
            bgClass="from-[#854D0E] to-[#A16207]"
            borderClass="border-[#EAB308]"
            onClick={() => navigate('/auction')}
          />
          <NavButton 
            color="teal" 
            title="炼金室" 
            icon={<Moon size={28} className="text-teal-300" />} 
            bgClass="from-[#0F766E] to-[#115E59]"
            borderClass="border-[#14B8A6]"
            onClick={() => navigate('/alchemy')}
          />
        </div>

        {/* 2 Grid Buttons */}
        <div className="grid grid-cols-2 gap-2 px-2 pb-2">
          <div 
            onClick={() => navigate('/dungeon')}
            className="bg-gradient-to-b from-[#1E40AF] to-[#1E3A8A] border border-[#3B82F6] rounded-md py-2 text-center shadow-lg relative overflow-hidden cursor-pointer hover:brightness-110"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
            <span className="text-white text-xs font-bold tracking-wider relative z-10">元素试炼·今日剩余3次</span>
          </div>
          <div 
            onClick={() => navigate('/dungeon')}
            className="bg-gradient-to-b from-[#166534] to-[#14532D] border border-[#22C55E] rounded-md py-2 text-center shadow-lg relative overflow-hidden cursor-pointer hover:brightness-110"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
            <span className="text-white text-xs font-bold tracking-wider relative z-10">金币矿洞·大量金币产出</span>
          </div>
        </div>
      </div>

      {/* Energy Modal */}
      {showEnergyModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111D3B] border border-blue-800 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white mb-4 text-center">补充体力</h2>
            <div className="space-y-4">
              <button 
                onClick={handleWatchAd}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all"
              >
                观看广告 (恢复20点)
              </button>
              <button 
                onClick={handleBuyEnergy}
                className="w-full py-3 bg-pink-600 hover:bg-pink-500 rounded-lg text-white font-bold shadow-[0_0_15px_rgba(219,39,119,0.5)] transition-all flex items-center justify-center gap-2"
              >
                <Gem size={16} /> 30 购买50点体力
              </button>
            </div>
            <button 
              onClick={() => setShowEnergyModal(false)}
              className="w-full mt-4 py-2 border border-blue-800/50 rounded-lg text-blue-300 hover:bg-blue-900/30 transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
