import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Home, PackageOpen, Swords, Compass } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '家园', icon: Home },
    { path: '/cardpack', label: '卡包', icon: PackageOpen },
    { path: '/arena', label: '竞技', icon: Swords },
    { path: '/explore', label: '探索', icon: Compass },
  ];

  return (
    <div className="h-screen w-full max-w-[720px] mx-auto bg-[#1A1C29] text-white font-sans overflow-hidden flex flex-col relative shadow-2xl pt-safe pb-safe">
      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="w-full bg-[#1A1C29] border-t border-white/10 h-[65px] flex px-2 pb-2 pt-1 shrink-0">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex-1 flex flex-col items-center justify-center transition-all duration-200 gap-1",
                isActive 
                  ? "text-[#E68A2E]" 
                  : "text-gray-400 hover:text-gray-200"
              )}
            >
              <Icon size={24} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(230,138,46,0.8)]")} />
              <span className="text-[10px] font-bold tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
