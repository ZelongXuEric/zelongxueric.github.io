import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { duration, fit, model, REST, scene, viewAt } from '../src/lib/contactFigure.ts';

const data = JSON.parse(readFileSync(new URL('../src/data/contact-figure.json', import.meta.url), 'utf8'));
const ribbon = model(data);
const count = data.contacts.length;
const total = duration(count);
const frame = { width: 212, height: 152, scale: fit(ribbon, 212, 152) };
const at = (ms, view = viewAt(ms, count)) => scene(ribbon, view, frame, ms);
const kinds = (shapes) => new Set(shapes.map((shape) => shape.kind));

test('the figure data is one residue per coordinate, with long-range contacts in range', () => {
  assert.equal(data.ca.length, data.sequence.length);
  assert.equal(data.o.length, data.sequence.length);
  assert.match(data.structure, new RegExp(`^[EH-]{${data.sequence.length}}$`));
  assert.equal(count, Math.floor(data.sequence.length / 2));
  for (const [i, j, confirmed] of data.contacts) {
    assert.ok(i >= 0 && j < data.ca.length && j - i >= 6, `${i}-${j}`);
    assert.ok(confirmed === 0 || confirmed === 1);
  }
});

test('the ribbon is wide on strands and the helix, a line on loops, and ends each strand in a point', () => {
  const near = (residue) => ribbon.samples.find((s) => s.u >= residue - 1e-9);
  [...data.structure].forEach((kind, i) => {
    const interior = data.structure[i - 1] === kind && data.structure[i + 1] === kind && data.structure[i + 2] === kind;
    if (!interior || i < 1) return;
    if (kind === '-') assert.equal(near(i).width, 0, `loop at ${i}`);
    else assert.ok(near(i).width > 1.4, `${kind} at ${i}`);
  });
  [...data.structure].forEach((kind, i) => {
    if (kind === 'E' && data.structure[i + 1] !== 'E') assert.ok(near(i).width < 1e-6, `strand ending at ${i}`);
  });
  for (const s of ribbon.samples) assert.ok(Math.abs(Math.hypot(...s.side) - 1) < 1e-6, 'the side vector is a unit vector');
});

test('nothing is drawn before the sequence starts, and the ribbon comes first', () => {
  assert.deepEqual(at(0), []);
  assert.ok([...kinds(at(1500))].every((kind) => kind === 'band' || kind === 'loop'));
});

test('contacts are shown while they are tested and leave a clean ribbon behind', () => {
  assert.ok(kinds(at(4200)).has('stitch'));
  const end = at(total);
  assert.deepEqual([...kinds(end)].sort(), ['band', 'loop']);
  assert.ok(end.every((shape, n) => n === 0 || end[n - 1].z <= shape.z), 'sorted back to front');
});

test('a refuted contact breaks in two and a confirmed one stays whole', () => {
  const refuted = data.contacts.findIndex(([, , confirmed]) => !confirmed);
  const only = (k) => scene({ ...ribbon, contacts: data.contacts.map((c, n) => (n === k ? c : [c[0], c[1], c[2]])).slice(k, k + 1) }, REST, frame, 3500 + 300).filter((s) => s.kind === 'stitch');
  assert.equal(only(refuted).length, 2);
  assert.equal(only(data.contacts.findIndex(([, , confirmed]) => confirmed)).length, 1);
});

test('the view settles on the resting view, then sways unless motion is reduced', () => {
  assert.deepEqual(viewAt(total, count), REST);
  assert.deepEqual(viewAt(total + 6000, count, true), REST);
  assert.notDeepEqual(viewAt(total + 6000, count), REST);
});

test('lines stay ink; only the bands of the helix and strands take a color', () => {
  const channels = (color) => color.match(/\d+/g).map(Number);
  const neutral = (color) => Math.max(...channels(color)) - Math.min(...channels(color)) <= 4;
  const shapes = at(4200);
  for (const shape of shapes) assert.ok(neutral(shape.kind === 'band' ? shape.edge : shape.color));
  const fills = shapes.filter((shape) => shape.kind === 'band' && !neutral(shape.fill)).map((shape) => channels(shape.fill));
  assert.ok(fills.some(([r, , b]) => b > r), 'the helix is washed blue');
  assert.ok(fills.some(([r, , b]) => r > b), 'the strands are washed wheat');
});

test('the ribbon stays inside its frame at rest', () => {
  for (const shape of at(total, REST)) {
    const points = shape.kind === 'band' ? shape.corners : [shape.from, shape.to];
    for (const { x, y } of points) assert.ok(x >= 0 && x <= frame.width && y >= 0 && y <= frame.height);
  }
});
