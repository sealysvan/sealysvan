import express from 'express';
import db from '../db';

const router = express.Router();

export const GALAXIES = [
  { id: 'solar', name: '太阳系', index: 0, planets: ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'], unlocked: true },
  { id: 'alpha_centauri', name: '半人马座α星系', index: 1, planets: ['proxima_b','proxima_c'], unlocked: false, condition: '完成太阳系所有行星修复' },
];

const PLANET_CONFIG = [
  { id: 'mercury', name: '水星', stageCount: 15, description: '离太阳最近的行星，表面布满陨石坑。', requiredLevel: 1 },
  { id: 'venus', name: '金星', stageCount: 30, description: '被浓厚云层覆盖的炽热行星。', requiredLevel: 5 },
  { id: 'earth', name: '地球', stageCount: 45, description: '我们的家园，充满生机的蓝色星球。', requiredLevel: 10 },
  { id: 'mars', name: '火星', stageCount: 60, description: '红色的沙漠行星，曾经可能有水存在。', requiredLevel: 15 },
  { id: 'jupiter', name: '木星', stageCount: 80, description: '太阳系最大的气态巨行星，拥有大红斑。', requiredLevel: 20 },
  { id: 'saturn', name: '土星', stageCount: 100, description: '拥有美丽光环的气态行星。', requiredLevel: 25 },
  { id: 'uranus', name: '天王星', stageCount: 100, description: '躺着自转的冰巨行星。', requiredLevel: 30 },
  { id: 'neptune', name: '海王星', stageCount: 100, description: '太阳系最边缘的蓝色冰巨行星。', requiredLevel: 35 },
  { id: 'proxima_b', name: '比邻星b', stageCount: 15, description: '位于宜居带的系外行星。', requiredLevel: 40 },
  { id: 'proxima_c', name: '比邻星c', stageCount: 30, description: '寒冷的超级地球。', requiredLevel: 45 },
];

function generateStages(planetId: string, count: number, planetName: string) {
  const stages = [];
  const totalWeight = (count * (count + 1)) / 2;
  for (let i = 1; i <= count; i++) {
    const isSmallBoss = i % 5 === 0 && i % 10 !== 0;
    const isBigBoss = i % 10 === 0;
    
    const baseGold = 50 + (i - 1) * 20;
    const goldReward = baseGold + i * 10 + 10; // Use average of random(0,20) for static config
    
    let gemsReward = 0;
    if (isBigBoss) gemsReward = 50;
    else if (isSmallBoss) gemsReward = 10;
    
    const repairValue = (i / totalWeight) * 100;

    stages.push({
      id: `${planetId}_${i}`,
      name: `${planetName} 第${i}关${isBigBoss ? '(大首领)' : isSmallBoss ? '(首领)' : ''}`,
      staminaCost: 5,
      recommendedPower: i * 150,
      repairValue: repairValue,
      rewards: { exp: i * 10, gold: goldReward, gems: gemsReward }
    });
  }
  return stages;
}

const STAGES: Record<string, any[]> = {};
PLANET_CONFIG.forEach(p => {
  STAGES[p.id] = generateStages(p.id, p.stageCount, p.name);
});

router.get('/galaxies', (req, res) => {
  res.json(GALAXIES);
});

router.get('/galaxies/:id/planets', (req, res) => {
  const { id } = req.params;
  const galaxy = GALAXIES.find(g => g.id === id);
  if (!galaxy) return res.status(404).json({ error: 'Galaxy not found' });
  
  const planets = PLANET_CONFIG.filter(p => galaxy.planets.includes(p.id));
  res.json(planets);
});

router.get('/planets', (req, res) => {
  res.json(PLANET_CONFIG);
});

router.get('/planets/:id/stages', (req, res) => {
  const { id } = req.params;
  const stages = STAGES[id];
  if (!stages) return res.status(404).json({ error: 'Planet not found' });
  res.json(stages);
});

router.post('/battle', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { stageId, planetId, deckIds } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const stages = STAGES[planetId];
  if (!stages) return res.status(404).json({ error: 'Planet not found' });

  const stage = stages.find(s => s.id === stageId);
  if (!stage) return res.status(404).json({ error: 'Stage not found' });

  if (user.stamina < stage.staminaCost) {
    return res.status(400).json({ error: '体力不足' });
  }

  let deckPower = 0;
  if (deckIds && deckIds.length > 0) {
    const placeholders = deckIds.map(() => '?').join(',');
    const cards = db.prepare(`SELECT * FROM cards WHERE id IN (${placeholders}) AND owner_id = ?`).all(...deckIds, userId) as any[];
    cards.forEach(card => {
      deckPower += card.power;
    });
  }

  const isWin = deckPower >= stage.recommendedPower * 0.8;

  const transaction = db.transaction(() => {
    let newStamina = user.stamina - stage.staminaCost;
    if (isWin) newStamina = Math.min(120, newStamina + 5);
    
    let newExp = user.exp;
    let newGold = user.gold;
    let newGems = user.gems;
    let planetRepair = JSON.parse(user.planet_repair || '{}');
    let explorationProgress = user.exploration_progress || 'mercury';

    if (isWin) {
      newExp += stage.rewards.exp;
      newGold += stage.rewards.gold;
      if (stage.rewards.gems) newGems += stage.rewards.gems;

      // Update planet repair
      let currentRepair = planetRepair[planetId] || 0;
      currentRepair += stage.repairValue;
      if (currentRepair >= 100) {
        currentRepair = 100;
        
        // Check for next planet unlock
        const currentPlanetIndex = PLANET_CONFIG.findIndex(p => p.id === planetId);
        if (currentPlanetIndex !== -1 && currentPlanetIndex < PLANET_CONFIG.length - 1) {
          const nextPlanetId = PLANET_CONFIG[currentPlanetIndex + 1].id;
          // Only update if we are currently at this planet
          if (explorationProgress === planetId) {
            explorationProgress = nextPlanetId;
          }
        }
      }
      planetRepair[planetId] = currentRepair;
    }

    db.prepare(`
      UPDATE users 
      SET stamina = ?, exp = ?, gold = ?, gems = ?, planet_repair = ?, exploration_progress = ?
      WHERE id = ?
    `).run(newStamina, newExp, newGold, newGems, JSON.stringify(planetRepair), explorationProgress, userId);

    return { newStamina, newExp, newGold, newGems, planetRepair, explorationProgress };
  });

  try {
    const result = transaction();
    res.json({
      win: isWin,
      rewards: isWin ? stage.rewards : null,
      player: result,
      battleLog: isWin 
        ? ['战斗开始', `我方战力: ${deckPower}`, `敌方战力: ${stage.recommendedPower}`, '经过激烈的战斗，我方取得了胜利！']
        : ['战斗开始', `我方战力: ${deckPower}`, `敌方战力: ${stage.recommendedPower}`, '我方战力不足，战斗失败...']
    });
  } catch (error) {
    console.error('Battle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
