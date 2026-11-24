// Our cast for the Panchuka short, drawn with the bridge short's Pen (plum ink, thick-thin rings, painted crescents).
// People reuse bodyFront() from the bridge toon kit with Odia outfits; Rama gets a crown, tilak and bow; the egret
// (बगुला) and his wife are new side-view drawings in the same 600 x 1000 design space (soles at y = 975).
import { Pen, bodyFront, headBlob, blobPts, thickAngle, mix, mul, shade, INK, Outfit, FrontOpts } from "../bridge/toon";

type P2 = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const WHITE = "#f7f7f2", WHITE_SH = "#c9cfe0", BEAK = "#f2c230", LEG = "#2f2a2e";

// ---------------- people ----------------
export const RAMA: Outfit = { jacket: "#f2b134", pants: "#f2b134", boots: "#6f9be0", hat: "hair", hair: "#221a30", skin: "#6f9be0", sash: "#d0473a" };
export const VILLAGERS: Outfit[] = [
  { jacket: "#f3eee2", pants: "#f3eee2", boots: "#7a5236", hat: "hair", hair: "#231b1b", skin: "#c99067", moustache: "#2a201a" },
  { jacket: "#c0353a", pants: "#3b3f52", boots: "#7a5236", hat: "hair", hair: "#1d1616", skin: "#e0ae84", dress: "#e8a531" },
  { jacket: "#e6c36a", pants: "#f3eee2", boots: "#5a3b2a", hat: "hair", hair: "#2a201a", skin: "#d39a6e" },
  { jacket: "#2f8f6a", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#1d1616", skin: "#c99067", dress: "#c25a7a" },
  { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "hair", hair: "#231b1b", skin: "#e0ae84", build: "kid" },
  { jacket: "#3f6fb5", pants: "#f3eee2", boots: "#7a5236", hat: "hair", hair: "#2a201a", skin: "#b57a52", moustache: "#2a201a" },
  { jacket: "#7b5ac9", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#1d1616", skin: "#d39a6e", dress: "#2f8f6a" },
];
const BUILD = { adult: { a: 118, torso: 1.1, legs: 1.4 }, stout: { a: 118, torso: 1.15, legs: 1.32 }, kid: { a: 112, torso: 0.85, legs: 1.0 } };
/** head centre + half height for a bodyFront() figure (same maths as toon.ts), for crowns and bindis */
const headOf = (o: Outfit, fo: FrontOpts): [number, number, number] => {
  const Bd = BUILD[o.build ?? "adult"], H = headBlob(fo.seed ?? 1, Bd.a, fo.facing ?? 0), HH = 2 * H.b;
  const tall = (1 + Bd.torso + Bd.legs) * HH, ph = fo.phase ?? 0, two = Math.PI * 2;
  const bob = fo.mode === "march" ? 0.025 * tall * Math.cos(2 * two * ph) : fo.mode === "stroll" ? 0.015 * tall * Math.cos(2 * two * ph) : 0;
  const torsoBot = fo.mode === "sit" ? 975 - 0.2 * HH : 975 - Bd.legs * HH + bob;
  const chin = torsoBot - Bd.torso * HH;
  return [300, chin - H.b, H.b];
};

export const person = (p: Pen, o: Outfit, fo: FrontOpts) => {
  bodyFront(p, o, fo);
  if (o.dress) { const [x, hc, b] = headOf(o, fo); p.dot(x + (fo.facing ?? 0) * 6, hc - 0.42 * b, 6.5, "#c81e3a"); }
};

export const rama = (p: Pen, fo: FrontOpts) => {
  const [x, hc, b] = headOf(RAMA, fo), a = 118;
  // bow slung behind the left shoulder
  p.line([[x - 1.05 * a, hc + 1.0 * b], [x - 1.45 * a, hc + 2.6 * b], [x - 1.2 * a, hc + 4.4 * b]], "#8a5a34", 9);
  p.stroke([[x - 1.05 * a, hc + 1.0 * b], [x - 1.2 * a, hc + 4.4 * b]], 2.5, "#f1ece0");
  bodyFront(p, RAMA, fo);
  // tilak
  p.poly([[x - 5, hc - 0.62 * b], [x + 5, hc - 0.62 * b], [x + 2.5, hc - 0.3 * b], [x - 2.5, hc - 0.3 * b]], "#e23b2e", 1.5);
  // golden mukut
  const top = hc - b, gold = "#f3c33b", band = top + 0.32 * b;
  p.poly([[x - 0.78 * a, band + 6], [x - 0.74 * a, band - 0.35 * b], [x - 0.42 * a, band - 0.62 * b], [x - 0.18 * a, band - 0.5 * b],
    [x, band - 1.15 * b], [x + 0.18 * a, band - 0.5 * b], [x + 0.42 * a, band - 0.62 * b], [x + 0.74 * a, band - 0.35 * b], [x + 0.78 * a, band + 6]], gold, 9);
  p.poly([[x - 0.8 * a, band - 8], [x + 0.8 * a, band - 8], [x + 0.8 * a, band + 14], [x - 0.8 * a, band + 14]], mul(gold, [0.92, 0.82, 0.6]), 7);
  p.ell(x, band - 0.42 * b, 11, 14, "#d0303a", 4);
  for (const s of [-1, 1]) p.ell(x + s * 0.45 * a, band - 0.2 * b, 6, 7, "#2f8f6a", 3);
  p.dot(x, band - 1.15 * b, 7, gold);
};

// ---------------- the egret (side view, facing right unless the card is mirrored) ----------------
export type CraneExpr = "neutral" | "happy" | "nervous" | "shut" | "curious" | "stern";
export type CraneOpts = {
  expr?: CraneExpr; blink?: number; pose?: "stand" | "point" | "walk"; phase?: number;
  /** beak direction in degrees (0 = right, 90 = down, -30 = proudly up, 160 = turned away to the left) */
  beak?: number; neck?: number; fish?: boolean; wife?: boolean; bob?: number; light?: number;
};
export const crane = (p: Pen, o: CraneOpts) => {
  const { expr = "neutral", blink = 0, pose = "stand", phase = 0, beak = 8, neck = 0, fish = false, wife = false, bob = 0, light = rad(-120) } = o;
  const thick = thickAngle(light), body: P2 = [285, 575 + bob];
  // ---- legs ----
  const legs: [number, number][] = pose === "walk"
    ? [[Math.sin(phase * Math.PI * 2) * 45, 0], [-Math.sin(phase * Math.PI * 2) * 45, 0]] : [[-18, 0], [22, 0]];
  for (const [dx] of legs) {
    const hip: P2 = [body[0] + dx * 0.3 + 5, body[1] + 70], knee: P2 = [body[0] + dx * 0.6 + 14, 800], foot: P2 = [body[0] + dx, 968];
    p.line([hip, knee, foot], LEG, 9);
    for (const t of [-1, 0, 1]) p.stroke([foot, [foot[0] + 34 * Math.cos(rad(t * 28)) , foot[1] + 6 + Math.abs(t) * 2]], 7, LEG);
    p.stroke([foot, [foot[0] - 20, foot[1] + 3]], 6, LEG);
  }
  // ---- body: egg, tail feathers lower-left ----
  const bp: P2[] = [];
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    const rx = 128 * (c < 0 ? 1.12 : 1), ry = 82 * (s > 0 ? 1.05 : 0.95);
    const x = rx * c, y = ry * s, r = rad(-14);
    bp.push([body[0] + x * Math.cos(r) - y * Math.sin(r), body[1] + x * Math.sin(r) + y * Math.cos(r)]);
  }
  // tail plumes
  p.poly([[body[0] - 110, body[1] + 10], [body[0] - 205, body[1] + 78], [body[0] - 170, body[1] + 80], [body[0] - 192, body[1] + 100], [body[0] - 95, body[1] + 55]], WHITE, 9);
  p.shadedFill(bp, WHITE, WHITE_SH, light, 130);
  p.inkRing(bp, 10, thick);
  // folded wing
  if (pose !== "point") {
    p.poly([[body[0] + 70, body[1] - 40], [body[0] - 40, body[1] - 52], [body[0] - 150, body[1] + 30], [body[0] - 60, body[1] + 48], [body[0] + 60, body[1] + 20]], "#eceff6", 6);
    p.stroke([[body[0] - 60, body[1] + 4], [body[0] - 120, body[1] + 34]], 4, mix(INK, WHITE, 0.45));
    p.stroke([[body[0] - 20, body[1] + 12], [body[0] - 80, body[1] + 42]], 4, mix(INK, WHITE, 0.45));
  }
  // ---- neck: S curve up to the head ----
  const base: P2 = [body[0] + 95, body[1] - 45];
  const turned = Math.cos(rad(beak)) < 0;
  const hx = base[0] + (turned ? -30 : 40) + neck * 0.5, hy = 270 + bob - neck;
  const mid: P2 = [base[0] + (turned ? 50 : -25), (base[1] + hy) / 2];
  p.line([base, mid, [hx, hy + 30]], WHITE, 46);
  p.stroke([base, mid, [hx, hy + 30]], 38, WHITE);
  // ---- head + beak ----
  const hc: P2 = [hx, hy], bd = rad(beak), bx = Math.cos(bd), by = Math.sin(bd);
  const root: P2 = [hc[0] + bx * 34, hc[1] + by * 34];
  const tip: P2 = [root[0] + bx * 140, root[1] + by * 140];
  const nx = -by, ny = bx;
  if (fish) fishInBeak(p, [root[0] + bx * 92, root[1] + by * 92], beak);
  p.poly([[root[0] + nx * 13, root[1] + ny * 13], tip, [root[0] - nx * 11, root[1] - ny * 11]], BEAK, 7);
  p.stroke([root, [root[0] + bx * 120, root[1] + by * 120]], 3, mul(BEAK, [0.6, 0.45, 0.2]));
  p.poly([[tip[0] - bx * 30 + nx * 4, tip[1] - by * 30 + ny * 4], tip, [tip[0] - bx * 30 - nx * 4, tip[1] - by * 30 - ny * 4]], "#3a2c26", 0);
  const hp: P2[] = blobPts(hc[0], hc[1], { a: 52, b: 44, nTop: 2, nBot: 2.2, egg: 0, asym: 0, rot: bd, noise: 0, seed: 3 });
  p.shadedFill(hp, WHITE, WHITE_SH, light, 52);
  p.inkRing(hp, 8, thick);
  if (wife) { // plume, lashes and a bindi
    p.line([[hc[0] - bx * 40, hc[1] - 30], [hc[0] - bx * 95, hc[1] - 52], [hc[0] - bx * 130, hc[1] - 30]], WHITE, 7);
    p.dot(hc[0] + bx * 4 - nx * 2, hc[1] - 34, 7, "#d81f3a");
  }
  // ---- eye (on the beak side of the head) ----
  const ex = hc[0] + bx * 14 + nx * -14, ey = hc[1] + by * 14 - 14;
  const lid = blink >= 0.75;
  p.ell(ex - bx * 14, ey + 2, 13, 9, BEAK, 0); // yellow lore
  if (lid || expr === "shut") { p.arc(ex, ey + 2, 11, 7, 200, 340, 6); }
  else switch (expr) {
    case "happy": p.arc(ex, ey + 6, 12, 9, 200, 340, 6); break;
    case "nervous": p.ell(ex, ey, 9, 9, "#fff", 4); p.dot(ex + bx * 2, ey + 1, 4.2); break;
    case "curious": p.ell(ex, ey, 12, 13, "#fff", 4.5); p.dot(ex + bx * 3, ey, 6.5); p.arc(ex, ey - 20, 14, 6, 200, 340, 5); break;
    case "stern": p.dot(ex, ey + 2, 7); p.stroke([[ex - 16, ey - 16], [ex + 14 * Math.sign(bx || 1), ey - 9]], 6); break;
    default: p.dot(ex, ey, 7.5);
  }
  if (wife && !lid && expr !== "shut") for (const k of [-1, 0, 1]) p.stroke([[ex + k * 6, ey - 9], [ex + k * 9, ey - 19]], 3.5);
  if (expr === "nervous") { // sweat drop
    const sx = hc[0] - bx * 50, sy = hc[1] - 50;
    p.poly([[sx, sy - 20], [sx + 11, sy + 4], [sx, sy + 14], [sx - 11, sy + 4]], "#9fd3f2", 4);
  }
  // ---- pointing wing (raised, feather fingers) ----
  if (pose === "point") {
    const s: P2 = [body[0] + 50, body[1] - 40];
    const fan: P2[] = [s, [s[0] + 70, s[1] - 150], [s[0] + 150, s[1] - 205], [s[0] + 175, s[1] - 190], [s[0] + 150, s[1] - 160],
      [s[0] + 190, s[1] - 160], [s[0] + 160, s[1] - 125], [s[0] + 190, s[1] - 118], [s[0] + 140, s[1] - 90], [s[0] + 60, s[1] + 20]];
    p.poly(fan, "#eceff6", 9);
    p.stroke([[s[0] + 30, s[1] - 30], [s[0] + 140, s[1] - 170]], 4, mix(INK, WHITE, 0.45));
  }
};

const fishInBeak = (p: Pen, at: P2, beak: number) => {
  p.rot = [rad(beak + 90), at[0], at[1]];
  fishBody(p, at[0], at[1], 0.55, "#9fb6c8");
  p.rot = null;
};

// ---------------- fish, effects, food ----------------
/** a fish centred at (cx, cy) pointing right, scale k (1 = 200 units long) */
export const fishBody = (p: Pen, cx: number, cy: number, k: number, col: string, fried = false) => {
  const L = 100 * k, H = 38 * k, ow = Math.max(3, 7 * k);
  p.poly([[cx - L * 0.8, cy], [cx - L * 1.15, cy - H * 0.9], [cx - L * 1.05, cy], [cx - L * 1.15, cy + H * 0.9]], mul(col, [0.85, 0.85, 0.9]), ow);
  const pts: P2[] = [];
  for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI * 2; pts.push([cx + L * Math.cos(t) * (Math.cos(t) > 0 ? 1 : 0.85), cy + H * Math.sin(t) * (1 - 0.25 * Math.cos(t))]); }
  p.shadedFill(pts, col, mul(col, [0.72, 0.72, 0.82]), rad(-110), L);
  p.inkRing(pts, ow, rad(70), 0.4);
  if (fried) for (let i = 0; i < 4; i++) p.stroke([[cx - L * 0.5 + i * L * 0.3, cy - H * 0.6], [cx - L * 0.35 + i * L * 0.3, cy + H * 0.6]], ow * 0.9, "#7a3f17");
  else for (let i = 0; i < 3; i++) p.arc(cx - L * 0.25 + i * L * 0.25, cy, H * 0.35, H * 0.5, -60, 60, ow * 0.5, mul(col, [0.7, 0.7, 0.8]));
  p.dot(cx + L * 0.62, cy - H * 0.2, 5.5 * k + 1.5);
  p.dot(cx + L * 0.64, cy - H * 0.24, 1.8 * k + 0.6, "#fff");
};
export const fxFish = (p: Pen, col = "#9fb6c8", fried = false) => fishBody(p, 128, 64, 1.0, col, fried);

