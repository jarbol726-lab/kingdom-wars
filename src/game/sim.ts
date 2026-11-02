import {
  BRIDGE_HALF,
  BRIDGE_L,
  BRIDGE_R,
  CARDS,
  CARD_IDS,
  H,
  LAYOUT,
  MATCH_TIME,
  OVERTIME_TIME,
  RIVER_BOT,
  RIVER_TOP,
  TOWERS,
  W,
  mul,
  type CardId,
  type Team,
} from "./data";

export interface Tower {
  id: number;
  team: Team;
  role: "king" | "princess";
  lane: "l" | "c" | "r";
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
  range: number;
  hitEvery: number;
  cooldown: number;
  radius: number;
  alive: boolean;
  flash: number;
}

export interface Unit {
  id: number;
  team: Team;
  card: CardId;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  range: number;
  hitEvery: number;
  cooldown: number;
  radius: number;
  aggro: number;
  splash: number;
  buildings: boolean;
  scale: number;
  alive: boolean;
  flash: number;
  deathT: number;
  phase: number;
  facing: number;
  moving: boolean;
  windup: number;
  attackDur: number;
  target: Target | null;
  lane: "l" | "r";
  born: number;
}

export interface Target {
  kind: "unit" | "tower";
  id: number;
}

export interface Shot {
  id: number;
  team: Team;
  kind: "arrow" | "magic" | "bolt" | "fireball";
  x: number;
  y: number;
  x0: number;
  y0: number;
  tx: number;
  ty: number;
  t: number;
  dur: number;
  speed: number;
  damage: number;
  splash: number;
  alive: boolean;
  homing: Target | null;
  ang: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  grav: number;
}

