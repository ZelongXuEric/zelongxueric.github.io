---
# Keep the arXiv id quoted so YAML does not read it as a number.
title: "DOG-DPO: Dynamic Optimization in Geometry for Safety Alignment"
authors:
  - Yi Nian
  - Tiankai Yang
  - Yudi Zhang
  - Qi Pan
  - Zelong Xu
  - Shenzhe Zhu
  - Qingqing Luan
  - Yue Huang
  - Xiangliang Zhang
  - Yue Zhao
venue: Findings of EMNLP 2026
year: 2026
date: 2026-06-04
arxiv: "2606.07678"
pdf: https://arxiv.org/pdf/2606.07678
code:              # e.g. https://github.com/...
project:           # project page, if any
doi:               # e.g. 10.18653/v1/... once in the ACL Anthology
selected: true
---

Safety alignment for large language models relies on preference data, but current pipelines often train on large, redundant datasets. Existing data selection methods typically score each preference pair independently, collapsing directional preference information into scalar quality or diversity scores. This sample-centric view is especially limiting in multi-dataset settings, where shared safety directions coexist with dataset-specific residual risks. We propose DOG-DPO, a training-free data selection framework that treats preference pairs as structured geometric signals. DOG-DPO first represents each preference pair as a direction in model representation space. It then decomposes multi-dataset preference geometry into a global anchor subspace and dataset-specific residual subspaces. Finally, it selects subsets by maximizing diversity-based coverage, encouraging broad, non-redundant coverage of alignment directions before DPO training. Across six safety benchmarks and two model backbones, DOG-DPO achieves a strong utility-robustness trade-off using only 11% of the preference pairs. It recovers most of the safety gains of full-data training while remaining entirely teacher-free, training-free, and substantially faster than representative selection baselines.
