/**
 * The intro figure: a ribbon diagram of one small protein in ink with a wash of color. The ribbon
 * is drawn along the chain; then the residue contacts a language model proposes are tested against
 * the structure one by one, and fade. This file is the geometry, the color, and the timing; the
 * component paints the shapes it returns.
 */

export type Vec3 = readonly [number, number, number];
/** Two residue indices, the earlier first, and whether the structure confirms the contact (1) or not (0). */
export type Contact = readonly [i: number, j: number, confirmed: number];
/** What scripts/contact-figure.py writes. `structure` has E for a strand, H for a helix, - for a loop. */
export interface FigureData { ca: readonly Vec3[]; o: readonly Vec3[]; structure: string; contacts: readonly Contact[] }

/** Viewing angles in radians: a turn about the vertical axis, then a tilt toward the viewer. */
export interface View { yaw: number; pitch: number }
/** The drawing area in CSS pixels, and pixels per angstrom. */
export interface Frame { width: number; height: number; scale: number }

interface Point { x: number; y: number }
export type Shape =
  /** A piece of ribbon: a filled quadrilateral with its two long edges inked. */
  | { kind: 'band'; z: number; corners: readonly [Point, Point, Point, Point]; fill: string; edge: string; width: number }
  /** A piece of loop, with a white halo so it passes cleanly over what lies behind. */
  | { kind: 'loop'; z: number; from: Point; to: Point; color: string; width: number }
  /** A contact between two residues. */
  | { kind: 'stitch'; z: number; from: Point; to: Point; color: string; width: number; alpha: number; dash?: readonly [number, number] }
  | { kind: 'dot'; z: number; x: number; y: number; r: number; color: string; alpha: number };

/** One point along the ribbon: its center, the unit vector across it, and its half-width in angstroms. */
export interface Sample { p: Vec3; side: Vec3; width: number; u: number; kind: string }
export interface Model { samples: Sample[]; anchors: Vec3[]; contacts: readonly Contact[]; length: number }

// The wash of color: slate blue on the helix and wheat on the strands, the pairing most
// structure figures use. Loops stay ink.
type Rgb = readonly [number, number, number];
const HELIX_HUE: Rgb = [88, 122, 172];
const STRAND_HUE: Rgb = [214, 176, 104];
const hueOf = (kind: string) => (kind === 'H' ? HELIX_HUE : kind === 'E' ? STRAND_HUE : null);
const WHITE: Rgb = [255, 255, 255];
const PENCIL = 132; // grey of a contact that has been proposed but not yet tested
const INK = 24;
const FAR = 178;

const CAMERA = 110; // angstroms from the center; far enough for only a mild perspective
const SAMPLES = 8; // per residue
const STRAND = 1.8; // half-widths in angstroms
const HELIX = 1.5;
const ARROW = 1.3; // residues an arrowhead takes up
const ARROW_WIDTH = 3;

/** The resting view: the helix in front, lying across the sheet. */
export const REST: View = { yaw: 2.7, pitch: -0.18 };
/** How far the pointer can turn the molecule from where it is, in radians. */
export const REACH: View = { yaw: 0.45, pitch: 0.22 };
/** After the sequence the molecule sways this far to either side, slowly. */
const SWAY: View = { yaw: 0.2, pitch: 0.05 };
const SWAY_MS: View = { yaw: 16000, pitch: 21000 };
const OPENING_TURN = 0.9; // radians the molecule turns through while the sequence plays