export interface Floater {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

export interface Burst {
  x: number;
  y: number;
  life: number;
  max: number;
  kind: "spark" | "boom";
}

export interface GameEvent {
  kind: "deploy" | "hit" | "spell" | "tower" | "crown" | "win" | "lose" | "draw";
}

export interface Match {
  arenaId: string;
  clock: number;
  timeLeft: number;
  overtime: boolean;
  doubleAnnounced: boolean;
  elixir: [number, number];
  decks: [CardId[], CardId[]];
  towers: Tower[];
  units: Unit[];
  shots: Shot[];
  particles: Particle[];
  floaters: Floater[];
  bursts: Burst[];
  events: GameEvent[];
  nextId: number;
  hitstop: number;
  trauma: number;
  banner: number;
  toast: string;
  toastT: number;
  finished: boolean;
  result: "win" | "loss" | "draw" | null;
  surrendered: boolean;
  reward: number;
  aiLevel: number;
  aiThink: number;
}

export interface HudSnap {
  elixir: number;
  timeLeft: number;
  overtime: boolean;
  deck: CardId[];
  crownsYou: number;
  crownsThem: number;
  finished: boolean;
  result: Match["result"];
  toast: string;
  toastT: number;
  banner: number;
  aiLevel: number;
  reward: number;
  surrendered: boolean;
}

export interface PlayResult {
  ok: boolean;
  reason?: string;
}

const UNIT_CAP = 16;

function shuffle(): CardId[] {
  const deck = [...CARD_IDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = deck[i]!;
    deck[i] = deck[j]!;
    deck[j] = a;
  }
  return deck;
}

function rewardFor(result: "win" | "loss" | "draw", crowns: number, surrendered: boolean) {
  if (surrendered) return 6;
  if (result === "win") return 34 + crowns * 16;
  if (result === "draw") return 16;
  return 10;
}

export function crownCount(m: Match, team: Team) {
  return m.towers.filter((t) => t.team !== team && !t.alive).length;
}

export function snapshot(m: Match): HudSnap {
  return {
    elixir: m.elixir[0],
    timeLeft: m.timeLeft,
    overtime: m.overtime,
    deck: m.decks[0].slice(),
    crownsYou: crownCount(m, 0),
    crownsThem: crownCount(m, 1),
    finished: m.finished,
    result: m.result,
    toast: m.toast,
    toastT: m.toastT,
    banner: m.banner,
    aiLevel: m.aiLevel,
    reward: m.reward,
    surrendered: m.surrendered,
  };
}

export function formatTime(seconds: number) {
  const t = Math.max(0, Math.ceil(seconds - 1e-4));
  const min = Math.floor(t / 60);
  const sec = t % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function createMatch(opts: {
  arenaId: string;
  playerLevels: Record<CardId, number>;
  aiLevel: number;
}): Match {
  const ai = Math.max(1, opts.aiLevel);
  const avg = CARD_IDS.reduce((sum, id) => sum + (opts.playerLevels[id] ?? 1), 0) / CARD_IDS.length;
  const m: Match = {
    arenaId: opts.arenaId,
    clock: 0,
    timeLeft: MATCH_TIME,
    overtime: false,
    doubleAnnounced: false,
    elixir: [5, 5],
    decks: [shuffle(), shuffle()],
    towers: [],
    units: [],
    shots: [],
    particles: [],
    floaters: [],
    bursts: [],
    events: [],
    nextId: 1,
    hitstop: 0,
    trauma: 0,
    banner: 1.05,
    toast: "В бой!",
    toastT: 1.05,
    finished: false,
    result: null,
    surrendered: false,
    reward: 0,
    aiLevel: ai,
    aiThink: 2.4,
  };
  const add = (
    team: Team,
    role: "king" | "princess",
    lane: "l" | "c" | "r",
    pos: { x: number; y: number },
    level: number,
  ) => {
    const base = role === "king" ? TOWERS.king : TOWERS.princess;
    const k = mul(level);
    m.towers.push({
      id: m.nextId++,
      team,
      role,
      lane,
      x: pos.x,
      y: pos.y,
      hp: Math.round(base.hp * k),
      maxHp: Math.round(base.hp * k),
      damage: Math.round(base.damage * k),
      range: base.range,
      hitEvery: base.hitEvery,
      cooldown: 0.4,
      radius: base.radius,
      alive: true,
      flash: 0,
    });
  };
  add(1, "king", "c", LAYOUT.enemy.king, ai);
  add(1, "princess", "l", LAYOUT.enemy.l, ai);
  add(1, "princess", "r", LAYOUT.enemy.r, ai);
  add(0, "princess", "l", LAYOUT.player.l, avg);
  add(0, "princess", "r", LAYOUT.player.r, avg);
  add(0, "king", "c", LAYOUT.player.king, avg);
  return m;
}

function nid(m: Match) {
  return m.nextId++;
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

export function inWater(x: number, y: number) {
  if (y <= RIVER_TOP || y >= RIVER_BOT) return false;
  if (Math.abs(x - BRIDGE_L) <= BRIDGE_HALF) return false;
  if (Math.abs(x - BRIDGE_R) <= BRIDGE_HALF) return false;
  return true;
}

function inBounds(x: number, y: number) {
  return x >= 18 && x <= W - 18 && y >= 18 && y <= H - 18;
}

function ownHalf(team: Team, y: number) {
  return team === 0 ? y >= RIVER_BOT + 4 : y <= RIVER_TOP - 4;
}

function blocked(m: Match, x: number, y: number) {
  return m.towers.some((t) => dist(t.x, t.y, x, y) < t.radius + 14);
}

function pushEvent(m: Match, kind: GameEvent["kind"]) {
  m.events.push({ kind });
  if (m.events.length > 24) m.events.shift();
}

function spark(m: Match, x: number, y: number, color: string, n: number, speed = 70) {
  for (let i = 0; i < n; i++) {
    if (m.particles.length > 200) m.particles.shift();
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.35 + Math.random() * 0.75);
    const life = 0.28 + Math.random() * 0.28;
    m.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 16,
      life,
      max: life,
      color,
      size: 2 + Math.random() * 2.6,
      grav: 30,
    });
  }
}

function floater(m: Match, x: number, y: number, text: string, color: string) {
  m.floaters.push({ x, y, text, life: 0.72, color });
  if (m.floaters.length > 28) m.floaters.shift();
}

function findUnit(m: Match, id: number) {
  return m.units.find((u) => u.id === id) ?? null;
}

function findTower(m: Match, id: number) {
  return m.towers.find((t) => t.id === id) ?? null;
}

function finish(m: Match, result: "win" | "loss" | "draw") {
  if (m.finished) return;
  m.finished = true;
  m.result = result;
  m.reward = rewardFor(result, crownCount(m, 0), m.surrendered);
  m.toast = result === "win" ? "Победа!" : result === "loss" ? "Поражение" : "Ничья";
  m.toastT = 2.2;
  m.trauma = Math.min(1, m.trauma + 0.55);
  pushEvent(m, result === "win" ? "win" : result === "loss" ? "lose" : "draw");
}

