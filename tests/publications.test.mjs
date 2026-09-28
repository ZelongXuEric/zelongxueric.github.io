import assert from 'node:assert/strict';
import test from 'node:test';
import { bibtex, isSameAuthor, primaryUrl, sortForDisplay, sortNewestFirst } from '../src/lib/publications.ts';

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
  assert.equal(primaryUrl(paper({ arxiv: '2606.07678', pdf: '/files/paper.pdf' })), 'https://arxiv.org/abs/2606.07678');
});

test('no incomplete generated citation when the author list is unknown', () => {
  assert.equal(bibtex(paper({ authors: [], status: 'under-review' })), '');
});

test('under-review work never acquires a conference publication citation', () => {
  const result = bibtex(paper({ status: 'under-review', venue: 'Submission venue', arxiv: '2606.07678' }));
  assert.match(result, /^@misc/);
  assert.doesNotMatch(result, /booktitle|Submission venue/);
  assert.match(result, /archivePrefix\s*= \{arXiv\}/);
});

test('published work has its venue and clean author names in BibTeX', () => {
  const result = bibtex(paper({ status: 'published', venue: 'Findings of EMNLP 2026', arxiv: '2606.07678' }));
  assert.match(result, /^@inproceedings\{xu2026an,/);
  assert.match(result, /author\s*= \{Zelong Xu and Second Author\}/);
  assert.match(result, /booktitle\s*= \{Findings of EMNLP 2026\}/);
  assert.match(result, /https:\/\/arxiv.org\/abs\/2606.07678/);
});

test('an explicitly supplied citation is preserved', () => {
  assert.equal(bibtex(paper({ authors: [], bibtex: '  @misc{custom, title={Custom}}\n' })), '@misc{custom, title={Custom}}');
});

test('equal-contribution metadata does not change author order or add citation markers', () => {
  const authors = ['Prince Zizhuang Wang', 'Chenhao Liang', 'Zelong Xu', 'Aojie Yuan', 'Xiaolin Zhou', 'Haiyue Zhang', 'Yue Zhao', 'Xiyang Hu', 'Shuli Jiang'];
  const result = bibtex(paper({ authors, status: 'under-review', equalContribution: authors.slice(0, 5) }));
  assert.ok(result.includes(`{${authors.join(' and ')}}`));
  assert.doesNotMatch(result, /\*|co-first|equal contribution/);
  assert.deepEqual(authors.slice(0, 3), ['Prince Zizhuang Wang', 'Chenhao Liang', 'Zelong Xu']);
});
