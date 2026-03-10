import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Gift, CheckCircle2, CircleDashed, Coins, Gem } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';

type TabType = 'daily' | 'weekly' | 'monthly' | 'main';

interface Task {
  id: string;
  type: TabType;
  title: string;
  description: string;
  reward: { type: string; amount: number; icon: string };
  requiredProgress: number;
  progress: number;
  claimed: boolean;
}

export default function Task() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [tasks, setTasks] = useState<Task[]>([]);
  const { updatePlayer, player } = useGameStore();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/task', {
        headers: { 'x-user-id': player.id }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const handleClaim = async (taskId: string) => {
    try {
      const res = await fetch(`/api/task/claim/${taskId}`, {
        method: 'POST',
        headers: { 'x-user-id': player.id }
      });
      
      if (res.ok) {
        const data = await res.json();
        updatePlayer(data.player);
        
        // Update local state
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, claimed: true } : t
        ));
        
        const task = tasks.find(t => t.id === taskId);
        if (task) {
           alert(`获得奖励: ${task.reward.amount} ${task.reward.type === 'gold' ? '金币' : '宝石'}`);
        }
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (error) {
      console.error('Failed to claim task:', error);
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'daily', label: '日常' },
    { id: 'weekly', label: '周常' },
    { id: 'monthly', label: '月常' },
    { id: 'main', label: '主线' },
  ];

  const filteredTasks = tasks.filter(t => t.type === activeTab);

  return (
    <div className="h-full w-full flex flex-col bg-[#1A1C29] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#0B132B] border-b border-blue-900/50 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-widest text-white">任务中心</h1>
        <div className="w-10" />
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-4 pb-2 gap-2 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold tracking-wider transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' 
                : 'bg-[#111D3B] text-blue-300/50 hover:bg-[#1A2B50]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map(task => {
            const isCompleted = task.progress >= task.requiredProgress;
            const status = task.claimed ? 'claimed' : isCompleted ? 'completed' : 'active';
            
            return (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-4 rounded-xl border flex items-center justify-between ${
                status === 'claimed' 
                  ? 'bg-white/5 border-white/5 opacity-50' 
                  : 'bg-[#111D3B] border-blue-800/50'
              }`}
            >
              <div className="flex gap-4 items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center shrink-0">
                  {status === 'claimed' ? (
                    <CheckCircle2 size={20} className="text-green-500" />
                  ) : status === 'completed' ? (
                    <Gift size={20} className="text-yellow-400 animate-pulse" />
                  ) : (
                    <CircleDashed size={20} className="text-blue-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white mb-1">{task.title}</h3>
                  <p className="text-xs text-blue-200/60 mb-2">{task.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${status === 'completed' || status === 'claimed' ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(100, (task.progress / task.requiredProgress) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-blue-300">
                      {task.progress}/{task.requiredProgress}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ml-4 flex flex-col items-end gap-2 shrink-0">
                <div className="flex gap-1">
                    <div className="flex items-center gap-1 bg-black/30 px-2 py-1 rounded text-[10px] font-mono text-yellow-400">
                      {task.reward.type === 'gold' ? <Coins size={10} /> : <Gem size={10} />} {task.reward.amount}
                    </div>
                </div>
                
                {status === 'completed' ? (
                  <button 
                    onClick={() => handleClaim(task.id)}
                    className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded shadow-[0_0_10px_rgba(234,179,8,0.3)] transition-all"
                  >
                    领取
                  </button>
                ) : status === 'active' ? (
                  <button className="px-4 py-1.5 bg-blue-600/50 text-blue-200 text-xs font-bold rounded cursor-not-allowed">
                    前往
                  </button>
                ) : (
                  <button className="px-4 py-1.5 bg-white/10 text-white/40 text-xs font-bold rounded cursor-not-allowed">
                    已领取
                  </button>
                )}
              </div>
            </motion.div>
          )})}
        </AnimatePresence>
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-10 text-white/40 text-sm">
            暂无任务
          </div>
        )}
      </div>
    </div>
  );
}
