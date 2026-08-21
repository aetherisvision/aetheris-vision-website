import { AUTHOR, CATEGORY_PROFILES, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 4,
  slug: "fourcastnet",
  title: "Model Profile: FourCastNet",
  date: "Aug 7, 2026",
  category: CATEGORY_PROFILES,
  author: AUTHOR,
  summary:
    "NVIDIA's Fourier-operator model was the first to run global AI forecasts at quarter-degree resolution — and it proved the speed argument that reshaped the field.",
  content: `
*Every profile in this series follows the same template — what the model is, how it works, what the evidence shows, strengths, limitations, and where to learn more — applying the critical lens from [our foundations article](/blog/transformers-and-graph-networks-in-weather).*

## What it is

FourCastNet (Fourier Forecasting Neural Network), released by NVIDIA with academic partners in early 2022, was the first deep-learning model to produce global forecasts at the quarter-degree (~28 km) resolution of the reanalysis it trained on — a claim to fame that mattered less for its skill than for what it proved: that high-resolution, data-driven global forecasting was computationally feasible at all.

![Schematic: FourCastNet transforms fields into frequency space, mixes global information there cheaply, and transforms back.](/images/insights/fourcastnet-fourier.svg)

## Architecture in brief

FourCastNet is built on the **Adaptive Fourier Neural Operator (AFNO)**. Instead of comparing every location with every other directly — the quadratic-cost attention problem — it transforms fields into frequency space with Fourier transforms, mixes information there (where global structure is cheap to manipulate), and transforms back. For a fluid on a sphere, thinking in waves rather than pixels is natural; it echoes how spectral NWP models have represented the atmosphere for decades. A later NVIDIA successor, the **Spherical Fourier Neural Operator (SFNO)**, redid the mathematics properly on the sphere rather than on a flat grid, improving long-rollout stability.

Trained on ERA5, the original model predicted a compact set of about twenty atmospheric and surface variables in six-hour autoregressive steps.

## What the evidence shows

On headline deterministic scores, the original FourCastNet approached but did not match ECMWF's high-resolution physical forecast; later entrants (Pangu-Weather, GraphCast) clearly surpassed it. Its landmark result was **speed**: a multi-day global forecast in about two seconds on a GPU node — orders of magnitude faster and cheaper than the physical equivalent — making the case that very large ensembles, unthinkable with physical models, come within practical reach.

## Strengths

- **Proof of feasibility.** First at 0.25°, and the model that made the cost-collapse argument concrete.
- **Ensembles at scale.** Its speed made very large ensembles a practical research topic — the direction the whole field then took.
- **An engineering ecosystem.** FourCastNet ships inside NVIDIA's open-source Earth-2/PhysicsNeMo (formerly Modulus) stack, making it one of the easiest global models to actually run, fine-tune, and study.
- **Spectral thinking.** The Fourier-operator approach connects naturally to how the atmosphere and classical spectral NWP actually work.

## Limitations

- **Superseded on skill.** On WeatherBench-style scoreboards, FourCastNet sits below GraphCast, Pangu, and current operational AI models on most deterministic targets.
- **The family diseases apply.** Blurring with lead time, reanalysis dependence for training and initialization, quarter-degree ceiling, no conservation guarantees — every caveat from [the foundations article](/blog/transformers-and-graph-networks-in-weather) applies here.
- **A lean variable set.** The original model forecast fewer variables and levels than physical output provides, limiting downstream use.

## Status

Best understood today as a fast, open, well-engineered research platform and ensemble workhorse inside NVIDIA's Earth-2 ecosystem, rather than a skill leader. Its historical importance is secure: it opened the door the others walked through.

---

## References & further learning

**Accessible starting points**

- [NVIDIA Earth-2 platform](https://www.nvidia.com/en-us/high-performance-computing/earth-2/) — where FourCastNet lives operationally today.

**Technical depth**

- Pathak, J., et al. (2022). ["FourCastNet: A Global Data-driven High-resolution Weather Model using Adaptive Fourier Neural Operators."](https://arxiv.org/abs/2202.11214)
- Bonev, B., et al. (2023). ["Spherical Fourier Neural Operators: Learning Stable Dynamics on the Sphere."](https://arxiv.org/abs/2306.03838) The mathematically-correct-on-the-sphere successor.
- [NVIDIA PhysicsNeMo / Earth2Studio on GitHub](https://github.com/NVIDIA/earth2studio) — runnable code.

*Next profile: [Pangu-Weather](/blog/pangu-weather).*
`,
};

export default article;
