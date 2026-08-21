import { AUTHOR, CATEGORY_PROFILES, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 8,
  slug: "aifs",
  title: "Model Profile: AIFS",
  date: "Aug 15, 2026",
  category: CATEGORY_PROFILES,
  author: AUTHOR,
  summary:
    "ECMWF's AIFS is the first AI forecast model made fully operational by a major weather center — the moment data-driven forecasting stopped being a tech-company demonstration.",
  content: `
*Part of our model-profile series. Template and critical lens described in [the foundations article](/blog/transformers-and-graph-networks-in-weather).*

## What it is

AIFS — the Artificial Intelligence Forecasting System — is ECMWF's own data-driven model, developed inside the institution whose physical Integrated Forecasting System (IFS) has defined the state of the art for decades. In February 2025 the deterministic AIFS Single became **the first AI weather model promoted to full operational status at a major center**, running on the same schedule as the IFS, with its output distributed to national meteorological services and published as open data. An ensemble variant trained directly on a probabilistic score (AIFS-CRPS) followed into operations during 2025.

![Schematic: AIFS runs inside the operational pipeline — observations flow through ECMWF's data assimilation into an analysis that initializes both the physical IFS and the AI model side by side.](/images/insights/aifs-pipeline.svg)

## Architecture in brief

AIFS uses a **graph-based encoder and decoder around a transformer processor**: the input grid is encoded onto a reduced spherical representation, a sliding-window attention transformer advances the state, and the result is decoded back — a design cousin to both GraphCast's mesh and Pangu's windowed attention, at 0.25° resolution with six-hour steps. It is trained on ERA5, then fine-tuned on ECMWF's own operational analyses.

That last clause is the institutional advantage. AIFS is initialized by the same world-leading data assimilation that feeds the IFS, run in-house, with none of the research-world mismatch between reanalysis training and operational starting states.

## What the evidence shows

ECMWF's published verification showed AIFS Single beating IFS HRES on many headline deterministic scores (on the order of 20% RMSE improvement for some upper-air targets at medium range) while remaining behind on some surface and extreme-value measures — reported with the same candor the center applies to its physical system. The CRPS-trained ensemble competes with the physical ENS on probabilistic scores. All of it is verified continuously, in public, against the most demanding operational standards in the field — which, for this model family, is itself a result.

## Strengths

- **Operational legitimacy.** Not a paper, not a demo: a scheduled forecast product with service obligations, run by the center everyone else benchmarks against.
- **Assimilation-consistent initialization.** Trained and initialized inside one coherent pipeline — the cleanest setup any AI model currently enjoys.
- **Open by design.** Real-time AIFS output is free under open data; the training framework (Anemoi) is open source and explicitly built so national services can train their own models.
- **Honest verification culture.** Weaknesses are documented in the same charts as strengths.

## Limitations

- **The family caveats do not vanish with operational status.** Quarter-degree ceiling, deterministic smoothing in the Single variant, dependence on the physical assimilation system for its starting state — AIFS's own scientists are explicit that it complements rather than replaces the IFS.
- **Surface and extremes lag.** The published scorecard is uneven: strong upper-air gains, weaker performance on some surface variables and tails.
- **Young.** Operational track record is measured in seasons, not decades. Rare-event reliability — the thing operations ultimately runs on — takes years to establish.

## Status

Running operationally alongside the IFS, with the ensemble variant following the same path. For anyone building on AI weather output today, AIFS is arguably the most consequential model in this series: professionally verified, institutionally supported, and free to use.

---

## References & further learning

**Accessible starting points**

- [ECMWF: AIFS pages and blog](https://www.ecmwf.int/en/forecasts/dataset/aifs-machine-learning-data) — model status, charts, and open data access.

**Technical depth**

- Lang, S., et al. (2024). ["AIFS — ECMWF's data-driven forecasting system."](https://arxiv.org/abs/2406.01465)
- Lang, S., et al. (2024). ["AIFS-CRPS: Ensemble forecasting using a model trained with a loss function based on the Continuous Ranked Probability Score."](https://arxiv.org/abs/2412.15832) The ensemble variant.
- [Anemoi framework documentation](https://anemoi.readthedocs.io/) — ECMWF's open-source stack for training data-driven forecast models.
- [ECMWF open data](https://www.ecmwf.int/en/forecasts/datasets/open-data) — real-time AIFS output, free.

*Next profile: [Aurora](/blog/aurora) — the foundation-model bet.*
`,
};

export default article;
