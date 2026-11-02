export const W = 360;
export const H = 640;
export const RIVER_TOP = 300;
export const RIVER_BOT = 352;
export const BRIDGE_L = 92;
export const BRIDGE_R = 268;
export const BRIDGE_HALF = 28;
export const MATCH_TIME = 150;
export const OVERTIME_TIME = 45;
export const MAX_LEVEL = 5;

export const CARD_IDS = ["knight", "archers", "giant", "mage", "fireball"] as const;
export type CardId = (typeof CARD_IDS)[number];
export type Team = 0 | 1;

export interface CardDef {
  id: CardId;
  name: string;
  blurb: string;
  cost: number;
  kind: "troop" | "spell";
  count: number;
  hp: number;
  damage: number;
  speed: number;
  range: number;
  hitEvery: number;
  radius: number;
  aggro: number;
  splash: number;
  buildings: boolean;
  scale: number;
}

export const CARDS: Record<CardId, CardDef> = {
  knight: {
    id: "knight",
    name: "Мечник",
    blurb: "Быстрый боец ближнего боя. Дёшево закрывает мост.",
    cost: 3,
    kind: "troop",
    count: 1,
    hp: 760,
    damage: 88,
    speed: 80,
    range: 26,
    hitEvery: 0.95,
    radius: 13,
    aggro: 112,
    splash: 0,
    buildings: false,
    scale: 1,
  },
  archers: {
    id: "archers",
    name: "Лучники",
    blurb: "Пара стрелков. Ставьте за гигантом — башни бьют дальше, чем они.",
    cost: 3,
    kind: "troop",
    count: 2,
    hp: 280,
    damage: 47,
    speed: 74,
    range: 116,
    hitEvery: 0.88,
    radius: 11,
    aggro: 148,
    splash: 0,
    buildings: false,
    scale: 0.94,
  },
  giant: {
    id: "giant",
    name: "Гигант",
    blurb: "Медленный таран. Идёт в башни и почти не отвлекается на бойцов.",
    cost: 5,
    kind: "troop",
    count: 1,
    hp: 2500,
    damage: 128,
    speed: 40,
    range: 24,
    hitEvery: 1.32,
    radius: 18,
    aggro: 0,
    splash: 0,
    buildings: true,
    scale: 1.5,
  },
  mage: {
    id: "mage",
    name: "Маг",
    blurb: "Волна по области. Сносит лучников и кучки на мосту.",
    cost: 4,
    kind: "troop",
    count: 1,
    hp: 450,
    damage: 102,
    speed: 60,
    range: 108,
    hitEvery: 1.22,
    radius: 12,
    aggro: 136,
    splash: 48,
    buildings: false,
    scale: 1.06,
  },
  fireball: {
    id: "fireball",
    name: "Огненный шар",
    blurb: "Заклинание в любую точку. Ранит отряд и башни.",
    cost: 4,
    kind: "spell",
    count: 0,
    hp: 0,
    damage: 300,
    speed: 0,
    range: 0,
    hitEvery: 0,
    radius: 70,
    aggro: 0,
    splash: 70,
    buildings: false,
    scale: 1,
  },
};

export interface ArenaDef {
  id: string;
  name: string;
  need: number;
  skyTop: string;
  skyBot: string;
  grassA: string;
  grassB: string;
  grassC: string;
  riverA: string;
  riverB: string;
  foam: string;
  path: string;
  wall: string;
  wallDark: string;
  flower: string;
  flower2: string;
}

export const ARENAS: ArenaDef[] = [
  {
    id: "meadow",
    name: "Луговая переправа",
    need: 0,
    skyTop: "#8fd4ff",
    skyBot: "#d9f6c8",
    grassA: "#8ed36a",
    grassB: "#4fa348",
    grassC: "#3d8c3e",
    riverA: "#b8f4ff",
    riverB: "#1a9ec4",
    foam: "#e9fbff",
    path: "#e2c07a",
    wall: "#8b6848",
    wallDark: "#5c4030",
    flower: "#ff7aa2",
    flower2: "#ffe27a",
  },
  {
    id: "royal",
    name: "Королевская река",
    need: 2,
    skyTop: "#f2c56b",
    skyBot: "#b9dcff",
    grassA: "#7dcb86",
    grassB: "#2f8f5a",
    grassC: "#22724a",
    riverA: "#c5d6ff",
    riverB: "#2c55b8",
    foam: "#eef3ff",
    path: "#efd59a",
    wall: "#7a5a3c",
    wallDark: "#4a3424",
    flower: "#ffffff",
    flower2: "#f0b429",
  },
  {
    id: "ember",
    name: "Угольная цитадель",
    need: 5,
    skyTop: "#4c2a58",
    skyBot: "#c46a3a",
    grassA: "#8d9358",
    grassB: "#44502f",
    grassC: "#2e3822",
    riverA: "#ffd0a0",
    riverB: "#d24a16",
    foam: "#ffe7c2",
    path: "#6d5344",
    wall: "#3d2a2a",
    wallDark: "#241616",
    flower: "#ffb15a",
    flower2: "#ff5a3c",
  },
];

export function arenaById(id: string): ArenaDef {
  return ARENAS.find((a) => a.id === id) ?? ARENAS[0];
}

export function mul(level: number): number {
  return 1 + (Math.min(MAX_LEVEL, Math.max(1, level)) - 1) * 0.1;
}

export function upgradeCost(level: number): number {
  return 40 + (level - 1) * 35;
}

export const TOWERS = {
  princess: { hp: 1620, damage: 78, hitEvery: 0.8, range: 140, radius: 26 },
  king: { hp: 3000, damage: 86, hitEvery: 0.9, range: 124, radius: 34 },
};

export const LAYOUT = {
  enemy: {
    king: { x: 180, y: 84 },
    l: { x: 74, y: 176 },
    r: { x: 286, y: 176 },
  },
  player: {
    king: { x: 180, y: 562 },
    l: { x: 74, y: 472 },
    r: { x: 286, y: 472 },
  },
};
