import express from 'express';
import db from '../db';

const router = express.Router();

const DAILY_TASKS = [
  { id: 'd1', type: 'daily', title: '每日登录', description: '登录游戏', reward: { type: 'gold', amount: 500, icon: 'Coins' }, requiredProgress: 1 },
  { id: 'd2', type: 'daily', title: '完成3次战斗', description: '在探索中完成3次战斗', reward: { type: 'gems', amount: 50, icon: 'Gem' }, requiredProgress: 3 },
  { id: 'd3', type: 'daily', title: '进行1次卡牌合成', description: '在炼金室合成任意卡牌', reward: { type: 'gold', amount: 1000, icon: 'Coins' }, requiredProgress: 1 },
];

const WEEKLY_TASKS = [
  { id: 'w1', type: 'weekly', title: '累计登录5天', description: '本周累计登录5天', reward: { type: 'gems', amount: 300, icon: 'Gem' }, requiredProgress: 5 },
  { id: 'w2', type: 'weekly', title: '完成20次战斗', description: '在探索中完成20次战斗', reward: { type: 'gold', amount: 5000, icon: 'Coins' }, requiredProgress: 20 },
];

const MONTHLY_TASKS = [
  { id: 'm1', type: 'monthly', title: '累计登录20天', description: '本月累计登录20天', reward: { type: 'gems', amount: 1000, icon: 'Gem' }, requiredProgress: 20 },
];

const MAIN_TASKS = [
  { id: 'main1', type: 'main', title: '初入星际', description: '完成第一次战斗', reward: { type: 'gold', amount: 1000, icon: 'Coins' }, requiredProgress: 1 },
  { id: 'main2', type: 'main', title: '卡牌大师', description: '获得5张卡牌', reward: { type: 'gems', amount: 100, icon: 'Gem' }, requiredProgress: 5 },
];

const ALL_TASKS = [...DAILY_TASKS, ...WEEKLY_TASKS, ...MONTHLY_TASKS, ...MAIN_TASKS];

// Helper to get task by id
const getTaskById = (id: string) => ALL_TASKS.find(t => t.id === id);

router.get('/', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = db.prepare('SELECT tasks_progress FROM users WHERE id = ?').get(userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  let progress = {};
  try {
    progress = JSON.parse(user.tasks_progress || '{}');
  } catch (e) {
    console.error('Failed to parse tasks_progress', e);
  }

  // Merge progress with task definitions
  const tasksWithProgress = ALL_TASKS.map(task => {
    const taskProgress = (progress as any)[task.id] || { current: 0, claimed: false };
    return {
      ...task,
      progress: taskProgress.current,
      claimed: taskProgress.claimed
    };
  });

  res.json(tasksWithProgress);
});

router.post('/claim/:taskId', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { taskId } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const task = getTaskById(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  let progress: any = {};
  try {
    progress = JSON.parse(user.tasks_progress || '{}');
  } catch (e) {}

  const taskProgress = progress[taskId] || { current: 0, claimed: false };

  if (taskProgress.claimed) {
    return res.status(400).json({ error: 'Task already claimed' });
  }

  if (taskProgress.current < task.requiredProgress) {
    return res.status(400).json({ error: 'Task not completed yet' });
  }

  // Claim reward
  const transaction = db.transaction(() => {
    let newGold = user.gold;
    let newGems = user.gems;

    if (task.reward.type === 'gold') {
      newGold += task.reward.amount;
    } else if (task.reward.type === 'gems') {
      newGems += task.reward.amount;
    }

    progress[taskId] = { ...taskProgress, claimed: true };

    db.prepare(`
      UPDATE users 
      SET gold = ?, gems = ?, tasks_progress = ?
      WHERE id = ?
    `).run(newGold, newGems, JSON.stringify(progress), userId);

    return { newGold, newGems };
  });

  try {
    const result = transaction();
    res.json({ success: true, player: result });
  } catch (error) {
    console.error('Claim task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to update task progress (internal/gameplay use)
router.post('/progress', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { taskId, amount } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = db.prepare('SELECT tasks_progress FROM users WHERE id = ?').get(userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  let progress: any = {};
  try {
    progress = JSON.parse(user.tasks_progress || '{}');
  } catch (e) {}

  const taskProgress = progress[taskId] || { current: 0, claimed: false };
  taskProgress.current += amount;
  progress[taskId] = taskProgress;

  db.prepare('UPDATE users SET tasks_progress = ? WHERE id = ?').run(JSON.stringify(progress), userId);

  res.json({ success: true });
});

export default router;
