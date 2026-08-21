import { AUTHOR, CATEGORY_PROFILES, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 7,
  slug: "gencast",
  title: "Model Profile: GenCast",
  date: "Aug 13, 2026",
  category: CATEGORY_PROFILES,
  author: AUTHOR,
  summary:
    "DeepMind's diffusion-based ensemble model attacks the blur problem head-on: probabilistic forecasts that beat the world's best physical ensemble on 97% of targets — with sharpness deterministic models can't offer.",
  content: `
*Part of our model-profile series. Template and critical lens described in [the foundations article](/blog/transformers-and-graph-networks-in-weather).*

## What it is

GenCast, from Google DeepMind, published in *Nature* in December 2024, is the model that moved AI weather prediction from "impressive deterministic scores" to the ground where operational meteorology actually lives: **probability**. It generates full ensembles of physically plausible forecast scenarios and, in its headline evaluation, beat ECMWF's world-leading physical ensemble (ENS) on 97.2% of evaluated targets.

![Schematic: from one analysis, GenCast's diffusion process generates an ensemble of sharp, distinct scenarios rather than one blurred average.](/images/insights/gencast-ensemble.svg)

## Architecture in brief

GenCast is a **conditional diffusion model** — the same generative family behind modern image synthesis. Training teaches it to remove noise from a corrupted future atmospheric state, conditioned on the two most recent states. At forecast time it starts from pure noise and denoises step by step into a *sample* of the next state — do that repeatedly and you get one internally consistent 15-day trajectory; rerun with different noise and you get another, equally plausible one. The denoiser itself runs on a GraphCast-style icosahedral mesh with a graph-transformer processor, at 0.25° resolution, in 12-hour steps.

This design dissolves the blur problem at its root. A mean-squared-error model must answer "what is the average future?" — which is a smooth, hedged field. A diffusion model answers "give me one future that could really happen," and expresses uncertainty across the ensemble, not by smearing each member.

## What the evidence shows

Against ECMWF ENS — the strongest operational baseline on Earth — GenCast scored better CRPS (the standard probabilistic metric) on 97.2% of the 1,320 evaluated variable-lead combinations, with better tropical-cyclone track probabilities and better regional wind-power forecasts. Individual members stay sharp and spectrally realistic where deterministic AI fields go soft. Each member takes about eight minutes on a single TPU; members run in parallel, so a full ensemble arrives in minutes.

## Strengths

- **The right question.** Ensembles and calibrated probabilities are what forecasting has actually been about for thirty years; GenCast is the family's first model built natively for that.
- **Sharpness with honesty.** Realistic-looking members plus spread-based uncertainty — the combination deterministic AI cannot deliver.
- **State-of-the-art evidence** against the hardest available baseline, peer-reviewed.
- **Open.** Code and weights are public, like GraphCast before it.

## Limitations

- **Twelve-hour steps.** Sub-daily evolution — a morning-to-afternoon severe-weather setup — falls between the model's native time steps.
- **Slower than deterministic AI.** Iterative denoising costs more compute per member than one GraphCast pass; still trivially cheap next to a physical ensemble, but the "instant forecast" framing does not apply.
- **Baseline-fairness footnotes.** Parts of the evaluation compare against an ENS at coarser archived resolution than today's operational system; ECMWF's own AIFS ensemble work provides the institutional counter-check. The headline holds, but the margin has honest error bars.
- **Standard family caveats.** ERA5-trained, analysis-initialized, quarter-degree ceiling — the [foundations caveats](/blog/transformers-and-graph-networks-in-weather) all apply. And an ensemble can only be as trustworthy as its calibration in the rare events that matter most, where verification samples are inherently thin.

## Status

GenCast defines the research frontier for probabilistic AI forecasting, and its approach — generative ensembles rather than deterministic point forecasts — is visibly the direction the whole field is moving, including operational centers ([AIFS-CRPS](/blog/aifs) at ECMWF). Google's operational WeatherNext products draw on this lineage.

---

## References & further learning

**Accessible starting points**

- [DeepMind: GenCast blog post](https://deepmind.google/discover/blog/gencast-predicts-weather-and-the-risks-of-extreme-conditions-with-sota-accuracy/) — clear plain-language summary.

**Technical depth**

- Price, I., et al. (2024). ["Probabilistic weather forecasting with machine learning."](https://doi.org/10.1038/s41586-024-08252-9) *Nature*, 637, 84–90.
- Price, I., et al. (2023). ["GenCast: Diffusion-based ensemble forecasting for medium-range weather."](https://arxiv.org/abs/2312.15796) The extended preprint.
- [google-deepmind/weathernext on GitHub (formerly graphcast)](https://github.com/google-deepmind/weathernext) — the repository also hosts GenCast code and weights.
- Ho, J., et al. (2020). ["Denoising Diffusion Probabilistic Models."](https://arxiv.org/abs/2006.11239) The diffusion foundation, for readers who want the generative machinery itself.

*Next profile: [AIFS](/blog/aifs) — the first AI model made operational by a major forecast center.*
`,
};

export default article;
