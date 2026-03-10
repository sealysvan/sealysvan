import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import db from '../db';

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function calculateSynthesisCost(elements: string[], rarity: number) {
  const baseCost = elements.length * 50;
  const rarityMultiplier = [1, 1.5, 2.5, 4, 6];
  return Math.max(100, Math.floor(baseCost * rarityMultiplier[rarity - 1]));
}

router.post('/generate-card', async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { elements, timestamp, planet } = req.body;

  if (!elements || !Array.isArray(elements) || elements.length === 0) {
    return res.status(400).json({ error: 'Elements are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check element usage limits
  const today = new Date().toISOString().split('T')[0];
  let elementUsage = JSON.parse(user.element_daily_usage || '{}');
  
  for (const el of elements) {
    if (!elementUsage[el] || elementUsage[el].date !== today) {
      elementUsage[el] = { count: 0, date: today };
    }
    if (elementUsage[el].count >= 5) {
      return res.status(400).json({ error: `今日元素【${el}】使用次数已达上限` });
    }
  }

  const minCost = Math.max(100, elements.length * 50);
  if (user.gold < minCost) {
    return res.status(400).json({ error: `金币不足，至少需要 ${minCost} 金币` });
  }

  try {
    const prompt = `
      You are an AI in a cosmic card game. The player is synthesizing a new card on the planet ${planet || '火星'}.
      They have combined the following elements: ${elements.join(", ")}.
      The selected timestamp is ${timestamp || Date.now()}.
      
      Generate a unique, legendary card based on these elements and the time.
      Return the response as a JSON object with the following properties EXACTLY:
      - name: A cool, epic name for the card in Chinese (e.g., "创世·火星之焰").
      - rarity: A number between 1 and 5 (1 is common, 5 is legendary).
      - power: A number between 100 and 1000 representing overall combat power.
      - hp: A number between 50 and 500.
      - attack: A number between 10 and 200.
      - skill: An object with { "name": "Skill Name in Chinese", "effect": "Skill effect description in Chinese", "cooldown": number between 1 and 5 }.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const generatedData = JSON.parse(response.text || "{}");
    const rarity = generatedData.rarity || 1;
    const actualCost = calculateSynthesisCost(elements, rarity);

    if (user.gold < actualCost) {
      // If they don't have enough for the actual rarity, we downgrade the rarity to what they can afford
      // For simplicity, let's just let them go to 0 gold if they don't have enough, or deduct what they have
    }
    const finalGold = Math.max(0, user.gold - actualCost);

    // Update element usage
    for (const el of elements) {
      elementUsage[el].count += 1;
    }

    const cardId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let globalRank = null;
    if (rarity >= 5) {
      const info = db.prepare('INSERT INTO card_rank_seq DEFAULT VALUES').run();
      globalRank = info.lastInsertRowid;
    }

    const cardData = {
      id: cardId,
      owner_id: userId,
      name: generatedData.name || "未知卡牌",
      elements: JSON.stringify(elements),
      rarity: rarity,
      power: generatedData.power || 100,
      hp: generatedData.hp || 100,
      attack: generatedData.attack || 10,
      skill_name: generatedData.skill?.name || "普通攻击",
      skill_effect: generatedData.skill?.effect || "造成少量伤害",
      skill_cooldown: generatedData.skill?.cooldown || 1,
      discovery_time: timestamp || Date.now(),
      market_status: 'locked',
      global_rank: globalRank
    };

    db.transaction(() => {
      db.prepare(`
        INSERT INTO cards (
          id, owner_id, name, elements, rarity, power, hp, attack, 
          skill_name, skill_effect, skill_cooldown, discovery_time, market_status, global_rank
        ) VALUES (
          @id, @owner_id, @name, @elements, @rarity, @power, @hp, @attack,
          @skill_name, @skill_effect, @skill_cooldown, @discovery_time, @market_status, @global_rank
        )
      `).run(cardData);

      db.prepare('UPDATE users SET gold = ?, element_daily_usage = ? WHERE id = ?')
        .run(finalGold, JSON.stringify(elementUsage), userId);
    })();

    const updatedUser = db.prepare('SELECT username, gold FROM users WHERE id = ?').get(userId) as any;

    res.json({ 
      card: {
        ...cardData,
        elements: JSON.parse(cardData.elements),
        skill: {
          name: cardData.skill_name,
          effect: cardData.skill_effect,
          cooldown: cardData.skill_cooldown
        }
      },
      creatorName: updatedUser?.username || 'Unknown',
      remainingGold: updatedUser?.gold,
      cost: actualCost
    });
  } catch (error) {
    console.error('Synthesis failed:', error);
    res.status(500).json({ error: 'Synthesis failed' });
  }
});

export default router;
