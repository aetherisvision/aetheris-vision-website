import { AUTHOR, CATEGORY_FOUNDATIONS, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 3,
  slug: "transformers-and-graph-networks-in-weather",
  title: "Transformers and Graph Networks: The Models Behind the Headlines",
  date: "Aug 5, 2026",
  category: CATEGORY_FOUNDATIONS,
  author: AUTHOR,
  summary:
    "How attention and graph networks produce global ten-day forecasts in under a minute — explained twice, once in plain language and once with the machinery — plus the caveats the press releases skip.",
  content: `
This is the family behind every "AI beats traditional weather forecasting" headline since 2022: GraphCast, Pangu-Weather, FourCastNet, AIFS, and their descendants. The claims are partly true, genuinely important — and consistently oversold. This article explains how these models work and gives you the tools to read the headlines critically.

## The short version

The [CNN article](/blog/cnns-in-weather) ended at a wall: convolution sees locally, but the atmosphere is a global, interconnected fluid. A trough leaving East Asia shapes weather over North America days later. A model stepping the whole planet forward six hours at a time needs some mechanism for distant points to exchange information efficiently.

Two architectures deliver that:

**Transformers** replace fixed local filters with **attention**: every element of the input can look at every other element and decide, dynamically, what is relevant. Attention is expensive — cost grows with the square of the number of elements — so weather transformers make it tractable with windowing tricks (Pangu-Weather's 3D Earth-specific windows) or by mixing information in frequency space (FourCastNet's Fourier operators).

**Graph neural networks (GNNs)** abandon the rectangular grid entirely. GraphCast maps the atmosphere onto a mesh of nodes spread quasi-uniformly over the sphere — no polar distortion — with edges at multiple scales, short ones for local detail and long ones that let information hop across the planet in a few steps. Learning happens as messages passed along edges.

Either way, the training recipe is the same and is worth stating plainly, because it defines both the power and the limits: **take roughly forty years of ERA5 reanalysis — our best gridded reconstruction of the atmosphere across the satellite era — and learn the function that maps the state now to the state six hours from now.** Apply that function repeatedly and you have a ten-day global forecast.

That is the executive summary, and it is enough to carry you through the rest of the series. The next four sections open the hood. Each comes in two passes — the intuition first, then the machinery for readers who want it — and if mechanics are not why you came, skip ahead to "What they genuinely achieve": the critical-reading tools at the end of this article require no code.

![Schematic: attention and multi-scale graph edges let distant points on the globe exchange information in a few steps.](/images/insights/global-attention.svg)

## What attention actually does

### The intuition

Watch an experienced forecaster work a chart and you will notice that not every point on Earth gets equal weight. Forecasting for Oklahoma at day five, the forecaster looks at particular distant places — the trough digging off Japan, the ridge building over the Gulf of Alaska, the subtropical moisture feed — because experience teaches *which remote features matter for this forecast, at this range, in this situation*. Attention is that judgment, made mechanical and learnable. For every location, the model computes a set of relevance weights over other locations — how much should conditions *there* revise my estimate of what happens *here*? — and, crucially, those weights are not fixed rules. They are recomputed from the current state of the atmosphere, so a blocked pattern and a fast-moving progressive pattern produce entirely different maps of who listens to whom. That adaptivity is exactly what the fixed local filters of the [CNN era](/blog/cnns-in-weather) could not provide.

### Under the hood

The machinery is the same one language models apply to words. The atmospheric state is cut into small patches, and each patch is embedded as a vector — a *token*. Every token derives three quantities: a query (what am I looking for?), a key (what do I contain?), and a value (what information do I pass along if someone attends to me). Relevance is the match between one token's query and another's key; the output for each token is the relevance-weighted blend of everyone's values — in the standard notation, $\\mathrm{softmax}(QK^{\\top}/\\sqrt{d})\\,V$. In English: compare every location's question to every other location's contents, convert the match scores to weights that sum to one, and mix accordingly.

The catch is cost. Comparing everything with everything grows with the *square* of the token count, and a quarter-degree global grid holds just over a million columns of atmosphere — a trillion pairings per layer, which is not a computation anyone runs. The weather transformers earn their tractability with structure:

- **Windowed attention.** Pangu-Weather adapts the Swin transformer's trick to the atmosphere: attention runs only inside local 3D windows (spanning longitude, latitude, *and* pressure level), and the windows shift between layers so information leaks across boundaries, layer by layer. An Earth-specific positional bias teaches the windows that they live on a sphere with a vertical structure, not on a flat image.
- **Frequency-space mixing.** FourCastNet sidesteps the pairing problem entirely: transform the fields into waves with a Fourier transform, mix information globally there — where planetary-scale structure is cheap to manipulate — and transform back. For a fluid on a sphere this is a natural move; spectral NWP models have represented the atmosphere this way for decades.

## Forecasting on a mesh: the graph route

### The intuition

There is an older problem hiding in every "global grid": latitude–longitude cells are not the same size. Meridians converge toward the poles, so a grid that is 28 km wide at the equator crowds into slivers near the poles — and a filter that sees "one cell in each direction" sees wildly different amounts of atmosphere depending on where it sits. GraphCast's answer is to abandon the grid and forecast on a **mesh** — picture a geodesic dome wrapped around the planet, its nodes spread almost evenly from equator to pole. Neighboring nodes exchange information like colleagues passing notes, and the mesh carries edges at several scales at once: short edges for fronts and local gradients, and long edges — express lanes — that let a signal cross an ocean basin in a single hop.

### Under the hood

GraphCast is an encoder–processor–decoder. The **encoder** learns to move the state from the million-column latitude–longitude grid onto the mesh nodes. The **processor** runs repeated rounds of *message passing*: each node gathers learned messages from its neighbors along every edge, updates its state, and repeats — and because the mesh is a **multi-mesh** (a coarse icosahedron refined several times, all refinement levels kept and overlaid), the coarsest edges span continents while the finest resolve synoptic detail. A signal can traverse the hemisphere in a handful of rounds rather than hundreds of local hops. The **decoder** maps the result back to the familiar grid. The [GraphCast profile](/blog/graphcast) covers the specifics; ECMWF's AIFS combines this graph machinery with transformer processing, which tells you the two routes are complements, not rivals.

## Why global reach is non-negotiable

This is the meteorological grounding the architecture papers tend to state only in passing. The atmosphere moves information *fast*. Winds in the jet stream commonly run 150–250 km/h, so in a single six-hour step, air — and the disturbances it carries — travels on the order of a thousand kilometers. Worse, for the forecaster's purposes: Rossby wave energy propagates *downstream faster than the individual troughs and ridges move*, the classic downstream-development mechanism, so the true influence radius of six hours exceeds what advection alone suggests. Any model that steps the planet forward six hours at a time must let information travel at least that far per step, or it is wrong by construction — not wrong in a subtle statistical way, but in the way a forecaster who refuses to look upstream is wrong.

Physical models get this reach from the equations themselves, which propagate signals at the speeds the dynamics dictate. Attention and long-range graph edges are the *learned* equivalents — reach built into the architecture rather than derived from physics. That is also the honest way to frame teleconnections: this machinery is what would let a learned model represent them in principle. Whether the models capture those linkages at the right strength is a separate, and much harder, verification question — see the caveats below.

## What training actually involves

### The picture

ERA5, sampled six-hourly across four decades, is roughly 58,000 snapshots of the global atmosphere. Training shows the model a snapshot and asks it to predict the next one, adjusting its internal weights after every miss — millions of times, until the six-hour map is learned. That single map is the entire product. A ten-day forecast is, in the simplest designs, that map applied forty times to its own output, which is why the compounding-error caveat below is not incidental: rollout *is* the forecast.

### Under the hood

The training objective is an average-error loss, weighted so that shrinking high-latitude cells, different variables, and different pressure levels contribute sensibly — and that objective choice, more than any architecture detail, drives the blurring behavior discussed below. Because a model trained only on single steps meets its own imperfect output for the first time at forecast time, the leading models are *fine-tuned on rollouts* — trained against multi-step sequences so they learn to live with their own errors. Two facts about scale deserve to be more widely known. These models are small: tens to a few hundred million parameters, thousands of times smaller than a frontier language model, because the constraint is atmospheric data and physical structure, not parameter count. And the costs are lopsided: training runs for days to weeks on tens to hundreds of accelerators — a one-time expense — after which each ten-day forecast costs under a minute on a single one. Both halves of that asymmetry matter when you read the economics claims later in this article.

## What they genuinely achieve

- **Skill.** On standard headline metrics — RMSE and anomaly correlation for mid-tropospheric geopotential, temperature, wind — the leading models match or beat ECMWF's high-resolution physical forecast (long the gold standard) over medium-range lead times, on hundreds of evaluation targets. This has been reproduced independently, including by ECMWF itself; it is not a cherry-picked press claim.
- **Speed.** A ten-day global forecast takes tens of seconds to a minute on a single accelerator, versus roughly an hour on a multi-million-dollar supercomputer for the physical equivalent. That is a three-to-four-orders-of-magnitude cost change, and it is the real revolution: it makes large ensembles, rapid reruns, and forecast experimentation cheap.
- **Real structures, tracked well.** Tropical cyclone positions and atmospheric-river evolution verify well in the leading models — these are not toy statistics.

## The caveats the headlines skip

- **They stand on physics' shoulders — twice.** These models are trained on *reanalysis*: a dataset produced by a physical model fusing observations through data assimilation. And every operational run is *initialized* from an analysis produced the same way. Remove the physical modeling infrastructure and there is nothing to learn from and nothing to start from. "AI replaces physics" is exactly wrong; AI currently rides on physics. End-to-end systems that forecast from raw observations exist as research (Aardvark Weather, 2025) but are early.
- **Deterministic training causes blurring.** Models trained to minimize average error hedge toward the mean of possible futures — the same failure mode as CNN nowcasting, at planetary scale. Sharp gradients soften with lead time, and intensity extremes (a hurricane's peak winds, a record heat dome) are systematically muted even when position is right. Headline RMSE actually *rewards* this hedging, which is why blur-aware and probabilistic evaluation matters — and why the field moved to ensemble and diffusion approaches like [GenCast](/blog/gencast) and AIFS-CRPS.
- **The old problems came back in new clothes.** Error that compounds as a model steps forward on its own output is not a new discovery — numerical weather prediction spent half a century learning to manage exactly this. AI models inherit the problem intact and manage it with workarounds of their own: fine-tuning on longer rollouts (GraphCast), hierarchical time steps so a week uses seven jumps instead of twenty-eight (Pangu-Weather), longer strides with ensembles (GenCast). These are mitigations, not solutions. The same is true of fine-scale features, and of **teleconnections**: skill on the slow, planetary-scale linkages that organize weather at longer range is far less established than the headline medium-range scores, and is exactly where learned statistics are hardest to verify.
- **Cheap to run is not cheap to build.** The inference economics are real, but training a frontier model consumes enormous compute and energy up front, on decades of data that itself embodies the accumulated cost of physical modeling and observation. The fair comparison is lifecycle against lifecycle — and it favors whoever reuses a trained model heavily, not the claim that forecasting became free.
- **The resolution ceiling is inherited.** Trained at ERA5's quarter-degree grid (~28 km), these models cannot represent individual thunderstorms, terrain-driven winds, or anything convection-scale. A quarter-degree AI forecast is a synoptic tool, full stop.
- **Out-of-distribution weather is a live question.** The training archive contains a finite sample of climate. Events without precedent — and a changing background climate — probe the models exactly where learned statistics are weakest. Physical models generalize from equations; learned models generalize from history.
- **No conservation guarantees.** Mass, energy, and moisture budgets are approximately respected at best. For downstream physical computation, that can matter in ways pretty maps do not reveal.

## How to read the next headline

Ask four questions. Which metric — and does it reward blur? A lead on 500 hPa geopotential (Z500) error, the field's favorite headline number, is a statement about smooth mid-tropospheric flow, not about the surface weather anyone experiences. Which baseline — the deterministic physical model or the ensemble? Which initialization — was the AI model fed the physical center's own analysis? And which variables — headline scores on smooth mid-atmosphere fields say little about surface extremes. Models that survive those four questions are doing something real.

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
- Liu, Z., et al. (2021). ["Swin Transformer: Hierarchical Vision Transformer using Shifted Windows."](https://arxiv.org/abs/2103.14030) The windowed-attention design Pangu-Weather adapts to the atmosphere.
- Lam, R., et al. (2023). ["Learning skillful medium-range global weather forecasting."](https://doi.org/10.1126/science.adi2336) *Science*, 382. GraphCast.
- Bi, K., et al. (2023). ["Accurate medium-range global weather forecasting with 3D neural networks."](https://doi.org/10.1038/s41586-023-06185-3) *Nature*, 619. Pangu-Weather.
- Ben Bouallègue, Z., et al. (2024). ["The Rise of Data-Driven Weather Forecasting."](https://doi.org/10.1175/BAMS-D-23-0162.1) *BAMS*, 105. ECMWF's independent evaluation — essential hype control.
- Rasp, S., et al. (2024). ["WeatherBench 2: A benchmark for the next generation of data-driven global weather models."](https://arxiv.org/abs/2308.15560) The scoreboard the field actually uses.

*Next in the series: the model profiles, beginning with [FourCastNet](/blog/fourcastnet).*
`,
};

export default article;
