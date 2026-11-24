// One three.js world for the whole short, posed per frame: camera from story.ts, the bridge short's light rig
// (camera-relative sun frozen per shot, two-tone uniforms, tone-mapped sky / fog / river targets), diya flames
// driven HDR so only they bloom, the boats drifting, and the cast as lit flat cards (bridge cast.ts Pool/Actor/Fx).
import * as THREE from "three";
import { getInputProps } from "remotion";
import { TONE, CHAR, untone } from "../bridge/shade";
import { LIGHTS, LOOK } from "../bridge/lights";
import { NOINK } from "../bridge/ink";
import { Pool, Actor, Fx } from "../bridge/cast";
import { Pen, fxContact, fxBurst, fxSplash, Expr, FrontOpts } from "../bridge/toon";
import { cloudHD, waterNear, CLOUD_DAY, CLOUD_GOLD } from "../bridge/paint";
import {
  FPS, SHOTS, GHAT, REEDS, FOREST, MARKET, HOME, WATER_Y, RAMA_MARK, CRANE_MARK, WIFE_MARK, V3, W, camAt, smooth, clamp01, lerp, lerp3,
} from "./story";
import { buildSets, waterMaterial, skyMaterial, Sets } from "./sets";
import { person, rama, crane, CraneOpts, VILLAGERS, fxFish, fxQuestion, fxHeart, fxSwish } from "./chars";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const rad = (d: number) => (d * Math.PI) / 180;
/** card canvas size by distance; inputProps post.tex scales it (software-GL renders use ~0.6) */
const TEXK = (getInputProps() as { post?: { tex?: number } }).post?.tex ?? 1;
const tier = (d: number): [number, number, number] => {
  const [w, h, k]: [number, number, number] = d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
  return [Math.round(w * TEXK), Math.round(h * TEXK), k * TEXK];
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? Math.round(v * 100) / 100 : v));
/** eyelid: 4-frame blink every 0.5-2.3 s, offset per character */
const LID = [0.5, 1, 1, 0.5];
const blinkAt = (f: number, i: number) => {
  let s = (i * 23) % 40;
  for (let n = 0; s <= f && n < 300; n++) {
    const k = f - s; if (k >= 0 && k < 4) return LID[k];
    s += 15 + ((i * 37 + n * 53) % 55);
  }
  return 0;
};

type Place = { key: string; draw: (p: Pen) => void; pos: V3; scale: number; mirror: boolean };
type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; pos: V3; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
type Stage = { places: Place[]; fx: FxPlace[] };
/** sun overrides per shot (degrees from the camera's forward axis, + = screen right; elevation) */
const SUN_SHOT: Record<number, { az?: number; el?: number }> = { 1: { az: 20, el: 9 }, 10: { az: -10, el: 6 }, 12: { az: 110, el: 55 }, 13: { az: 120, el: 45 } };

