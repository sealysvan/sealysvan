import { create } from 'zustand';

export type ElementType = '金' | '木' | '水' | '火' | '土' | '风' | '雨' | '雷' | '电' | '光明' | '黑暗';

export interface Card {
  id: string;
  name: string;
  elements: ElementType[];
  rarity: number; // 1-5
  power: number;
  hp: number;
  attack: number;
  skill: {
    name: string;
    effect: string;
    cooldown: number;
  };
  discoveryTime: number;
  globalRank?: number;
  marketStatus?: 'locked' | 'tradable';
  // Fallback for old properties if needed
  description?: string;
  element?: string;
  health?: number;
}

export interface Player {
  id: string;
  name: string;
  level: number;
  exp: number;
  stamina: number;
  maxStamina: number;
  gold: number;
  gems: number;
}

interface GameState {
  player: Player;
  unlockedPlanets: string[];
  inventory: Card[];
  deck: (Card | null)[]; // 5 slots: 0,1 (front), 2,3,4 (back)
  globalNotifications: string[];
  addNotification: (msg: string) => void;
  addCardToInventory: (card: Card) => void;
  unlockPlanet: (planet: string) => void;
  updatePlayer: (updates: Partial<Player>) => void;
  setDeckSlot: (index: number, card: Card | null) => void;
  clearDeck: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  player: {
    id: '12345678',
    name: '玩家名字名字',
    level: 99,
    exp: 75,
    stamina: 120,
    maxStamina: 120,
    gold: 12345789,
    gems: 12345
  },
  unlockedPlanets: ['Earth'],
  inventory: [
    { id: 'c1', name: '初级火灵', description: '一团微弱的火光', attack: 30, hp: 100, rarity: 1, elements: ['火'], power: 130, skill: { name: '火花', effect: '造成微量伤害', cooldown: 1 }, discoveryTime: Date.now() },
    { id: 'c2', name: '水滴怪', description: '一滩有意识的水', attack: 20, hp: 150, rarity: 1, elements: ['水'], power: 170, skill: { name: '水滴', effect: '造成微量伤害', cooldown: 1 }, discoveryTime: Date.now() },
    { id: 'c3', name: '木头人', description: '坚硬的木头', attack: 40, hp: 120, rarity: 1, elements: ['木'], power: 160, skill: { name: '撞击', effect: '造成微量伤害', cooldown: 1 }, discoveryTime: Date.now() },
    { id: 'c4', name: '小金刚', description: '金属构成的怪物', attack: 50, hp: 80, rarity: 2, elements: ['金'], power: 130, skill: { name: '金属斩', effect: '造成少量伤害', cooldown: 2 }, discoveryTime: Date.now() },
    { id: 'c5', name: '泥土傀儡', description: '泥土构成的傀儡', attack: 25, hp: 200, rarity: 1, elements: ['土'], power: 225, skill: { name: '泥巴', effect: '造成微量伤害', cooldown: 1 }, discoveryTime: Date.now() },
  ],
  deck: [null, null, null, null, null],
  globalNotifications: [],
  addNotification: (msg) => set((state) => ({ 
    globalNotifications: [msg, ...state.globalNotifications].slice(0, 5) 
  })),
  addCardToInventory: (card) => set((state) => ({ 
    inventory: [...state.inventory, card] 
  })),
  unlockPlanet: (planet) => set((state) => ({ 
    unlockedPlanets: state.unlockedPlanets.includes(planet) ? state.unlockedPlanets : [...state.unlockedPlanets, planet] 
  })),
  updatePlayer: (updates) => set((state) => ({
    player: { ...state.player, ...updates }
  })),
  setDeckSlot: (index, card) => set((state) => {
    const newDeck = [...state.deck];
    newDeck[index] = card;
    return { deck: newDeck };
  }),
  clearDeck: () => set(() => ({ deck: [null, null, null, null, null] }))
}));
