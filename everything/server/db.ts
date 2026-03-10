import Database from 'better-sqlite3';

const db = new Database('game.db');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    gold INTEGER DEFAULT 1000,
    gems INTEGER DEFAULT 100,
    stamina INTEGER DEFAULT 120,
    last_stamina_update INTEGER DEFAULT 0,
    exp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    free_gacha_time INTEGER DEFAULT 0,
    gacha_pity_4star INTEGER DEFAULT 0,
    gacha_pity_5star INTEGER DEFAULT 0,
    tasks_progress TEXT DEFAULT '{}',
    season_points INTEGER DEFAULT 1200,
    season_tier TEXT DEFAULT 'bronze',
    ad_watch_count INTEGER DEFAULT 0,
    last_ad_date TEXT DEFAULT '',
    gem_buy_count INTEGER DEFAULT 0,
    last_gem_buy_date TEXT DEFAULT '',
    element_daily_usage TEXT DEFAULT '{}',
    planet_repair TEXT DEFAULT '{}',
    exploration_progress TEXT DEFAULT 'earth'
  );

  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    elements TEXT NOT NULL, -- JSON array
    rarity INTEGER NOT NULL,
    power INTEGER NOT NULL,
    hp INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    skill_name TEXT NOT NULL,
    skill_effect TEXT NOT NULL,
    skill_cooldown INTEGER NOT NULL,
    discovery_time INTEGER NOT NULL,
    market_status TEXT DEFAULT 'locked', -- 'locked', 'listed', 'sold'
    global_rank INTEGER, -- Unique global rank for rare cards
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  -- Create a sequence for global rank
  CREATE TABLE IF NOT EXISTS card_rank_seq (
    id INTEGER PRIMARY KEY AUTOINCREMENT
  );
`);

export default db;