export class World {
  root = new THREE.Group();
  private sets: Sets;
  private sky: THREE.Mesh; private skyMat = skyMaterial();
  private water: THREE.Mesh; private waterMat = waterMaterial(waterNear());
  private hemi = new THREE.HemisphereLight("#ffffff", "#806040", 0.5);
  private sun = new THREE.DirectionalLight("#ffffff", 3);
  private fog = new THREE.Fog("#b8d0ec", 25, 300);
  private clouds: THREE.Mesh[] = [];
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];

  constructor() {
    const R = this.root;
    this.sets = buildSets(R);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), this.skyMat);
    this.sky.layers.set(NOINK); this.sky.renderOrder = -10; this.sky.frustumCulled = false; R.add(this.sky);
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(700, 40).rotateX(-Math.PI / 2), this.waterMat);
    this.water.position.set(40, WATER_Y, -17); this.water.receiveShadow = false; R.add(this.water);
    R.add(this.hemi);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.sun); R.add(this.sun.target);
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false }));
      m.layers.set(NOINK); m.renderOrder = -9; this.clouds.push(m); R.add(m);
    }
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, s = SHOTS[id - 1], L = LIGHTS[s.light], K = LOOK[s.light];
    // ---- camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look);
    // ---- sun: camera-relative, frozen at the shot's first frame ----
    const c0 = camAt(id, s.a), fx0 = c0.look[0] - c0.pos[0], fz0 = c0.look[2] - c0.pos[2], fl = Math.hypot(fx0, fz0) || 1;
    const o = SUN_SHOT[id] ?? {}, az = rad(o.az ?? L.az), el = rad(o.el ?? L.el);
    const fwx = fx0 / fl, fwz = fz0 / fl, rx = -fwz, rz = fwx;
    const hx = fwx * Math.cos(az) + rx * Math.sin(az), hz = fwz * Math.cos(az) + rz * Math.sin(az);
    const sunDir = V(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const dist = cam.position.distanceTo(focus), Rr = THREE.MathUtils.clamp(dist * 1.4 + 8, 10, 40);
    this.sun.position.copy(focus).addScaledVector(sunDir, 200); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 400; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    // ---- sky, fog, clouds ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((d) => rad(d));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.fog = this.fog; scene.background = null;
    const cloudPal = s.light === "golden" ? CLOUD_GOLD : CLOUD_DAY;
    this.clouds.forEach((m, i) => {
      const a = Math.atan2(fz0, fx0) + rad(-38 + i * 15), d = 420 + (i % 3) * 60;
      m.position.set(cam.position.x + Math.cos(a) * d, 70 + (i % 3) * 38 + (i % 2) * 20, cam.position.z + Math.sin(a) * d);
      m.scale.set(150 + (i % 3) * 40, 75 + (i % 3) * 20, 1);
      m.lookAt(cam.position.x, m.position.y, cam.position.z);
      (m.material as THREE.MeshBasicMaterial).map = cloudHD(i % 4, cloudPal);
    });
    // ---- river ----
    const Wu = this.waterMat.uniforms, wc = K.water;
    const wcol = s.light === "golden" ? { near: "#4a76b0", mid: "#6c8cbc", far: "#e8b898" } : wc; // dawn river: lighter, picks up the peach sky
    untone(wcol.near, Wu.near.value); untone(wcol.mid, Wu.mid.value); untone(wcol.far, Wu.far.value);
    untone(wc.crest, Wu.crest.value); untone(wc.trough, Wu.trough.value); untone(wc.glint, Wu.glint.value);
    Wu.time.value = t; Wu.camPos.value.copy(cam.position);
    Wu.fogColor.value.copy(this.fog.color); Wu.fogNear.value = L.fogNear; Wu.fogFar.value = L.fogFar;
    // ---- props per shot ----
    const golden = s.light === "golden";
    this.sets.flames.forEach((m, i) => {
      m.visible = golden;
      m.quaternion.copy(cam.quaternion);
      const k = 1 + 0.12 * Math.sin(t * 13 + i * 1.7) + 0.06 * Math.sin(t * 29 + i);
      m.scale.set(1 / k, k, 1);
    });
    this.sets.boats.forEach((b, i) => {
      b.visible = id === 10;
      const u = t - 26;
      b.position.set(GHAT[0] + 0.55 + 0.45 * i + 0.14 * u + (i % 2) * 0.5, WATER_Y + 0.015 * Math.sin(2.2 * t + i), GHAT[2] - 4.5 - 0.95 * i - 0.05 * u);
      b.scale.setScalar(1.5);
      b.rotation.set(0.04 * Math.sin(1.7 * t + i), 0, 0.05 * Math.sin(2.1 * t + i * 2));
    });
    for (const st of this.sets.stalls) { st.full.visible = id !== 2; st.empty.visible = id === 2; }
    // ---- cast ----
    const st = stage(id, f, cam);
    let ai = 0; const used: Actor[] = [];
    for (const p of st.places) {
      const a = this.actor(ai++);
      const [w, h, k] = tier(cam.position.distanceTo(V(p.pos[0], p.pos[1] + 1, p.pos[2])) / p.scale);
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(...p.pos);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.pos[0], cam.position.z - p.pos[2]), 0);
      a.mesh.scale.set(p.mirror ? -p.scale : p.scale, p.scale, p.scale);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
      // contact shadow
      const cc = golden ? "#b9a6c8" : "#8f8fb4";
      st.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (q) => fxContact(q, cc), pos: [p.pos[0], p.pos[1] + 0.02, p.pos[2]], w: 0.62 * p.scale, h: 0.45 * p.scale, flat: true });
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0; const fused: Fx[] = [];
    for (const p of st.fx) {
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e2.use(!!p.soft);
      e2.mesh.visible = true;
      e2.mesh.position.set(...p.pos);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e2.mesh.quaternion.copy(cam.quaternion); e2.mesh.rotateZ(p.rot ?? 0); }
      e2.mesh.scale.set(p.w, p.h, 1);
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e3 of fused) e3.bind();
    return focus;
  }
}