export function surrender(m: Match) {
  if (m.finished) return;
  m.surrendered = true;
  finish(m, "loss");
}

function hurtUnit(m: Match, u: Unit, amount: number) {
  if (!u.alive) return;
  const dmg = Math.max(1, Math.round(amount));
  u.hp -= dmg;
  u.flash = 0.1;
  floater(m, u.x, u.y - 40 * u.scale, String(dmg), u.team === 0 ? "#ffd0d4" : "#fff1b0");
  spark(m, u.x, u.y - 18, u.team === 0 ? "#ffd0d4" : "#ffe08a", 5, 80);
  pushEvent(m, "hit");
  if (u.hp <= 0) {
    u.hp = 0;
    u.alive = false;
    u.deathT = 0.42;
    spark(m, u.x, u.y - 10, "#f6edd9", 12, 110);
    m.trauma = Math.min(1, m.trauma + 0.16);
  }
}

function hurtTower(m: Match, t: Tower, amount: number) {
  if (!t.alive) return;
  const dmg = Math.max(1, Math.round(amount));
  t.hp -= dmg;
  t.flash = 0.12;
  floater(m, t.x, t.y - (t.role === "king" ? 96 : 72), String(dmg), "#ffe08a");
  spark(m, t.x, t.y - 30, "#f0b429", 7, 90);
  pushEvent(m, "tower");
  m.trauma = Math.min(1, m.trauma + (t.role === "king" ? 0.34 : 0.2));
  if (m.hitstop <= 0) m.hitstop = t.role === "king" ? 0.055 : 0.03;
  if (t.hp <= 0) {
    t.hp = 0;
    t.alive = false;
    spark(m, t.x, t.y - 20, "#d7c4a2", 18, 130);
    m.bursts.push({ x: t.x, y: t.y - 24, life: 0.45, max: 0.45, kind: "boom" });
    pushEvent(m, "crown");
    if (t.role === "king" || m.overtime) finish(m, t.team === 0 ? "loss" : "win");
  }
}

export function princessesAlive(m: Match, team: Team) {
  return m.towers.filter((t) => t.team === team && t.role === "princess" && t.alive).length;
}

function towerRange(m: Match, t: Tower) {
  if (t.role !== "king") return t.range;
  const n = princessesAlive(m, t.team);
  if (n === 0) return t.range + 96;
  if (n === 1) return t.range + 50;
  return t.range;
}

function towerDamage(m: Match, t: Tower) {
  if (t.role === "king" && princessesAlive(m, t.team) === 0) return t.damage * 1.16;
  return t.damage;
}

function towerInterval(m: Match, t: Tower) {
  if (t.role === "king" && princessesAlive(m, t.team) === 0) return t.hitEvery * 0.82;
  return t.hitEvery;
}

function spawnShot(
  m: Match,
  team: Team,
  kind: Shot["kind"],
  x: number,
  y: number,
  tx: number,
  ty: number,
  damage: number,
  splash: number,
  homing: Target | null,
  speed = 340,
) {
  m.shots.push({
    id: nid(m),
    team,
    kind,
    x,
    y,
    x0: x,
    y0: y,
    tx,
    ty,
    t: 0,
    dur: 0.62,
    speed,
    damage,
    splash,
    alive: true,
    homing,
    ang: Math.atan2(ty - y, tx - x),
  });
  if (m.shots.length > 48) {
    const dead = m.shots.findIndex((s) => !s.alive);
    if (dead >= 0) m.shots.splice(dead, 1);
  }
}

function resolveTarget(m: Match, target: Target | null) {
  if (!target) return null;
  if (target.kind === "unit") {
    const u = findUnit(m, target.id);
    return u && u.alive ? { x: u.x, y: u.y - 8, unit: u, tower: null as Tower | null } : null;
  }
  const t = findTower(m, target.id);
  return t && t.alive ? { x: t.x, y: t.y - 16, unit: null, tower: t } : null;
}