export const fxQuestion = (p: Pen) => {
  p.line([[86, 92], [96, 50], [134, 36], [170, 56], [168, 96], [130, 120], [128, 160]], "#fdfaf0", 22);
  p.ell(128, 204, 17, 17, "#fdfaf0", 9);
};
export const fxHeart = (p: Pen, col = "#e8475f") => {
  const pts: P2[] = [];
  for (let i = 0; i <= 60; i++) { const t = (i / 60) * Math.PI * 2; pts.push([128 + 96 * Math.sin(t) ** 3, 120 - (78 * Math.cos(t) - 30 * Math.cos(2 * t) - 12 * Math.cos(3 * t) - 6 * Math.cos(4 * t))]); }
  p.poly(pts, col, 12);
  p.ell(92, 78, 16, 10, "#ffd0d8", 0, 0, 360, -30);
};
export const fxSparkle = (p: Pen, col = "#fff3b0") => {
  const pts: P2[] = [];
  for (let i = 0; i < 8; i++) { const r = i % 2 ? 26 : 110, a = (i / 8) * Math.PI * 2 - Math.PI / 2; pts.push([128 + r * Math.cos(a), 128 + r * Math.sin(a)]); }
  p.poly(pts, col, 9);
};
/** motion "no-no" swishes next to a shaking head */
export const fxSwish = (p: Pen) => {
  for (const s of [-1, 1]) p.arc(128 + s * 70, 128, 40, 70, s < 0 ? 120 : -60, s < 0 ? 240 : 60, 12, "#fdfaf0");
};