// ---------------- staging ----------------
const CRANE_S = 0.62;
const who = (i: number, o: FrontOpts, pos: V3, f: number, scale = 1, mirror = false): Place => {
  const fo: FrontOpts = { mode: "stand", ...o, blink: blinkAt(f, i + 3), seed: (i % 7) + 1, light: rad(-120) };
  const ov = VILLAGERS[i % VILLAGERS.length];
  return { key: `P${i}|${fkey(fo)}`, draw: (p) => person(p, ov, fo), pos, scale, mirror };
};
const ramaAt = (o: FrontOpts, pos: V3, f: number): Place => {
  const fo: FrontOpts = { mode: "stand", ...o, blink: blinkAt(f, 1), seed: 4, light: rad(-120) };
  return { key: `RAMA|${fkey(fo)}`, draw: (p) => rama(p, fo), pos, scale: 1, mirror: false };
};
const craneAt = (o: CraneOpts, pos: V3, f: number, mirror = false, wife = false): Place => {
  const co: CraneOpts = { ...o, wife, blink: blinkAt(f, wife ? 11 : 7) };
  return { key: `CR|${fkey(co)}`, draw: (p) => crane(p, co), pos, scale: CRANE_S, mirror };
};
/** a fish leaping out of the water and back: from a to b over [t0, t1], peak h; splash rings at both ends */
const fishJump = (out: Stage, t: number, t0: number, t1: number, a: V3, b: V3, h: number) => {
  const u = (t - t0) / (t1 - t0);
  for (const [ts, at] of [[t0, a], [t1, b]] as const) {
    const k = Math.round(((t - ts) / 0.6) * 12) / 12;
    if (k >= 0 && k < 1) out.fx.push({ key: `splash|${k}`, cw: 256, ch: 256, draw: (p) => { p.g.scale(256 / 800, 256 / 800); fxSplash(p, k); }, pos: [at[0], at[1] + 0.19, at[2]], w: 0.5, h: 0.5 });
  }
  if (u < 0 || u > 1) return;
  const p = lerp3(a, b, u); p[1] += h * 4 * u * (1 - u);
  out.fx.push({ key: "fish|leap", cw: 256, ch: 128, draw: (q) => fxFish(q, "#9fb6c8"), pos: p, w: 0.34, h: 0.17, rot: lerp(0.9, -0.9, u) * (b[0] > a[0] ? 1 : -1) });
};
const pop = (t: number, t0: number, dur = 0.25) => smooth((t - t0) / dur);

