import { ARENAS, CARD_IDS, type CardId, MAX_LEVEL, upgradeCost } from "./data";

export interface Profile {
  version: 1;
  coins: number;
  wins: number;
  losses: number;
  draws: number;
  levels: Record<CardId, number>;
  arenaId: string;
  sound: boolean;
  shake: boolean;
}

const KEY = "kingdom-wars-v1";

function fresh(): Profile {
  const levels = {} as Record<CardId, number>;
  for (const id of CARD_IDS) levels[id] = 1;
  let shake = true;
  if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    shake = false;
  }
  return {
    version: 1,
    coins: 90,
    wins: 0,
    losses: 0,
    draws: 0,
    levels,
    arenaId: "meadow",
    sound: true,
    shake,
  };
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as Partial<Profile>;
    const base = fresh();
    const levels = { ...base.levels };
    if (parsed.levels) {
      for (const id of CARD_IDS) {
        const n = parsed.levels[id];
        if (typeof n === "number" && n >= 1) levels[id] = Math.min(MAX_LEVEL, Math.floor(n));
      }
    }
    const arenaId = ARENAS.some((a) => a.id === parsed.arenaId) ? parsed.arenaId! : "meadow";
    return {
      version: 1,
      coins: typeof parsed.coins === "number" ? Math.max(0, Math.floor(parsed.coins)) : base.coins,
      wins: typeof parsed.wins === "number" ? Math.max(0, Math.floor(parsed.wins)) : 0,
      losses: typeof parsed.losses === "number" ? Math.max(0, Math.floor(parsed.losses)) : 0,
      draws: typeof parsed.draws === "number" ? Math.max(0, Math.floor(parsed.draws)) : 0,
      levels,
      arenaId,
      sound: parsed.sound !== false,
      shake: typeof parsed.shake === "boolean" ? parsed.shake : base.shake,
    };
  } catch {
    return fresh();
  }
}

export function saveProfile(profile: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* private mode / quota — the match still plays */
  }
}

export function upgradeCard(profile: Profile, id: CardId): Profile | null {
  const level = profile.levels[id];
  if (level >= MAX_LEVEL) return null;
  const cost = upgradeCost(level);
  if (profile.coins < cost) return null;
  return {
    ...profile,
    coins: profile.coins - cost,
    levels: { ...profile.levels, [id]: level + 1 },
  };
}

export function applyResult(
  profile: Profile,
  result: "win" | "loss" | "draw",
  reward: number,
): Profile {
  return {
    ...profile,
    coins: profile.coins + reward,
    wins: profile.wins + (result === "win" ? 1 : 0),
    losses: profile.losses + (result === "loss" ? 1 : 0),
    draws: profile.draws + (result === "draw" ? 1 : 0),
  };
}