const DRAW_MS = 3200; // the ribbon being drawn
const PROPOSE_AT = 2300; // contacts appear, a little apart, in the model's order of confidence
const PROPOSE_GAP = 40;
const PROPOSE_MS = 500;
const TEST_AT = 3500; // then each is tested in turn
const TEST_GAP = 60;
const TEST_MS = 420;
const LINGER_MS = 220;
const FADE_MS = 700;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const mix = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const easeInOut = (t: number) => (1 - Math.cos(Math.PI * clamp(t))) / 2;
const easeOut = (t: number) => 1 - (1 - clamp(t)) ** 3;
const smoothstep = (t: number) => clamp(t) ** 2 * (3 - 2 * clamp(t));
const rgb = (c: Vec3) => `rgb(${Math.round(c[0])} ${Math.round(c[1])} ${Math.round(c[2])})`;
const grey = (v: number) => rgb([v, v + 1, v + 2]);
/** Ink for a line at depth `t`: light at the back of the molecule, dark at the front. */
const ink = (t: number) => grey(lerp(FAR, INK, clamp(t)));

/** Catmull-Rom through the points, `pieces` between neighbors, ending on the last point. */
function spline(points: readonly Vec3[], pieces: number): Vec3[] {
  const at = (i: number) => points[Math.min(points.length - 1, Math.max(0, i))];
  const out: Vec3[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let s = 0; s < pieces; s++) {
      const t = s / pieces;
      const along = (k: 0 | 1 | 2) => 0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t * t * t);
      out.push([along(0), along(1), along(2)]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Moves each point toward the midpoint of its neighbors by `amount(i)`; the two ends stay in place. */
const soften = (points: readonly Vec3[], amount: (i: number) => number): Vec3[] =>
  points.map((p, i) => (i === 0 || i === points.length - 1 ? p : mix(p, mul(add(points[i - 1], points[i + 1]), 0.5), amount(i))));

/** The ribbon for a chain: flat arrows for strands, a coiled band for a helix, a thin line for loops. */
export function model(data: FigureData): Model {
  const { ca, o, structure } = data;
  const n = ca.length;
  // Each residue's peptide plane gives the direction across the ribbon (Carson and Bugg, 1986).
  // Neighbors are kept on the same side, so a strand lies flat instead of twisting at every residue.
  let sides = ca.map((p, i) => {
    const along = i < n - 1 ? sub(ca[i + 1], p) : sub(p, ca[i - 1]);
    return unit(cross(cross(along, sub(o[i], p)), along));
  });
  for (let i = 1; i < n; i++) if (dot(sides[i], sides[i - 1]) < 0) sides[i] = mul(sides[i], -1);
  for (let pass = 0; pass < 2; pass++) sides = sides.map((d, i) => (i === 0 || i === n - 1 ? d : unit(add(add(sides[i - 1], mul(d, 2)), sides[i + 1]))));
  // Strands lose the zigzag of their alpha carbons; the helix keeps its coil.
  const eased = soften(ca, (i) => (structure[i] === 'E' ? 0.8 : structure[i] === 'H' ? 0 : 0.5));
  const line = spline(soften(eased, (i) => (structure[i] === 'E' ? 0.5 : 0)), SAMPLES);
  const half = (i: number) => (structure[i] === 'E' ? STRAND : structure[i] === 'H' ? HELIX : 0);
  const strandEnd = (i: number) => structure[i] === 'E' && structure[i + 1] !== 'E';

  const samples: Sample[] = [];
  line.forEach((p, k) => {
    const u = k / SAMPLES;
    const i = Math.min(n - 2, Math.floor(u));
    const t = u - i;
    const tangent = unit(sub(line[Math.min(line.length - 1, k + 1)], line[Math.max(0, k - 1)]));
    const across = unit(mix(sides[i], sides[i + 1], t));
    const side = unit(sub(across, mul(tangent, dot(across, tangent))));
    const kind = structure[Math.min(n - 1, Math.round(u))];
    let width = lerp(half(i), half(i + 1), smoothstep(t)) * smoothstep(u / 0.6); // the chain starts as a point
    // A strand ends in an arrowhead: wider than the strand at its base, a point at the last residue.
    const end = [i, i + 1].find(strandEnd);
    if (end !== undefined && u >= end - ARROW && u <= end) {
      if (Math.abs(u - (end - ARROW)) < 1e-9) samples.push({ p, side, width: STRAND, u, kind });
      width = (ARROW_WIDTH * (end - u)) / ARROW;
    } else if (end !== undefined && u > end) {
      width = 0;
    }
    samples.push({ p, side, width, u, kind });
  });
  return { samples, anchors: ca.map((_, i) => samples.find((s) => s.u >= i - 1e-9)!.p), contacts: data.contacts, length: n };
}

/** Molecule space to camera space. */
function rotation(view: View) {
  const [cy, sy, cp, sp] = [Math.cos(view.yaw), Math.sin(view.yaw), Math.cos(view.pitch), Math.sin(view.pitch)];
  return ([x, y, z]: Vec3): Vec3 => {
    const x1 = x * cy + z * sy;
    const z1 = z * cy - x * sy;
    return [x1, y * cp - z1 * sp, z1 * cp + y * sp];
  };
}

/** Pixels per angstrom that keep the ribbon inside the frame however far it sways or the pointer turns it. */
export function fit(shape: Model, width: number, height: number, margin = 7): number {
  const edges = shape.samples.flatMap((s) => [add(s.p, mul(s.side, s.width)), sub(s.p, mul(s.side, s.width))]);
  let scale = Infinity;
  for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) {
    const turn = rotation({ yaw: REST.yaw + a * (REACH.yaw + SWAY.yaw), pitch: REST.pitch + b * (REACH.pitch + SWAY.pitch) });
    for (const edge of edges) {
      const [x, y, z] = turn(edge);
      const k = CAMERA / (CAMERA - z);
      scale = Math.min(scale, (width / 2 - margin) / Math.abs(x * k), (height / 2 - margin) / Math.abs(y * k));
    }
  }
  return scale;
}

/** Length of the opening sequence for a number of contacts, in milliseconds. */
export const duration = (contacts: number) => TEST_AT + Math.max(0, contacts - 1) * TEST_GAP + TEST_MS + LINGER_MS + FADE_MS;

/**
 * Where the molecule is turned to at `ms`. It turns toward its resting view while the sequence
 * plays, slowing to a stop, and afterwards sways slowly about that view (unless `still`).
 */
export function viewAt(ms: number, contacts: number, still = false): View {
  const total = duration(contacts);
  const left = 1 - clamp(ms / total);
  const since = Math.max(0, ms - total);
  const sway = still ? 0 : smoothstep(since / 2500);
  return {
    yaw: REST.yaw - OPENING_TURN * left * left + sway * SWAY.yaw * Math.sin((2 * Math.PI * since) / SWAY_MS.yaw),
    pitch: REST.pitch + sway * SWAY.pitch * Math.sin((2 * Math.PI * since) / SWAY_MS.pitch),
  };
}

/** Everything to draw at `ms` into the sequence, sorted from the back of the molecule to the front. */
export function scene(shape: Model, view: View, frame: Frame, ms: number): Shape[] {
  const turn = rotation(view);
  const project = ([x, y, z]: Vec3) => {
    const k = (frame.scale * CAMERA) / (CAMERA - z);
    return { x: frame.width / 2 + x * k, y: frame.height / 2 - y * k, z };
  };
  const shapes: Shape[] = [];

  const placed = shape.samples.map((s) => ({ c: turn(s.p), side: sub(turn(add(s.p, s.side)), turn(s.p)), width: s.width, hue: hueOf(s.kind) }));
  const zs = placed.map((s) => s.c[2]);
  const [back, front] = [Math.min(...zs), Math.max(...zs)];
  const depth = (z: number) => clamp((z - back) / (front - back || 1));
  const points = placed.map((s, k) => {
    const along = unit(sub(placed[Math.min(placed.length - 1, k + 1)].c, placed[Math.max(0, k - 1)].c));
    return {
      c: project(s.c),
      l: project(sub(s.c, mul(s.side, s.width))),
      r: project(add(s.c, mul(s.side, s.width))),
      width: s.width,
      hue: s.hue,
      facing: Math.abs(unit(cross(along, s.side))[2]), // 1 when the band faces the viewer squarely
    };
  });

  const drawn = easeInOut(ms / DRAW_MS) * (points.length - 1);
  for (let k = 0; k < Math.ceil(drawn); k++) {
    const [a, b] = [points[k], points[k + 1]];
    const z = (a.c.z + b.c.z) / 2;
    const t = depth(z);
    if (Math.max(a.width, b.width) < 0.25) {
      shapes.push({ kind: 'loop', z, from: a.c, to: b.c, color: ink(t), width: lerp(0.9, 1.9, t) });
      continue;
    }
    // A band is brightest where it faces the viewer. Its hue is a wash: pale on the lit face,
    // fuller where the band turns away, and fainter toward the back of the molecule.
    const lit = smoothstep(((a.facing + b.facing) / 2) * 1.15);
    const hue = a.hue ?? b.hue;
    const shade = lerp(206, 255, lit);
    const wash: Vec3 = hue ? mix(mul(mix(WHITE, hue, 0.74), 0.97), mix(WHITE, hue, 0.3), lit) : [shade, shade, shade]; // grey where the ribbon narrows into a loop
    shapes.push({ kind: 'band', z, corners: [a.l, a.r, b.r, b.l], fill: rgb(mix(wash, WHITE, (1 - t) * 0.22)), edge: ink(lerp(0.35, 1, t)), width: lerp(0.75, 1.35, t) });
  }

  shape.contacts.forEach(([i, j, confirmed], k) => {
    const grown = easeOut((ms - PROPOSE_AT - k * PROPOSE_GAP) / PROPOSE_MS);
    if (grown <= 0) return;
    const tested = clamp((ms - TEST_AT - k * TEST_GAP) / TEST_MS);
    const faded = easeInOut((ms - TEST_AT - k * TEST_GAP - TEST_MS - LINGER_MS) / FADE_MS);
    if (faded >= 1) return;
    const [a, b] = [project(turn(shape.anchors[i])), project(turn(shape.anchors[j]))];
    const z = (a.z + b.z) / 2 + 1.4; // a contact lies just above the two bands it joins
    const strength = lerp(0.6, 1, depth((a.z + b.z) / 2));
    const piece = (from: number, to: number, look: { color: string; width: number; alpha: number; dash?: readonly [number, number] }) => {
      if (to - from < 0.01) return;
      shapes.push({ kind: 'stitch', z, from: { x: lerp(a.x, b.x, from), y: lerp(a.y, b.y, from) }, to: { x: lerp(a.x, b.x, to), y: lerp(a.y, b.y, to) }, ...look });
    };
    if (!confirmed) {
      // Refuted: the dashed line parts in the middle and draws back to its two ends.
      const open = easeInOut(tested) / 2;
      const look = { color: grey(PENCIL), width: 0.8, alpha: strength * (1 - tested * tested), dash: [2, 2.2] as const };
      piece(0.5 - grown / 2, 0.5 - open, look);
      piece(0.5 + open, 0.5 + grown / 2, look);
      return;
    }
    // Confirmed: the dashes close into a solid line with a dot at each end, which then fades.
    const color = grey(lerp(PENCIL, INK, tested));
    piece(0.5 - grown / 2, 0.5 + grown / 2, { color, width: lerp(lerp(0.8, 1.6, tested), 0.8, faded), alpha: (1 - faded) * strength, dash: tested < 1 ? [2, 2.2 * (1 - tested)] : undefined });
    if (tested > 0) for (const p of [a, b]) shapes.push({ kind: 'dot', z: z + 0.01, x: p.x, y: p.y, r: lerp(0.6, 1.7, tested) * (1 - faded), color, alpha: strength });
  });

  return shapes.sort((p, q) => p.z - q.z);
}
