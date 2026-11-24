// The places of the Panchuka short as one three.js world: river + banks, the ghat steps and a rekha-deula temple,
// mud huts with thatch, palms / banana plants / round trees, the fish market lane, the veranda with jhoti floor art.
// Materials are the bridge short's two-tone Lambert (shade.ts), textures painted on canvases like paint.ts.
import * as THREE from "three";
import { twoTone, untone } from "../bridge/shade";
import { ctex, rep, rng, grassHD, stoneHD } from "../bridge/paint";
import { NOINK } from "../bridge/ink";
import { Pen } from "../bridge/toon";
import { GHAT, REEDS, FOREST, MARKET, HOME, WATER_Y, V3 } from "./story";
import { fxFlame, fishBody, leafTex } from "./chars";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const cache = new Map<string, THREE.MeshLambertMaterial>();
export const mat = (col: string, map?: THREE.Texture, side: THREE.Side = THREE.FrontSide, key = "") => {
  const k = `${col}|${map?.uuid ?? ""}|${side}|${key}`;
  let m = cache.get(k);
  if (!m) { m = twoTone(new THREE.MeshLambertMaterial({ color: col, map, side })); cache.set(k, m); }
  return m;
};
const mesh = (g: THREE.BufferGeometry, m: THREE.Material, p: V3 = [0, 0, 0], shadow = true) => {
  const o = new THREE.Mesh(g, m); o.position.set(...p); o.castShadow = shadow; o.receiveShadow = true; return o;
};
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------------- painted textures ----------------
const mudTex = () => ctex("mud", 512, 512, (g, r) => {
  g.fillStyle = "#c79a68"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? "rgba(150,105,60,0.18)" : "rgba(230,190,140,0.18)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 6 + r() * 30, 4 + r() * 16, r() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 90; i++) { g.fillStyle = "rgba(90,60,40,0.35)"; g.beginPath(); g.arc(r() * 512, r() * 512, 1 + r() * 2.5, 0, 7); g.fill(); }
});
const thatchTex = () => ctex("thatch", 512, 512, (g, r) => {
  g.fillStyle = "#d4a944"; g.fillRect(0, 0, 512, 512);
  g.lineCap = "round";
  for (let i = 0; i < 900; i++) {
    const x = r() * 512, y = r() * 512, l = 20 + r() * 40;
    g.strokeStyle = r() < 0.5 ? "rgba(150,105,30,0.55)" : "rgba(245,215,120,0.6)"; g.lineWidth = 1.5 + r() * 2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y + l); g.stroke();
  }
  for (let y = 0; y < 512; y += 64) { g.fillStyle = "rgba(90,60,20,0.55)"; g.fillRect(0, y, 512, 5); }
});
const wallTex = () => ctex("hutWall", 512, 512, (g, r) => {
  g.fillStyle = "#d69a64"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? "rgba(170,110,60,0.15)" : "rgba(245,200,150,0.18)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 10 + r() * 40, 6 + r() * 18, 0, 0, 7); g.fill(); }
  g.fillStyle = "#8f5a3c"; g.fillRect(0, 400, 512, 112); // dado band
  g.strokeStyle = "#fbf6ea"; g.lineWidth = 6; g.lineCap = "round";
  for (let x = 30; x < 512; x += 64) { // white jhoti motifs above the band
    g.beginPath(); g.moveTo(x, 395); g.quadraticCurveTo(x + 16, 350, x + 32, 395); g.stroke();
    g.beginPath(); g.arc(x + 16, 340, 7, 0, 7); g.stroke();
  }
});
const jhotiFloor = () => ctex("jhotiFloor", 1024, 1024, (g, r) => {
  g.fillStyle = "#c9a274"; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 200; i++) { g.fillStyle = r() < 0.5 ? "rgba(160,120,80,0.14)" : "rgba(235,205,160,0.16)"; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 20 + r() * 60, 10 + r() * 30, 0, 0, 7); g.fill(); }
  // rice-paste jhoti: a lotus ring of petals and dots
  g.strokeStyle = "#fbf6ea"; g.fillStyle = "#fbf6ea"; g.lineWidth = 9; g.lineCap = "round";
  const cx = 512, cy = 560;
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    g.save(); g.translate(cx + Math.cos(a) * 300, cy + Math.sin(a) * 300); g.rotate(a + Math.PI / 2);
    g.beginPath(); g.moveTo(0, -60); g.quadraticCurveTo(40, 0, 0, 60); g.quadraticCurveTo(-40, 0, 0, -60); g.stroke();
    g.beginPath(); g.arc(0, -84, 10, 0, 7); g.fill();
    g.restore();
  }
  g.beginPath(); g.arc(cx, cy, 380, 0, 7); g.stroke();
  for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * 410, cy + Math.sin(a) * 410, 8, 0, 7); g.fill(); }
});
const sandstoneTex = () => ctex("sandstone", 512, 512, (g, r) => {
  g.fillStyle = "#cf9a6c"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) {
    g.fillStyle = `rgba(120,70,40,${0.35 + r() * 0.2})`; g.fillRect(0, y, 512, 5);
    for (let x = (y / 32) % 2 ? 0 : 40; x < 512; x += 80 + r() * 30) g.fillRect(x, y, 4, 32);
    for (let x = 0; x < 512; x += 24) { g.fillStyle = r() < 0.5 ? "rgba(235,185,140,0.25)" : "rgba(150,90,55,0.2)"; g.fillRect(x, y + 5, 24, 27); }
  }
});
const tarpTex = (col: string, stripe: string) => ctex("tarp" + col, 256, 256, (g) => {
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  g.fillStyle = stripe; for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 28, 256);
});
const wickerTex = () => ctex("wicker", 256, 256, (g) => {
  g.fillStyle = "#b9874a"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) for (let x = 0; x < 256; x += 16) { g.fillStyle = (x + y) % 32 ? "#a0703a" : "#d0a060"; g.fillRect(x, y, 14, 7); }
});
const bananaStemTex = () => ctex("bananaStem", 256, 256, (g, r) => {
  g.fillStyle = "#d9e3a6"; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 10) { g.fillStyle = `rgba(150,170,90,${0.25 + r() * 0.3})`; g.fillRect(x, 0, 3, 256); }
});
export const flameTex = () => ctex("flame", 128, 220, (g) => fxFlame(new Pen(g)));
const fishTex = (col: string, fried = false) => ctex(`fish${col}${fried}`, 256, 128, (g) => fishBody(new Pen(g), 128, 64, 1.0, col, fried));
const leafMap = () => ctex("bananaLeaf", 1024, 400, (g) => leafTex(g));

