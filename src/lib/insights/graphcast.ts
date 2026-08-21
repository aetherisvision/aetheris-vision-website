import { AUTHOR, CATEGORY_PROFILES, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 6,
  slug: "graphcast",
  title: "Model Profile: GraphCast",
  date: "Aug 11, 2026",
  category: CATEGORY_PROFILES,
  author: AUTHOR,
  summary:
    "DeepMind's graph neural network became the reference point for AI weather prediction: mesh-based message passing, 37 vertical levels, and the strongest peer-reviewed deterministic results of its generation.",
  content: `
*Part of our model-profile series. Template and critical lens described in [the foundations article](/blog/transformers-and-graph-networks-in-weather).*

## What it is

GraphCast, from Google DeepMind, published in *Science* in November 2023, is the model most researchers mean when they say "the AI weather model." Its evaluation — outperforming ECMWF's high-resolution deterministic forecast on roughly 90% of more than 1,300 verification targets — set the standard the rest of the field now measures against, and its open weights made it the community's shared reference system.

![Schematic: GraphCast maps the latitude-longitude grid onto a multi-scale icosahedral mesh, passes messages along its edges, and decodes back to the grid.](/images/insights/graphcast-mesh.svg)

## Architecture in brief

GraphCast is a **graph neural network** in an encode-process-decode arrangement. The 0.25° latitude-longitude grid (about a million points, 37 pressure levels, six atmospheric and five surface variables) is **encoded** onto an icosahedral mesh — a quasi-uniform triangulation of the sphere with no polar crowding. The **processor** then runs sixteen rounds of message passing over a *multi-mesh*: edges at several refinement scales simultaneously, so short edges carry local detail while long edges let information cross the planet in a few hops — the graph-world answer to attention's global reach. Finally the state is **decoded** back to the grid.

The model steps six hours at a time, takes the two most recent states as input, and is fine-tuned on progressively longer autoregressive rollouts so that it learns to live with its own errors — a key trick for ten-day stability.

## What the evidence shows

Beyond headline RMSE and anomaly-correlation wins, the *Science* paper showed better tropical-cyclone track error than HRES out to several days, improved atmospheric-river forecasts, and useful extreme-heat lead time. ECMWF's independent evaluation broadly confirmed the deterministic superiority. Precipitation is included but weakly verified — the paper itself treats it cautiously. A version fine-tuned on ECMWF operational analyses (rather than ERA5) closed the gap between research scores and real operational initialization.

## Strengths

- **The strongest deterministic evidence of its generation**, peer-reviewed at scale and reproduced independently.
- **Native spherical geometry.** The mesh avoids the pole pathologies that haunt grid-based architectures.
- **Deep vertical resolution.** 37 levels — matching ERA5's standard pressure levels — against Pangu's 13.
- **Openness with consequences.** Public code and weights turned GraphCast into the field's workbench: GenCast builds on its lineage, and countless papers use it as the baseline.

## Limitations

- **Deterministic blur.** Trained on mean-squared error, GraphCast hedges toward the ensemble mean at long leads: smoothed gradients, muted extremes. Its own authors' successor, [GenCast](/blog/gencast), exists precisely to fix this.
- **A single trajectory.** No native uncertainty. Running it as one deterministic forecast invites overconfidence in exactly the situations that matter.
- **Precipitation is the weak flank.** The most societally relevant variable is its least convincing.
- **Standard family caveats.** ERA5 training, analysis initialization (the model still needs the physical data-assimilation pipeline), 0.25° effective ceiling, approximate conservation only.

## Status

GraphCast remains the deterministic reference model in research, while its lineage powers Google DeepMind's operational-facing products (the WeatherNext family) and its probabilistic successor GenCast represents the current frontier. If you want to *run* a serious AI weather model yourself this weekend, GraphCast is still the sensible place to start.

---

## References & further learning

**Accessible starting points**

- [DeepMind: GraphCast blog post](https://deepmind.google/discover/blog/graphcast-ai-model-for-faster-and-more-accurate-global-weather-forecasting/) — the plain-language companion.
- [WeatherBench 2 leaderboard](https://sites.research.google/weatherbench/) — where GraphCast sits against everything since.

**Technical depth**

- Lam, R., et al. (2023). ["Learning skillful medium-range global weather forecasting."](https://doi.org/10.1126/science.adi2336) *Science*, 382, 1416–1421.
- Lam, R., et al. (2022). ["GraphCast: Learning skillful medium-range global weather forecasting."](https://arxiv.org/abs/2212.12794) The extended preprint, with fuller methods.
- [google-deepmind/weathernext on GitHub (formerly graphcast)](https://github.com/google-deepmind/weathernext) — code, weights, and example notebooks.
- Ben Bouallègue, Z., et al. (2024). ["The Rise of Data-Driven Weather Forecasting."](https://doi.org/10.1175/BAMS-D-23-0162.1) *BAMS*, 105. Independent verification.

*Next profile: [GenCast](/blog/gencast).*
`,
};

export default article;
