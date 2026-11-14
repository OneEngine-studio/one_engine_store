// Interface sounds, synthesised with Web Audio (no audio files ship with the launcher).
// One shared context and one master chain: everything passes a gentle low-pass, a short room reverb and a
// limiter, so sounds are soft, warm and never clip. Volumes are deliberately low: a launcher is heard
// hundreds of times a day.

export type UiSound = 'click' | 'hover' | 'launch' | 'purchase' | 'alert';

interface Chain {
  ctx: AudioContext;
  dry: GainNode;
  wet: GainNode;
}

let chain: Chain | null = null;

function getChain(): Chain | null {
  if (chain) return chain;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();

  const master = ctx.createGain();
  master.gain.value = 0.9;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 6500;
  tone.Q.value = 0.5;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -14;
  limiter.knee.value = 10;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.12;
  master.connect(tone).connect(limiter).connect(ctx.destination);

  // A small, dark room: decaying stereo noise as the impulse response.
  const seconds = 1.1;
  const impulse = ctx.createBuffer(2, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = impulse.getChannelData(c);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3.2);
  }
  const reverb = ctx.createConvolver();
  reverb.buffer = impulse;
  const reverbTone = ctx.createBiquadFilter();
  reverbTone.type = 'lowpass';
  reverbTone.frequency.value = 3200;

  const dry = ctx.createGain();
  const wet = ctx.createGain();
  wet.gain.value = 0.22;
  dry.connect(master);
  wet.connect(reverb).connect(reverbTone).connect(master);

  chain = { ctx, dry, wet };
  return chain;
}

/** A sine-based voice with a fast attack and exponential release; `glide` bends the pitch slightly. */
function voice(
  c: Chain,
  { freq, at, attack = 0.004, release, gain, type = 'sine', glideTo, wet = 1 }: {
    freq: number;
    at: number;
    attack?: number;
    release: number;
    gain: number;
    type?: OscillatorType;
    glideTo?: number;
    wet?: number;
  }
) {
  const { ctx } = c;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, at + attack + release * 0.6);
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, at + attack + release);
  osc.connect(env);
  env.connect(c.dry);
  if (wet > 0) {
    const send = ctx.createGain();
    send.gain.value = wet;
    env.connect(send).connect(c.wet);
  }
  osc.start(at);
  osc.stop(at + attack + release + 0.05);
}

/** A very short band-passed noise tick: the "material" of a button press. */
function tick(c: Chain, at: number, gain: number, centre = 2400) {
  const { ctx } = c;
  const len = Math.floor(ctx.sampleRate * 0.012);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = centre;
  band.Q.value = 1.2;
  const env = ctx.createGain();
  env.gain.value = gain;
  src.connect(band).connect(env).connect(c.dry);
  src.start(at);
}

/** A soft noise swell that rises and fades, for the launch whoosh. */
function swell(c: Chain, at: number, duration: number, gain: number) {
  const { ctx } = c;
  const len = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 0.9;
  filter.frequency.setValueAtTime(300, at);
  filter.frequency.exponentialRampToValueAtTime(2800, at + duration * 0.85);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + duration * 0.7);
  env.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  src.connect(filter).connect(env);
  env.connect(c.dry);
  env.connect(c.wet);
  src.start(at);
}

const SOUNDS: Record<UiSound, (c: Chain, t: number) => void> = {
  // Soft, rounded "tock": a low sine with a whisper of texture on top. Short and quiet.
  click: (c, t) => {
    tick(c, t, 0.05, 2600);
    voice(c, { freq: 620, glideTo: 540, at: t, attack: 0.002, release: 0.07, gain: 0.07, wet: 0.25 });
    voice(c, { freq: 1240, at: t, attack: 0.002, release: 0.035, gain: 0.015, wet: 0 });
  },
  // Barely there: used sparingly.
  hover: (c, t) => {
    voice(c, { freq: 1480, at: t, attack: 0.003, release: 0.03, gain: 0.008, wet: 0 });
  },
  // Rising whoosh into a warm open chord with a bell on top, like a console "start game".
  launch: (c, t) => {
    swell(c, t, 0.55, 0.06);
    const chord = [164.81, 246.94, 329.63, 493.88]; // E3 B3 E4 B4
    chord.forEach((f, i) =>
      voice(c, { freq: f, at: t + 0.42 + i * 0.015, attack: 0.03, release: 1.3, gain: 0.05, type: 'triangle', wet: 0.9 })
    );
    voice(c, { freq: 1318.5, at: t + 0.48, attack: 0.004, release: 0.9, gain: 0.04, wet: 1 }); // E6 bell
    voice(c, { freq: 1975.5, at: t + 0.52, attack: 0.004, release: 0.6, gain: 0.018, wet: 1 }); // B6 sparkle
  },
  // Three-note rising chime: confirmation, sign-in, purchase.
  purchase: (c, t) => {
    [1046.5, 1318.5, 1568.0].forEach((f, i) => {
      voice(c, { freq: f, at: t + i * 0.075, attack: 0.003, release: 0.5, gain: 0.05, wet: 0.8 });
      voice(c, { freq: f * 2, at: t + i * 0.075, attack: 0.003, release: 0.18, gain: 0.01, wet: 0.5 });
    });
  },
  // Two soft descending notes: something needs attention, without sounding like an error buzzer.
  alert: (c, t) => {
    voice(c, { freq: 880, at: t, attack: 0.004, release: 0.22, gain: 0.05, type: 'triangle', wet: 0.6 });
    voice(c, { freq: 659.25, at: t + 0.11, attack: 0.004, release: 0.32, gain: 0.05, type: 'triangle', wet: 0.6 });
  },
};

let lastPlayed: Partial<Record<UiSound, number>> = {};

export function playUiSound(type: UiSound, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const c = getChain();
    if (!c) return;
    if (c.ctx.state === 'suspended') void c.ctx.resume();
    const now = c.ctx.currentTime;
    // Rapid repeats (double clicks, key repeat) would stack into a rattle: skip them.
    const last = lastPlayed[type] ?? -1;
    if (now - last < 0.045) return;
    lastPlayed = { ...lastPlayed, [type]: now };
    SOUNDS[type](c, now + 0.005);
  } catch {
    // audio is a nicety; never let it break the interface
  }
}
