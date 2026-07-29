import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SAMPLE_RATE = 22_050;
const TAU = Math.PI * 2;

function midi(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function envelope(time, duration, attack = 0.008, release = 0.08) {
  const attackGain = Math.min(1, time / Math.max(attack, 0.0001));
  const releaseGain = Math.min(1, (duration - time) / Math.max(release, 0.0001));
  return Math.max(0, Math.min(attackGain, releaseGain));
}

function oscillator(kind, phase) {
  const wrapped = phase - Math.floor(phase);
  if (kind === "square") return wrapped < 0.5 ? 1 : -1;
  if (kind === "triangle") return 1 - 4 * Math.abs(wrapped - 0.5);
  return Math.sin(TAU * wrapped);
}

function addTone(samples, options) {
  const {
    start,
    duration,
    frequency,
    endFrequency = frequency,
    amplitude,
    kind = "sine",
    attack,
    release,
  } = options;
  const startIndex = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const endIndex = Math.min(samples.length, Math.ceil((start + duration) * SAMPLE_RATE));
  let phase = 0;
  for (let index = startIndex; index < endIndex; index += 1) {
    const localTime = index / SAMPLE_RATE - start;
    const progress = Math.min(1, localTime / duration);
    const currentFrequency = frequency + (endFrequency - frequency) * progress;
    phase += currentFrequency / SAMPLE_RATE;
    samples[index] +=
      oscillator(kind, phase) *
      amplitude *
      envelope(localTime, duration, attack, release);
  }
}

function addNoise(samples, options) {
  const { start, duration, amplitude, release = duration, seed = 1 } = options;
  const startIndex = Math.max(0, Math.floor(start * SAMPLE_RATE));
  const endIndex = Math.min(samples.length, Math.ceil((start + duration) * SAMPLE_RATE));
  let state = seed >>> 0;
  let filtered = 0;
  for (let index = startIndex; index < endIndex; index += 1) {
    state = (1664525 * state + 1013904223) >>> 0;
    const raw = (state / 0xffffffff) * 2 - 1;
    filtered = filtered * 0.48 + raw * 0.52;
    const localTime = index / SAMPLE_RATE - start;
    samples[index] +=
      filtered * amplitude * envelope(localTime, duration, 0.001, release);
  }
}

function createSamples(duration) {
  return new Float64Array(Math.ceil(duration * SAMPLE_RATE));
}

function addChord(samples, start, duration, notes, amplitude, kind = "triangle") {
  for (const note of notes) {
    addTone(samples, {
      start,
      duration,
      frequency: midi(note),
      amplitude: amplitude / notes.length,
      kind,
      attack: 0.035,
      release: 0.16,
    });
  }
}

function renderBgm({ bpm, chords, melody, mood }) {
  const beat = 60 / bpm;
  const totalBeats = chords.length * 4;
  const samples = createSamples(totalBeats * beat);

  chords.forEach((chord, bar) => {
    const barStart = bar * 4 * beat;
    addChord(samples, barStart, 4 * beat - 0.05, chord, mood === "cave" ? 0.17 : 0.2);
    for (let step = 0; step < 4; step += 1) {
      addTone(samples, {
        start: barStart + step * beat,
        duration: beat * 0.76,
        frequency: midi(chord[0] - 12),
        amplitude: mood === "login" ? 0.14 : 0.17,
        kind: "triangle",
        attack: 0.012,
        release: 0.12,
      });
    }
  });

  melody.forEach((note, step) => {
    if (note === null) return;
    const start = step * beat * 0.5;
    addTone(samples, {
      start,
      duration: beat * (mood === "cave" ? 0.78 : 0.42),
      frequency: midi(note),
      amplitude: mood === "cave" ? 0.12 : 0.16,
      kind: mood === "login" ? "sine" : "square",
      attack: 0.006,
      release: 0.06,
    });
  });

  for (let beatIndex = 0; beatIndex < totalBeats; beatIndex += 1) {
    const start = beatIndex * beat;
    if (mood !== "cave" && beatIndex % 2 === 0) {
      addTone(samples, {
        start,
        duration: 0.09,
        frequency: 95,
        endFrequency: 48,
        amplitude: 0.18,
        kind: "sine",
        release: 0.08,
      });
    }
    addNoise(samples, {
      start: start + beat * 0.5,
      duration: mood === "cave" ? 0.025 : 0.045,
      amplitude: mood === "cave" ? 0.025 : 0.05,
      release: 0.035,
      seed: 73 + beatIndex,
    });
  }

  return samples;
}

function renderSfx(name) {
  const definitions = {
    "ui-confirm": () => {
      const samples = createSamples(0.18);
      addTone(samples, { start: 0, duration: 0.1, frequency: midi(72), amplitude: 0.3, kind: "square", release: 0.05 });
      addTone(samples, { start: 0.055, duration: 0.12, frequency: midi(79), amplitude: 0.25, kind: "square", release: 0.07 });
      return samples;
    },
    jump: () => {
      const samples = createSamples(0.22);
      addTone(samples, { start: 0, duration: 0.2, frequency: 230, endFrequency: 620, amplitude: 0.32, kind: "square", release: 0.055 });
      return samples;
    },
    throw: () => {
      const samples = createSamples(0.16);
      addNoise(samples, { start: 0, duration: 0.13, amplitude: 0.25, release: 0.13, seed: 2026 });
      addTone(samples, { start: 0, duration: 0.14, frequency: 940, endFrequency: 430, amplitude: 0.18, kind: "triangle", release: 0.08 });
      return samples;
    },
    hit: () => {
      const samples = createSamples(0.18);
      addNoise(samples, { start: 0, duration: 0.11, amplitude: 0.34, release: 0.1, seed: 41 });
      addTone(samples, { start: 0, duration: 0.16, frequency: 185, endFrequency: 96, amplitude: 0.3, kind: "square", release: 0.12 });
      return samples;
    },
    "player-hurt": () => {
      const samples = createSamples(0.32);
      addTone(samples, { start: 0, duration: 0.29, frequency: 360, endFrequency: 105, amplitude: 0.32, kind: "square", release: 0.09 });
      addNoise(samples, { start: 0.025, duration: 0.17, amplitude: 0.16, release: 0.14, seed: 91 });
      return samples;
    },
    "monster-defeat": () => {
      const samples = createSamples(0.48);
      [55, 51, 48].forEach((note, index) => {
        addTone(samples, { start: index * 0.1, duration: 0.22, frequency: midi(note), amplitude: 0.23, kind: "square", release: 0.12 });
      });
      return samples;
    },
    "loot-land": () => {
      const samples = createSamples(0.13);
      addTone(samples, { start: 0, duration: 0.11, frequency: 310, endFrequency: 170, amplitude: 0.2, kind: "triangle", release: 0.07 });
      addNoise(samples, { start: 0, duration: 0.055, amplitude: 0.11, release: 0.05, seed: 17 });
      return samples;
    },
    "loot-pickup": () => {
      const samples = createSamples(0.3);
      [72, 76, 79].forEach((note, index) => {
        addTone(samples, { start: index * 0.055, duration: 0.17, frequency: midi(note), amplitude: 0.23, kind: "square", release: 0.09 });
      });
      return samples;
    },
    portal: () => {
      const samples = createSamples(0.58);
      addTone(samples, { start: 0, duration: 0.55, frequency: 150, endFrequency: 720, amplitude: 0.22, kind: "triangle", release: 0.18 });
      addTone(samples, { start: 0.08, duration: 0.45, frequency: 240, endFrequency: 990, amplitude: 0.12, kind: "sine", release: 0.14 });
      return samples;
    },
    recovery: () => {
      const samples = createSamples(0.64);
      [67, 71, 74, 79].forEach((note, index) => {
        addTone(samples, { start: index * 0.085, duration: 0.31, frequency: midi(note), amplitude: 0.18, kind: "sine", release: 0.18 });
      });
      return samples;
    },
    "job-advancement": () => {
      const samples = createSamples(1.05);
      [55, 60, 63, 67, 72].forEach((note, index) => {
        addTone(samples, { start: index * 0.105, duration: 0.5, frequency: midi(note), amplitude: 0.18, kind: index < 2 ? "triangle" : "square", release: 0.25 });
      });
      return samples;
    },
    "level-up": () => {
      const samples = createSamples(0.95);
      [60, 64, 67, 72, 76].forEach((note, index) => {
        addTone(samples, { start: index * 0.085, duration: 0.43, frequency: midi(note), amplitude: 0.17, kind: "square", release: 0.22 });
      });
      return samples;
    },
  };
  const render = definitions[name];
  if (!render) throw new Error(`Unknown SFX: ${name}`);
  return render();
}

function encodeWav(samples) {
  const dataLength = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);

  for (let index = 0; index < samples.length; index += 1) {
    const compressed = Math.tanh(samples[index] * 1.15) * 0.88;
    const pcm = Math.round(Math.max(-1, Math.min(1, compressed)) * 32767);
    buffer.writeInt16LE(pcm, 44 + index * 2);
  }
  return buffer;
}

