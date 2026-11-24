// "पंचुका और छाड़खाई": our original ~40 s Hindi short in the flat-characters-in-a-3D-toon-world style.
// Timeline, sets per shot, cameras, lens blur. Everything is timed to the voice (shorts/panchuka/voice/voice.wav),
// word-group onsets measured from its pauses (silencedetect -35 dB, 0.25 s):
//  0.00 कार्तिक के आख़िरी दिन | 1.87 पंचुका | 2.62 ओडिशा के कई घरों में मछली-मांस बंद | 5.72 और कहते हैं, बगुला भी
//  मछली नहीं खाता | 8.43 क्यों? | 9.14 रामायण में | 10.22 सीता को ढूँढते राम को सिर्फ़ एक बगुले ने राह दिखाई |
//  13.88 राम ने वर दिया | 15.05 तुम्हारी पत्नी तुम्हें खिलाएगी | 17.10 बगुला झिझका | 18.75 पत्नी का जूठा? |
//  20.08 राम बोले | 21.06 पति-पत्नी के बीच कुछ जूठा नहीं होता | 23.71 पर पंचुका में | 24.92 मछली नहीं |
//  26.05 फिर कार्तिक पूर्णिमा पर | 27.69 केले के तने की नावें ... बहती हैं | 31.16 और अगले दिन, छाड़खाई! |
//  32.92 बाज़ार भर जाते हैं | ~34.9 और केले के पत्ते पर परोसी जाती है मछली | 37.51 आप किस तरफ़ हैं? | 38.65 कमेंट में बताइए
export const FPS = 30;
export const VOICE_LEN = 39.6;
export const TOTAL = 1206; // 40.2 s: voice + a 0.6 s tail
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** seconds -> frame, landing reactions 2 f before the word (reference: 0-3 f early) */
export const W = (s: number) => Math.round(s * FPS) - 2;

// ---------------- places (world coordinates; ground y = 0, river surface y = -0.8 for z < -4) ----------------
export const GHAT: V3 = [0, 0, 0];        // stone steps down to the river, temple behind
export const REEDS: V3 = [-14, 0, -4.6];  // the crane's spot at the water's edge near the ghat
export const FOREST: V3 = [-90, 0, 0];    // Ramayana forest on the same river bank
export const MARKET: V3 = [80, 0, 30];    // fish market lane
export const HOME: V3 = [150, 0, 40];     // veranda where the family eats on a banana leaf
export const WATER_Y = -0.8;

export type Light = "day" | "golden";
export type SetName = "ghat" | "stallEmpty" | "reeds" | "forest" | "boats" | "market" | "meal";
export type ShotDef = { id: number; a: number; b: number; light: Light; set: SetName };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 68, light: "golden", set: "ghat" },          // diyas on the temple steps: Kartika, Panchuka
  { id: 2, a: 68, b: 170, light: "day", set: "stallEmpty" },     // fish stall shut, empty baskets
  { id: 3, a: 170, b: 268, light: "day", set: "reeds" },         // the egret turns its beak away from a fish. "Why?"
  { id: 4, a: 268, b: 340, light: "day", set: "forest" },        // Rama searching the forest
  { id: 5, a: 340, b: 412, light: "day", set: "forest" },        // the egret points the way
  { id: 6, a: 412, b: 511, light: "day", set: "forest" },        // the boon; the wife arrives
  { id: 7, a: 511, b: 600, light: "day", set: "forest" },        // the egret hesitates: her leftovers?
  { id: 8, a: 600, b: 709, light: "day", set: "forest" },        // Rama: no leftovers between husband and wife
  { id: 9, a: 709, b: 780, light: "day", set: "forest" },        // ...but in Panchuka, no fish
  { id: 10, a: 780, b: 932, light: "golden", set: "boats" },     // Kartika Purnima dawn: banana-stem boats with diyas
  { id: 11, a: 932, b: 1044, light: "day", set: "market" },      // Chhadakhai! the market fills
  { id: 12, a: 1044, b: 1124, light: "day", set: "meal" },       // fish served on a banana leaf
  { id: 13, a: 1124, b: TOTAL, light: "day", set: "meal" },      // which side are you on? (the egret peeks in)
];
/** crossfades (frames) INTO shot id: place / time changes */
export const XFADE: Record<number, number> = { 4: 0, 10: 10, 12: 8 };
export const FLASH_AT = 268; // white flash after the hook ("क्यों?")

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  const s = shotAt(f), x = XFADE[s.id] ?? 0;
  if (x && f < s.a + x && s.id > 1) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - s.a + 1) / (x + 1) }];
  return [{ id: s.id, alpha: 1 }];
};

