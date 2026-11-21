/**
 * The sidebar figure, drawn in ink: the residue contacts a language model proposes for a protein
 * appear first, then the backbone is traced through them and each contact is tested against the
 * crystal structure as the chain reaches it. A confirmed contact closes into a stitch; a refuted
 * one breaks and draws back. This file is the geometry and the timing; the component paints the
 * shapes it returns.
 */

export type Vec3 = readonly [number, number, number];
/** Two residue indices, the earlier first, and whether the structure confirms the contact (1) or not (0). */
export type Contact = readonly [i: number, j: number, confirmed: number];

/** Viewing angles in radians: a turn about the vertical axis, then a tilt toward the viewer. */
export interface View { yaw: number; pitch: number }
/** The drawing area in CSS pixels, and pixels per angstrom. */
export interface Frame { width: number; height: number; scale: number }
/** How much of the chain is drawn, and how far each contact has been proposed, tested, and settled (all 0 to 1). */
export interface Progress { chain: number; proposed: readonly number[]; tested: readonly number[]; settled: readonly number[] }

interface Stroke { kind: 'line'; z: number; x1: number; y1: number; x2: number; y2: number; width: number; color: string; alpha: number; dash?: readonly [number, number]; halo?: number }
interface Dot { kind: 'dot'; z: number; x: number; y: number; r: number; color: string; alpha: number }
export type Shape = Stroke | Dot;

// One ink, no hue: the near side of the molecule is dark and heavy, the far side light and thin.
type Rgb = readonly [number, number, number];
const INK: Rgb = [24, 25, 26];
const FAR: Rgb = [178, 180, 181];
const PENCIL: Rgb = [132, 134, 135]; // a contact that has been proposed but not yet tested

const CAMERA = 110; // angstroms from the center; far enough for only a mild perspective
const SAMPLES_PER_RESIDUE = 6;
const SMOOTHING = 0.4;

export const REST: View = { yaw: -0.25, pitch: 0.15 };
/** How far the pointer can turn the molecule from its resting view, in radians. */
export const REACH: View = { yaw: 0.45, pitch: 0.22 };
const OPENING_TURN = 0.9; // radians the molecule turns through while the sequence plays

const PROPOSE_MS = 700; // one contact appearing
const PROPOSE_STAGGER_MS = 30; // between contacts, in the model's order of confidence
const CHAIN_START_MS = 800;
const CHAIN_MS = 3600;
const TEST_MS = 420;
const LINGER_MS = 220;
const SETTLE_MS = 700;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: Rgb, b: Rgb, t: number) => `rgb(${a.map((v, k) => Math.round(lerp(v, b[k], t))).join(' ')})`;
const rgb = (c: Rgb) => mix(c, c, 0);
const easeInOut = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
/** When an eased motion of length 1 has covered the fraction `f`. */
const easedAt = (f: number) => Math.acos(1 - 2 * clamp(f)) / Math.PI;

/**
 * Softens the zigzag of the alpha carbons so strands read as ribbons while the helix keeps its coil.
 * Each point moves toward the midpoint of its neighbors; the two ends stay in place.
 */
export function smooth(ca: readonly Vec3[], amount = SMOOTHING): Vec3[] {
  return ca.map((p, i) => (i === 0 || i === ca.length - 1
    ? p
    : [0, 1, 2].map((k) => lerp(p[k], (ca[i - 1][k] + ca[i + 1][k]) / 2, amount)) as unknown as Vec3));
}

/** A smooth curve through the given points (Catmull-Rom), sampled evenly between them. */
export function backbone(ca: readonly Vec3[], samples = SAMPLES_PER_RESIDUE): Vec3[] {
  const at = (i: number) => ca[Math.min(ca.length - 1, Math.max(0, i))];
  const points: Vec3[] = [];
  for (let i = 0; i < ca.length - 1; i++) {
    const [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let s = 0; s < samples; s++) {
      const t = s / samples;
      points.push([0, 1, 2].map((k) => 0.5 * (
        2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t * t * t
      )) as unknown as Vec3);
    }
  }
  points.push(ca[ca.length - 1]);
  return points;
}

function projector(view: View, frame: Frame) {
  const [cy, sy, cp, sp] = [Math.cos(view.yaw), Math.sin(view.yaw), Math.cos(view.pitch), Math.sin(view.pitch)];
  return ([x, y, z]: Vec3) => {
    const x1 = x * cy + z * sy;
    const z1 = z * cy - x * sy;
    const y2 = y * cp - z1 * sp;
    const z2 = z1 * cp + y * sp;
    const k = (frame.scale * CAMERA) / (CAMERA - z2);
    return { x: frame.width / 2 + x1 * k, y: frame.height / 2 - y2 * k, z: z2 };
  };
}

/** Pixels per angstrom that keep the molecule inside the frame in every view the pointer can reach. */
export function fit(points: readonly Vec3[], width: number, height: number, margin = 6): number {
  let scale = Infinity;
  for (const yaw of [-1, 0, 1]) for (const pitch of [-1, 0, 1]) {
    const project = projector({ yaw: REST.yaw + yaw * REACH.yaw, pitch: REST.pitch + pitch * REACH.pitch }, { width: 0, height: 0, scale: 1 });
    for (const p of points.map(project)) scale = Math.min(scale, (width / 2 - margin) / Math.abs(p.x), (height / 2 - margin) / Math.abs(p.y));
  }
  return scale;
}

