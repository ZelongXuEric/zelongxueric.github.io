import assert from 'node:assert/strict';
import test from 'node:test';
import { isElision, isSameAuthor, primaryUrl, sortForDisplay, sortNewestFirst, venueLine } from '../src/lib/publications.ts';

const paper = (overrides = {}) => ({
  id: 'example',
  collection: 'publications',
  data: {
    title: 'An Example Paper',
    authors: ['Zelong Xu*', 'Second Author'],
    status: 'preprint',
    year: 2026,
    order: 100,
    ...overrides,
  },
});

test('editorial order wins, with newest-first ties and no input mutation', () => {
  const first = paper({ order: 1, year: 2025 });
  const older = paper({ order: 2, date: new Date('2026-01-01') });
  const newer = paper({ order: 2, date: new Date('2026-09-01') });
  const input = [older, newer, first];
  assert.deepEqual(sortForDisplay(input), [first, newer, older]);
  assert.deepEqual(input, [older, newer, first]);
});

test('undated papers fall back to their year', () => {
  const recent = paper({ year: 2026 });
  const earlier = paper({ year: 2025 });
  assert.deepEqual(sortNewestFirst([earlier, recent]), [recent, earlier]);
});

test('author highlighting recognizes contribution markers without partial matches', () => {
  assert.equal(isSameAuthor('Zelong Xu*', 'Zelong Xu'), true);
  assert.equal(isSameAuthor('Zelong Xu\u2020', 'Zelong Xu'), true);
  assert.equal(isSameAuthor('Another Zelong Xu', 'Zelong Xu'), false);
});

test('title URL uses the best available public resource, or stays unlinked', () => {
  assert.equal(primaryUrl(paper()), undefined);
  assert.equal(primaryUrl(paper({ project: '/projects/example' })), '/projects/example');
  assert.equal(primaryUrl(paper({ doi: '10.1234/example', project: '/projects/example' })), 'https://doi.org/10.1234/example');
  assert.equal(primaryUrl(paper({ pdf: '/files/paper.pdf', doi: '10.1234/example' })), '/files/paper.pdf');
  assert.equal(primaryUrl(paper({ arxiv: '2606.07678', pdf: '/files/paper.pdf' })), '/files/paper.pdf');
  assert.equal(primaryUrl(paper({ arxiv: '2606.07678', doi: '10.1234/example' })), 'https://arxiv.org/pdf/2606.07678');
});

test('an abbreviated author list is recognized by its elision entry', () => {
  assert.equal(isElision('…'), true);
  assert.equal(isElision(' ... '), true);
  assert.equal(isElision('Zelong Xu'), false);
});

test('the venue line names the venue only for published work', () => {
  assert.equal(venueLine({ status: 'published', venue: 'Findings of EMNLP 2026', year: 2026 }), 'Findings of EMNLP 2026');
  assert.equal(venueLine({ status: 'published', venue: 'Some Journal', year: 2026 }), 'Some Journal · 2026');
  assert.equal(venueLine({ status: 'under-review', venue: 'Submission venue', year: 2026 }), 'Under review · 2026');
  assert.equal(venueLine({ status: 'preprint', year: 2026 }), 'Preprint · 2026');
  assert.equal(venueLine({ status: 'manuscript', year: 2026 }), 'Manuscript · 2026');
});
