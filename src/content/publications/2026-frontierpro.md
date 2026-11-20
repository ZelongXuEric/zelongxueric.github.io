---
title: "FrontierPro: Benchmarking Computer-Use Agents on Closed-Loop Professional Work Across Digital and Physical Worlds"
# 17 authors; the names shown are the confirmed ones, in the paper's order.
authors:
  - Prince Zizhuang Wang
  - Yingtao Luo
  - Zelong Xu
  - Yuding Wang
  - Chenhao Liang
  - Defu Cao
  - "…"
  - Yue Zhao
  - Xiyang Hu
  - Shuli Jiang
authorCount: 17
equalContribution:
  - Prince Zizhuang Wang
  - Yingtao Luo
  - Zelong Xu
  - Yuding Wang
  - Chenhao Liang
  - Defu Cao
status: under-review
year: 2026
order: 4
summary: "A benchmark where agents work in professional software, probe physical systems that depart from their documentation, and are graded on held-out physical instances."
image: ./figures/2026-frontierpro.png
imageAlt: "The FrontierPro loop on a harbour-entry task: the agent works in professional software, acts in the physical world, finds that the GPS is 200 m off while radar and the view disagree, and has its saved work verified against the true track."
---

Professional scientific and engineering work runs as a closed loop between software and the physical world: practitioners plan and design in software, test their work in the physical world, and revise it when the world departs from its documentation. Benchmarks for computer-use agents stop at the software and benchmarks of physical tasks bypass it, so whether AI agents can close this loop has not been tested. We introduce FrontierPro, a benchmark of closed-loop tasks that combine professional work in software with field work in the physical world, across five domains: engineering design, laboratory measurement, machine programming, embodied teleoperation of robots and vehicles, and physical simulation. Agents work through the visual interfaces of professional software such as FreeCAD, QCoDeS, OpenPnP, Beremiz, and QGroundControl, and of purpose-built operator consoles; they must turn decisions made in software into physical probes, reconcile what they observe with nominal documentation, and refine their work within experimental budgets. Each task verifies the agent’s saved work by building, simulating, or stress-testing it on held-out physical instances rather than with an LLM judge. To keep every task a faithful, high-quality test, all tasks go through the same quality-control pipeline: each starts from a seed written by a domain expert, its verifier is calibrated against reference and flawed solutions, a separate agent searches it for shortcuts, and frontier models attempt it while domain experts read every failed trajectory. Our evaluation of frontier agents shows that operating professional software is no longer the obstacle; closing the loop with the physical world is. Agents run experiments that cannot tell competing explanations apart, trust documentation and instrument readings over contradicting evidence, and release work never tested under the conditions it will face; even the strongest agent fails most of its attempts, and almost none succeed when the world runs in real time.
