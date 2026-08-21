import { AUTHOR, CATEGORY_PROFILES, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 5,
  slug: "pangu-weather",
  title: "Model Profile: Pangu-Weather",
  date: "Aug 9, 2026",
  category: CATEGORY_PROFILES,
  author: AUTHOR,
  summary:
    "Huawei's 3D transformer was the first AI model shown to beat the leading physical forecast on headline scores in a top journal — with real caveats, including no precipitation.",
  content: `
*Part of our model-profile series. Template and critical lens described in [the foundations article](/blog/transformers-and-graph-networks-in-weather).*

## What it is

Pangu-Weather, from Huawei Cloud, published in *Nature* in July 2023, was the first data-driven model whose peer-reviewed results showed it beating the ECMWF high-resolution deterministic forecast (IFS HRES) on standard headline metrics — the result that forced the operational weather community to take this model family seriously.

![Schematic: Pangu-Weather composes 24-, 6-, 3- and 1-hour models so a forecast uses the fewest possible steps, limiting error accumulation.](/images/insights/pangu-temporal.svg)

## Architecture in brief

Pangu is a **3D transformer** — a Swin-style vision transformer extended to treat the atmosphere as a genuine volume rather than a stack of independent maps, with an "Earth-specific" positional encoding that tells attention where on the planet, and at what height, each window sits. It ingests 13 pressure levels plus surface fields at 0.25° resolution.

Its most distinctive engineering choice is **hierarchical temporal aggregation**: four separately trained models step the atmosphere forward 1, 3, 6, and 24 hours. A 7-day forecast composes the fewest possible steps (seven 24-hour jumps) instead of iterating one small step hundreds of times — directly attacking the error accumulation that plagues autoregressive rollouts.

## What the evidence shows

In the *Nature* evaluation on ERA5-initialized reforecasts, Pangu produced lower RMSE and higher anomaly correlation than IFS HRES for key upper-air and surface variables across medium-range lead times, and tracked tropical cyclones with competitive — often superior — position accuracy. ECMWF's own independent evaluation (Ben Bouallègue et al., *BAMS* 2024) broadly confirmed the picture while documenting the caveats below. ECMWF also ran Pangu experimentally in its own charts, an unusual institutional endorsement of an outside model.

## Strengths

- **The credibility breakthrough.** Peer-reviewed, independently reproduced superiority on headline deterministic scores — the moment "AI weather model" stopped meaning "toy."
- **Volumetric attention.** Treating the atmosphere as 3D lets the model capture vertical structure — shear, stability — natively rather than as stacked 2D slices.
- **Fewer steps, less compounding.** The 1/3/6/24-hour model hierarchy measurably reduces rollout error growth.
- **Open inference.** Trained weights and inference code are public, which enabled the independent scrutiny that validated it.

## Limitations

- **No precipitation.** Pangu does not forecast precipitation at all — the variable the public most associates with a weather forecast. Headline wins on geopotential and temperature simply do not speak to rain.
- **Thirteen levels.** A relatively coarse vertical description compared with GraphCast's 37 levels or full physical output; fine for synoptic structure, limiting for anything vertically subtle.
- **Deterministic smoothing.** As lead time grows, fields blur toward climatological plausibility and intensity extremes are muted — the family-wide failure mode of average-error training, discussed in [the foundations article](/blog/transformers-and-graph-networks-in-weather). A famous illustration: AI models tracked Hurricane Otis (2023) well while — like the physical models — badly underforecasting its record rapid intensification.
- **Fixed lead-time grid.** The four-model composition constrains which lead times exist natively and complicates uncertainty treatment across seams.
- **Standard family caveats.** ERA5-trained, analysis-initialized, 0.25° ceiling, no conservation guarantees.

## Status

Pangu remains a widely cited benchmark and its weights still circulate in research pipelines, but the frontier moved to probabilistic and operational systems ([GenCast](/blog/gencast), [AIFS](/blog/aifs)). Its permanent contribution is historical and architectural: the proof, and the temporal-aggregation idea.

---

## References & further learning

**Accessible starting points**

- [ECMWF: The rise of machine learning models](https://www.ecmwf.int/en/about/media-centre/aifs-blog) — institutional context for how centers received Pangu.

**Technical depth**

- Bi, K., et al. (2023). ["Accurate medium-range global weather forecasting with 3D neural networks."](https://doi.org/10.1038/s41586-023-06185-3) *Nature*, 619.
- Bi, K., et al. (2022). ["Pangu-Weather: A 3D High-Resolution Model for Fast and Accurate Global Weather Forecast."](https://arxiv.org/abs/2211.02556) The fuller technical preprint.
- [Pangu-Weather on GitHub](https://github.com/198808xc/Pangu-Weather) — inference code and pretrained models.
- Ben Bouallègue, Z., et al. (2024). ["The Rise of Data-Driven Weather Forecasting."](https://doi.org/10.1175/BAMS-D-23-0162.1) *BAMS*, 105. The independent audit.

*Next profile: [GraphCast](/blog/graphcast).*
`,
};

export default article;
