// Score in code (title-sequence-3d: "a low bed, a hit on each new shot, a lift on the last line").
// Writes a 10s 48kHz stereo WAV. Fully deterministic.
const fs = require('fs');
const SR = 48000, DUR = 10, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
const TAU = Math.PI * 2;
let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// 1. Warm bed: D minor 9 voicing, slow swell, gentle detune for width
const bed = [73.42, 110.0, 146.83, 174.61, 220.0, 261.63, 329.63];
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const swell = Math.min(1, t / 1.5) * Math.min(1, (DUR - t) / 1.6);
  let l = 0, r = 0;
  bed.forEach((f, k) => {
    const a = 0.09 / (1 + k * 0.45) * (0.75 + 0.25 * Math.sin(TAU * (0.11 + k * 0.05) * t + k));
    l += a * Math.sin(TAU * f * t) + a * 0.5 * Math.sin(TAU * f * 1.003 * t);
    r += a * Math.sin(TAU * f * t + 0.3) + a * 0.5 * Math.sin(TAU * f * 0.997 * t);
  });
  L[i] += l * swell; R[i] += r * swell;
}

// 2. Hits on each new beat: soft low thump + a bell partial
function hit(at, gain, bell) {
  const s0 = Math.floor(at * SR);
  for (let j = 0; j < SR * 3 && s0 + j < N; j++) {
    const t = j / SR;
    const thump = Math.sin(TAU * (48 + 40 * Math.exp(-t * 18)) * t) * Math.exp(-t * 5) * 0.55;
    const b = (Math.sin(TAU * bell * t) + 0.4 * Math.sin(TAU * bell * 2.76 * t) * Math.exp(-t * 3)) * Math.exp(-t * 1.6) * 0.12;
    L[s0 + j] += gain * (thump + b); R[s0 + j] += gain * (thump + b * 0.85);
  }
}
// beat times: default is the first ad; HITS="0.4,3.0,..." overrides (first and last hits are the strongest)
const bells = [587.33, 880.0, 783.99, 659.25, 739.99, 698.46, 587.33];
const times = process.env.HITS ? process.env.HITS.split(',').map(Number) : [0.5, 3.7, 4.3, 4.9, 7.3];
times.forEach((t, i) => hit(t, i === 0 ? 0.8 : i === times.length - 1 ? 1.0 : 0.5, i === times.length - 1 ? 587.33 : bells[i % bells.length]));

// 3. Lift under the last line: rising filtered shimmer 7.6–10s
for (let i = Math.floor(7.6 * SR); i < N; i++) {
  const t = i / SR, k = (t - 7.6) / 2.4;
  const env = Math.sin(Math.PI * Math.min(1, k * 1.15)) * 0.06;
  const f = 1174.66 * (1 + k * 0.5);
  const tr = 0.6 + 0.4 * Math.sin(TAU * 7 * t);
  L[i] += env * tr * Math.sin(TAU * f * t); R[i] += env * tr * Math.sin(TAU * f * 1.5 * t);
}

// 4. Air: very quiet filtered noise
let lp = 0;
for (let i = 0; i < N; i++) { lp += 0.02 * ((rnd() * 2 - 1) - lp); L[i] += lp * 0.05; R[i] += lp * 0.05; }

// 5. Simple stereo reverb (feedback delays), then normalise to -1 dBFS
function verb(buf, delays, fb) {
  const out = Float32Array.from(buf);
  for (const d of delays) { const n = Math.floor(d * SR); for (let i = n; i < N; i++) out[i] += out[i - n] * fb; }
  return out;
}
const Lw = verb(L, [0.031, 0.067, 0.113], 0.32), Rw = verb(R, [0.037, 0.073, 0.127], 0.32);
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(Lw[i]), Math.abs(Rw[i]));
const g = 0.89 / peak;

const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Lw[i] * g)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, Rw[i] * g)) * 32767), 46 + i * 4);
}
fs.writeFileSync(process.argv[2] || 'score.wav', buf);
console.log('score written');
