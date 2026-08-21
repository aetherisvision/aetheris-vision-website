import { AUTHOR, CATEGORY_NWP, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 14,
  slug: "data-assimilation-the-initial-state",
  title: "The Initial State: Data Assimilation, Forecasting's Quiet Crown Jewel",
  date: "Jun 17, 2026",
  category: CATEGORY_NWP,
  author: AUTHOR,
  summary:
    "Every forecast starts from an estimate of the atmosphere that no instrument can provide directly. How that estimate is built — from hand analysis to 4D-Var and ensemble filters — why satellites changed everything, and why AI models still cannot do without it.",
  content: `
Richardson's forecast failed because of its starting point. Seventy years of work on that one problem produced the least celebrated and most valuable technology in meteorology: **data assimilation**, the method by which millions of imperfect, irregular observations are combined with a previous forecast to produce a single, physically consistent estimate of the atmosphere at one instant. Every forecast begins from it. Every reanalysis that trains an AI model is produced by it. This article explains what it is, how it evolved, and why it remains the part of the forecasting system the headlines never mention.

## The problem, plainly

At any moment the atmosphere's state is described, in a modern global model, by something like a billion numbers — winds, temperature, humidity, pressure on every grid point and level. Against that we have perhaps tens of millions of observations in a six-hour window, clustered over land and along flight routes, sparse over oceans and the Southern Hemisphere, each with its own error, and most of them (satellite radiances) not even measuring the model's variables directly. The task is to produce the best estimate of all billion numbers from the observations we have.

### The intuition

Suppose you have two thermometers of different quality and you want the best estimate of the temperature. You do not pick one; you average them, weighting the better instrument more. Now suppose you also have a decent guess of the temperature before you read either — yesterday's forecast for today. That guess is a third source of information, to be weighted by *its* reliability. Data assimilation is this weighted combination carried out across a billion variables at once, with one more ingredient: the physics. The previous forecast, called the **background**, carries the atmosphere's structure — its balances, its correlations between neighboring points and between wind and pressure — so that an observation of wind over the Pacific correctly adjusts the pressure field around it, and a temperature measurement at one level influences the levels above and below. Observations correct the background; the background spreads the corrections physically.

![Schematic: the assimilation cycle — a short forecast provides the background, observations are blended in to form the analysis, and the analysis launches the next forecast.](/images/insights/data-assimilation-cycle.svg)

### Under the hood

Modern methods minimize a cost function that penalizes distance from the background and distance from the observations, each weighted by the inverse of its error covariance:

$$
J(x) = (x - x_b)^{\\top} B^{-1} (x - x_b) + (y - H(x))^{\\top} R^{-1} (y - H(x))
$$

Here $x$ is the state being sought, $x_b$ the background, $y$ the observations, $H$ the **observation operator** that maps a model state to what each instrument would measure, $B$ the background-error covariance, and $R$ the observation-error covariance. Everything important hides in two places. $B$ encodes the physics — how an error at one point relates to errors elsewhere — and specifying it well is the central art. $H$ is where satellites enter: for a radiance measurement, $H$ is a full radiative-transfer calculation, which is why assimilating satellite data directly, rather than through retrieved temperatures, was such a consequential advance.

## The methods, in order

- **Hand analysis (1950s).** Analysts drew the initial fields by hand from plotted observations and the previous forecast, then digitized them. This is the same craft described later in this series under [hand analysis](/blog/hand-analysis) — but as the *input* to the computer, it could not keep pace.
- **Successive corrections (1959).** George Cressman's scheme at the U.S. center iteratively nudged a first guess toward nearby observations with distance-weighted corrections. Objective, fast, crude about errors.
- **Optimal interpolation (1960s–1980s).** Lev Gandin's statistical formulation weighted observations by their error statistics and the background's — the first method to treat the problem as estimation. Operational through the 1970s and 1980s at most centers.
- **Three-dimensional variational (3D-Var, 1990s).** Minimizing the cost function above directly over the whole globe. The U.S. center's Spectral Statistical Interpolation in 1991 and ECMWF's 3D-Var in 1996 made direct radiance assimilation practical.
- **Four-dimensional variational (4D-Var, 1997).** The same minimization carried across a time window, using the model's dynamics — and its adjoint — so that observations at the right time correct the state consistently. ECMWF went operational in late 1997; the skill gains, especially in the data-sparse Southern Hemisphere, were among the largest in the center's history.
- **Ensemble Kalman filters (2000s).** Geir Evensen's 1994 formulation, developed for operations by Houtekamer and Mitchell in Canada, estimates the background-error covariance from an ensemble of forecasts instead of prescribing it — so $B$ changes with the weather of the day.
- **Hybrids (2010s–present).** Nearly every major center now blends the two: variational minimization with ensemble-derived, flow-dependent covariances. The U.S. global system adopted a hybrid in 2012 and four-dimensional ensemble-variational assimilation in 2016.

## The observing system

What gets assimilated is as important as how. Radiosondes, launched twice daily from several hundred stations, remain the reference for the vertical profile and are thin over oceans. Surface stations, ships, buoys, and commercial aircraft add coverage where people and routes are. But by count, satellites supply the overwhelming majority of assimilated observations: microwave and infrared sounders on polar orbiters, winds derived from cloud motion on geostationary imagery, radio-occultation profiles from GNSS signals bending through the atmosphere, scatterometer ocean winds. The transformation of forecasting in the 1990s and 2000s — the Southern Hemisphere catching up to the Northern — is, to a first approximation, the story of learning to assimilate satellite radiances well.

## Reanalysis: the archive that AI learns from

Run a fixed, modern assimilation system backward over decades of archived observations and you obtain a **reanalysis**: a consistent, gridded, physically balanced reconstruction of the atmosphere's history. The U.S. NCEP/NCAR Reanalysis of 1996 was the first widely used; ECMWF's ERA-40, ERA-Interim, and now ERA5 — hourly, at about 31 km, from 1940 to the present — became the field's standard. ERA5 is what GraphCast, Pangu-Weather, FourCastNet, GenCast, and their descendants are trained on. Every one of their skill results is a statement about how well they learned ERA5, and every one of their operational runs starts from an analysis produced by the same machinery.

## Why AI has not replaced it

Learning the assimilation step end to end — raw observations in, analysis or forecast out — is an active research frontier, and Aardvark Weather (2025) showed a first complete system. But the physics-based analysis still sets the standard for accuracy and, critically, for *balance*: a learned initial state that is slightly inconsistent sends the subsequent forecast through exactly the spurious adjustments that ruined Richardson's. The honest summary in 2026 is that data assimilation is where the traditional model infrastructure is least replaceable, and where "AI replaced the supercomputers" is furthest from the truth.

---

## References & further learning

**Accessible starting points**

- [ECMWF: Data assimilation](https://www.ecmwf.int/en/research/data-assimilation) — the center's own overview.
- [ECMWF fact sheet: Reanalysis](https://www.ecmwf.int/en/about/media-centre/focus/2023/fact-sheet-reanalysis) — what ERA5 is and how it is made.

**Technical depth**

- Kalnay, E. (2003). *Atmospheric Modeling, Data Assimilation and Predictability.* Cambridge University Press.
- Daley, R. (1991). *Atmospheric Data Analysis.* Cambridge University Press — the classic treatment of the statistical foundations.
- Parrish, D. F., & Derber, J. C. (1992). ["The National Meteorological Center's spectral statistical-interpolation analysis system."](https://doi.org/10.1175/1520-0493(1992)120<1747:TNMCSS>2.0.CO;2) *Monthly Weather Review*, 120 — 3D-Var in U.S. operations.
- Rabier, F., et al. (2000). ["The ECMWF operational implementation of four-dimensional variational assimilation. I: Experimental results with simplified physics."](https://doi.org/10.1002/qj.49712656415) *QJRMS*, 126.
- Evensen, G. (1994). ["Sequential data assimilation with a nonlinear quasi-geostrophic model using Monte Carlo methods to forecast error statistics."](https://doi.org/10.1029/94JC00572) *Journal of Geophysical Research*, 99 — the ensemble Kalman filter.
- Kalnay, E., et al. (1996). ["The NCEP/NCAR 40-Year Reanalysis Project."](https://doi.org/10.1175/1520-0477(1996)077<0437:TNYRP>2.0.CO;2) *BAMS*, 77.
- Hersbach, H., et al. (2020). ["The ERA5 global reanalysis."](https://doi.org/10.1002/qj.3803) *QJRMS*, 146.

*Next in the series: [The Models We Ran](/blog/the-models-we-ran) — LFM, NGM, Eta, AVN and MRF, and the road to the GFS.*
`,
};

export default article;
