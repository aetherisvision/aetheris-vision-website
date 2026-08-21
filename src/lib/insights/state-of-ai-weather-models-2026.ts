import { AUTHOR, CATEGORY_FOUNDATIONS, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 11,
  slug: "state-of-ai-weather-models-2026",
  title: "The State of AI Weather Models in 2026: Signal and Noise",
  date: "Aug 20, 2026",
  category: CATEGORY_FOUNDATIONS,
  featured: true,
  author: AUTHOR,
  summary:
    "The honest scorecard: what data-driven forecasting has genuinely achieved, what the headlines oversell, where physical models remain irreplaceable, and how to think about the next five years.",
  content: `
Four years ago, "AI weather forecasting" meant research demos. Today an AI model runs operationally at ECMWF, open weights for world-class models sit on GitHub, and a ten-day global forecast costs about a minute of GPU time. That is real, and this series has traced how it happened — from [random forests](/blog/random-forests-in-weather) through [CNNs](/blog/cnns-in-weather) to the [transformer and graph models](/blog/transformers-and-graph-networks-in-weather) behind the headlines.

This closing piece is the scorecard: what has actually been achieved, what is being oversold, and how a scientifically literate reader should think about the next few years. It also serves as the index to our model profiles, in the table below.

![Schematic timeline: from FourCastNet's feasibility proof in 2022 to operational AI forecasting and generative ensembles by 2025-26.](/images/insights/ai-weather-timeline.svg)

## The field at a glance

| Model | Organization | Approach | Resolution | Character | Profile |
|---|---|---|---|---|---|
| FourCastNet | NVIDIA | Fourier neural operator | 0.25° | Deterministic; speed pioneer | [Read](/blog/fourcastnet) |
| Pangu-Weather | Huawei | 3D windowed transformer | 0.25° | Deterministic; first to beat HRES in a top journal | [Read](/blog/pangu-weather) |
| GraphCast | Google DeepMind | Graph neural network | 0.25° | Deterministic reference model | [Read](/blog/graphcast) |
| GenCast | Google DeepMind | Diffusion ensemble | 0.25° | Probabilistic frontier | [Read](/blog/gencast) |
| AIFS | ECMWF | Graph + transformer | 0.25° | First operational at a major center | [Read](/blog/aifs) |
| Aurora | Microsoft | Pretrained foundation model | 0.1° | Multi-task generalist | [Read](/blog/aurora) |
| NeuralGCM | Google Research | Hybrid physics + ML | 0.7–1.4° | Differentiable GCM; climate-capable | [Read](/blog/neuralgcm) |

## What is genuinely real

**The skill results survived hostile review.** The claim that learned models match or beat the best deterministic physical forecasts on medium-range headline scores has been peer-reviewed in *Nature* and *Science*, reproduced on the community's shared benchmark (WeatherBench 2), and — decisively — confirmed by ECMWF, the institution with the most to lose. When the center that has led forecasting since the 1970s makes an AI model operational and publishes candid verification, the burden of proof has genuinely shifted.

**The economics changed by three to four orders of magnitude.** An hour on a supercomputer became under a minute on one accelerator. This is the deepest change, because it alters who can forecast: a national service without a supercomputer, a research group, a company with a specific risk problem — all can now run or fine-tune world-class models. Speed also buys science: thousand-member ensembles, rapid what-if reruns, forecast experimentation at interactive tempo. The honest asterisk: *inference* is cheap; training is not. Frontier models consume enormous compute and energy up front, learning from data that itself embodies decades of physical modeling and observation infrastructure — the economics favor those who run a trained model often, not the claim that forecasting became free.

**The probabilistic turn happened.** The field heard the meteorologists: single deterministic runs are the wrong product. GenCast's diffusion ensembles and ECMWF's CRPS-trained AIFS ensemble put uncertainty — the actual currency of forecasting — at the center of the frontier.

## What the hype gets wrong

**"AI replaced the supercomputers" — no.** Every model in the table above is trained on reanalysis produced by physical models fusing observations through data assimilation, and every operational run starts from an analysis produced the same way. Data assimilation — arguably the crown jewel of modern meteorology — still runs on physics and supercomputers, and the AI models are its beneficiaries. End-to-end learned systems that go straight from raw observations to forecasts (Aardvark Weather, 2025) are promising research, not replacements.

**"Better at everything" — no, better at averages.** Deterministic learned models hedge: fields blur with lead time and extremes are muted, because average-error training rewards exactly that. Headline RMSE partially *credits* this hedging. Hurricane Otis's record 2023 rapid intensification — missed by physical and AI guidance alike — is the standing reminder that tail events, the forecasts that matter most, remain the hardest and least-verified ground. Probabilistic models improve this; they do not close it.

**"Beats traditional models" — the claim keeps outrunning its metrics.** The superiority announcements have not slowed; the newest generation — Google DeepMind's WeatherNext line among them — continues the pattern. The wins behind them are typically real *as scored*: lower error on headline targets like Z500. But Z500 and its siblings measure smooth mid-tropospheric flow, partially reward hedging, and say little about surface weather, extremes, or spatial structure. Establishing that a model is the better *forecast system* requires surface variables, verification that punishes blur, calibrated probabilities, and independent operational scoring across seasons. On that fuller ledger, the honest verdict in 2026 is "competitive and complementary" — not "beaten."

**"AI solved forecasting's hard problems" — it re-met them.** Compounding error from stepping forward on your own output, fine-scale features, teleconnections at long range: the difficulties that shaped fifty years of numerical weather prediction reappear in every AI model, managed with different workarounds — bigger time steps, rollout fine-tuning, ensembles — not abolished. Anyone who has watched NWP mature will recognize the pattern; it should temper how quickly we declare the new approach mature.

**"Kilometer-scale AI forecasts" — read the fine print.** Quarter-degree models resolve synoptic weather, not thunderstorms. Where finer output exists, it is learned from physical analyses at that resolution — inherited detail, not new observation. Convection-allowing forecasting remains physical-model territory in 2026.

**"The physics era is over" — the strongest counter-evidence is [NeuralGCM](/blog/neuralgcm).** Keeping the equations and learning only the sub-grid closure produced multi-year stability and climate-relevant behavior no pure autoregressive model has matched. Physics-versus-ML was always a false framing; the discipline's own history — from [MOS regression](/blog/random-forests-in-weather) onward — is statistics layered on physics.

## Where physical models remain irreplaceable

- **Data assimilation.** Turning millions of raw, irregular observations into a coherent initial state is still physics' game — and it is the input every AI model depends on.
- **Convective scale.** Explicit storm dynamics, local wind systems, orographic detail.
- **Novel conditions.** Equations generalize to atmospheres never observed; learned statistics extrapolate at their peril — a live concern whenever the background climate differs from the training record.
- **Process understanding.** A physical model is an experiment you can interrogate; understanding *why* remains largely a physics product.

## How to consume this field without being fooled

The four questions from [the foundations article](/blog/transformers-and-graph-networks-in-weather) — which metric, which baseline, which initialization, which variables — filter most press releases. Add a fifth for 2026: **which verification period?** A model tuned to the recent past can flatter itself against a baseline verified across decades. Trust continuous operational verification over one-time paper evaluations; trust CRPS and spread-reliability over RMSE alone; and treat any claim about extremes with proportional skepticism, because that is where the evidence is thinnest.

## The next five years, soberly

Expect: probabilistic learned models as the default medium-range product, physical-AI hybrids moving from research to operations, learned components inside data assimilation itself, fine-tuned regional and impact-specific models built on open foundations, and continuing physical-model primacy at convective scale. Do not expect: the end of NWP, trustworthy AI forecasts of unprecedented extremes, or any relaxation of the need for professional meteorological judgment sitting between model output and consequential decisions.

That last point is where this series has been heading all along. The models changed; the discipline of using them well — verification, calibration, physical reasoning, honest communication of uncertainty — did not. That discipline is precisely what Aetheris Vision practices.

---

## References & further learning

**Accessible starting points**

- [WeatherBench 2](https://sites.research.google/weatherbench/) — the field's public scoreboard.
- [ECMWF: the AIFS blog](https://www.ecmwf.int/en/about/media-centre/aifs-blog) — the operational center's own account.

**Technical depth**

- Ben Bouallègue, Z., et al. (2024). ["The Rise of Data-Driven Weather Forecasting."](https://doi.org/10.1175/BAMS-D-23-0162.1) *BAMS*, 105 — the single best critical survey.
- Rasp, S., et al. (2024). ["WeatherBench 2: A benchmark for the next generation of data-driven global weather models."](https://arxiv.org/abs/2308.15560)
- Bauer, P., Thorpe, A., & Brunet, G. (2015). ["The quiet revolution of numerical weather prediction."](https://doi.org/10.1038/nature14956) *Nature*, 525 — read this first to understand what AI is being measured against.
- Allen, A., et al. (2025). ["End-to-end data-driven weather prediction."](https://doi.org/10.1038/s41586-025-08897-0) *Nature* — Aardvark Weather, the research frontier beyond this survey.

*This article anchors our AI & Weather series. Start from the beginning: [Random Forests in Weather](/blog/random-forests-in-weather).*
`,
};

export default article;
