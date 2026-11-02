import { arenaById, BRIDGE_HALF, BRIDGE_L, BRIDGE_R, H, RIVER_BOT, RIVER_TOP, W, type ArenaDef, type CardId, type Team } from "./data";
import {
  princessesAlive,
  type Burst,
  type Floater,
  type Match,
  type Particle,
  type Shot,
  type Tower,
  type Unit,
} from "./sim";

const INK = "#2a1a12";

interface Tone {
  main: string;
  dark: string;
  light: string;
  skin: string;
  skinDark: string;
}

function tone(team: Team): Tone {
  if (team === 0) {
    return { main: "#3c7dff", dark: "#1d4ed8", light: "#d6e4ff", skin: "#f3c39a", skinDark: "#e0a078" };
  }
  return { main: "#e23b48", dark: "#a41828", light: "#ffd0d4", skin: "#f3c39a", skinDark: "#e0a078" };
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function stroke(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.stroke();
}

function limb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  len: number,
  rot: number,
  fill: string,
  shade: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  rr(ctx, -w / 2, 0, w, len, w / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.fillStyle = shade;
  ctx.fillRect(-w / 2, len * 0.55, w, len * 0.45);
  stroke(ctx);
  ctx.restore();
}

export interface Pose {
  phase: number;
  moving: boolean;
  attack: number;
}

function legSwing(pose: Pose) {
  return Math.sin(pose.phase * Math.PI * 2) * (pose.moving ? 0.55 : 0.08);
}

export function drawActor(ctx: CanvasRenderingContext2D, card: CardId, team: Team, pose: Pose) {
  if (card === "giant") drawGiant(ctx, team, pose);
  else if (card === "archers") drawArcher(ctx, team, pose);
  else if (card === "mage") drawMage(ctx, team, pose);
  else if (card === "fireball") drawFireball(ctx, pose.phase);
  else drawKnight(ctx, team, pose);
}

function drawKnight(ctx: CanvasRenderingContext2D, team: Team, pose: Pose) {
  const c = tone(team);
  const swing = legSwing(pose);
  const atk = Math.sin(Math.min(1, pose.attack) * Math.PI);
  limb(ctx, -5, -18, 7, 16, swing, c.dark, "#152a55");
  limb(ctx, 5, -18, 7, 16, -swing, c.main, c.dark);
  rr(ctx, -10, -38, 20, 22, 7);
  ctx.fillStyle = c.main;
  ctx.fill();
  stroke(ctx);
  ctx.fillStyle = "#f0b429";
  ctx.fillRect(-10, -24, 20, 4);
  ctx.beginPath();
  ctx.arc(-12, -30, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#efe2c6";
  ctx.fill();
  stroke(ctx);
  ctx.fillStyle = c.main;
  ctx.beginPath();
  ctx.arc(-12, -30, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -46, 11, 0, Math.PI * 2);
  ctx.fillStyle = c.main;
  ctx.fill();
  stroke(ctx);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(-7, -44, 14, 3);
  ctx.beginPath();
  ctx.moveTo(2, -56);
  ctx.quadraticCurveTo(16, -58 - atk * 4, 8, -44);
  ctx.quadraticCurveTo(8, -50, 2, -50);
  ctx.fillStyle = "#f6edd9";
  ctx.fill();
  stroke(ctx);
  ctx.save();
  ctx.translate(8, -34);
  ctx.rotate(-0.5 + atk * 1.7);
  limb(ctx, 0, 0, 5, 12, 0, c.skin, c.skinDark);
  ctx.translate(0, 12);
  ctx.rotate(0.4);
  rr(ctx, -2, 0, 4, 16, 2);
  ctx.fillStyle = "#d5dde8";
  ctx.fill();
  stroke(ctx);
  ctx.restore();
  if (atk > 0.25) {
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(12, -24, 16, -0.4, 1.1);
    ctx.stroke();
  }
}

function drawArcher(ctx: CanvasRenderingContext2D, team: Team, pose: Pose) {
  const c = tone(team);
  const swing = legSwing(pose);
  const pull = Math.sin(Math.min(1, pose.attack) * Math.PI);
  ctx.beginPath();
  ctx.moveTo(-6, -20);
  ctx.quadraticCurveTo(-16, -8, -4, 0);
  ctx.quadraticCurveTo(2, -12, -2, -22);
  ctx.fillStyle = c.dark;
  ctx.fill();
  stroke(ctx);
  limb(ctx, -4, -16, 6, 15, swing, "#6b4b32", "#4a3424");
  limb(ctx, 4, -16, 6, 15, -swing, "#8b6848", "#5c4030");
  rr(ctx, -8, -36, 16, 20, 6);
  ctx.fillStyle = c.main;
  ctx.fill();
  stroke(ctx);
  ctx.beginPath();
  ctx.arc(0, -42, 9, 0, Math.PI * 2);
  ctx.fillStyle = c.skin;
  ctx.fill();
  stroke(ctx);
  ctx.fillStyle = INK;
  ctx.fillRect(-3, -44, 2, 2);
  ctx.fillRect(2, -44, 2, 2);
  ctx.beginPath();
  ctx.arc(0, -48, 10, Math.PI, Math.PI * 2);
  ctx.quadraticCurveTo(0, -34, -10, -40);
  ctx.fillStyle = c.dark;
  ctx.fill();
  stroke(ctx);
  ctx.save();
  ctx.translate(11, -30);
  ctx.rotate(-0.15);
  ctx.strokeStyle = "#6b4b32";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, 12, -1.15, 1.15);
  ctx.stroke();
  ctx.strokeStyle = "#f6edd9";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(Math.cos(-1.15) * 12, Math.sin(-1.15) * 12);
  ctx.lineTo(-4 - pull * 6, 0);
  ctx.lineTo(Math.cos(1.15) * 12, Math.sin(1.15) * 12);
  ctx.stroke();
  if (pull > 0.2) {
    ctx.strokeStyle = "#e7c98a";
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGiant(ctx: CanvasRenderingContext2D, team: Team, pose: Pose) {
  const c = tone(team);
  const swing = legSwing(pose) * 0.45;
  const smash = Math.sin(Math.min(1, pose.attack) * Math.PI);
  limb(ctx, -8, -12, 8, 14, swing, c.skinDark, "#c4846a");
  limb(ctx, 8, -12, 8, 14, -swing, c.skin, c.skinDark);
  ctx.beginPath();
  ctx.ellipse(0, -30, 16, 18, 0, 0, Math.PI * 2);
  ctx.fillStyle = c.skin;
  ctx.fill();
  stroke(ctx);
  ctx.fillStyle = c.main;
  ctx.fillRect(-14, -36, 8, 16);
  ctx.fillRect(6, -36, 8, 16);
  ctx.strokeStyle = INK;
  ctx.strokeRect(-14, -36, 8, 16);
  ctx.strokeRect(6, -36, 8, 16);
  ctx.fillStyle = "#f0b429";
  ctx.fillRect(-14, -24, 28, 4);
  ctx.beginPath();
  ctx.arc(0, -48, 12, 0, Math.PI * 2);
  ctx.fillStyle = c.skin;
  ctx.fill();
  stroke(ctx);
  ctx.fillStyle = "#6b4b32";
  ctx.beginPath();
  ctx.arc(0, -54, 8, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.fillRect(-5, -50, 3, 3);
  ctx.fillRect(2, -50, 3, 3);
  ctx.beginPath();
  ctx.arc(0, -44, 3, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.save();
  ctx.translate(14, -34);
  ctx.rotate(-1.1 + smash * 1.8);
  rr(ctx, -4, 0, 8, 26, 4);
  ctx.fillStyle = "#8b5a2b";
  ctx.fill();
  stroke(ctx);
  ctx.beginPath();
  ctx.arc(0, 26, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#6b4b32";
  ctx.fill();
  stroke(ctx);
  ctx.restore();
}

function drawMage(ctx: CanvasRenderingContext2D, team: Team, pose: Pose) {
  const c = tone(team);
  const glow = 0.45 + Math.sin(pose.phase * 4) * 0.15 + pose.attack * 0.4;
  ctx.beginPath();
  ctx.moveTo(-12, -8);
  ctx.lineTo(12, -8);
  ctx.lineTo(8, -40);
  ctx.lineTo(-8, -40);
  ctx.closePath();
  ctx.fillStyle = c.main;
  ctx.fill();
  stroke(ctx);
  ctx.fillStyle = "#f0b429";
  ctx.beginPath();
  ctx.arc(-2, -28, 2.2, 0, Math.PI * 2);
  ctx.arc(4, -22, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -46, 8, 0, Math.PI * 2);
  ctx.fillStyle = c.skin;
  ctx.fill();
  stroke(ctx);
  ctx.fillStyle = "#f6edd9";
  ctx.beginPath();
  ctx.moveTo(-6, -42);
  ctx.quadraticCurveTo(0, -32, 6, -42);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-10, -50);
  ctx.lineTo(0, -68);
  ctx.lineTo(10, -50);
  ctx.closePath();
  ctx.fillStyle = c.dark;
  ctx.fill();
  stroke(ctx);
  ctx.fillStyle = "#f0b429";
  ctx.fillRect(-8, -52, 16, 3);
  ctx.save();
  ctx.translate(12, -36);
  ctx.rotate(0.35 - pose.attack * 0.8);
  rr(ctx, -2, 0, 4, 28, 2);
  ctx.fillStyle = "#6b4b32";
  ctx.fill();
  stroke(ctx);
  ctx.translate(0, 0);
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 7);
  g.addColorStop(0, `rgba(255, 236, 170, ${glow})`);
  g.addColorStop(1, "rgba(240, 180, 41, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff1b0";
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawFireball(ctx: CanvasRenderingContext2D, spin: number) {
  ctx.save();
  ctx.rotate(spin);
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
  g.addColorStop(0, "#fff6d0");
  g.addColorStop(0.35, "#ffb15a");
  g.addColorStop(1, "rgba(226, 59, 72, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff7a3c";
  for (let i = 0; i < 5; i++) {
    ctx.rotate((Math.PI * 2) / 5);
    ctx.beginPath();
    ctx.ellipse(10, 0, 7, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, clock: number) {
  const wave = Math.sin(clock * 4 + x) * 3;
  ctx.strokeStyle = "#6b4b32";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 22);
  ctx.quadraticCurveTo(x + 10, y - 18 + wave, x + 16, y - 14);
  ctx.lineTo(x, y - 10);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.stroke();
}

export function drawTower(ctx: CanvasRenderingContext2D, t: Tower, clock: number, rage: number) {
  const c = tone(t.team);
  const king = t.role === "king";
  const h = king ? 92 : 68;
  const w = king ? 54 : 44;
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.fillStyle = "rgba(42, 26, 18, 0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 4, w * 0.55, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  if (!t.alive) {
    ctx.fillStyle = "#cbb892";
    ctx.beginPath();
    ctx.ellipse(0, -6, w * 0.46, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    stroke(ctx);
    ctx.fillStyle = "#8d7960";
    rr(ctx, -10, -22, 14, 12, 2);
    ctx.fill();
    stroke(ctx);
    rr(ctx, 2, -16, 12, 10, 2);
    ctx.fill();
    stroke(ctx);
    ctx.restore();
    return;
  }
  if (rage > 0) {
    ctx.strokeStyle = rage > 1 ? "rgba(226,59,72,0.7)" : "rgba(240,180,41,0.7)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 2, w * 0.7 + Math.sin(clock * 6) * 2, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  const body = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  body.addColorStop(0, "#d7c4a2");
  body.addColorStop(0.5, "#f3e6cc");
  body.addColorStop(1, "#c4aa84");
  rr(ctx, -w / 2, -h + 16, w, h - 12, 6);
  ctx.fillStyle = body;
  ctx.fill();
  stroke(ctx);
  const merlons = king ? 4 : 3;
  const mw = w / merlons;
  for (let i = 0; i < merlons; i++) {
    if (i % 2 === 0) {
      rr(ctx, -w / 2 + i * mw, -h + 4, mw - 2, 16, 2);
      ctx.fillStyle = "#efe2c6";
      ctx.fill();
      stroke(ctx);
    }
  }
  if (king) {
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 4, -h + 18);
    ctx.lineTo(0, -h - 18);
    ctx.lineTo(w / 2 - 4, -h + 18);
    ctx.closePath();
    ctx.fillStyle = "#f0b429";
    ctx.fill();
    stroke(ctx);
  }
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.lineTo(8, -8);
  ctx.lineTo(8, -22);
  ctx.arc(0, -22, 8, 0, Math.PI, true);
  ctx.closePath();
  ctx.fillStyle = "#5c4030";
  ctx.fill();
  ctx.fillStyle = "#7ec8ff";
  ctx.fillRect(-6, -h + 36, 8, 8);
  if (king) ctx.fillRect(6, -h + 40, 7, 7);
  ctx.strokeStyle = INK;
  ctx.strokeRect(-6, -h + 36, 8, 8);
  const ratio = t.hp / t.maxHp;
  if (ratio < 0.55) {
    ctx.strokeStyle = "rgba(42,26,18,0.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-8, -h + 40);
    ctx.lineTo(2, -h + 28);
    ctx.lineTo(-2, -20);
    ctx.stroke();
  }
  drawFlag(ctx, w / 2 - 4, -h + 20, c.main, clock);
  ctx.restore();
}

function lane(ctx: CanvasRenderingContext2D, x: number, theme: ArenaDef) {
  ctx.fillStyle = theme.path;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(x - 24, 0, 48, H);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#fff4d2";
  ctx.fillRect(x - 8, 0, 10, H);
  ctx.globalAlpha = 1;
}

function bridge(ctx: CanvasRenderingContext2D, x: number, theme: ArenaDef) {
  const top = RIVER_TOP - 8;
  const height = RIVER_BOT - RIVER_TOP + 16;
  rr(ctx, x - BRIDGE_HALF - 4, top, BRIDGE_HALF * 2 + 8, height, 8);
  ctx.fillStyle = "#8d7960";
  ctx.fill();
  stroke(ctx);
  ctx.fillStyle = "#c4a574";
  const planks = 6;
  for (let i = 0; i < planks; i++) {
    const y = top + 6 + i * ((height - 10) / planks);
    ctx.fillRect(x - BRIDGE_HALF + 2, y, BRIDGE_HALF * 2 - 4, 6);
    ctx.strokeStyle = "rgba(42,26,18,0.35)";
    ctx.strokeRect(x - BRIDGE_HALF + 2, y, BRIDGE_HALF * 2 - 4, 6);
  }
  ctx.fillStyle = theme.wallDark;
  rr(ctx, x - BRIDGE_HALF - 8, top + 4, 8, height - 8, 3);
  ctx.fill();
  rr(ctx, x + BRIDGE_HALF, top + 4, 8, height - 8, 3);
  ctx.fill();
}

interface Decor {
  x: number;
  y: number;
  k: number;
  s: number;
}

const DECOR = new Map<string, Decor[]>();

function decorOf(id: string): Decor[] {
  const cached = DECOR.get(id);
  if (cached) return cached;
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed = (seed * 33 + id.charCodeAt(i)) >>> 0;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const pads = [
    { x: 180, y: 84, r: 48 },
    { x: 74, y: 176, r: 40 },
    { x: 286, y: 176, r: 40 },
    { x: 74, y: 472, r: 40 },
    { x: 286, y: 472, r: 40 },
    { x: 180, y: 562, r: 50 },
  ];
  const list: Decor[] = [];
  for (let i = 0; i < 36; i++) {
    const x = 20 + rnd() * (W - 40);
    const y = 48 + rnd() * (H - 96);
    if (y > RIVER_TOP - 10 && y < RIVER_BOT + 10) continue;
    if (Math.abs(x - BRIDGE_L) < 40 || Math.abs(x - BRIDGE_R) < 40) continue;
    if (pads.some((p) => Math.hypot(p.x - x, p.y - y) < p.r)) continue;
    list.push({ x, y, k: rnd(), s: 0.7 + rnd() * 0.8 });
  }
  DECOR.set(id, list);
  return list;
}

export function drawArena(ctx: CanvasRenderingContext2D, theme: ArenaDef, clock: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.18, theme.skyBot);
  sky.addColorStop(0.5, theme.grassA);
  sky.addColorStop(1, theme.grassB);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  const grass = ctx.createLinearGradient(0, 0, 0, H);
  grass.addColorStop(0, theme.grassC);
  grass.addColorStop(0.45, theme.grassB);
  grass.addColorStop(1, theme.grassA);
  ctx.fillStyle = grass;
  ctx.fillRect(0, 36, W, H - 72);
  lane(ctx, BRIDGE_L, theme);
  lane(ctx, BRIDGE_R, theme);
  ctx.fillStyle = "rgba(60,125,255,0.08)";
  ctx.fillRect(0, RIVER_BOT, W, H - RIVER_BOT);
  ctx.fillStyle = "rgba(226,59,72,0.08)";
  ctx.fillRect(0, 0, W, RIVER_TOP);
  for (const d of decorOf(theme.id)) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.scale(d.s, d.s);
    if (d.k < 0.55) {
      ctx.strokeStyle = theme.grassC;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-3, -6, -2, -10);
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(3, -7, 4, -11);
      ctx.stroke();
    } else if (d.k < 0.85) {
      ctx.fillStyle = d.k < 0.7 ? theme.flower : theme.flower2;
      ctx.beginPath();
      ctx.arc(0, -6, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f0b429";
      ctx.beginPath();
      ctx.arc(0, -6, 1.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#8d7960";
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  const river = ctx.createLinearGradient(0, RIVER_TOP, 0, RIVER_BOT);
  river.addColorStop(0, theme.riverA);
  river.addColorStop(1, theme.riverB);
  ctx.fillStyle = river;
  ctx.fillRect(0, RIVER_TOP, W, RIVER_BOT - RIVER_TOP);
  ctx.strokeStyle = theme.foam;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    const y = RIVER_TOP + 10 + i * 11;
    for (let x = 0; x <= W; x += 10) {
      const yy = y + Math.sin(x * 0.05 + clock * 2.2 + i) * 2.4;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  bridge(ctx, BRIDGE_L, theme);
  bridge(ctx, BRIDGE_R, theme);
  ctx.fillStyle = theme.wall;
  ctx.fillRect(0, 0, W, 28);
  ctx.fillRect(0, H - 26, W, 26);
  ctx.fillStyle = theme.wallDark;
  for (let x = 8; x < W; x += 28) {
    ctx.fillRect(x, 0, 16, 12);
    ctx.fillRect(x, H - 12, 16, 12);
  }
  const vignette = ctx.createRadialGradient(W / 2, H / 2, 140, W / 2, H / 2, 420);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

function hpColor(r: number) {
  if (r > 0.55) return "#7dde62";
  if (r > 0.28) return "#f0b429";
  return "#e23b48";
}

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, ratio: number) {
  const r = Math.max(0, Math.min(1, ratio));
  ctx.fillStyle = "rgba(26,18,12,0.72)";
  rr(ctx, x - w / 2, y, w, 6, 3);
  ctx.fill();
  ctx.fillStyle = hpColor(r);
  rr(ctx, x - w / 2, y, Math.max(3, w * r), 6, 3);
  ctx.fill();
}

function drawUnit(ctx: CanvasRenderingContext2D, u: Unit) {
  const attack = u.attackDur > 0 && u.windup > 0 ? 1 - u.windup / u.attackDur : 0;
  const pop = u.born > 0 ? 0.55 + 0.45 * (1 - u.born / 0.18) : 1;
  const dead = !u.alive;
  ctx.save();
  ctx.translate(u.x, u.y + (dead ? -8 * (1 - u.deathT / 0.42) : 0));
  ctx.globalAlpha = dead ? Math.max(0, u.deathT / 0.42) : 1;
  const squash = dead ? 0.7 + 0.3 * (u.deathT / 0.42) : 1;
  ctx.scale(u.facing * u.scale * pop, u.scale * pop * squash);
  ctx.fillStyle = "rgba(42,26,18,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 2, 12, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (u.flash > 0) ctx.filter = "brightness(1.8)";
  const lunge = Math.sin(Math.min(1, attack) * Math.PI) * 4;
  ctx.translate(lunge, 0);
  drawActor(ctx, u.card, u.team, { phase: u.phase, moving: u.moving && u.alive, attack });
  ctx.filter = "none";
  ctx.restore();
  if (u.alive) bar(ctx, u.x, u.y - 58 * u.scale, 32, u.hp / u.maxHp);
}

function drawShot(ctx: CanvasRenderingContext2D, s: Shot, clock: number) {
  ctx.save();
  ctx.translate(s.x, s.y);
  if (s.kind === "fireball") {
    drawFireball(ctx, clock * 8);
    ctx.restore();
    return;
  }
  ctx.rotate(s.ang);
  if (s.kind === "magic") {
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 9);
    g.addColorStop(0, "#fff6d0");
    g.addColorStop(0.5, "#d28bff");
    g.addColorStop(1, "rgba(210,139,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
  } else if (s.kind === "bolt") {
    ctx.fillStyle = "#f0b429";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-8, 4);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, -4);
    ctx.closePath();
    ctx.fill();
    stroke(ctx);
  } else {
    ctx.strokeStyle = "#f6edd9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(6, 0);
    ctx.stroke();
    ctx.fillStyle = "#e7c98a";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(4, 3);
    ctx.lineTo(4, -3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawBurst(ctx: CanvasRenderingContext2D, b: Burst) {
  const k = 1 - b.life / b.max;
  const rad = (b.kind === "boom" ? 18 : 10) + k * (b.kind === "boom" ? 46 : 18);
  ctx.globalAlpha = b.life / b.max;
  const g = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, rad);
  g.addColorStop(0, "#fff6d0");
  g.addColorStop(0.45, b.kind === "boom" ? "#ff7a3c" : "#d28bff");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(b.x, b.y, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawFloater(ctx: CanvasRenderingContext2D, f: Floater) {
  ctx.globalAlpha = Math.max(0, f.life / 0.72);
  ctx.fillStyle = f.color;
  ctx.font = "700 13px Nunito, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(f.text, f.x, f.y);
  ctx.globalAlpha = 1;
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.globalAlpha = Math.max(0, p.life / p.max);
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export interface Cue {
  card: CardId | null;
  x: number;
  y: number;
  ok: boolean;
}

export function drawFrame(ctx: CanvasRenderingContext2D, m: Match, cue: Cue) {
  const theme = arenaById(m.arenaId);
  drawArena(ctx, theme, m.clock);
  if (cue.card) {
    ctx.fillStyle = cue.ok ? "rgba(60,125,255,0.13)" : "rgba(226,59,72,0.12)";
    if (cue.card === "fireball") ctx.fillRect(12, 12, W - 24, H - 24);
    else ctx.fillRect(12, RIVER_BOT, W - 24, H - RIVER_BOT - 12);
  }
  const sprites: Array<{ y: number; draw: () => void }> = [];
  for (const t of m.towers) {
    const rage = t.role === "king" ? 2 - princessesAlive(m, t.team) : 0;
    sprites.push({ y: t.y, draw: () => drawTower(ctx, t, m.clock, rage) });
  }
  for (const u of m.units) sprites.push({ y: u.y, draw: () => drawUnit(ctx, u) });
  sprites.sort((a, b) => a.y - b.y);
  for (const s of sprites) s.draw();
  for (const t of m.towers) {
    if (!t.alive) continue;
    bar(ctx, t.x, t.y - (t.role === "king" ? 118 : 86), t.role === "king" ? 62 : 48, t.hp / t.maxHp);
  }
  for (const s of m.shots) drawShot(ctx, s, m.clock);
  for (const b of m.bursts) drawBurst(ctx, b);
  for (const p of m.particles) drawParticle(ctx, p);
  for (const f of m.floaters) drawFloater(ctx, f);
  if (cue.card) {
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.translate(cue.x, cue.y);
    if (cue.card === "fireball") {
      ctx.strokeStyle = cue.ok ? "rgba(255,180,80,0.9)" : "rgba(226,59,72,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 70, 0, Math.PI * 2);
      ctx.stroke();
      drawFireball(ctx, m.clock * 6);
    } else {
      if (!cue.ok) ctx.filter = "grayscale(0.4) brightness(0.8)";
      ctx.scale(CARDS_SCALE[cue.card], CARDS_SCALE[cue.card]);
      drawActor(ctx, cue.card, 0, { phase: m.clock, moving: true, attack: 0 });
    }
    ctx.restore();
  }
  if (m.banner > 0.15) {
    ctx.globalAlpha = Math.min(1, m.banner);
    ctx.fillStyle = "#1a120c";
    rr(ctx, W / 2 - 78, H / 2 - 28, 156, 48, 14);
    ctx.fill();
    ctx.fillStyle = "#f6edd9";
    ctx.font = "700 28px Unbounded, Nunito, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("В БОЙ!", W / 2, H / 2 - 2);
    ctx.globalAlpha = 1;
    ctx.textBaseline = "alphabetic";
  }
}

const CARDS_SCALE: Record<CardId, number> = {
  knight: 1,
  archers: 0.94,
  giant: 1.5,
  mage: 1.06,
  fireball: 1,
};

export function paintPortrait(ctx: CanvasRenderingContext2D, card: CardId) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.translate(ctx.canvas.width / 2, ctx.canvas.height * 0.82);
  ctx.scale(1.35, 1.35);
  if (card === "fireball") drawFireball(ctx, 0.4);
  else drawActor(ctx, card, 0, { phase: 0.18, moving: false, attack: card === "knight" ? 0.15 : 0 });
  ctx.restore();
}