/** Everything to draw for one moment, sorted from the back of the molecule to the front. */
export function scene(guide: readonly Vec3[], curve: readonly Vec3[], contacts: readonly Contact[], view: View, frame: Frame, progress: Progress): Shape[] {
  const project = projector(view, frame);
  const points = curve.map(project);
  const zs = points.map((p) => p.z);
  const [back, front] = [Math.min(...zs), Math.max(...zs)];
  const depth = (z: number) => clamp((z - back) / (front - back || 1));
  const shapes: Shape[] = [];

  // The backbone, with a white halo on each piece so nearer strands pass in front of farther ones.
  const drawn = clamp(progress.chain) * (points.length - 1);
  for (let s = 0; s < Math.ceil(drawn); s++) {
    const a = points[s];
    const part = Math.min(1, drawn - s);
    const b = { x: lerp(a.x, points[s + 1].x, part), y: lerp(a.y, points[s + 1].y, part), z: lerp(a.z, points[s + 1].z, part) };
    const t = depth((a.z + b.z) / 2);
    shapes.push({ kind: 'line', z: (a.z + b.z) / 2, x1: a.x, y1: a.y, x2: b.x, y2: b.y, width: lerp(0.9, 2.3, t), color: mix(FAR, INK, t), alpha: 1, halo: 2.8 });
    // The pen: a dot at the growing end of the chain.
    if (s === Math.ceil(drawn) - 1 && progress.chain < 1) shapes.push({ kind: 'dot', z: b.z + 0.01, x: b.x, y: b.y, r: 2.1, color: rgb(INK), alpha: 1 });
  }

  contacts.forEach(([i, j, confirmed], k) => {
    const grown = clamp(progress.proposed[k] ?? 0);
    if (grown <= 0) return;
    const tested = clamp(progress.tested[k] ?? 0);
    const settled = clamp(progress.settled[k] ?? 0);
    const [a, b] = [project(guide[i]), project(guide[j])];
    const z = (a.z + b.z) / 2 + 0.02;
    const fade = lerp(0.5, 1, depth(z));
    const line = (from: number, to: number, look: Pick<Stroke, 'width' | 'color' | 'alpha' | 'dash'>) => {
      if (to - from < 0.01) return;
      shapes.push({ kind: 'line', z, x1: lerp(a.x, b.x, from), y1: lerp(a.y, b.y, from), x2: lerp(a.x, b.x, to), y2: lerp(a.y, b.y, to), ...look });
    };

    if (!confirmed) {
      // Refuted: the dashed line parts in the middle and draws back to its two ends.
      const open = easeInOut(tested) / 2;
      const look = { width: 0.8, color: rgb(PENCIL), alpha: fade * (1 - tested * tested), dash: [2, 2.2] as const };
      line(0.5 - grown / 2, 0.5 - open, look);
      line(0.5 + open, 0.5 + grown / 2, look);
      return;
    }
    // Confirmed: the dashes close into a solid stitch, which then thins and stays.
    const color = mix(PENCIL, INK, tested);
    line(0.5 - grown / 2, 0.5 + grown / 2, {
      width: lerp(lerp(0.8, 1.6, tested), 0.8, settled),
      color,
      alpha: lerp(1, 0.62, settled) * fade,
      dash: tested < 1 ? [2, 2.2 * (1 - tested)] : undefined,
    });
    // A dot marks each end while the stitch closes.
    if (tested > 0 && settled < 1) {
      for (const p of [a, b]) shapes.push({ kind: 'dot', z: p.z + 0.03, x: p.x, y: p.y, r: lerp(0.6, 1.7, tested) * (1 - settled), color, alpha: fade });
    }
  });

  return shapes.sort((p, q) => p.z - q.z);
}

/** Length of the opening sequence in milliseconds. */
export const DURATION = CHAIN_START_MS + CHAIN_MS + TEST_MS + LINGER_MS + SETTLE_MS;

/**
 * The state of the sequence after `ms`. The proposed contacts appear, then the chain is traced
 * through `residues` residues, and each contact is tested when the chain reaches its later end.
 */
export function progressAt(ms: number, contacts: readonly Contact[], residues: number): Progress {
  const reached = contacts.map(([, j]) => CHAIN_START_MS + CHAIN_MS * easedAt(j / (residues - 1)));
  return {
    chain: easeInOut(clamp((ms - CHAIN_START_MS) / CHAIN_MS)),
    proposed: contacts.map((_, k) => easeOut(clamp((ms - k * PROPOSE_STAGGER_MS) / PROPOSE_MS))),
    tested: reached.map((at) => clamp((ms - at) / TEST_MS)),
    settled: reached.map((at) => easeInOut(clamp((ms - at - TEST_MS - LINGER_MS) / SETTLE_MS))),
  };
}

/** The molecule turns toward its resting view while the sequence plays, slowing to a stop. */
export function viewAt(ms: number): View {
  const left = 1 - clamp(ms / DURATION);
  return { yaw: REST.yaw - OPENING_TURN * left * left, pitch: REST.pitch };
}