// ---------------- props ----------------
const hut = (root: THREE.Object3D, at: V3, yaw: number, w = 4, d = 3.2, h = 2.4) => {
  const g = new THREE.Group(); g.position.set(...at); g.rotation.y = yaw;
  const wt = wallTex();
  const wall = mesh(new THREE.BoxGeometry(w, h, d), [mat("#ffffff", rep(wt, w / 3, 1))].map((m) => m)[0], [0, h / 2, 0]);
  g.add(wall);
  const roof = new THREE.ConeGeometry(Math.hypot(w, d) * 0.62, 1.8, 4, 1, true); roof.rotateY(Math.PI / 4); roof.scale(1, 1, d / w);
  g.add(mesh(roof, mat("#ffffff", rep(thatchTex(), 3, 2), THREE.DoubleSide), [0, h + 0.85, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.9, 1.7, 0.06), mat("#5a3826"), [w * 0.15, 0.85, d / 2 + 0.02]));
  root.add(g);
};
const roundTree = (root: THREE.Object3D, at: V3, s: number, r: () => number) => {
  root.add(mesh(new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 2.6 * s, 7), mat("#7a5236"), add3(at, [0, 1.3 * s, 0])));
  const greens = ["#3f8f3a", "#4ea443", "#367d34", "#5bb04a"];
  for (let i = 0; i < 4; i++) {
    const b = new THREE.IcosahedronGeometry((1.0 + r() * 0.5) * s, 1);
    root.add(mesh(b, mat(greens[i % 4]), add3(at, [(r() - 0.5) * 1.6 * s, (2.8 + r() * 1.2) * s, (r() - 0.5) * 1.6 * s])));
  }
};
const palm = (root: THREE.Object3D, at: V3, s: number, r: () => number) => {
  const lean = (r() - 0.5) * 0.5, segs = 6;
  let top = new THREE.Vector3(...at);
  for (let i = 0; i < segs; i++) {
    const a = top.clone(), b = a.clone().add(V(lean * 0.35 * s * (i / segs), 1.2 * s, lean * 0.2 * s));
    const c = new THREE.CylinderGeometry(0.15 * s, 0.19 * s, 1.25 * s, 7); c.translate(0, 0.6 * s, 0);
    const m = mesh(c, mat(i % 2 ? "#8a6a4a" : "#9b7a56"), [a.x, a.y, a.z]);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
    root.add(m); top = b;
  }
  const frondM = mat("#4f9a3c", undefined, THREE.DoubleSide);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + r(), L = 2.6 * s;
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(L * 0.5, 0.45 * s, L, 0); sh.quadraticCurveTo(L * 0.5, -0.45 * s, 0, 0);
    const g = new THREE.ShapeGeometry(sh, 8); g.rotateX(-Math.PI / 2);
    // droop: bend vertices down with distance
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); pos.setY(i, 0.35 * s * Math.sin((x / L) * 2.2) - 0.55 * s * (x / L) ** 2); }
    g.computeVertexNormals();
    const m = mesh(g, frondM, [top.x, top.y, top.z]); m.rotation.y = a; root.add(m);
  }
  root.add(mesh(new THREE.SphereGeometry(0.22 * s, 8, 6), mat("#6b8a2f"), [top.x, top.y - 0.15 * s, top.z]));
};
const banana = (root: THREE.Object3D, at: V3, s: number, r: () => number) => {
  root.add(mesh(new THREE.CylinderGeometry(0.12 * s, 0.17 * s, 1.6 * s, 8), mat("#9cb35a"), add3(at, [0, 0.8 * s, 0])));
  const lm = mat("#ffffff", leafMap(), THREE.DoubleSide, "leaf");
  lm.alphaTest = 0.5; lm.transparent = false;
  for (let k = 0; k < 6; k++) {
    const g = new THREE.PlaneGeometry(1.9 * s, 0.75 * s, 8, 1); g.translate(0.95 * s, 0, 0); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) / (1.9 * s); pos.setY(i, s * (0.9 * x - 1.3 * x * x)); }
    g.computeVertexNormals();
    const m = mesh(g, lm, add3(at, [0, 1.55 * s, 0])); m.rotation.y = (k / 6) * Math.PI * 2 + r(); m.rotation.z = 0.5 + r() * 0.3; root.add(m);
  }
};
const reeds = (root: THREE.Object3D, at: V3, n: number, r: () => number) => {
  const m = mat("#7aa64a");
  for (let i = 0; i < n; i++) {
    const g = new THREE.ConeGeometry(0.035, 0.9 + r() * 0.6, 4); g.translate(0, 0.45, 0);
    const o = mesh(g, m, add3(at, [(r() - 0.5) * 1.6, 0, (r() - 0.5) * 0.8]), false); o.rotation.z = (r() - 0.5) * 0.4; root.add(o);
  }
};
export const diya = (root: THREE.Object3D, at: V3, flames: THREE.Mesh[]) => {
  const g = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.045, 0.005), new THREE.Vector2(0.07, 0.035), new THREE.Vector2(0.065, 0.045)], 10);
  root.add(mesh(g, mat("#b5653f", undefined, THREE.DoubleSide), at, false));
  const f = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.12), new THREE.MeshBasicMaterial({ map: flameTex(), transparent: true, depthWrite: false, color: new THREE.Color(3.2, 2.6, 1.8) }));
  f.position.set(at[0], at[1] + 0.1, at[2]); f.layers.set(NOINK); f.renderOrder = 2;
  root.add(f); flames.push(f);
};

