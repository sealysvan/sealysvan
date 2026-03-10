import express from 'express';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const TIERS = [
  { id: 'bronze', name: '青铜', minPoints: 0, rewards: { gold: 1000, gems: 50 } },
  { id: 'silver', name: '白银', minPoints: 1000, rewards: { gold: 2000, gems: 100 } },
  { id: 'gold', name: '黄金', minPoints: 2000, rewards: { gold: 5000, gems: 200 } },
  { id: 'platinum', name: '铂金', minPoints: 3000, rewards: { gold: 10000, gems: 500 } },
  { id: 'diamond', name: '钻石', minPoints: 4000, rewards: { gold: 20000, gems: 1000 } },
];

const getTierByPoints = (points: number) => {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) return TIERS[i];
  }
  return TIERS[0];
};

router.get('/info', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = db.prepare('SELECT season_points, season_tier FROM users WHERE id = ?').get(userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const currentTier = getTierByPoints(user.season_points);

  // Update tier if it changed
  if (user.season_tier !== currentTier.id) {
    db.prepare('UPDATE users SET season_tier = ? WHERE id = ?').run(currentTier.id, userId);
  }

  res.json({
    points: user.season_points,
    tier: currentTier.id,
    tiers: TIERS
  });
});

router.post('/match', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { deckIds } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!deckIds || deckIds.length === 0) {
    return res.status(400).json({ error: 'Deck is empty' });
  }

  // Calculate deck power
  let deckPower = 0;
  const placeholders = deckIds.map(() => '?').join(',');
  const cards = db.prepare(`SELECT * FROM cards WHERE id IN (${placeholders}) AND owner_id = ?`).all(...deckIds, userId) as any[];
  
  cards.forEach(card => {
    deckPower += card.power;
  });

  // Simulate opponent
  const opponentPower = deckPower * (0.8 + Math.random() * 0.4); // Opponent power is 80% to 120% of player's
  const isWin = deckPower >= opponentPower;

  const pointsChange = isWin ? 25 : -15;
  let newPoints = Math.max(0, user.season_points + pointsChange);
  const newTier = getTierByPoints(newPoints);

  db.prepare('UPDATE users SET season_points = ?, season_tier = ? WHERE id = ?').run(newPoints, newTier.id, userId);

  res.json({
    win: isWin,
    pointsChange,
    newPoints,
    newTier: newTier.id,
    battleLog: isWin 
      ? ['匹配到对手...', `我方战力: ${deckPower}`, `敌方战力: ${Math.floor(opponentPower)}`, '经过激烈的战斗，我方取得了胜利！', `积分 +${pointsChange}`]
      : ['匹配到对手...', `我方战力: ${deckPower}`, `敌方战力: ${Math.floor(opponentPower)}`, '我方战力不足，战斗失败...', `积分 ${pointsChange}`]
  });
});

export default router;