function explode(m: Match, shot: Shot) {
  shot.alive = false;
  if (shot.splash > 0) {
    for (const u of m.units) {
      if (!u.alive || u.team === shot.team) continue;
      const d = dist(shot.tx, shot.ty, u.x, u.y);
      const rad = shot.splash + u.radius * 0.2;
      if (d <= rad) hurtUnit(m, u, shot.damage * (1 - (d / rad) * 0.35));
    }
    for (const t of m.towers) {
      if (!t.alive || t.team === shot.team) continue;
      const d = dist(shot.tx, shot.ty, t.x, t.y);
      const rad = shot.splash + t.radius * 0.15;
      if (d <= rad) hurtTower(m, t, shot.damage * (1 - (d / rad) * 0.25));
    }
    m.bursts.push({
      x: shot.tx,
      y: shot.ty,
      life: shot.kind === "fireball" ? 0.42 : 0.28,
      max: shot.kind === "fireball" ? 0.42 : 0.28,
      kind: shot.kind === "fireball" ? "boom" : "spark",
    });
    spark(m, shot.tx, shot.ty, shot.kind === "magic" ? "#d28bff" : "#ffb15a", shot.kind === "fireball" ? 16 : 8, 120);
    if (shot.kind === "fireball") {
      m.trauma = Math.min(1, m.trauma + 0.5);
      if (m.hitstop <= 0) m.hitstop = 0.05;
      pushEvent(m, "spell");
    }
    return;
  }
  const tgt = resolveTarget(m, shot.homing);
  if (!tgt) return;
  if (dist(shot.x, shot.y, tgt.x, tgt.y) > 48) return;
  if (tgt.unit) hurtUnit(m, tgt.unit, shot.damage);
  if (tgt.tower) hurtTower(m, tgt.tower, shot.damage);
}

function strike(m: Match, u: Unit) {
  const tgt = resolveTarget(m, u.target);
  if (!tgt) return;
  if (u.range > 50) {
    spawnShot(
      m,
      u.team,
      u.card === "mage" ? "magic" : "arrow",
      u.x + u.facing * 8,
      u.y - 28 * u.scale,
      tgt.x,
      tgt.y,
      u.damage,
      u.splash,
      u.target,
      u.card === "mage" ? 280 : 360,
    );
    return;
  }
  if (tgt.unit) {
    hurtUnit(m, tgt.unit, u.damage);
    const d = Math.max(1, dist(u.x, u.y, tgt.unit.x, tgt.unit.y));
    tgt.unit.x += ((tgt.unit.x - u.x) / d) * 5;
    tgt.unit.y += ((tgt.unit.y - u.y) / d) * 5;
  }
  if (tgt.tower) hurtTower(m, tgt.tower, u.damage);
  if (u.splash > 0 && tgt.unit) {
    for (const other of m.units) {
      if (!other.alive || other.team === u.team || other.id === tgt.unit.id) continue;
      if (dist(tgt.x, tgt.y, other.x, other.y) <= u.splash) hurtUnit(m, other, u.damage * 0.7);
    }
  }
}

function pickBuilding(u: Unit, towers: Tower[]) {
  const foes = towers.filter((t) => t.alive && t.team !== u.team);
  if (!foes.length) return null;
  let nearest = foes[0]!;
  let nd = dist(u.x, u.y, nearest.x, nearest.y);
  for (const t of foes) {
    const d = dist(u.x, u.y, t.x, t.y);
    if (d < nd) {
      nearest = t;
      nd = d;
    }
  }
  if (nd < 110) return nearest;
  const laneX = u.lane === "l" ? BRIDGE_L : BRIDGE_R;
  const princesses = foes.filter((t) => t.role === "princess");
  if (princesses.length) {
    princesses.sort((a, b) => Math.abs(a.x - laneX) - Math.abs(b.x - laneX));
    return princesses[0]!;
  }
  return foes.find((t) => t.role === "king") ?? nearest;
}

function bridgePoint(u: Unit, building: Tower) {
  const bx = u.lane === "l" ? BRIDGE_L : BRIDGE_R;
  const north = u.team === 0;
  const crossed = north ? u.y <= RIVER_TOP - 2 : u.y >= RIVER_BOT + 2;
  if (crossed) return { x: building.x, y: building.y };
  if (Math.abs(u.x - bx) > 14) return { x: bx, y: north ? RIVER_BOT + 22 : RIVER_TOP - 22 };
  return { x: bx, y: north ? RIVER_TOP - 20 : RIVER_BOT + 20 };
}