// ---------------- stall + fish ----------------
export type Stall = { full: THREE.Object3D; empty: THREE.Object3D };
const stall = (root: THREE.Object3D, at: V3, tarp: [string, string], r: () => number): Stall => {
  const g = new THREE.Group(); g.position.set(...at); root.add(g);
  g.add(mesh(new THREE.BoxGeometry(2.2, 0.08, 1.0), mat("#9a6a42"), [0, 0.78, 0]));
  for (const [x, z] of [[-1.05, -0.45], [1.05, -0.45], [-1.05, 0.45], [1.05, 0.45]]) g.add(mesh(new THREE.BoxGeometry(0.07, 0.78, 0.07), mat("#6e4a2e"), [x, 0.39, z]));
  for (const [x, z] of [[-1.15, -0.6], [1.15, -0.6]]) g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6), mat("#6e4a2e"), [x, 1.25, z]));
  for (const [x, z] of [[-1.15, 0.7], [1.15, 0.7]]) g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 6), mat("#6e4a2e"), [x, 1.05, z]));
  const roof = mesh(new THREE.PlaneGeometry(2.7, 1.7), mat("#ffffff", tarpTex(...tarp), THREE.DoubleSide), [0, 2.3, 0.05]);
  roof.rotation.x = -Math.PI / 2 + 0.28; g.add(roof);
  // baskets
  const bas: V3[] = [[-0.65, 0.82, 0], [0.05, 0.82, 0.05], [0.72, 0.82, -0.05]];
  for (const b of bas) g.add(mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.2, 14, 1, true), mat("#ffffff", wickerTex(), THREE.DoubleSide), add3(b, [0, 0.1, 0])));
  for (const b of bas) g.add(mesh(new THREE.CircleGeometry(0.24, 14).rotateX(-Math.PI / 2), mat("#8a5e30"), add3(b, [0, 0.01, 0])));
  // full: fish heaped in the baskets and laid on the table (lit flat cards with their own ink)
  const full = new THREE.Group(); g.add(full);
  const cols = ["#9fb6c8", "#c9a27a", "#b8c4cc", "#d2b48a"];
  const fm = cols.map((c) => { const m = mat("#ffffff", fishTex(c), THREE.DoubleSide, "fish"); m.alphaTest = 0.5; return m; });
  const fg = new THREE.PlaneGeometry(0.34, 0.17);
  for (const b of bas) for (let i = 0; i < 9; i++) {
    const m = mesh(fg, fm[(i + Math.round(b[0] * 10)) % 4], add3(b, [(r() - 0.5) * 0.32, 0.12 + i * 0.012, (r() - 0.5) * 0.25]), false);
    m.rotation.set(-Math.PI / 2 + (r() - 0.5) * 0.5, 0, r() * Math.PI); m.layers.set(NOINK); full.add(m);
  }
  for (let i = 0; i < 8; i++) {
    const m = mesh(fg, fm[i % 4], [-0.9 + i * 0.25, 0.83, 0.36 + (i % 2) * 0.05], false);
    m.rotation.set(-Math.PI / 2, 0, (r() - 0.5) * 0.4); m.layers.set(NOINK); full.add(m);
  }
  // a hanging string of fish
  for (let i = 0; i < 5; i++) {
    const m = mesh(new THREE.PlaneGeometry(0.17, 0.34), fm[i % 4], [-0.7 + i * 0.35, 1.75, 0.68], false);
    m.rotation.z = Math.PI / 2; m.layers.set(NOINK); full.add(m);
  }
  // empty: an upturned basket and a cloth over the table front
  const empty = new THREE.Group(); g.add(empty);
  const cloth = mesh(new THREE.PlaneGeometry(2.3, 0.75, 8, 1), mat("#ffffff", tarpTex("#5c7fb8", "#4a6aa0"), THREE.DoubleSide), [0, 0.42, 0.52]);
  empty.add(cloth);
  const up = mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.2, 14, 1, true), mat("#ffffff", wickerTex(), THREE.DoubleSide), [0.9, 0.1, 0.9]);
  empty.add(up);
  return { full, empty };
};

