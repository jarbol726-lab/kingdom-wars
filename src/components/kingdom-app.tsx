import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Coins, Library, Play, Settings, Swords } from "lucide-react";
import { ARENAS, CARDS, CARD_IDS, MAX_LEVEL, upgradeCost, type CardId } from "@/game/data";
import { paintPortrait } from "@/game/art";
import { sfx } from "@/game/sfx";
import { applyResult, loadProfile, saveProfile, upgradeCard, type Profile } from "@/game/storage";
import { BattleView, useStableSettled, type Summary } from "@/components/battle-view";

function Portrait({ card }: { card: CardId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    paintPortrait(ctx, card);
  }, [card]);
  return <canvas ref={ref} width={128} height={104} className="h-16 w-16" aria-hidden />;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh justify-center">
      <div className="phone">{children}</div>
    </main>
  );
}

export function KingdomApp() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [screen, setScreen] = useState<"menu" | "collection" | "settings" | "battle">("menu");
  const [battleKey, setBattleKey] = useState(0);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);
  useEffect(() => {
    if (profile) saveProfile(profile);
  }, [profile]);
  useEffect(() => {
    const unlock = () => sfx.unlock();
    window.addEventListener("pointerdown", unlock);
    const onVis = () => {
      if (document.visibilityState === "visible") sfx.unlock();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  useEffect(() => {
    if (profile) sfx.setEnabled(profile.sound);
  }, [profile]);

  const onSettled = useStableSettled((summary: Summary) => {
    setProfile((p) => (p ? applyResult(p, summary.result, summary.reward) : p));
  });

  const play = useCallback(() => {
    sfx.unlock();
    sfx.play("click");
    setBattleKey((k) => k + 1);
    setScreen("battle");
  }, []);

  if (!profile) {
    return (
      <Shell>
        <div className="grid flex-1 place-items-center">
          <div className="text-center">
            <Swords className="mx-auto size-10 text-gold" />
            <h1 className="mt-3 font-display text-3xl">Kingdom Wars</h1>
          </div>
        </div>
      </Shell>
    );
  }

  if (screen === "battle") {
    const aiLevel = Math.min(MAX_LEVEL, 1 + Math.floor(profile.wins / 2));
    return (
      <main className="flex min-h-dvh justify-center">
        <BattleView
          key={battleKey}
          profile={profile}
          aiLevel={aiLevel}
          onSettled={onSettled}
          onExit={() => setScreen("menu")}
          onRematch={() => {
            sfx.unlock();
            setBattleKey((k) => k + 1);
          }}
        />
      </main>
    );
  }

  return (
    <Shell>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-8 pb-6">
        {screen === "menu" ? (
          <>
            <div className="mb-6 text-center">
              <p className="text-sm tracking-wide text-gold uppercase">две башни, одна река</p>
              <h1 className="mt-1 font-display text-4xl leading-tight">Kingdom Wars</h1>
              <p className="mt-2 text-muted">
                {profile.wins} побед · {profile.losses} поражений
              </p>
            </div>
            <div className="mb-4 flex items-center justify-center gap-2 rounded-full bg-panel px-4 py-2 text-gold">
              <Coins className="size-5" />
              <span className="font-display">{profile.coins}</span>
            </div>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {ARENAS.map((arena) => {
                const locked = profile.wins < arena.need;
                const on = profile.arenaId === arena.id;
                return (
                  <button
                    key={arena.id}
                    type="button"
                    disabled={locked}
                    className={
                      on
                        ? "btn min-w-36 shrink-0 border-2 border-gold bg-panel text-sm text-gold"
                        : "btn btn-ghost min-w-36 shrink-0 text-sm"
                    }
                    onClick={() => setProfile({ ...profile, arenaId: arena.id })}
                  >
                    {arena.name}
                    {locked ? ` · ${arena.need} побед` : ""}
                  </button>
                );
              })}
            </div>
            <button type="button" className="btn btn-gold text-lg" onClick={play}>
              <span className="inline-flex items-center justify-center gap-2">
                <Play className="size-5" /> Играть
              </span>
            </button>
            <button type="button" className="btn btn-ghost mt-3" onClick={() => setScreen("collection")}>
              <span className="inline-flex items-center justify-center gap-2">
                <Library className="size-5" /> Коллекция
              </span>
            </button>
            <button type="button" className="btn btn-ghost mt-3" onClick={() => setScreen("settings")}>
              <span className="inline-flex items-center justify-center gap-2">
                <Settings className="size-5" /> Настройки
              </span>
            </button>
          </>
        ) : null}

        {screen === "collection" ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl">Коллекция</h2>
              <span className="inline-flex items-center gap-1 text-gold">
                <Coins className="size-4" /> {profile.coins}
              </span>
            </div>
            <ul className="flex flex-col gap-3">
              {CARD_IDS.map((id) => {
                const card = CARDS[id];
                const level = profile.levels[id];
                const cost = upgradeCost(level);
                const maxed = level >= MAX_LEVEL;
                const k = 1 + (level - 1) * 0.1;
                return (
                  <li key={id} className="flex items-center gap-3 rounded-2xl bg-panel p-3">
                    <Portrait card={id} />
                    <div className="min-w-0 flex-1">
                      <div className="font-display">{card.name}</div>
                      <p className="text-sm text-muted">{card.blurb}</p>
                      <p className="text-xs text-cream-dim">
                        ур. {level}/{MAX_LEVEL}
                        {card.kind === "troop" ? ` · здоровье ${Math.round(card.hp * k)}` : ""} · урон{" "}
                        {Math.round(card.damage * k)} · {card.cost} эликсира
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-gold px-3 text-sm"
                      disabled={maxed || profile.coins < cost}
                      onClick={() => {
                        const next = upgradeCard(profile, id);
                        if (next) {
                          sfx.play("click");
                          setProfile(next);
                        }
                      }}
                    >
                      {maxed ? "Макс" : `${cost}`}
                    </button>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="btn btn-ghost mt-4" onClick={() => setScreen("menu")}>
              Назад
            </button>
          </>
        ) : null}

        {screen === "settings" ? (
          <>
            <h2 className="font-display text-2xl">Настройки</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Четыре карты внизу. Нажмите карту и поставьте бойца на своей половине — ниже реки. Бойцы сами идут
              к вражеским башням и дерутся по пути. Башни стреляют сами. Огненный шар можно бросить куда угодно.
              Эликсир копится до 10. Сломайте королевскую башню или башню в овертайме.
            </p>
            <button
              type="button"
              role="switch"
              aria-checked={profile.sound}
              className="btn btn-ghost mt-4"
              onClick={() => setProfile({ ...profile, sound: !profile.sound })}
            >
              Звук: {profile.sound ? "вкл" : "выкл"}
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={profile.shake}
              className="btn btn-ghost mt-3"
              onClick={() => setProfile({ ...profile, shake: !profile.shake })}
            >
              Тряска экрана: {profile.shake ? "вкл" : "выкл"}
            </button>
            <button type="button" className="btn btn-ghost mt-4" onClick={() => setScreen("menu")}>
              Назад
            </button>
          </>
        ) : null}
      </div>
    </Shell>
  );
}