function steer(u: Unit, tx: number, ty: number, dt: number, engage: boolean) {
  const dx = tx - u.x;
  const dy = ty - u.y;
  const len = Math.hypot(dx, dy) || 1;
  if (engage) {
    u.moving = false;
    if (Math.abs(dx) > 3) u.facing = dx < 0 ? -1 : 1;
    return;
  }
  const step = Math.min(len, u.speed * dt);
  let nx = u.x + (dx / len) * step;
  let ny = u.y + (dy / len) * step;
  if (inWater(nx, ny)) {
    const bx = Math.abs(u.x - BRIDGE_L) < Math.abs(u.x - BRIDGE_R) ? BRIDGE_L : BRIDGE_R;
    nx = u.x + Math.sign(bx - u.x) * Math.min(Math.abs(bx - u.x), u.speed * dt);
    ny = u.y;
  }
  u.x = Math.max(16, Math.min(W - 16, nx));
  u.y = Math.max(16, Math.min(H - 16, ny));
  u.moving = true;
  if (Math.abs(dx) > 4) u.facing = dx < 0 ? -1 : 1;
}

function separate(m: Match) {
  const list = m.units.filter((u) => u.alive);
  for (let n = 0; n < 2; n++) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!;
        const b = list[j]!;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d = Math.hypot(dx, dy);
        const min = (a.radius + b.radius) * 0.92;
        if (d < 0.01) {
          a.x += 1;
          d = 1;
          dx = 1;
          dy = 0;
        }
        if (d < min) {
          const push = (min - d) / 2;
          a.x += (dx / d) * push;
          a.y += (dy / d) * push;
          b.x -= (dx / d) * push;
          b.y -= (dy / d) * push;
        }
      }
    }
  }
  for (const u of list) {
    if (inWater(u.x, u.y)) {
      const bx = Math.abs(u.x - BRIDGE_L) < Math.abs(u.x - BRIDGE_R) ? BRIDGE_L : BRIDGE_R;
      u.x += Math.sign(bx - u.x) * Math.min(Math.abs(bx - u.x), 8);
    }
    for (const t of m.towers) {
      const d = dist(u.x, u.y, t.x, t.y);
      const min = t.radius * 0.72;
      if (d < min && d > 0.01) {
        u.x = t.x + ((u.x - t.x) / d) * min;
        u.y = t.y + ((u.y - t.y) / d) * min;
      }
    }
    u.x = Math.max(16, Math.min(W - 16, u.x));
    u.y = Math.max(16, Math.min(H - 16, u.y));
  }
}

function updateUnit(m: Match, u: Unit, dt: number) {
  if (!u.alive) return;
  u.phase += dt * (u.moving ? 1.6 + u.speed / 70 : 0.9);
  let prey: Unit | null = null;
  if (!u.buildings) {
    let best = u.aggro;
    for (const f of m.units) {
      if (!f.alive || f.team === u.team) continue;
      const d = dist(u.x, u.y, f.x, f.y) - f.radius;
      if (d < best) {
        best = d;
        prey = f;
      }
    }
  }
  const building = pickBuilding(u, m.towers);
  let tx = u.x;
  let ty = u.y;
  let engage = false;
  let target: Target | null = null;
  if (prey) {
    tx = prey.x;
    ty = prey.y;
    const reach = u.range + prey.radius * 0.45;
    engage = dist(u.x, u.y, prey.x, prey.y) <= reach;
    target = { kind: "unit", id: prey.id };
  } else if (building) {
    const point = bridgePoint(u, building);
    const toBuilding = point.x === building.x && point.y === building.y;
    if (toBuilding) {
      const reach = u.range + building.radius * 0.42;
      engage = dist(u.x, u.y, building.x, building.y) <= reach;
      tx = building.x;
      ty = building.y;
      if (engage) target = { kind: "tower", id: building.id };
    } else {
      tx = point.x;
      ty = point.y;
    }
  }
  if (u.windup > 0) {
    u.windup -= dt;
    u.moving = false;
    if (target && Math.abs(tx - u.x) > 3) u.facing = tx < u.x ? -1 : 1;
    if (u.windup <= 0) {
      strike(m, u);
      u.target = null;
    }
    return;
  }
  steer(u, tx, ty, dt, engage);
  if (engage && target && u.cooldown <= 0) {
    u.target = target;
    u.attackDur = u.card === "mage" ? 0.3 : u.card === "giant" ? 0.34 : u.card === "archers" ? 0.2 : 0.16;
    u.windup = u.attackDur;
    u.cooldown = u.hitEvery;
    u.moving = false;
  }
}