// ---------------- the world ----------------
export type Sets = { flames: THREE.Mesh[]; boats: THREE.Group[]; stalls: Stall[]; ghatDiyas: THREE.Object3D; leaf: THREE.Object3D };
export const buildSets = (root: THREE.Object3D): Sets => {
  const r = rng(7);
  const flames: THREE.Mesh[] = [];
  // ground (near bank), far bank, river bank slope
  const gTex = rep(grassHD(), 60, 20);
  const ground = mesh(new THREE.PlaneGeometry(600, 200).rotateX(-Math.PI / 2), mat("#ffffff", gTex), [40, 0, 96], false);
  root.add(ground);
  const far = mesh(new THREE.PlaneGeometry(600, 200).rotateX(-Math.PI / 2), mat("#ffffff", rep(grassHD(), 60, 20)), [40, 0, -128], false);
  root.add(far);
  const slope = new THREE.PlaneGeometry(600, 2.4).rotateX(-Math.PI / 2 - 0.55);
  root.add(mesh(slope, mat("#ffffff", rep(mudTex(), 120, 1)), [40, -0.6, -5.0], false));
  const slope2 = new THREE.PlaneGeometry(600, 2.4).rotateX(-Math.PI / 2 + 0.55);
  root.add(mesh(slope2, mat("#ffffff", rep(mudTex(), 120, 1)), [40, -0.6, -27.0], false));
  // ghat steps down to the water
  const st = stoneHD();
  for (let i = 0; i < 7; i++) {
    const y = -0.2 * (i + 1), z0 = -0.7 * i, z1 = -0.7 * (i + 1);
    root.add(mesh(new THREE.BoxGeometry(11, 0.2 + 2, 0.72), mat("#ffffff", rep(st, 5, 1)), add3(GHAT, [0, y + 0.1 - 1, (z0 + z1) / 2])));
  }
  for (const s of [-1, 1]) root.add(mesh(new THREE.BoxGeometry(0.8, 1.6, 6), mat("#ffffff", rep(st, 1, 2)), add3(GHAT, [s * 5.9, -0.3, -2.4])));
  root.add(mesh(new THREE.BoxGeometry(14, 0.12, 6).translate(0, -0.06, 0), mat("#ffffff", rep(st, 6, 3)), add3(GHAT, [0, 0.02, 2.8]), false));
  // temple: jagamohana with a stepped pidha roof + curvilinear rekha deula, amalaka, kalasha and a saffron flag
  const T = add3(GHAT, [0, 0, 11]);
  const ss = sandstoneTex();
  root.add(mesh(new THREE.BoxGeometry(7, 0.6, 9), mat("#ffffff", rep(ss, 3, 1)), add3(T, [0, 0.3, 0])));
  root.add(mesh(new THREE.BoxGeometry(4, 2.6, 3.6), mat("#ffffff", rep(ss, 2, 2)), add3(T, [0, 1.9, -2.2])));
  for (let k = 0; k < 4; k++) root.add(mesh(new THREE.BoxGeometry(4.4 - k * 0.9, 0.38, 4.0 - k * 0.85), mat("#ffffff", rep(ss, 2, 0.4)), add3(T, [0, 3.35 + k * 0.5, -2.2])));
  root.add(mesh(new THREE.ConeGeometry(0.5, 0.7, 4).rotateY(Math.PI / 4), mat("#ffffff", rep(ss, 1, 1)), add3(T, [0, 5.4, -2.2])));
  root.add(mesh(new THREE.BoxGeometry(1.2, 1.9, 0.05), mat("#3a2418"), add3(T, [0, 1.55, -4.03])));
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14; prof.push(new THREE.Vector2(2.6 * (1 - 0.55 * t ** 2.2), t * 9)); }
  prof.push(new THREE.Vector2(0, 9));
  const tower = new THREE.LatheGeometry(prof, 4); tower.rotateY(Math.PI / 4);
  root.add(mesh(tower, mat("#ffffff", rep(ss, 3, 4)), add3(T, [0, 0.6, 1.4])));
  root.add(mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.4, 20), mat("#c88c5e"), add3(T, [0, 9.8, 1.4])));
  root.add(mesh(new THREE.SphereGeometry(0.28, 12, 8), mat("#e8b43a"), add3(T, [0, 10.25, 1.4])));
  root.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 5), mat("#6e4a2e"), add3(T, [0, 11.0, 1.4])));
  const flag = new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0.9, -0.25, 0), V(0, -0.55, 0)]); flag.computeVertexNormals();
  root.add(mesh(flag, mat("#f08a2c", undefined, THREE.DoubleSide), add3(T, [0.02, 11.75, 1.4])));
  // diyas on the steps and temple plinth (Kartika / Panchuka evenings)
  const ghatDiyas = new THREE.Group(); root.add(ghatDiyas);
  for (let i = 0; i < 3; i++) for (let x = -4.5; x <= 4.5; x += 0.6) diya(ghatDiyas, add3(GHAT, [x + (i % 2) * 0.3, -0.2 * i, -0.7 * i - 0.12]), flames);
  for (let x = -3.2; x <= 3.2; x += 0.55) diya(ghatDiyas, add3(T, [x, 0.6, -4.45]), flames);
  // huts and palms around the ghat
  for (const [x, z, yaw] of [[-13, 9, 0.3], [-20, 14, -0.2], [12, 8, -0.4], [19, 13, 0.2], [-8, 22, 0.1], [9, 24, -0.1]] as const) hut(root, add3(GHAT, [x, 0, z]), yaw);
  for (const [x, z] of [[-9, 4], [-16, 3], [8, 3.5], [15, 5], [22, 6], [-24, 6]] as const) palm(root, add3(GHAT, [x, 0, z]), 1.1 + r() * 0.3, r);
  for (const [x, z] of [[-11, 6.5], [10.5, 6], [6, 16]] as const) banana(root, add3(GHAT, [x, 0, z]), 1.1, r);
  reeds(root, add3(REEDS, [-0.8, -0.8, -0.5]), 18, r); reeds(root, add3(REEDS, [2.6, -0.8, -1.3]), 12, r);
  // far bank: a line of palms and trees, and a few huts
  for (let x = -150; x < 220; x += 7 + r() * 6) (r() < 0.6 ? palm : roundTree)(root, [x, 0, -31 - r() * 12], 1.2 + r() * 0.5, r);
  for (let x = -120; x < 200; x += 40 + r() * 20) hut(root, [x, 0, -40 - r() * 8], r() * 3);
  // forest (Ramayana): dense round trees, banana plants and reeds along the water
  for (let i = 0; i < 46; i++) {
    const x = FOREST[0] - 22 + r() * 44, z = 2 + r() * 26;
    if (Math.abs(x - FOREST[0]) < 6 && z < 9) continue; // keep the clearing open
    roundTree(root, [x, 0, z], 1.0 + r() * 0.7, r);
  }
  for (const [x, z] of [[-6, 5], [5, 4], [8, 8], [-9, 2.5], [-12, 7], [12, 3]] as const) banana(root, add3(FOREST, [x, 0, z]), 1.0 + r() * 0.3, r);
  for (let x = -20; x < 20; x += 3 + r() * 3) if (Math.abs(x + 1.5) > 2.5) reeds(root, add3(FOREST, [x, -0.8, -4.7]), 10, r);
  roundTree(root, add3(FOREST, [-7, 0, -1.2]), 1.2, r); roundTree(root, add3(FOREST, [7.5, 0, -0.5]), 1.1, r);
  // market lane: three stalls, huts behind, a palm
  const stalls = [stall(root, MARKET, ["#e8692e", "#f2a33a"], r), stall(root, add3(MARKET, [-3.2, 0, -0.3]), ["#3f78c0", "#5b97d6"], r), stall(root, add3(MARKET, [3.3, 0, -0.2]), ["#c63e4b", "#e2685e"], r)];
  root.add(mesh(new THREE.PlaneGeometry(30, 14).rotateX(-Math.PI / 2), mat("#ffffff", rep(mudTex(), 8, 4)), add3(MARKET, [0, 0.015, 2]), false));
  for (const [x, z, yaw] of [[-6, -5, 0], [0, -5.5, 0], [6.5, -5, 0], [-12, 2, 1.5], [12, 2, -1.5]] as const) hut(root, add3(MARKET, [x, 0, z]), yaw, 4.5, 3.4, 2.6);
  for (const [x, z] of [[-9, -3], [9.5, -2.5]] as const) palm(root, add3(MARKET, [x, 0, z]), 1.2, r);
  // veranda: jhoti floor, back wall with a door, two pillars, banana leaf meal
  const H = HOME;
  root.add(mesh(new THREE.BoxGeometry(7, 0.3, 5).translate(0, -0.15, 0), mat("#ffffff", jhotiFloor()), add3(H, [0, 0.012, -0.2]), false));
  root.add(mesh(new THREE.BoxGeometry(7, 3.2, 0.3), mat("#ffffff", rep(wallTex(), 2, 1)), add3(H, [0, 1.6, -2.4])));
  root.add(mesh(new THREE.BoxGeometry(1.0, 1.9, 0.05), mat("#5a3826"), add3(H, [-1.8, 0.95, -2.24])));
  for (const s of [-1, 1]) root.add(mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.9, 10), mat("#8a5e3c"), add3(H, [s * 2.2, 1.45, 1.2])));
  root.add(mesh(new THREE.BoxGeometry(7.4, 0.25, 4.6), mat("#ffffff", rep(thatchTex(), 4, 2)), add3(H, [0, 3.05, -0.3])));
  for (const [x, z] of [[-4.8, 2], [4.6, 2.6]] as const) banana(root, add3(H, [x, 0, z]), 1.2, r);
  hut(root, add3(H, [-9, 0, -2]), 0.2); hut(root, add3(H, [9, 0, -3]), -0.3);
  const leaf = new THREE.Group(); leaf.position.set(...add3(H, [0, 0.024, -0.2])); root.add(leaf);
  const lm = mat("#ffffff", leafMap(), THREE.DoubleSide, "mealLeaf"); lm.alphaTest = 0.5;
  const lp = mesh(new THREE.PlaneGeometry(1.3, 0.52).rotateX(-Math.PI / 2), lm, [0, 0, 0], false); lp.layers.set(NOINK); leaf.add(lp);
  const rice = mesh(new THREE.SphereGeometry(0.16, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.62, 1), mat("#fbf8ee"), [-0.24, 0, 0.02]);
  leaf.add(rice);
  const bowl = new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.07, 0.005), new THREE.Vector2(0.1, 0.06), new THREE.Vector2(0.1, 0.065)], 20);
  leaf.add(mesh(bowl, mat("#d9a83a", undefined, THREE.DoubleSide), [0.28, 0, -0.08]));
  leaf.add(mesh(new THREE.CircleGeometry(0.095, 20).rotateX(-Math.PI / 2), mat("#c8622a"), [0.28, 0.05, -0.08], false));
  const ff = mat("#ffffff", fishTex("#d99a4a", true), THREE.DoubleSide, "fried"); ff.alphaTest = 0.5;
  for (const [x, z, a] of [[0.07, 0.1, 0.3], [0.12, -0.12, -0.2]] as const) { const m = mesh(new THREE.PlaneGeometry(0.3, 0.15).rotateX(-Math.PI / 2), ff, [x, 0.008, z], false); m.rotation.y = a; m.layers.set(NOINK); leaf.add(m); }
  leaf.add(mesh(new THREE.SphereGeometry(0.035, 10, 8).scale(1.2, 0.7, 1), mat("#f2d23a"), [-0.02, 0.012, -0.16]));
  const chili = new THREE.CapsuleGeometry(0.012, 0.07, 4, 8).rotateZ(Math.PI / 2);
  leaf.add(mesh(chili, mat("#3f9a2e"), [0.42, 0.012, 0.12]));
  // banana-stem boats for Kartika Purnima (Boita Bandana): stem rafts, a diya, a paper sail
  const boats: THREE.Group[] = [];
  const bt = bananaStemTex();
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Group();
    for (const dz of [-0.07, 0.07]) {
      const c = new THREE.CylinderGeometry(0.065, 0.065, 0.62, 10).rotateZ(Math.PI / 2);
      b.add(mesh(c, mat("#ffffff", bt), [0, 0.03, dz]));
    }
    for (const dx of [-0.2, 0.2]) b.add(mesh(new THREE.BoxGeometry(0.03, 0.02, 0.3), mat("#6e4a2e"), [dx, 0.1, 0]));
    diya(b, [0.05, 0.1, 0], flames);
    b.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 5), mat("#6e4a2e"), [-0.14, 0.3, 0]));
    const sail = new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0.2, 0.1, 0), V(0, 0.26, 0)]); sail.computeVertexNormals();
    b.add(mesh(sail, mat(i % 2 ? "#f4efe2" : "#e94b3c", undefined, THREE.DoubleSide), [-0.135, 0.22, 0]));
    root.add(b); boats.push(b);
  }
  return { flames, boats, stalls, ghatDiyas, leaf };
};