export const stage = (id: number, f: number, cam: THREE.PerspectiveCamera): Stage => {
  const t = f / FPS, out: Stage = { places: [], fx: [] }, P = out.places;
  switch (id) {
    case 1: { // diyas on the temple steps at dusk
      P.push(who(1, { expr: "smile_closed" }, add(GHAT, [-1.3, 0.02, 1.4]), f));
      P.push(who(4, { expr: "grin", look: -0.5 }, add(GHAT, [-0.55, 0.02, 1.7]), f));
      P.push(who(0, { expr: "smile" }, add(GHAT, [1.0, 0.02, 3.2]), f));
      break;
    }
    case 2: { // the fish stall is shut: the vendor sits idle
      P.push(who(5, { mode: "sit", expr: t > 4.2 ? "dazed" : "neutral", look: -0.4 }, add(MARKET, [1.55, 0, 0.75]), f));
      break;
    }
    case 3: { // the egret looks at a fish... and turns away. "Why?"
      const pos = add(REEDS, [0, WATER_Y - 0.06, -0.35]);
      const away = t >= W(7.0) / FPS && t < W(8.3) / FPS, ask = t >= W(8.3) / FPS;
      const co: CraneOpts = ask ? { expr: "curious", beak: 12 } : away ? { expr: "shut", beak: 205, neck: 20 } : t > 6.0 ? { expr: "curious", beak: 35 } : { expr: "neutral", beak: 10, bob: 4 * Math.sin(t * 3) };
      P.push(craneAt(co, pos, f));
      fishJump(out, t, 6.05, 6.95, add(REEDS, [0.4, WATER_Y, -0.55]), add(REEDS, [0.85, WATER_Y, -0.5]), 0.5);
      if (ask) { const k = pop(t, 8.32); out.fx.push({ key: "question", cw: 256, ch: 256, draw: fxQuestion, pos: add(pos, [0.2, 0.9 + 0.05 * k, 0]), w: 0.32 * k, h: 0.32 * k }); }
      break;
    }
    case 4: { // Rama searches the forest for Sita
      const u = clamp01((t - 8.93) / 2.4), pos = lerp3(add(FOREST, [7.0, 0, -0.6]), add(FOREST, [3.4, 0, -1.0]), u);
      P.push(ramaAt({ mode: "stroll", phase: t * 1.1, expr: "nervous", look: Math.sin(t * 2.2) }, pos, f));
      break;
    }
    case 5: { // only the egret answers: he points the way
      const point = t >= W(11.5) / FPS;
      P.push(ramaAt({ expr: point ? "relief" : "nervous", look: -0.8, facing: -1 }, RAMA_MARK, f));
      P.push(craneAt(point ? { pose: "point", expr: "happy", beak: -18 } : { expr: "curious", beak: 8 }, CRANE_MARK, f));
      break;
    }
    case 6: { // the boon; the wife walks in
      const bless = t >= W(13.95) / FPS;
      P.push(ramaAt({ expr: "smile", look: -0.8, facing: -1, ...(bless ? { wave: 0.2 * Math.sin(t * 6) } : {}) }, RAMA_MARK, f));
      P.push(craneAt({ expr: bless ? "happy" : "curious", beak: 4 }, CRANE_MARK, f));
      const k = Math.round(((t - 14.1) / 0.7) * 15) / 15;
      if (k >= 0 && k < 1) out.fx.push({ key: `burst|${k}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, k, "#fff3b0", 12, 50, 240), pos: add(CRANE_MARK, [0.05, 0.75, 0.05]), w: 1.2, h: 1.2 });
      const wu = clamp01((t - W(15.05) / FPS) / 1.3);
      if (t > 14.8) P.push(craneAt(wu < 1 ? { pose: "walk", phase: t * 1.6, expr: "happy", beak: 10 } : { expr: "happy", beak: 10 }, lerp3(add(FOREST, [-5.5, 0, -3.0]), WIFE_MARK, wu), f, false, true));
      break;
    }
    case 7: { // her leftovers? he hesitates
      const ask = t >= W(18.75) / FPS;
      P.push(craneAt({ expr: "nervous", beak: ask ? 25 : 40, neck: ask ? -10 : 0, bob: ask ? 3 * Math.sin(t * 20) : 0 }, CRANE_MARK, f, true));
      P.push(craneAt({ expr: "happy", beak: 5, fish: true }, WIFE_MARK, f, false, true));
      break;
    }
    case 8: { // Rama: nothing is leftover between husband and wife
      const say = t >= W(21.06) / FPS, close = smooth((t - 21.2) / 1.2);
      P.push(ramaAt({ expr: say ? "relief_open" : "smile", look: -0.8, facing: -1 }, RAMA_MARK, f));
      P.push(craneAt({ expr: say ? "happy" : "curious", beak: 4 }, add(CRANE_MARK, [-0.3 * close, 0, 0]), f, true));
      P.push(craneAt({ expr: "happy", beak: 6 }, add(WIFE_MARK, [0.25 * close, 0, 0]), f, false, true));
      for (let i = 0; i < 3; i++) {
        const k = (t - 21.6 - i * 0.45) / 1.4;
        if (k > 0 && k < 1) out.fx.push({ key: "heart", cw: 256, ch: 256, draw: (p) => fxHeart(p), pos: add(CRANE_MARK, [-0.45 + (i - 1) * 0.15, 0.85 + 0.6 * k, 0.1]), w: 0.2 * Math.min(1, k * 4), h: 0.2 * Math.min(1, k * 4) });
      }
      break;
    }
    case 9: { // ...but in Panchuka, no fish
      const no = t >= W(24.92) / FPS;
      P.push(craneAt(no ? { expr: "shut", beak: 205, neck: 22 } : t > 23.95 ? { expr: "curious", beak: 30 } : { expr: "neutral", beak: 8 }, CRANE_MARK, f));
      fishJump(out, t, 23.8, 24.65, add(CRANE_MARK, [0.4, WATER_Y, -1.6]), add(CRANE_MARK, [0.85, WATER_Y, -1.55]), 0.7);
      if (no) { const k = pop(t, 24.92, 0.15), wob = Math.sin(t * 18) * 0.05; out.fx.push({ key: "swish", cw: 256, ch: 256, draw: fxSwish, pos: add(CRANE_MARK, [0.12 + wob, 0.95, 0.05]), w: 0.55 * k, h: 0.4 * k }); }
      break;
    }
    case 10: { // Kartika Purnima dawn: a woman sends off a banana-stem boat
      P.push(who(1, { expr: "smile_closed", wave: 0.3 }, add(GHAT, [0.9, -1.25, -5.0]), f));
      break;
    }
    case 11: { // Chhadakhai! the market fills
      P.push(who(0, { expr: "grin", wave: 0.5 + 0.5 * Math.sin(t * 5) }, add(MARKET, [0.1, 0, -0.85]), f));
      P.push(who(5, { expr: "laugh" }, add(MARKET, [-3.3, 0, -1.15]), f));
      P.push(who(2, { expr: "grin" }, add(MARKET, [3.4, 0, -1.05]), f));
      const crowd: [number, V3, Expr, number][] = [
        [1, [-0.65, 0, 0.9], "grin", 31.2], [3, [0.7, 0, 1.0], "laugh", 31.5], [4, [0.35, 0, 2.3], "relief_open", 31.9],
        [6, [-1.25, 0, 1.5], "grin", 32.4], [2, [1.3, 0, 1.6], "smile", 32.8], [0, [-1.55, 0, 0.5], "laugh", 33.2], [3, [1.55, 0, 0.55], "grin", 33.6],
      ];
      crowd.forEach(([i, p, ex, t0], n) => {
        const u = smooth((t - t0) / 0.9), side = p[0] < 0 ? -1 : 1;
        if (u <= 0) return;
        const pos = add(MARKET, [lerp(side * 6.5, p[0], u), 0, p[2]]);
        P.push(who(i + n * 7, u < 1 ? { mode: "stroll", phase: t * 1.3, expr: ex } : { expr: ex, ...(n % 2 ? { wave: 0.4 } : {}) }, pos, f, i === 4 ? 0.9 : 1));
      });
      break;
    }
    case 12: case 13: { // fish served on a banana leaf; the egret peeks in
      const last = id === 13;
      P.push(who(0, { mode: "sit", expr: last ? "laugh" : "lick" }, add(HOME, [-0.6, 0, -1.0]), f));
      P.push(who(1, { mode: "sit", expr: last ? "grin" : "smile_closed" }, add(HOME, [0.1, 0, -1.15]), f));
      P.push(who(4, { mode: "sit", expr: last ? "laugh" : "grin" }, add(HOME, [0.75, 0, -0.95]), f, 0.9));
      if (last) {
        const k = smooth((t - 37.6) / 0.6);
        P.push(craneAt({ expr: t > 38.6 ? "happy" : "curious", beak: 10 + 12 * Math.sin(t * 3) }, add(HOME, [1.95 - 0.8 * k, 0, 0.3]), f, true));
      }
      break;
    }
  }
  void cam;
  return out;
};
