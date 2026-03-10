import express from 'express';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper to generate a random card
function generateRandomCard(rarity: number, ownerId: string) {
  const elements = ['火', '水', '木', '金', '土', '风', '雷', '光', '暗'];
  const element = elements[Math.floor(Math.random() * elements.length)];
  
  return {
    id: uuidv4(),
    owner_id: ownerId,
    name: `神秘卡牌 ${rarity}星`,
    elements: JSON.stringify([element]),
    rarity,
    power: rarity * 100,
    hp: rarity * 50,
    attack: rarity * 20,
    skill_name: '基础攻击',
    skill_effect: '造成伤害',
    skill_cooldown: 1,
    discovery_time: Date.now(),
    market_status: 'locked',
    global_rank: null
  };
}

router.get('/info', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const freeDrawAvailable = (now - user.free_gacha_time) >= oneDay;

  res.json({
    freeDrawAvailable,
    pity: {
      fourStar: user.gacha_pity_4star,
      fiveStar: user.gacha_pity_5star
    }
  });
});

router.post('/draw', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { type, count } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let newGems = user.gems;
  let newFreeTime = user.free_gacha_time;
  let pity4 = user.gacha_pity_4star;
  let pity5 = user.gacha_pity_5star;

  // Validation
  if (type === 'free') {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - newFreeTime < oneDay) {
      return res.status(400).json({ error: 'Free draw not available yet' });
    }
    newFreeTime = now;
  } else if (type === 'gem') {
    const cost = 200 * count;
    if (newGems < cost) {
      return res.status(400).json({ error: 'Not enough gems' });
    }
    newGems -= cost;
  } else {
    return res.status(400).json({ error: 'Invalid draw type' });
  }

  const drawnCards = [];
  const insertCard = db.prepare(`
    INSERT INTO cards (id, owner_id, name, elements, rarity, power, hp, attack, skill_name, skill_effect, skill_cooldown, discovery_time, market_status, global_rank)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    for (let i = 0; i < count; i++) {
      let rarity = 1;
      const rand = Math.random();

      if (type === 'gem') {
        pity4++;
        pity5++;

        if (pity5 >= 50 || rand < 0.02) {
          rarity = 5;
          pity5 = 0;
          pity4 = 0;
        } else if (pity4 >= 10 || rand < 0.10) {
          rarity = 4;
          pity4 = 0;
        } else if (rand < 0.30) {
          rarity = 3;
        } else if (rand < 0.60) {
          rarity = 2;
        } else {
          rarity = 1;
        }
      } else {
        // Free pool
        if (rand < 0.09) rarity = 3;
        else if (rand < 0.39) rarity = 2;
        else rarity = 1;
      }

      const card = generateRandomCard(rarity, userId);
      insertCard.run(
        card.id, card.owner_id, card.name, card.elements, card.rarity, card.power, card.hp, card.attack,
        card.skill_name, card.skill_effect, card.skill_cooldown, card.discovery_time, card.market_status, card.global_rank
      );
      
      drawnCards.push({
        id: card.id,
        name: card.name,
        elements: JSON.parse(card.elements),
        rarity: card.rarity,
        power: card.power,
        hp: card.hp,
        attack: card.attack,
        skill: { name: card.skill_name, effect: card.skill_effect, cooldown: card.skill_cooldown },
        discoveryTime: card.discovery_time,
        marketStatus: card.market_status
      });
    }

    // Update user
    db.prepare(`
      UPDATE users 
      SET gems = ?, free_gacha_time = ?, gacha_pity_4star = ?, gacha_pity_5star = ?
      WHERE id = ?
    `).run(newGems, newFreeTime, pity4, pity5, userId);
  });

  try {
    transaction();
    res.json({
      cards: drawnCards,
      remainingGems: newGems,
      pity: { fourStar: pity4, fiveStar: pity5 },
      freeDrawAvailable: false // Since we just drew, or if gem draw, we don't care
    });
  } catch (error) {
    console.error('Gacha error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
