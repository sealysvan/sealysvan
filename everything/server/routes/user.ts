import { Router } from 'express';
import db from '../db';

const router = Router();

function updateStamina(user: any) {
  const now = Date.now();
  const MAX_STAMINA = 120;
  const RECOVERY_RATE = 5 * 60 * 1000; // 5 minutes in ms

  if (user.last_stamina_update === 0) {
    db.prepare('UPDATE users SET last_stamina_update = ? WHERE id = ?').run(now, user.id);
    user.last_stamina_update = now;
    return user;
  }

  if (user.stamina < MAX_STAMINA) {
    const timePassed = now - user.last_stamina_update;
    const recovered = Math.floor(timePassed / RECOVERY_RATE);
    
    if (recovered > 0) {
      const newStamina = Math.min(MAX_STAMINA, user.stamina + recovered);
      const newLastUpdate = user.last_stamina_update + recovered * RECOVERY_RATE;
      
      db.prepare('UPDATE users SET stamina = ?, last_stamina_update = ? WHERE id = ?')
        .run(newStamina, newLastUpdate, user.id);
      
      user.stamina = newStamina;
      user.last_stamina_update = newLastUpdate;
    }
  } else {
    db.prepare('UPDATE users SET last_stamina_update = ? WHERE id = ?').run(now, user.id);
    user.last_stamina_update = now;
  }
  return user;
}

router.post('/login', (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  
  if (!user) {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    db.prepare('INSERT INTO users (id, username, last_stamina_update) VALUES (?, ?, ?)').run(id, username, Date.now());
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  } else {
    user = updateStamina(user);
  }

  res.json({ user });
});

router.get('/profile', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  let user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  user = updateStamina(user);
  res.json({ user });
});

router.post('/energy/ad', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  let user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const today = new Date().toISOString().split('T')[0];
  let adCount = user.ad_watch_count;
  
  if (user.last_ad_date !== today) {
    adCount = 0;
  }

  if (adCount >= 5) {
    return res.status(400).json({ error: '今日广告观看次数已达上限' });
  }

  const newStamina = Math.min(120, user.stamina + 20);
  
  db.prepare('UPDATE users SET stamina = ?, ad_watch_count = ?, last_ad_date = ? WHERE id = ?')
    .run(newStamina, adCount + 1, today, userId);

  user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  res.json({ player: user });
});

router.post('/energy/gem', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  let user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const today = new Date().toISOString().split('T')[0];
  let buyCount = user.gem_buy_count;
  
  if (user.last_gem_buy_date !== today) {
    buyCount = 0;
  }

  if (buyCount >= 3) {
    return res.status(400).json({ error: '今日宝石购买体力次数已达上限' });
  }

  if (user.gems < 30) {
    return res.status(400).json({ error: '宝石不足' });
  }

  const newStamina = Math.min(120, user.stamina + 50);
  const newGems = user.gems - 30;
  
  db.prepare('UPDATE users SET stamina = ?, gems = ?, gem_buy_count = ?, last_gem_buy_date = ? WHERE id = ?')
    .run(newStamina, newGems, buyCount + 1, today, userId);

  user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  res.json({ player: user });
});

export default router;
