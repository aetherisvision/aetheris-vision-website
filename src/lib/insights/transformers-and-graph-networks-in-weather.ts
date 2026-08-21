import { AUTHOR, CATEGORY_FOUNDATIONS, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 3,
  slug: "transformers-and-graph-networks-in-weather",
  title: "Transformers and Graph Networks: The Models Behind the Headlines",
  date: "Aug 5, 2026",
  category: CATEGORY_FOUNDATIONS,
  author: AUTHOR,
  summary:
    "How attention-based and graph-based architectures produce global ten-day forecasts in under a minute, what the skill scores really say, and the caveats the press releases skip.",
  content: `
This is the family behind every "AI beats traditional weather forecasting" headline since 2022: GraphCast, Pangu-Weather, FourCastNet, AIFS, and their descendants. The claims are partly true, genuinely important — and consistently oversold. This article explains how these models work and gives you the tools to read the headlines critically.

## The short version

The [CNN article](/blog/cnns-in-weather) ended at a wall: convolution sees locally, but the atmosphere is a global, interconnected fluid. A trough leaving East Asia shapes weather over North America days later. A model stepping the whole planet forward six hours at a time needs some mechanism for distant points to exchange information efficiently.

Two architectures deliver that:

**Transformers** replace fixed local filters with **attention**: every element of the input can look at every other element and decide, dynamically, what is relevant. Attention is expensive — cost grows with the square of the number of elements — so weather transformers make it tractable with windowing tricks (Pangu-Weather's 3D Earth-specific windows) or by mixing information in frequency space (FourCastNet's Fourier operators).

**Graph neural networks (GNNs)** abandon the rectangular grid entirely. GraphCast maps the atmosphere onto a mesh of nodes spread quasi-uniformly over the sphere — no polar distortion — with edges at multiple scales, short ones for local detail and long ones that let information hop across the planet in a few steps. Learning happens as messages passed along edges.

Either way, the training recipe is the same and is worth stating plainly, because it defines both the power and the limits: **take roughly forty years of ERA5 reanalysis — our best gridded reconstruction of the atmosphere across the satellite era — and learn the function that maps the state now to the state six hours from now.** Apply that function repeatedly and you have a ten-day global forecast.

![Schematic: attention and multi-scale graph edges let distant points on the globe exchange information in a few steps.](/images/insights/global-attention.svg)

## What they genuinely achieve

- **Skill.** On standard headline metrics — RMSE and anomaly correlation for mid-tropospheric geopotential, temperature, wind — the leading models match or beat ECMWF's high-resolution physical forecast (long the gold standard) over medium-range lead times, on hundreds of evaluation targets. This has been reproduced independently, including by ECMWF itself; it is not a cherry-picked press claim.
- **Speed.** A ten-day global forecast takes tens of seconds to a minute on a single accelerator, versus roughly an hour on a multi-million-dollar supercomputer for the physical equivalent. That is a three-to-four-orders-of-magnitude cost change, and it is the real revolution: it makes large ensembles, rapid reruns, and forecast experimentation cheap.
- **Real structures, tracked well.** Tropical cyclone positions and atmospheric-river evolution verify well in the leading models — these are not toy statistics.

## The caveats the headlines skip

- **They stand on physics' shoulders — twice.** These models are trained on *reanalysis*: a dataset produced by a physical model fusing observations through data assimilation. And every operational run is *initialized* from an analysis produced the same way. Remove the physical modeling infrastructure and there is nothing to learn from and nothing to start from. "AI replaces physics" is exactly wrong; AI currently rides on physics. End-to-end systems that forecast from raw observations exist as research (Aardvark Weather, 2025) but are early.
- **Deterministic training causes blurring.** Models trained to minimize average error hedge toward the mean of possible futures — the same failure mode as CNN nowcasting, at planetary scale. Sharp gradients soften with lead time, and intensity extremes (a hurricane's peak winds, a record heat dome) are systematically muted even when position is right. Headline RMSE actually *rewards* this hedging, which is why blur-aware and probabilistic evaluation matters — and why the field moved to ensemble and diffusion approaches like [GenCast](/blog/gencast) and AIFS-CRPS.
- **The resolution ceiling is inherited.** Trained at ERA5's quarter-degree grid (~28 km), these models cannot represent individual thunderstorms, terrain-driven winds, or anything convection-scale. A quarter-degree AI forecast is a synoptic tool, full stop.
- **Out-of-distribution weather is a live question.** The training archive contains a finite sample of climate. Events without precedent — and a changing background climate — probe the models exactly where learned statistics are weakest. Physical models generalize from equations; learned models generalize from history.
- **No conservation guarantees.** Mass, energy, and moisture budgets are approximately respected at best. For downstream physical computation, that can matter in ways pretty maps do not reveal.

## How to read the next headline

Ask four questions. Which metric — and does it reward blur? Which baseline — the deterministic physical model or the ensemble? Which initialization — was the AI model fed the physical center's own analysis? And which variables — headline scores on smooth mid-atmosphere fields say little about surface extremes. Models that survive those four questions are doing something real.

The individual [model profiles](/blog/state-of-ai-weather-models-2026) in this series apply exactly this lens, one model at a time.

## The honest summary

Transformer and graph models are the real thing: a genuine change in how global forecasts can be produced, validated by the most demanding verification community in applied science. They are also, today, synoptic-scale pattern engines that inherit their worldview from physical reanalysis, hedge under uncertainty unless trained probabilistically, and depend on NWP infrastructure at both ends. Both halves of that sentence are true at once. That is not a contradiction; it is just what the technology actually is.

---

## References & further learning

**Accessible starting points**

- [ECMWF: the AIFS blog](https://www.ecmwf.int/en/about/media-centre/aifs-blog) — measured institutional accounts from the center that verifies everyone.
- [Google DeepMind: GraphCast blog](https://deepmind.google/discover/blog/graphcast-ai-model-for-faster-and-more-accurate-global-weather-forecasting/) — the accessible companion to the Science paper.

**Technical depth**

- Vaswani, A., et al. (2017). ["Attention Is All You Need."](https://arxiv.org/abs/1706.03762) The transformer paper itself.
- Lam, R., et al. (2023). ["Learning skillful medium-range global weather forecasting."](https://doi.org/10.1126/science.adi2336) *Science*, 382. GraphCast.
- Bi, K., et al. (2023). ["Accurate medium-range global weather forecasting with 3D neural networks."](https://doi.org/10.1038/s41586-023-06185-3) *Nature*, 619. Pangu-Weather.
- Ben Bouallègue, Z., et al. (2024). ["The Rise of Data-Driven Weather Forecasting."](https://doi.org/10.1175/BAMS-D-23-0162.1) *BAMS*, 105. ECMWF's independent evaluation — essential hype control.
- Rasp, S., et al. (2024). ["WeatherBench 2: A benchmark for the next generation of data-driven global weather models."](https://arxiv.org/abs/2308.15560) The scoreboard the field actually uses.

*Next in the series: the model profiles, beginning with [FourCastNet](/blog/fourcastnet).*
`,
};

export default article;
