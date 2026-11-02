import { useCallback, useEffect, useRef, useState } from "react";
import { CARDS, H, W, type CardId } from "@/game/data";
import { drawFrame, paintPortrait, type Cue } from "@/game/art";
import {
  canPlace,
  createMatch,
  formatTime,
  playCard,
  snapshot,
  step,
  surrender,
  type HudSnap,
  type Match,
} from "@/game/sim";
import { sfx } from "@/game/sfx";
import type { Profile } from "@/game/storage";

export interface Summary {
  result: "win" | "loss" | "draw";
  reward: number;
  surrendered: boolean;
}

function Portrait({ card }: { card: CardId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    paintPortrait(ctx, card);
  }, [card]);
  return <canvas ref={ref} width={128} height={104} className="h-14 w-14" aria-hidden />;
}

export function BattleView({
  profile,
  aiLevel,
  onSettled,
  onExit,
  onRematch,
}: {
  profile: Profile;
  aiLevel: number;
  onSettled: (summary: Summary) => void;
  onExit: () => void;
  onRematch: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Match | null>(null);
  const viewRef = useRef({ ox: 0, oy: 0, scale: 1 });
  const cueRef = useRef<Cue>({ card: null, x: 0, y: 0, ok: false });
  const shakeRef = useRef(profile.shake);
  shakeRef.current = profile.shake;
  const levelsRef = useRef(profile.levels);
  levelsRef.current = profile.levels;
  const arenaRef = useRef(profile.arenaId);
  const aiRef = useRef(aiLevel);
  const reported = useRef(false);
  const [sel, setSel] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [ask, setAsk] = useState(false);
  const [hud, setHud] = useState<HudSnap | null>(null);
  const selRef = useRef<number | null>(null);
  selRef.current = sel;

  useEffect(() => {
    simRef.current = createMatch({
      arenaId: arenaRef.current,
      playerLevels: levelsRef.current,
      aiLevel: aiRef.current,
    });
    setHud(snapshot(simRef.current));
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      const match = simRef.current;
      const ctx = canvas.getContext("2d");
      if (!match || !ctx) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!document.hidden) {
        acc += dt;
        let n = 0;
        while (acc >= 1 / 60 && n < 5) {
          step(match, 1 / 60);
          acc -= 1 / 60;
          n++;
        }
        if (n === 5) acc = 0;
        sfx.tick(dt);
        while (match.events.length) {
          const ev = match.events.shift();
          if (ev) sfx.play(ev.kind);
        }
      }
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const bw = Math.max(1, Math.floor(cssW * dpr));
      const bh = Math.max(1, Math.floor(cssH * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      const scale = Math.min(cssW / W, cssH / H);
      const ox = (cssW - W * scale) / 2;
      const oy = (cssH - H * scale) / 2;
      viewRef.current = { ox, oy, scale };
      const amp = shakeRef.current ? match.trauma * match.trauma : 0;
      ctx.save();
      ctx.translate(ox + Math.sin(match.clock * 42) * 7 * amp, oy + Math.cos(match.clock * 37) * 5 * amp);
      ctx.scale(scale, scale);
      const card = selRef.current == null ? null : match.decks[0][selRef.current] ?? null;
      cueRef.current.card = card;
      drawFrame(ctx, match, cueRef.current);
      ctx.restore();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const poll = window.setInterval(() => {
      const match = simRef.current;
      if (!match) return;
      setHud(snapshot(match));
      if (match.finished && !reported.current && match.result) {
        reported.current = true;
        onSettled({ result: match.result, reward: match.reward, surrendered: match.surrendered });
      }
    }, 120);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(poll);
    };
  }, [onSettled]);

  const worldAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const v = viewRef.current;
    return {
      x: (clientX - rect.left - v.ox) / v.scale,
      y: (clientY - rect.top - v.oy) / v.scale,
    };
  };

  const moveCue = (clientX: number, clientY: number) => {
    const match = simRef.current;
    const p = worldAt(clientX, clientY);
    const index = selRef.current;
    if (!match || !p || index == null) {
      cueRef.current = { card: null, x: 0, y: 0, ok: false };
      return;
    }
    const card = match.decks[0][index];
    if (!card) return;
    cueRef.current = { card, x: p.x, y: p.y, ok: canPlace(match, 0, card, p.x, p.y) };
  };

  const tryPlay = (clientX: number, clientY: number) => {
    const match = simRef.current;
    const index = selRef.current;
    const p = worldAt(clientX, clientY);
    if (!match || index == null || !p || match.finished) return;
    const card = match.decks[0][index];
    if (!card) return;
    const result = playCard(match, 0, index, p.x, p.y, levelsRef.current[card]);
    if (!result.ok) {
      setNote(result.reason ?? "Нельзя");
      return;
    }
    setNote("");
    setSel(null);
    cueRef.current.card = null;
    if (navigator.vibrate) navigator.vibrate(12);
    setHud(snapshot(match));
  };

  const pick = (index: number) => {
    const match = simRef.current;
    if (!match || match.finished) return;
    const card = match.decks[0][index];
    if (!card) return;
    if (CARDS[card].cost > match.elixir[0] + 1e-3) {
      setNote("Не хватает эликсира");
      return;
    }
    sfx.play("click");
    setNote("");
    setSel((cur) => (cur === index ? null : index));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "4") pick(Number(e.key) - 1);
      if (e.key === "Escape") setSel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const giveUp = () => {
    const match = simRef.current;
    if (!match) return;
    surrender(match);
    setAsk(false);
    setHud(snapshot(match));
  };

  const deck = hud?.deck ?? [];
  const hand = deck.slice(0, 4);
  const next = deck[4];

  return (
    <div className="phone bg-ink">
      <header className="flex items-center gap-2 px-3 pt-3 pb-1">
        <button type="button" className="btn btn-ghost min-h-11 px-3 text-sm" onClick={() => setAsk(true)}>
          Сдаться
        </button>
        <div className="flex flex-1 flex-col items-center">
          <div className="font-display text-lg leading-none text-cream">
            {hud?.overtime ? `ОТ ${formatTime(hud.timeLeft)}` : formatTime(hud?.timeLeft ?? 150)}
          </div>
          <div className="text-xs text-muted">
            {hud?.overtime ? "эликсир ×3" : (hud?.timeLeft ?? 150) <= 60 ? "эликсир ×2" : `соперник ур. ${aiLevel}`}
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="text-crimson">{hud?.crownsThem ?? 0} короны</div>
          <div className="text-sap">{hud?.crownsYou ?? 0} ваши</div>
        </div>
      </header>
      <canvas
        ref={canvasRef}
        className="min-h-0 w-full flex-1 touch-none"
        onPointerMove={(e) => moveCue(e.clientX, e.clientY)}
        onPointerDown={(e) => {
          moveCue(e.clientX, e.clientY);
          tryPlay(e.clientX, e.clientY);
        }}
      />
      {note ? <p className="px-3 text-center text-sm text-gold">{note}</p> : null}
      {hud && hud.toastT > 0 && hud.banner <= 0 ? (
        <p className="pointer-events-none absolute top-16 left-0 right-0 text-center font-display text-gold">{hud.toast}</p>
      ) : null}
      <div className="px-3 pt-1 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mb-2 flex items-center gap-2">
          {next ? (
            <div className="grid h-14 w-12 place-items-center rounded-xl border border-line bg-panel text-xs">
              <Portrait card={next} />
            </div>
          ) : null}
          <div className="flex-1">
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>Эликсир</span>
              <span className="text-elixir">{Math.floor(hud?.elixir ?? 0)}/10</span>
            </div>
            <div className="elixir-track">
              <div className="elixir-fill" style={{ width: `${((hud?.elixir ?? 0) / 10) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {hand.map((id, index) => {
            const card = CARDS[id];
            const locked = (hud?.elixir ?? 0) + 1e-3 < card.cost || Boolean(hud?.finished);
            return (
              <button
                key={`${id}-${index}`}
                type="button"
                disabled={locked}
                className={sel === index ? "troop-card is-on" : "troop-card"}
                onClick={() => pick(index)}
              >
                <span className="cost-gem">{card.cost}</span>
                <Portrait card={id} />
                <span className="text-xs font-bold">{card.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      {ask ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-ink/80 p-6">
          <div className="w-full max-w-xs rounded-2xl bg-panel p-5 text-center">
            <h2 className="font-display text-xl">Сдаться?</h2>
            <p className="mt-2 text-sm text-muted">Это поражение. Монет будет меньше.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button type="button" className="btn btn-gold" onClick={giveUp}>
                Сдаться
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setAsk(false)}>
                Продолжить
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {hud?.finished && hud.result ? (
        <div className="absolute inset-0 z-30 grid place-items-center bg-ink/80 p-6">
          <div className="w-full max-w-xs rounded-2xl bg-panel p-5 text-center">
            <h2 className="font-display text-2xl text-gold">
              {hud.result === "win" ? "Победа" : hud.result === "loss" ? "Поражение" : "Ничья"}
            </h2>
            <p className="mt-2 text-cream">
              {hud.crownsYou} : {hud.crownsThem}
            </p>
            <p className="mt-1 text-gold">+{hud.reward} монет</p>
            <div className="mt-4 flex flex-col gap-2">
              <button type="button" className="btn btn-gold" onClick={onRematch}>
                Ещё раз
              </button>
              <button type="button" className="btn btn-ghost" onClick={onExit}>
                В меню
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function useStableSettled(fn: (summary: Summary) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((summary: Summary) => ref.current(summary), []);
}
