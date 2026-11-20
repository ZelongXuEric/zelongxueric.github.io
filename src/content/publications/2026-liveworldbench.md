---
title: "LiveWorldBench: Can Frontier Agents Operate in Live and Real-time Worlds?"
# 17 authors; the names shown are the confirmed ones, in the paper's order.
authors:
  - Prince Zizhuang Wang
  - Yuding Wang
  - Yingtao Luo
  - Zelong Xu
  - Aojie Yuan
  - Xiaolin Zhou
  - "…"
  - Yue Zhao
  - Xiyang Hu
  - Shuli Jiang
authorCount: 17
equalContribution:
  - Prince Zizhuang Wang
  - Yuding Wang
  - Yingtao Luo
  - Zelong Xu
  - Aojie Yuan
  - Xiaolin Zhou
status: under-review
year: 2026
order: 5
summary: "A benchmark of real-time tasks in released software, unmodified games, and live robot physics, where the world keeps moving while the agent thinks."
image: ./figures/2026-liveworldbench.png
imageAlt: "Left: real-time tasks in ZoneMinder, 0 A.D., and a UR5e cobot cell. Right: with the same thinking time, a conveyor pick is correct when the world is paused or at half speed, late at native speed, and missed at double speed."
---

Computer-use agents increasingly act on systems that do not wait for them: a dispatch queue fills while the agent reads it, a conveyor keeps moving while it plans a pick, and a match goes on while it chooses a move. Benchmarks for these agents almost always freeze the world between actions, and the few that let the clock run use worlds built for the test and grade only pass or fail at a single speed. We introduce LiveWorldBench, a benchmark that asks whether agents can operate in real time. Its tasks run on the world’s own clock in real software, real games and live robot physics, and each outcome is checked by a task-specific verifier rather than a judge model. A gateway places every look, every input and every world event on one clock, so each task can also be run at several tempos and under a paused control. We evaluate 18 configurations of frontier and open-weight models, including faster inference tiers and a sweep of reasoning effort. Only 4.1% of trials pass, most tasks are solved by no configuration, and no open-weight model passes a single trial. Agents mostly fail on pace: in 58% of frontier trials the agent acts too late or too rarely for the world. Faster inference helps only models that already decide well, and more reasoning does not help at all.