/** diya flame: teardrop, white-hot core (unlit card; world.ts drives it HDR for bloom) */
export const fxFlame = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(64, 150, 6, 64, 140, 110);
  gr.addColorStop(0, "#fffbe8"); gr.addColorStop(0.35, "#ffe07a"); gr.addColorStop(0.75, "#ff9a2e"); gr.addColorStop(1, "rgba(255,120,30,0)");
  g.fillStyle = gr;
  g.beginPath(); g.moveTo(64, 10); g.bezierCurveTo(90, 80, 112, 130, 100, 170); g.bezierCurveTo(90, 205, 38, 205, 28, 170); g.bezierCurveTo(16, 130, 38, 80, 64, 10); g.fill();
};

/** banana leaf seen from above, tip to the right, 1024 x 400 */
export const leafTex = (g: CanvasRenderingContext2D) => {
  const p = new Pen(g);
  const pts: P2[] = [];
  for (let i = 0; i <= 50; i++) { const t = i / 50; pts.push([40 + t * 950, 200 - 170 * Math.sin(Math.PI * Math.min(1, t * 1.05)) ** 0.6]); }
  for (let i = 50; i >= 0; i--) { const t = i / 50; pts.push([40 + t * 950, 200 + 165 * Math.sin(Math.PI * Math.min(1, t * 1.05)) ** 0.6]); }
  p.gradFill(pts, "#5fae3c", "#3f8a2a", rad(-90), 0.3);
  p.clip(pts, () => {
    for (let x = 60; x < 990; x += 15) { p.stroke([[x, 200], [x + 60, 30]], 2.5, "rgba(40,90,25,0.45)"); p.stroke([[x, 200], [x + 60, 370]], 2.5, "rgba(40,90,25,0.45)"); }
    p.g.fillStyle = "rgba(150,210,100,0.25)"; p.g.fillRect(0, 40, 1024, 80);
  });
  p.poly(pts, null, 8);
  p.stroke([[40, 200], [990, 200]], 10, "#a6cc6a");
  p.stroke([[40, 200], [990, 200]], 3, "#4d8a2c");
};
