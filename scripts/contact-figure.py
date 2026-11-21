"""Data for the sidebar figure: contacts a protein language model proposes, checked against a structure.

    pip install torch transformers numpy
    curl -O https://files.rcsb.org/download/1PGA.pdb
    python scripts/contact-figure.py 1PGA.pdb > src/data/contact-figure.json

ESM-2 predicts residue contacts from the sequence alone. The top L/2 pairs at least six residues
apart are kept in order of confidence, and each is marked confirmed when the two C-beta atoms
(C-alpha for glycine) lie within 8 angstroms in the crystal structure. Both cutoffs are the usual
ones for long-range contact prediction.
"""
import json
import math
import sys

import numpy as np
import torch
from transformers import AutoTokenizer, EsmForMaskedLM

MODEL = 'facebook/esm2_t30_150M_UR50D'
CONTACT_ANGSTROMS = 8.0
MIN_SEPARATION = 6
ONE_LETTER = dict(ALA='A', ARG='R', ASN='N', ASP='D', CYS='C', GLN='Q', GLU='E', GLY='G', HIS='H', ILE='I',
                  LEU='L', LYS='K', MET='M', PHE='F', PRO='P', SER='S', THR='T', TRP='W', TYR='Y', VAL='V')


def read_chain(path, chain='A'):
    """One chain's first model and first alternate location: atoms by residue, and the strand residues."""
    residues, strands = {}, []
    with open(path) as lines:
        for line in lines:
            if line.startswith('ENDMDL'):
                break
            if line.startswith('SHEET') and line[21] == chain:
                strands.append((int(line[22:26]), int(line[33:37])))
            if line.startswith('ATOM') and line[21] == chain and line[16] in ' A':
                residue = residues.setdefault(int(line[22:26]), {'name': line[17:20]})
                residue[line[12:16].strip()] = (float(line[30:38]), float(line[38:46]), float(line[46:54]))
    numbers = sorted(residues)
    in_strand = [any(first <= n <= last for first, last in strands) for n in numbers]
    return [residues[n] for n in numbers], in_strand


def viewing_frame(points, in_strand):
    """Centered coordinates with the beta sheet facing the viewer (+z) and its strands running left to right (x).

    The chain starts on the left and the rest of the fold lies behind the sheet. Without a sheet,
    the principal axes are used. The frame is right-handed, so the molecule is never mirrored.
    """
    centered = points - points.mean(axis=0)
    has_sheet = sum(in_strand) >= 3
    sheet = centered[np.array(in_strand)] if has_sheet else centered
    along, _, normal = np.linalg.svd(sheet - sheet.mean(axis=0), full_matrices=False)[2]
    if has_sheet and (centered[~np.array(in_strand)].mean(axis=0) - sheet.mean(axis=0)) @ normal > 0:
        normal = -normal
    if along @ centered[0] > 0:
        along = -along
    return centered @ np.array([along, np.cross(normal, along), normal]).T


def main(pdb_path):
    residues, in_strand = read_chain(pdb_path)
    sequence = ''.join(ONE_LETTER[r['name']] for r in residues)
    length = len(sequence)
    side = [r.get('CB', r['CA']) for r in residues]

    torch.set_num_threads(2)
    tokenizer = AutoTokenizer.from_pretrained(MODEL)
    model = EsmForMaskedLM.from_pretrained(MODEL, attn_implementation='eager').eval()
    encoded = tokenizer(sequence, return_tensors='pt')
    with torch.no_grad():
        probability = model.esm.predict_contacts(encoded['input_ids'], encoded['attention_mask'])[0]
    assert probability.shape == (length, length)

    ranked = sorted(
        ((float(probability[i, j]), i, j) for i in range(length) for j in range(i + MIN_SEPARATION, length)),
        reverse=True,
    )[: length // 2]
    contacts = [[i, j, int(math.dist(side[i], side[j]) < CONTACT_ANGSTROMS)] for _, i, j in ranked]

    ca = viewing_frame(np.array([r['CA'] for r in residues]), in_strand)
    json.dump({
        'pdb': pdb_path.rsplit('/', 1)[-1].split('.')[0].upper(),
        'model': MODEL,
        'sequence': sequence,
        'ca': [[round(float(v), 2) for v in point] for point in ca],
        'contacts': contacts,
    }, sys.stdout, separators=(',', ':'))
    sys.stdout.write('\n')


if __name__ == '__main__':
    main(sys.argv[1])