function writeAudio(relativePath, samples) {
  const target = resolve(ROOT, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, encodeWav(samples));
}

const bgm = {
  "login-theme-v1": renderBgm({
    bpm: 100,
    mood: "login",
    chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]],
    melody: [72, null, 76, 74, 72, 69, 67, null, 69, 72, 76, null, 74, 72, 69, null, 65, 69, 72, 69, 67, 65, 64, null, 67, 71, 74, 71, 69, 67, 62, null],
  }),
  "kerning-city-theme-v1": renderBgm({
    bpm: 112,
    mood: "town",
    chords: [[50, 53, 57], [48, 52, 55], [45, 48, 52], [46, 50, 53]],
    melody: [62, 65, 69, 65, 62, 60, 62, null, 60, 64, 67, 64, 60, 59, 60, null, 57, 60, 64, 60, 57, 55, 57, null, 58, 62, 65, 62, 58, 57, 53, null],
  }),
  "mushroom-cave-theme-v1": renderBgm({
    bpm: 82,
    mood: "cave",
    chords: [[45, 48, 52], [43, 47, 50], [41, 45, 48], [43, 46, 50]],
    melody: [69, null, null, 67, null, 64, null, null, 67, null, 71, null, 67, null, 62, null, 65, null, null, 64, null, 60, null, null, 62, null, 65, null, 62, null, 58, null],
  }),
};

for (const [name, samples] of Object.entries(bgm)) {
  writeAudio(`assets/audio/bgm/${name}.wav`, samples);
}

for (const name of [
  "ui-confirm",
  "jump",
  "throw",
  "hit",
  "player-hurt",
  "monster-defeat",
  "loot-land",
  "loot-pickup",
  "portal",
  "recovery",
  "job-advancement",
  "level-up",
]) {
  writeAudio(`assets/audio/sfx/${name}-v1.wav`, renderSfx(name));
}

console.log(`Generated ${Object.keys(bgm).length} BGM loops and 12 SFX at ${SAMPLE_RATE} Hz.`);