function updateTower(m: Match, t: Tower, dt: number) {
  if (!t.alive) return;
  t.cooldown -= dt;
  if (t.cooldown > 0) return;
  const range = towerRange(m, t);
  let best: Unit | null = null;
  let bd = range;
  for (const u of m.units) {
    if (!u.alive || u.team === t.team) continue;
    const d = dist(t.x, t.y, u.x, u.y);
    if (d < bd) {
      bd = d;
      best = u;
    }
  }
  if (!best) return;
  t.cooldown = towerInterval(m, t);
  spawnShot(
    m,
    t.team,
    t.role === "king" ? "bolt" : "arrow",
    t.x,
    t.y - (t.role === "king" ? 70 : 52),
    best.x,
    best.y - 10,
    towerDamage(m, t),
    0,
    { kind: "unit", id: best.id },
    t.role === "king" ? 300 : 380,
  );
}

function updateShot(m: Match, shot: Shot, dt: number) {
  if (!shot.alive) return;
  if (shot.kind === "fireball") {
    shot.t += dt;
    const k = Math.min(1, shot.t / shot.dur);
    const arc = Math.sin(k * Math.PI) * 100;
    shot.x = shot.x0 + (shot.tx - shot.x0) * k;
    shot.y = shot.y0 + (shot.ty - shot.y0) * k - arc;
    shot.ang += dt * 6;
    if (k >= 1) explode(m, shot);
    return;
  }
  const live = resolveTarget(m, shot.homing);
  if (live) {
    shot.tx = live.x;
    shot.ty = live.y;
  }
  const dx = shot.tx - shot.x;
  const dy = shot.ty - shot.y;
  const d = Math.hypot(dx, dy);
  shot.ang = Math.atan2(dy, dx);
  const step = shot.speed * dt;
  if (d <= step + 8) {
    shot.x = shot.tx;
    shot.y = shot.ty;
    explode(m, shot);
    return;
  }
  shot.x += (dx / d) * step;
  shot.y += (dy / d) * step;
  shot.t += dt;
  if (shot.t > 2.6) shot.alive = false;
}

function elixirRate(m: Match) {
  if (m.overtime) return 1 / 0.9;
  if (m.timeLeft <= 60) return 1 / 1.45;
  return 1 / 2.8;
}

function tiebreak(m: Match) {
  const you = crownCount(m, 0);
  const them = crownCount(m, 1);
  if (you > them) return finish(m, "win");
  if (them > you) return finish(m, "loss");
  const hp = (team: Team) => m.towers.filter((t) => t.team === team).reduce((s, t) => s + Math.max(0, t.hp), 0);
  const a = hp(0);
  const b = hp(1);
  if (a > b + 30) return finish(m, "win");
  if (b > a + 30) return finish(m, "loss");
  finish(m, "draw");
}

function advanceClock(m: Match, dt: number) {
  m.timeLeft -= dt;
  if (!m.overtime && m.timeLeft <= 60 && !m.doubleAnnounced) {
    m.doubleAnnounced = true;
    m.toast = "Эликсир ×2";
    m.toastT = 1.35;
  }
  if (!m.overtime && m.timeLeft <= 0) {
    m.overtime = true;
    m.timeLeft = OVERTIME_TIME;
    m.toast = "Овертайм";
    m.toastT = 1.5;
    return;
  }
  if (m.overtime && m.timeLeft <= 0) tiebreak(m);
}

