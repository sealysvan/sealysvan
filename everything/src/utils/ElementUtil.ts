import { ElementType } from '../store/useGameStore';

export function calculateDamage(
  attacker: { elements?: ElementType[], element?: string, attack: number }, 
  defender: { elements?: ElementType[], element?: string }
): number {
  const weaknessMap: Record<string, string[]> = {
    '金': ['木'], 
    '木': ['土'], 
    '水': ['火'], 
    '火': ['金'], 
    '土': ['水'],
    '风': ['雷'], 
    '雷': ['雨'], 
    '雨': ['风'],
    '电': ['水'], // Example addition
    '光明': ['黑暗'], 
    '黑暗': ['光明']
  };
  
  let multiplier = 1.0;
  
  const attackerElement = attacker.elements?.[0] || attacker.element || '未知';
  const defenderElement = defender.elements?.[0] || defender.element || '未知';
  
  if (weaknessMap[attackerElement]?.includes(defenderElement)) {
    multiplier = 1.5;
  } else if (weaknessMap[defenderElement]?.includes(attackerElement)) {
    multiplier = 0.7;
  }
  
  return Math.floor(attacker.attack * multiplier);
}
