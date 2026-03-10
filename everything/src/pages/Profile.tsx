import { motion } from 'motion/react';

export default function Profile() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#1A1C29] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#112_0%,_#000_100%)]"></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="z-10 text-center">
        <h1 className="text-3xl font-bold text-white mb-4 tracking-widest">个人资料</h1>
        <p className="text-blue-300 text-sm">玩家信息与设置模块开发中...</p>
      </motion.div>
    </div>
  );
}