// ---------------- characters' fixed marks ----------------
export const RAMA_MARK: V3 = [FOREST[0] + 0.1, 0, -3.4];
export const CRANE_MARK: V3 = [FOREST[0] - 0.9, 0, -2.6];
export const WIFE_MARK: V3 = [FOREST[0] - 1.8, 0, -2.4];

// ---------------- cameras ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Key = { pos: V3; look: V3; fov?: number; roll?: number };
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** a shot = a start and an end key, smootherstep glide over [g0, g1] (fractions of the shot), plus a creeping push-in */
type ShotCam = { k0: Key; k1: Key; g0?: number; g1?: number; push?: number };
const C: Record<number, ShotCam> = {
  1: { k0: { pos: add(GHAT, [3.2, 1.0, -3.4]), look: add(GHAT, [-0.6, 0.2, 0.8]), fov: 38, roll: 3 }, k1: { pos: add(GHAT, [2.4, 1.3, -2.6]), look: add(GHAT, [-0.8, 0.5, 1.6]), fov: 36, roll: 2 } },
  2: { k0: { pos: add(MARKET, [1.6, 1.55, 5.4]), look: add(MARKET, [0.75, 0.75, 0.3]), fov: 44 }, k1: { pos: add(MARKET, [1.4, 1.5, 4.6]), look: add(MARKET, [0.8, 0.75, 0.3]), fov: 42, roll: -2 } },
  3: { k0: { pos: add(REEDS, [2.6, 1.15, 2.4]), look: add(REEDS, [0.0, -0.25, -0.4]), fov: 40, roll: 2 }, k1: { pos: add(REEDS, [2.2, 1.0, 2.0]), look: add(REEDS, [0.0, -0.2, -0.4]), fov: 38, roll: 4 } },
  4: { k0: { pos: add(FOREST, [8.2, 1.4, 4.2]), look: add(FOREST, [6.6, 1.05, -0.6]), fov: 40 }, k1: { pos: add(FOREST, [4.9, 1.35, 3.8]), look: add(FOREST, [3.6, 1.05, -1.0]), fov: 40, roll: -3 }, g0: 0, g1: 1 },
  5: { k0: { pos: add(FOREST, [0.1, 1.3, 2.6]), look: add(FOREST, [-0.4, 0.9, -2.8]), fov: 44 }, k1: { pos: add(FOREST, [-0.3, 1.2, 2.0]), look: add(FOREST, [-0.5, 0.85, -2.8]), fov: 42, roll: 3 }, g0: 0.1, g1: 0.9 },
  6: { k0: { pos: add(FOREST, [-0.2, 1.35, 3.2]), look: add(FOREST, [-0.5, 0.9, -2.8]), fov: 46 }, k1: { pos: add(FOREST, [-0.6, 1.3, 3.0]), look: add(FOREST, [-0.85, 0.85, -2.8]), fov: 48, roll: -3 }, g0: 0.35, g1: 1 },
  7: { k0: { pos: add(FOREST, [-0.9, 0.8, 0.8]), look: add(FOREST, [-1.35, 0.62, -2.5]), fov: 40, roll: 4 }, k1: { pos: add(FOREST, [-1.0, 0.78, 0.4]), look: add(FOREST, [-1.35, 0.62, -2.5]), fov: 38, roll: 4 } },
  8: { k0: { pos: add(FOREST, [0.3, 1.3, 3.0]), look: add(FOREST, [-0.7, 0.9, -2.8]), fov: 48, roll: -2 }, k1: { pos: add(FOREST, [-0.2, 1.25, 2.5]), look: add(FOREST, [-0.8, 0.85, -2.8]), fov: 46, roll: -4 }, g0: 0, g1: 1 },
  9: { k0: { pos: add(FOREST, [-0.2, 0.75, 0.6]), look: add(FOREST, [-0.6, 0.62, -2.6]), fov: 38, roll: 3 }, k1: { pos: add(FOREST, [-0.35, 0.72, 0.2]), look: add(FOREST, [-0.6, 0.62, -2.6]), fov: 36, roll: 4 } },
  10: { k0: { pos: add(GHAT, [-0.8, 0.9, -1.6]), look: add(GHAT, [2.6, -0.8, -7.0]), fov: 42, roll: 2 }, k1: { pos: add(GHAT, [-0.5, 0.7, -2.2]), look: add(GHAT, [3.0, -0.8, -8.0]), fov: 40, roll: 4 }, g0: 0, g1: 1 },
  11: { k0: { pos: add(MARKET, [0.5, 2.3, 7.8]), look: add(MARKET, [0, 0.9, 0.5]), fov: 50 }, k1: { pos: add(MARKET, [0.2, 2.0, 6.2]), look: add(MARKET, [0, 0.9, 0.5]), fov: 46, roll: -3 }, g0: 0.05, g1: 0.6 },
  12: { k0: { pos: add(HOME, [0, 2.1, 2.4]), look: add(HOME, [0, 0.35, -0.6]), fov: 46 }, k1: { pos: add(HOME, [0, 1.95, 2.1]), look: add(HOME, [0, 0.35, -0.6]), fov: 44, roll: 2 } },
  13: { k0: { pos: add(HOME, [0.45, 1.4, 3.3]), look: add(HOME, [0.4, 0.6, -0.6]), fov: 48 }, k1: { pos: add(HOME, [0.4, 1.35, 2.9]), look: add(HOME, [0.4, 0.6, -0.6]), fov: 46, roll: -2 } },
};