function aiAct(m: Match) {
  if (m.finished || m.elixir[1] < 3) return;
  const hand = m.decks[1].slice(0, 4).map((id, index) => ({ id, index, cost: CARDS[id].cost }));
  const affordable = hand.filter((c) => c.cost <= m.elixir[1] + 1e-4);
  if (!affordable.length) return;
  if (m.elixir[1] < 9 && Math.random() < 0.08) return;
  const enemies = m.units.filter((u) => u.alive && u.team === 0);
  const incoming = enemies.filter((u) => u.y < RIVER_BOT + 40);
  const fb = affordable.find((c) => c.id === "fireball");
  if (fb && enemies.length) {
    let bestN = 0;
    let bx = 0;
    let by = 0;
    let score = 0;
    for (const u of enemies) {
      let n = 0;
      let sx = 0;
      let sy = 0;
      let sc = 0;
      for (const v of enemies) {
        if (dist(u.x, u.y, v.x, v.y) <= 72) {
          n++;
          sx += v.x;
          sy += v.y;
          sc += Math.min(400, v.hp);
        }
      }
      if (n > bestN || (n === bestN && sc > score)) {
        bestN = n;
        score = sc;
        bx = sx / n;
        by = sy / n;
      }
    }
    if (bestN >= 3 || (bestN >= 2 && score > 480)) {
      playCard(m, 1, fb.index, bx, by, m.aiLevel);
      return;
    }
    const weak = m.towers.filter((t) => t.team === 0 && t.alive && t.hp < 340).sort((a, b) => a.hp - b.hp)[0];
    if (weak && incoming.length === 0) {
      playCard(m, 1, fb.index, weak.x, weak.y - 10, m.aiLevel);
      return;
    }
  }
  const troops = affordable.filter((c) => CARDS[c.id].kind === "troop");
  if (!troops.length) return;
  const laneScore = (lane: "l" | "r") =>
    incoming.filter((u) => (lane === "l" ? u.x < W / 2 : u.x >= W / 2)).reduce((s, u) => s + u.hp, 0);
  const place = (lane: "l" | "r", cardIndex: number) => {
    const baseX = lane === "l" ? BRIDGE_L : BRIDGE_R;
    for (let k = 0; k < 7; k++) {
      const x = baseX + (k === 0 ? 0 : Math.random() * 64 - 32);
      const y = 236 + Math.random() * 40;
      if (playCard(m, 1, cardIndex, x, y, m.aiLevel).ok) return true;
    }
    return false;
  };
  if (incoming.length > 0) {
    const lane: "l" | "r" = laneScore("l") >= laneScore("r") ? "l" : "r";
    const prefer =
      troops.find((c) => c.id === "mage" && incoming.length >= 3) ??
      troops.find((c) => c.id === "archers") ??
      troops.find((c) => c.id === "knight") ??
      troops.find((c) => c.id !== "giant") ??
      troops[0]!;
    if (place(lane, prefer.index)) return;
  }
  if (m.elixir[1] < 6.2 && m.clock < 12) return;
  if (m.elixir[1] < 5 && Math.random() < 0.45) return;
  const princesses = m.towers.filter((t) => t.team === 0 && t.role === "princess" && t.alive);
  princesses.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
  const weakLane: "l" | "r" = princesses[0]?.lane === "r" ? "r" : "l";
  const ourPush = m.units.find((u) => u.alive && u.team === 1 && u.y > RIVER_TOP);
  const pushLane: "l" | "r" = ourPush ? (ourPush.x < W / 2 ? "l" : "r") : weakLane;
  const attack =
    troops.find((c) => c.id === "giant") ??
    troops.find((c) => c.id === "knight") ??
    troops.find((c) => c.id === "archers") ??
    troops[0]!;
  place(pushLane, attack.index);
}

function spawnTroop(m: Match, team: Team, card: CardId, level: number, x: number, y: number) {
  const def = CARDS[card];
  const k = mul(level);
  const lane: "l" | "r" = Math.abs(x - BRIDGE_L) <= Math.abs(x - BRIDGE_R) ? "l" : "r";
  const offsets = def.count <= 1 ? [0] : [-15, 15];
  for (let i = 0; i < def.count; i++) {
    m.units.push({
      id: nid(m),
      team,
      card,
      x: Math.max(20, Math.min(W - 20, x + (offsets[i] ?? 0))),
      y: Math.max(20, Math.min(H - 20, y + (i === 1 ? 8 : 0))),
      hp: Math.round(def.hp * k),
      maxHp: Math.round(def.hp * k),
      damage: Math.round(def.damage * k),
      speed: def.speed,
      range: def.range,
      hitEvery: def.hitEvery,
      cooldown: 0.22,
      radius: def.radius,
      aggro: def.aggro,
      splash: def.splash,
      buildings: def.buildings,
      scale: def.scale,
      alive: true,
      flash: 0,
      deathT: 0,
      phase: Math.random(),
      facing: team === 0 ? 1 : -1,
      moving: true,
      windup: 0,
      attackDur: 0.2,
      target: null,
      lane,
      born: 0.18,
    });
  }
  spark(m, x, y, team === 0 ? "#b9d0ff" : "#ffc1c6", 8, 60);
}

