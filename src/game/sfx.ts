export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private timer = 0;
  private step = 0;
  enabled = true;

  unlock() {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!this.ctx) {
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
      const music = ctx.createGain();
      music.gain.value = 0.035;
      music.connect(master);
      this.ctx = ctx;
      this.master = master;
      this.music = music;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? 0.22 : 0;
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, slide = 0) {
    if (!this.ctx || !this.master || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  play(kind: string) {
    if (!this.enabled) return;
    const rate = 0.94 + Math.random() * 0.12;
    if (kind === "deploy") this.tone(520 * rate, 0.12, "triangle", 0.18, 80);
    else if (kind === "hit") this.tone(180 * rate, 0.07, "square", 0.08, -60);
    else if (kind === "spell") {
      this.tone(140, 0.28, "sawtooth", 0.12, -80);
      this.tone(420, 0.16, "triangle", 0.1, 40);
    } else if (kind === "tower") this.tone(90, 0.14, "square", 0.1, -30);
    else if (kind === "crown") this.tone(660, 0.18, "triangle", 0.16, 120);
    else if (kind === "win") {
      this.tone(523, 0.14, "triangle", 0.16);
      this.tone(659, 0.16, "triangle", 0.14);
      this.tone(784, 0.28, "triangle", 0.16);
    } else if (kind === "lose") this.tone(220, 0.35, "sine", 0.12, -80);
    else if (kind === "click") this.tone(740, 0.05, "square", 0.06);
  }

  tick(dt: number) {
    if (!this.ctx || !this.music || !this.enabled) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.42;
    const notes = [262, 330, 392, 494, 392, 330, 440, 349];
    const freq = notes[this.step % notes.length]!;
    this.step++;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
    osc.connect(g);
    g.connect(this.music);
    osc.start(t);
    osc.stop(t + 0.4);
  }
}

export const sfx = new Sfx();
