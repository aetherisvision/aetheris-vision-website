import { AUTHOR, CATEGORY_PROFILES, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 9,
  slug: "aurora",
  title: "Model Profile: Aurora",
  date: "Aug 17, 2026",
  category: CATEGORY_PROFILES,
  author: AUTHOR,
  summary:
    "Microsoft's Aurora tests the foundation-model thesis on the atmosphere: pretrain one large model on diverse Earth-system data, then fine-tune it cheaply for weather, air quality, and ocean waves.",
  content: `
*Part of our model-profile series. Template and critical lens described in [the foundations article](/blog/transformers-and-graph-networks-in-weather).*

## What it is

Aurora, from Microsoft Research, published in *Nature* in May 2025, imports the strategy that transformed language AI into Earth science: **pretrain one large "foundation model" on as much diverse atmospheric data as possible, then fine-tune it — cheaply — for specific tasks.** Where the other models in this series were each built for one job, Aurora's claim is generality: the same pretrained core was adapted to medium-range weather at 0.1° resolution, air quality, ocean waves, and tropical cyclone tracks, each fine-tune a small fraction of the original training cost.

![Schematic: one pretrained atmospheric core, fine-tuned into separate heads for weather, air quality, and ocean waves.](/images/insights/aurora-foundation.svg)

## Architecture in brief

Aurora is a **3D Swin-transformer U-Net** — windowed attention over atmospheric volumes, in an encoder-decoder arrangement — with flexible **Perceiver-based encoders** that let it ingest datasets with different variables, resolutions, and pressure levels rather than being locked to one input format. Pretraining consumed over a million hours of model output, reanalyses, and analysis data; fine-tuning then specializes the model per task. The headline weather configuration runs at 0.1° (~11 km), finer than the 0.25° standard of this series.

## What the evidence shows

In the *Nature* evaluation, the 0.1° weather fine-tune outperformed IFS HRES on a large majority of headline targets, and the air-quality fine-tune competed with the physics-based CAMS system at a fraction of its computational cost — notable because atmospheric composition involves processes (chemistry, emissions) with far messier observational constraints than meteorology. The tropical-cyclone fine-tune produced track forecasts competitive with specialized guidance. The general pattern the paper argues: pretraining scale converts into fine-tuning efficiency.

## Strengths

- **The generality bet, partly cashed.** Demonstrated transfer of one pretrained core across genuinely different atmospheric tasks — the first convincing multi-task result in this family.
- **Resolution.** 0.1° output pushes past the quarter-degree ceiling the rest of the generation shares (with the honest asterisk below).
- **Cheap specialization.** If your problem is *like* weather but not weather — dispersion, renewables, regional hazards — a fine-tunable foundation model is a fundamentally attractive starting point.
- **Open.** Code and weights are public, and the model is accessible through Azure tooling.

## Limitations

- **The 0.1° asterisk.** Aurora's fine-resolution skill comes from fine-tuning on IFS *analyses* at 0.1° — it learns to imitate the physical system's fine-scale structure, not to observe finer reality. The resolution is real; its information content is inherited.
- **Foundation-model economics.** Pretraining at this scale is open only to a handful of organizations; everyone else consumes. Fine-tuning is cheaper, but still expertise- and data-hungry — "cheap" is relative to pretraining, not to a scikit-learn afternoon.
- **Generality has a ceiling.** On several pure-weather scores, task-specific models (GraphCast lineage, [AIFS](/blog/aifs)) remain the sharper instruments; breadth and peak skill have not converged.
- **Standard family caveats.** Analysis-initialized, no conservation guarantees, deterministic smoothing in the base configuration, tail-event reliability unproven — the [foundations caveats](/blog/transformers-and-graph-networks-in-weather) apply unchanged.

## Status

Aurora is the strongest current evidence that the foundation-model recipe transfers to Earth systems, and the natural platform choice when the task is adjacent to weather rather than weather itself. Whether pretrained generality eventually overtakes specialized models at their own game is one of the open questions our [state-of-the-field survey](/blog/state-of-ai-weather-models-2026) returns to.

---

## References & further learning

**Accessible starting points**

- [Microsoft Research: Aurora project page](https://www.microsoft.com/en-us/research/project/aurora-forecasting/) — overview and updates.

**Technical depth**

- Bodnar, C., et al. (2025). ["A foundation model for the Earth system."](https://doi.org/10.1038/s41586-025-09005-y) *Nature*, 641.
- Bodnar, C., et al. (2024). ["Aurora: A Foundation Model of the Atmosphere."](https://arxiv.org/abs/2405.13063) The extended preprint.
- [microsoft/aurora on GitHub](https://github.com/microsoft/aurora) — code, weights, and fine-tuning documentation.

*Next profile: [NeuralGCM](/blog/neuralgcm) — the hybrid that refuses the physics-versus-ML framing.*
`,
};

export default article;
