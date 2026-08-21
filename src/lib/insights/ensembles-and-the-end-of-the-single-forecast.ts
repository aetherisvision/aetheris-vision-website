import { AUTHOR, CATEGORY_NWP, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 16,
  slug: "ensembles-and-the-end-of-the-single-forecast",
  title: "Ensembles and the End of the Single Forecast",
  date: "Jun 26, 2026",
  category: CATEGORY_NWP,
  author: AUTHOR,
  summary:
    "Lorenz proved the atmosphere forgets its starting point; ensembles turned that limit into a product. How probabilistic forecasting was built, what spread actually means, and the reading habits that separate a useful ensemble from a pretty one.",
  content: `
For the first forty years of numerical prediction, a forecast was a single run: one initial state, one model, one answer. The discovery that this was the wrong product — not merely an imperfect one — came from theory before it came from practice, and it took thirty years to move from a 1963 paper to operational systems. Understanding that shift is essential background for the AI era, where the best learned models are once again ensembles.

## The limit Lorenz found

Edward Lorenz, running a toy convection model on a desk-sized computer at MIT in 1961, restarted a run from rounded-off numbers and watched the new solution diverge completely from the old. His 1963 paper, "Deterministic Nonperiodic Flow," established that a system like the atmosphere amplifies small errors exponentially: two states that differ imperceptibly today differ entirely within days. Later work put a number on it — roughly two weeks as the practical limit of deterministic weather prediction, however good the model or the observations.

The consequence is not that forecasting is hopeless. It is that a forecast is inherently a *distribution* of possible futures, and the single run hides this. Two forecasts of "rain Thursday" can be equally accurate on the day and entirely different in confidence. A product that cannot express the difference is withholding the most useful information it has.

![Schematic: an ensemble fans out from slightly perturbed initial conditions; tight agreement at short range, divergence at longer range, with the spread measuring confidence.](/images/insights/ensemble-spread.svg)

## The intuition

Run the model not once but many times, each from a slightly different starting state consistent with what the observations cannot pin down, and perhaps with slightly different physics. Where the runs agree, the atmosphere is predictable and the forecast is confident. Where they diverge, it is not, and the honest forecast is a probability. The collection is an **ensemble**; its members' scatter is the **spread**; and the fraction of members showing an outcome is the forecast **probability** of that outcome. Experienced forecasters had long done a rough version of this by comparing the NGM, Eta, and AVN, as [the previous article](/blog/the-models-we-ran) described. Ensembles made the practice systematic, quantitative, and verifiable.

## How it was built

The idea was formalized by Edward Epstein (stochastic-dynamic prediction, 1969) and Cecil Leith (Monte Carlo forecasting, 1974), but computing dozens of global forecasts was impossible until the 1990s. Both ECMWF and the U.S. center went operational in December 1992 — ECMWF with an ensemble perturbed along the directions of fastest error growth (**singular vectors**, Molteni, Buizza, Palmer, and Petroliagis), the U.S. center with **bred vectors** (Toth and Kalnay), perturbations grown by the model itself from recent cycles. ECMWF's ensemble reached 51 members in 1996 and runs at 9 km today; the U.S. Global Ensemble Forecast System runs 31 members.

Two refinements proved decisive. First, perturbing the initial state alone produced ensembles that were **under-dispersive** — too confident — because the model's own errors were not represented. Stochastic physics (Buizza, Miller, and Palmer, 1999) addressed this by randomly perturbing the parameterization tendencies, so the ensemble also samples model uncertainty. Second, multi-model and multi-center ensembles — the North American Ensemble Forecast System from 2004, the THORPEX TIGGE archive from 2006 — exploited the fact that different models fail differently.

### Under the hood

An ensemble's value rests on three properties that must be verified, not assumed. **Reliability**: when the ensemble says 30 percent, the event should occur about 30 percent of the time — checked with reliability diagrams and rank histograms, which expose the under-dispersion problem directly. **Resolution**: the probabilities should differ between cases, not hover near climatology. **Sharpness**: confident when confidence is warranted. The standard scalar summary is the **continuous ranked probability score (CRPS)**, which compares the forecast distribution to the observed value and reduces to the ordinary absolute error for a single deterministic forecast — which is why the AI series insists on it as the fair test for probabilistic learned models. The ensemble mean, note, is smoother than any member and is not a forecast of any single possible day; using it as if it were one reintroduces exactly the blurring that plagues deterministically trained AI models.

## Reading an ensemble like a forecaster

The products are familiar now: spaghetti plots of one contour from every member, plume diagrams of a single station's temperature or precipitation across members, postage-stamp maps, probability-of-exceedance charts. The reading habits matter more than the graphics.

- **Spread is a forecast, not a failure.** Large spread at day five says something true about the atmosphere that day. The right response is to communicate uncertainty, not to pick a member.
- **Look for clusters, not averages.** Members often split into two or three regimes — a cutoff low versus a progressive trough. The mean of two regimes is a third thing that will not happen.
- **Outliers deserve a look, not a vote.** A single member producing a major event is a reason to examine the physical scenario, not a reason to forecast it.
- **Calibrate against the model's record.** Raw ensembles are biased and under-dispersive; statistical post-processing and a forecaster's knowledge of the system's habits turn them into usable probabilities.

## The lesson for the AI era

The field spent thirty years learning that the deterministic run was the wrong product, and the learned models of 2022–2023 arrived deterministic all over again — trained to minimize average error, hedging toward the mean, scoring well on exactly the metrics that reward hedging. The correction came quickly, and it came in the ensemble's own vocabulary: [GenCast](/blog/gencast) and the AIFS ensemble are evaluated with CRPS and spread-skill relationships, and they are judged against the ECMWF ensemble because that is the standard the probabilistic era established. Ensemble thinking was not superseded by AI; it is the yardstick AI is now measured with.

---

## References & further learning

**Accessible starting points**

- [ECMWF fact sheet: Ensemble weather forecasting](https://www.ecmwf.int/en/about/media-centre/focus/2017/fact-sheet-ensemble-weather-forecasting) — the plain-language institutional account.
- [COMET / MetEd: Ensemble forecasting courses](https://www.meted.ucar.edu/) — operational training on reading and verifying ensembles.

**Technical depth**

- Lorenz, E. N. (1963). ["Deterministic nonperiodic flow."](https://doi.org/10.1175/1520-0469(1963)020<0130:DNF>2.0.CO;2) *Journal of the Atmospheric Sciences*, 20.
- Molteni, F., Buizza, R., Palmer, T. N., & Petroliagis, T. (1996). ["The ECMWF Ensemble Prediction System: Methodology and validation."](https://doi.org/10.1002/qj.49712252905) *QJRMS*, 122.
- Toth, Z., & Kalnay, E. (1993). ["Ensemble forecasting at NMC: The generation of perturbations."](https://doi.org/10.1175/1520-0477(1993)074<2317:EFANTG>2.0.CO;2) *BAMS*, 74.
- Buizza, R., Miller, M., & Palmer, T. N. (1999). ["Stochastic representation of model uncertainties in the ECMWF Ensemble Prediction System."](https://doi.org/10.1002/qj.49712556006) *QJRMS*, 125.
- Leutbecher, M., & Palmer, T. N. (2008). ["Ensemble forecasting."](https://doi.org/10.1016/j.jcp.2007.02.014) *Journal of Computational Physics*, 227 — the best single review.
- Palmer, T. (2019). ["The ECMWF ensemble prediction system: Looking back (more than) 25 years and projecting forward 25 years."](https://doi.org/10.1002/qj.3383) *QJRMS*, 145.

*Next in the series: [MOS and the Forecaster](/blog/mos-and-the-forecaster) — statistical guidance, and the forty-year argument about what the human adds.*
`,
};

export default article;