/** river: self-lit colour by distance from the lens + painted crest / trough / glint marks, fogged like the world */
export const waterMaterial = (marks: THREE.Texture) => new THREE.ShaderMaterial({
  uniforms: {
    near: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, far: { value: new THREE.Color() },
    crest: { value: new THREE.Color() }, trough: { value: new THREE.Color() }, glint: { value: new THREE.Color() },
    marks: { value: marks }, time: { value: 0 }, camPos: { value: new THREE.Vector3() },
    fogColor: { value: new THREE.Color() }, fogNear: { value: 25 }, fogFar: { value: 300 },
  },
  vertexShader: `varying vec3 vWP; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vWP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform vec3 near, mid, far, crest, trough, glint, fogColor; uniform sampler2D marks; uniform float time, fogNear, fogFar; uniform vec3 camPos; varying vec3 vWP;
  void main(){
    float d = distance(camPos.xz, vWP.xz);
    vec3 c = mix(near, mid, smoothstep(2.0, 22.0, d)); c = mix(c, far, smoothstep(22.0, 140.0, d));
    vec3 m = texture2D(marks, vWP.xz / 7.0 + vec2(time * 0.035, time * 0.012)).rgb;
    vec3 m2 = texture2D(marks, vWP.xz / 23.0 - vec2(time * 0.01, 0.0)).rgb;
    float k = 1.0 - smoothstep(30.0, 90.0, d);
    c = mix(c, crest, max(m.r, m2.r * 0.6) * 0.85 * k);
    c = mix(c, trough, max(m.g, m2.g * 0.6) * 0.5 * k);
    c = mix(c, glint, m.b * 0.8 * k);
    float f = smoothstep(fogNear, fogFar, length(vWP - camPos));
    gl_FragColor = vec4(mix(c, fogColor, f), 1.0);
  }`,
});

/** gradient sky dome: 5 stops by elevation (degrees), colours pre-inverted through the tone map (untone) */
export const skyMaterial = () => new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
  vertexShader: `varying vec3 vD; void main(){ vD = normalize((modelMatrix * vec4(position,0.0)).xyz); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform vec3 c0,c1,c2,c3,c4; uniform vec4 e; varying vec3 vD;
  void main(){ float el = asin(clamp(vD.y, -1.0, 1.0));
    vec3 c = c0; c = mix(c, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el)); c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el));
    gl_FragColor = vec4(c, 1.0); }`,
});
export { untone, WATER_Y };
