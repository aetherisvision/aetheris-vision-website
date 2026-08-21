import { AUTHOR, CATEGORY_PROFILES, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 10,
  slug: "neuralgcm",
  title: "Model Profile: NeuralGCM",
  date: "Aug 18, 2026",
  category: CATEGORY_PROFILES,
  author: AUTHOR,
  summary:
    "Google's NeuralGCM keeps the equations of atmospheric motion and lets a neural network learn only what physics can't resolve — the clearest demonstration that physics-versus-ML is a false choice.",
  content: `
*Part of our model-profile series. Template and critical lens described in [the foundations article](/blog/transformers-and-graph-networks-in-weather).*

## What it is

NeuralGCM, from Google Research, published in *Nature* in July 2024, is the odd one out in this series — and the profile I most recommend to skeptical meteorologists. Every other model here replaced the physics wholesale with a learned function. NeuralGCM **keeps the physics**: a real dynamical core solves the equations of large-scale atmospheric motion, and neural networks handle only the parts physics has always had to approximate anyway.

![Schematic: a differentiable dynamical core advances the resolved flow while a learned module supplies the sub-grid physics, trained end-to-end as one system.](/images/insights/neuralgcm-hybrid.svg)

## Architecture in brief

Every general circulation model (GCM) has two halves. The **dynamical core** integrates the resolved fluid dynamics — well-understood physics. The **parameterizations** estimate what happens below the grid scale — convection, cloud microphysics, turbulence, radiation interactions — and are, candidly, the accumulated empiricism where most model error lives.

NeuralGCM's move: rewrite a spectral dynamical core in a differentiable framework (JAX), replace the hand-built parameterizations with a neural network, and train the **whole hybrid end-to-end** against reanalysis — gradients flow *through the physics solver* into the learned component. The network is never asked to rediscover advection; it learns only the correction physics cannot supply. The system runs deterministically at resolutions from ~0.7° and as a stochastic ensemble at ~1.4°, with learned stochastic physics providing genuinely flow-dependent spread.

## What the evidence shows

At 1.4° — coarse by this series' standards — NeuralGCM's ensemble matched ECMWF ENS on probabilistic skill (CRPS) for medium-range forecasts, a startling result for that resolution and a fraction of the compute. More important for the long game: run for **multi-year climate-length simulations**, it remains stable and produces a realistic climatology, including emergent tropical-cyclone statistics — the regime where pure autoregressive ML models drift or blow up. That stability is the physics half paying rent.

## Strengths

- **Physical guarantees where they matter.** The resolved dynamics obey the equations by construction — not by hope — giving better-behaved budgets and trustworthy long integrations.
- **Sample efficiency and stability.** The network learns a smaller, better-posed problem (sub-grid corrections), and the hybrid extrapolates more gracefully toward conditions outside the training record — the exact weak point of pure-ML models.
- **A bridge discipline actually wants.** To a meteorologist, NeuralGCM is not an alien replacement but a familiar GCM with its worst components upgraded. That framing matters for institutional adoption.
- **Climate relevance.** Alone in this series, NeuralGCM plausibly points toward learned *climate* modeling, not just weather.

## Limitations

- **Resolution.** ~0.7–1.4° against the field's 0.25–0.1°: synoptic patterns, not local weather. This is the price of the spectral core's cost.
- **Not operational.** A research system, without the productization or continuous verification of [AIFS](/blog/aifs) or the GraphCast lineage.
- **Atmosphere-only.** Sea-surface temperatures are prescribed, not predicted; a coupled Earth system remains future work.
- **Slower than pure ML.** Solving equations costs more than one forward pass; the speed advantage over traditional NWP is large, but smaller than its pure-ML cousins claim.
- **Shared caveats, softened not removed.** Training still targets reanalysis; learned components can still surprise outside their training distribution — the physics constrains, but does not eliminate, the [foundations caveats](/blog/transformers-and-graph-networks-in-weather).

## Status

The reference point for hybrid modeling, open-source, and — in this author's judgment — the best available answer to the false dilemma this series keeps confronting. The near future of weather and climate modeling is unlikely to be either pure physics or pure learning; it will look considerably like this.

---

## References & further learning

**Accessible starting points**

- [Google Research blog: NeuralGCM](https://research.google/blog/fast-accurate-climate-modeling-with-neuralgcm/) — plain-language overview.

**Technical depth**

- Kochkov, D., et al. (2024). ["Neural general circulation models for weather and climate."](https://doi.org/10.1038/s41586-024-07744-y) *Nature*, 632, 1060–1066.
- Kochkov, D., et al. (2023). ["Neural General Circulation Models."](https://arxiv.org/abs/2311.07222) The preprint, with fuller methods.
- [neuralgcm on GitHub](https://github.com/neuralgcm/neuralgcm) — open-source code and documentation.

*The series concludes with [The State of AI Weather Models in 2026](/blog/state-of-ai-weather-models-2026).*
`,
};

export default article;