/** flip-sign impact shakes, decaying over 7 f (reference) */
export const KICKS: { f: number; amp: number }[] = [
  { f: W(31.9), amp: 0.06 },  // "छाड़खाई!"
  { f: W(8.43), amp: 0.025 }, // "क्यों?"
];
export const kickAt = (f: number) => {
  let x = 0;
  for (const k of KICKS) { const d = f - k.f; if (d >= 0 && d < 7) x += k.amp * (d % 2 ? -1 : 1) * (1 - d / 7); }
  return x;
};

export const camAt = (id: number, f: number): Cam => {
  const s = SHOTS[id - 1], c = C[id], n = s.b - s.a, u = (f - s.a) / n;
  const g = glide(((u - (c.g0 ?? 0)) / ((c.g1 ?? 1) - (c.g0 ?? 0))));
  const pos = lerp3(c.k0.pos, c.k1.pos, g), look = lerp3(c.k0.look, c.k1.look, g);
  // creeping push-in on top (0.25 %/f of the distance), so no hold is static
  const push = (c.push ?? 0.0025) * (f - s.a);
  const d: V3 = [look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]];
  const p2: V3 = [pos[0] + d[0] * Math.min(0.25, push), pos[1] + d[1] * Math.min(0.25, push), pos[2] + d[2] * Math.min(0.25, push)];
  const kk = kickAt(f);
  return { pos: [p2[0] + kk, p2[1] + kk * 0.6, p2[2]], look, fov: lerp(c.k0.fov ?? 40, c.k1.fov ?? c.k0.fov ?? 40, g), roll: ((lerp(c.k0.roll ?? 0, c.k1.roll ?? 0, g)) * Math.PI) / 180 };
};

// ---------------- lens blur (cInf px at 1080 wide; 0 = sharp) ----------------
const DOF: Record<number, number> = { 1: 14, 2: 10, 3: 14, 4: 6, 5: 10, 6: 8, 7: 14, 8: 9, 9: 14, 10: 7, 11: 6, 12: 13, 13: 11 };
export const dofAt = (id: number) => DOF[id] ?? 0;
