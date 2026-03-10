import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1A1C29_0%,_#000_100%)]"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="z-10 w-full max-w-sm bg-[#111D3B]/80 backdrop-blur-md p-8 rounded-2xl border border-blue-900/50 shadow-2xl text-center"
      >
        <h1 className="text-4xl font-light tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mb-8">
          Cosmos
        </h1>
        
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="输入钱包地址或游客ID" 
            className="w-full bg-black/50 border border-blue-800/50 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold tracking-widest py-3 rounded-lg shadow-lg hover:brightness-110 transition-all"
          >
            进入宇宙
          </button>
        </div>
        
        <p className="text-blue-500/50 text-[10px] mt-8">v1.0.0 Alpha</p>
      </motion.div>
    </div>
  );
}
