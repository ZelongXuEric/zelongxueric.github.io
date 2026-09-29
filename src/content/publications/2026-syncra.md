---
title: "SyncRA: Learning Temporal Correspondence in Omni-Modal Models"
authors:
  - Zelong Xu
  - Yan Li
  - Wenhe Hu
  - Xiyang Hu
status: under-review
year: 2026
order: 3
summary: "Learning audio-visual temporal correspondence from input timing alone, without extra annotations or inference-time cost."
arxiv: "2609.34363"
image: ./figures/2026-syncra.png
imageAlt: "SyncRA overview: audio and visual states from an omni-modal backbone are pooled over native time intervals, projected by a shared layer, and contrasted within the same video during training."
---

Recent omni-modal models demonstrate strong perception of audio and visual inputs, yet often struggle to connect what they hear with what they see at the same moment. This weakness in temporal correspondence can cause models to associate spoken cues with the wrong visual scenes, producing plausible answers grounded in incorrect audio-visual pairings. We diagnose this problem through controlled temporal swaps, revealing that model answers do not reliably follow changes in these pairings. To address it, we propose Synchrony-Guided Representation Alignment (SyncRA), a lightweight method for strengthening temporal correspondence between audio and vision. Specifically, SyncRA contrasts intermediate audio–visual representations within each video, aligning matching moments while separating mismatched ones to capture local temporal correspondence within a shared global context. The objective derives supervision directly from existing input timing, requiring no additional annotations and leaving inference unchanged. We evaluate SyncRA across four open omni-modal models spanning different sizes and architectures on five public video benchmarks. SyncRA consistently outperforms answer-only fine-tuning across all model–benchmark combinations, while substantially improving the ability to track changing audio–visual pairings in controlled evaluations. These results demonstrate that lightweight, targeted supervision can effectively strengthen temporal correspondence and translate into broad improvements in audio–visual question answering.