export function playCard(m: Match, team: Team, handIndex: number, x: number, y: number, level = 1): PlayResult {
  if (m.finished) return { ok: false, reason: "Бой уже закончен" };
  const deck = m.decks[team];
  const id = deck[handIndex];
  if (!id || handIndex < 0 || handIndex > 3) return { ok: false, reason: "Нет такой карты" };
  const card = CARDS[id];
  if (m.elixir[team] + 1e-4 < card.cost) return { ok: false, reason: "Не хватает эликсира" };
  if (card.kind === "spell") {
    if (!inBounds(x, y)) return { ok: false, reason: "Мимо арены" };
  } else {
    if (m.units.filter((u) => u.alive && u.team === team).length >= UNIT_CAP) {
      return { ok: false, reason: "Слишком много бойцов" };
    }
    if (!inBounds(x, y) || !ownHalf(team, y)) {
      return { ok: false, reason: team === 0 ? "Только своя половина, ниже реки" : "Своя половина" };
    }
    if (inWater(x, y) || blocked(m, x, y)) return { ok: false, reason: "Сюда нельзя поставить" };
  }
  m.elixir[team] = Math.max(0, m.elixir[team] - card.cost);
  const [used] = deck.splice(handIndex, 1);
  if (used) deck.push(used);
  if (card.kind === "spell") {
    const king = m.towers.find((t) => t.team === team && t.role === "king");
    const x0 = king?.x ?? x;
    const y0 = (king?.y ?? (team === 0 ? H : 0)) - 40;
    spawnShot(m, team, "fireball", x0, y0, x, y, Math.round(card.damage * mul(level)), card.splash, null, 0);
    pushEvent(m, "spell");
  } else {
    spawnTroop(m, team, id, level, x, y);
    pushEvent(m, "deploy");
  }
  return { ok: true };
}

export function canPlace(m: Match, team: Team, card: CardId, x: number, y: number) {
  const def = CARDS[card];
  if (def.kind === "spell") return inBounds(x, y);
  return inBounds(x, y) && ownHalf(team, y) && !inWater(x, y) && !blocked(m, x, y);
}

function updateVfx(m: Match, dt: number) {
  for (const p of m.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.grav * dt;
  }
  m.particles = m.particles.filter((p) => p.life > 0);
  for (const f of m.floaters) {
    f.life -= dt;
    f.y -= 26 * dt;
  }
  m.floaters = m.floaters.filter((f) => f.life > 0);
  for (const b of m.bursts) b.life -= dt;
  m.bursts = m.bursts.filter((b) => b.life > 0);
  for (const u of m.units) {
    u.flash = Math.max(0, u.flash - dt);
    u.born = Math.max(0, u.born - dt);
    if (!u.alive) u.deathT -= dt;
    else u.cooldown = Math.max(0, u.cooldown - dt);
  }
  m.units = m.units.filter((u) => u.alive || u.deathT > 0);
  for (const t of m.towers) t.flash = Math.max(0, t.flash - dt);
  if (m.toastT > 0) m.toastT -= dt;
  if (m.banner > 0) m.banner -= dt;
  m.trauma = Math.max(0, m.trauma - dt * 1.55);
}

export function step(m: Match, dt: number) {
  const d = Math.min(0.05, Math.max(0, dt));
  if (d <= 0) return;
  m.clock += d;
  updateVfx(m, d);
  if (m.hitstop > 0) {
    m.hitstop = Math.max(0, m.hitstop - d);
    return;
  }
  if (m.finished) return;
  const rate = elixirRate(m);
  m.elixir[0] = Math.min(10, m.elixir[0] + rate * d);
  m.elixir[1] = Math.min(10, m.elixir[1] + rate * d);
  for (const u of [...m.units]) updateUnit(m, u, d);
  separate(m);
  for (const t of m.towers) updateTower(m, t, d);
  for (const s of [...m.shots]) updateShot(m, s, d);
  m.shots = m.shots.filter((s) => s.alive);
  advanceClock(m, d);
  if (!m.finished) {
    m.aiThink -= d;
    if (m.aiThink <= 0) {
      m.aiThink = 0.5 + Math.random() * 0.35;
      aiAct(m);
    }
  }
}
