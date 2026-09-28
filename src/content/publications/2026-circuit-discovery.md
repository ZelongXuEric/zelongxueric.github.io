---
title: "Statistical Confidence for LLM Circuit Discovery via Randomized Interventions"
authors:
  - Zelong Xu
  - Yang Lu
status: under-review
year: 2026
order: 1
summary: "Estimating the causal contributions of circuit edges with calibrated statistical tests that reuse model evaluations."
image: ./figures/2026-circuit-discovery.png
imageAlt: "Recovery of shared (C), variable (V), and combined (U) components in three model-task settings: V recovers almost nothing alone, yet adding it to C more than doubles recovery, far beyond size-matched random additions."
---

Circuit discovery maps the connections in a large language model (LLM) that produce a target behavior, offering a route to audit and debug these models. Yet an edge’s contribution depends on which other connections are present. Establishing confidence in such discoveries therefore requires statistical evidence that accounts for circuit context. We introduce a randomized-intervention framework that estimates average edge contributions across three circuit densities, from sparse to near-complete, and tests whether each edge’s average effect is nonzero at any density. We draw candidate edges from several task-preserving input transformations and randomize their inclusion to construct different circuit contexts. Our method reuses the same model evaluations to compute p-values for all candidate edges, making large-scale assessment with multiple-testing correction practical. Across five model–task settings, including one with over 34,000 candidate edges, the resulting p-values are empirically calibrated: they stay uniform or conservative on structural negative controls, with zero false discoveries after correction. In every setting, edges selected under all input transformations pass correction at higher rates than those selected under only some. Fixed-circuit analyses in two tasks reveal superadditivity: variable components contribute little alone, but combining them with shared components more than doubles recovery. In each task, this gain exceeds those of all size-matched random additions. Together, these results show that an edge’s contribution is a property of its circuit context, and that randomized interventions make calibrated assessment of these contributions practical at scale.
