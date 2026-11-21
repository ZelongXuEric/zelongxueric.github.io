import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { backbone, DURATION, fit, progressAt, REST, scene, smooth, viewAt } from '../src/lib/contactFigure.ts';

const data = JSON.parse(readFileSync(new URL('../src/data/contact-figure.json', import.meta.url), 'utf8'));
const guide = smooth(data.ca);
const curve = backbone(guide);
const frame = { width: 188, height: 140, scale: fit(curve, 188, 140) };
const at = (ms, view = viewAt(ms)) => scene(guide, curve, data.contacts, view, frame, progressAt(ms, data.contacts, guide.length));
const stitches = (shapes) => shapes.filter((shape) => shape.kind === 'line' && !shape.halo);

test('the figure data is one residue per coordinate, with long-range contacts in range', () => {
  assert.equal(data.ca.length, data.sequence.length);
  assert.equal(data.contacts.length, Math.floor(data.sequence.length / 2));
  for (const [i, j, confirmed] of data.contacts) {
    assert.ok(i >= 0 && j < data.ca.length && j - i >= 6, `${i}-${j}`);
    assert.ok(confirmed === 0 || confirmed === 1);
  }
});

test('the backbone curve passes through every residue and keeps both ends', () => {
  assert.equal(curve.length, (guide.length - 1) * 6 + 1);
  guide.forEach((point, i) => assert.deepEqual(curve[i * 6].map((v) => +v.toFixed(6)), point.map((v) => +v.toFixed(6))));
  assert.deepEqual(guide[0], data.ca[0]);
  assert.deepEqual(guide.at(-1), data.ca.at(-1));
});

test('the sequence opens on an empty frame, then shows proposals before any backbone', () => {
  assert.deepEqual(at(0), []);
  const early = at(600);
  assert.ok(early.length > 0);
  assert.ok(early.every((shape) => shape.kind === 'line' && shape.dash), 'only dashed proposals so far');
});

test('each contact is tested only once the chain has reached both of its residues', () => {
  for (let ms = 0; ms <= DURATION; ms += 50) {
    const progress = progressAt(ms, data.contacts, guide.length);
    data.contacts.forEach(([, j], k) => {
      if (progress.tested[k] > 0) assert.ok(progress.chain * (guide.length - 1) >= j - 1e-6, `contact ${k} at ${ms} ms`);
    });
  }
});

test('the finished figure keeps a solid stitch for each confirmed contact and nothing for the refuted', () => {
  const shapes = at(DURATION);
  assert.deepEqual(viewAt(DURATION), REST);
  assert.equal(stitches(shapes).length, data.contacts.filter(([, , confirmed]) => confirmed).length);
  assert.ok(stitches(shapes).every((stitch) => !stitch.dash));
  assert.ok(shapes.every((shape) => shape.kind === 'line'), 'no dots remain');
  assert.ok(shapes.every((shape, n) => n === 0 || shapes[n - 1].z <= shape.z), 'sorted back to front');
});

test('the drawing is a single ink: every color is a neutral grey', () => {
  for (const ms of [600, 2500, 4000, DURATION]) {
    for (const shape of at(ms)) {
      const [r, g, b] = shape.color.match(/\d+/g).map(Number);
      assert.ok(Math.max(r, g, b) - Math.min(r, g, b) <= 4, shape.color);
    }
  }
});

test('the molecule stays inside its frame at rest', () => {
  for (const shape of at(DURATION, REST)) {
    assert.ok(Math.min(shape.x1, shape.x2) >= 0 && Math.max(shape.x1, shape.x2) <= frame.width);
    assert.ok(Math.min(shape.y1, shape.y2) >= 0 && Math.max(shape.y1, shape.y2) <= frame.height);
  }
});
