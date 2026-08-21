import { AUTHOR, CATEGORY_NWP, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 15,
  slug: "the-models-we-ran",
  title: "The Models We Ran: LFM, NGM, Eta, the AVN, and the Road to the GFS",
  date: "Jun 22, 2026",
  category: CATEGORY_NWP,
  author: AUTHOR,
  summary:
    "A forecaster's lineage of the operational models — American, European, and military — from the first regional grid of 1971 to the convection-allowing era, and what it meant to learn each one's personality.",
  content: `
Forecasters of a certain age know models the way mechanics know engines: by acronym, by habit, by the particular way each one went wrong. The LFM, the NGM, the Eta, the AVN and the MRF, the RUC, the "Euro" — these were not abstractions. They arrived on fax paper and, later, on a screen, twice or four times a day, and the working day was organized around comparing them. This article traces that lineage, with a detour into the Air Force models that Air Weather Service forecasters also lived with, and closes with what the comparison ritual taught.

![Schematic timeline of operational models: U.S. regional and global lines from the LFM through the Eta, RUC, HRRR, and GFS; ECMWF from 1979; the convection-allowing era from the 2010s.](/images/insights/the-models-we-ran.svg)

## The American line

The U.S. center was the National Meteorological Center (NMC) until 1995, and NCEP — the National Centers for Environmental Prediction — since. Its operational models form a surprisingly orderly sequence.

- **1955–58 — from three levels to one.** The Joint Numerical Weather Prediction Unit's first operational model, a three-level quasi-geostrophic scheme, disappointed everyone who tried to use it. The one-level barotropic model that replaced it in 1958 — one equation, the 500 hPa pattern moved forward — was the first product forecasters found genuinely useful, mainly those already thinking in terms of upper-air troughs and ridges.
- **1966 — the six-layer primitive-equation model.** Shuman and Hovermale's model was the first U.S. operational integration of the full equations. Richardson's method, working.
- **1971 — LFM, the Limited-area Fine Mesh.** The first widely used regional model, on a 190-km grid over North America. Coarse by any later standard, but it gave forecasters quantitative precipitation and lower-tropospheric fields at a resolution the hemispheric models could not, and its output charts became the wallpaper of every office.
- **1980 — the global spectral model.** Sela's spectral model replaced grid-point hemispheric models and became the basis for the **MRF** (Medium Range Forecast, run once daily to ten days and beyond) and the **AVN** (the Aviation run, shorter range, twice daily and four times daily from 1997). Forecasters spoke of "the AVN" and "the MRF" as separate models for twenty years; they were the same model run differently.
- **1985 — NGM, the Nested Grid Model.** The Regional Analysis and Forecast System's model, with a finer inner grid nested in a hemispheric outer one. The NGM was the regional workhorse of the late 1980s and early 1990s and the model most forecasters of that era learned first; its biases were catalogued in office notebooks and training memos.
- **1993 — Eta.** Mesinger and Janjić's model with its step-mountain vertical coordinate, run at 80 km and steadily refined to 48, 32, 22, and 12 km. The Eta handled terrain and fronts with a realism the NGM could not, and it remained the regional mainstay until it was replaced, as the **NAM** (North American Mesoscale), by a WRF-based core in 2006.
- **1994 — RUC, the Rapid Update Cycle.** Stan Benjamin's hourly assimilating model, built for aviation and for the nowcast-to-short-range gap. It became the **RAP** in 2012 and spawned the convection-allowing **HRRR** — the High-Resolution Rapid Refresh at 3 km — operational in 2014, the model that finally let forecasters see individual storm structures in guidance.
- **2002 — GFS.** The AVN and MRF were unified under one name, the Global Forecast System. The GFS adopted the FV3 finite-volume dynamical core in 2019 and is today the public, free global model that much of the world's forecasting runs on.

## Europe, and the model everyone envied

The European Centre for Medium-Range Weather Forecasts was founded in 1975 by a consortium of European states with a single mission — medium-range global forecasting — and produced its first operational forecast on 1 August 1979. It moved to a spectral model in 1983 and to the integrated system later named the **IFS**. From the 1980s onward, the ECMWF model was, on most objective measures, the most skillful global model in the world, and American forecasters came to call it simply "the Euro." Its lead owed less to any single idea than to a relentless program of data assimilation, higher resolution, and verification — the institutional culture that, decades later, would make ECMWF the credible arbiter of AI forecasting claims.

The other national centers built their own lines: the UK Met Office's Unified Model (1991, the first to use one code for weather and climate), Météo-France's ARPEGE (1993), Canada's GEM (1997), Japan's GSM, and the German Weather Service's icosahedral GME (1999) and its successor ICON — the grid geometry that GraphCast would later borrow.

## The military's own models

Air Weather Service forecasters in the 1980s and 1990s worked with two streams of guidance. NMC products came over the same circuits that served the Weather Service. But the Air Force Global Weather Central at Offutt Air Force Base also ran its own models — a global spectral model and a relocatable theater-scale model that could be re-centered wherever a contingency required — precisely because military forecasting had to cover places the civilian regional models did not. In October 1997 AFGWC was merged into the new Air Force Weather Agency at Offutt — Air Weather Service redesignated — which adopted the Penn State–NCAR MM5 as its mesoscale model that year and moved to the WRF in the 2000s. The Navy's Fleet Numerical center likewise ran its own global model, NOGAPS, from 1982, succeeded by NAVGEM in 2013. An Air Force forecaster's bench in 1994 thus carried AFGWC charts beside NGM and Eta charts, and part of the craft was knowing which to believe for which purpose.

## The daily ritual: model personalities

Every office kept, formally or informally, a ledger of what each model did well and badly. The material was specific — a model's tendency to over-deepen cyclones in one regime, to move systems too slowly in another, to produce too much light precipitation or too little convective rain — and most of it was not published; it lived in training memos, shift handovers, and the memories of senior forecasters. The daily comparison of the NGM, Eta, and AVN solutions was not a search for the "right" model. It was a search for the *pattern of disagreement*: where the models diverged, predictability was low, and the forecast needed hedging; where they agreed, confidence was justified. That habit of reading disagreement as information was, in effect, informal ensemble forecasting, years before [formal ensembles](/blog/ensembles-and-the-end-of-the-single-forecast) made it rigorous.

The other thing the ritual taught was humility about any single run. The MRF's day-five solution would swing from run to run; the sensible forecaster waited for consistency across runs before committing. "Run-to-run continuity" is a phrase that deserves to survive into the AI era, where a single fast model can be rerun so cheaply that the temptation to chase every new solution is stronger than ever.

## What changed, and how much

Between the LFM's 190 km and the HRRR's 3 km lies a sixty-fold change in resolution; between the NGM's initial state and a modern hybrid analysis lies the [satellite assimilation revolution](/blog/data-assimilation-the-initial-state). The net effect, measured by ECMWF's verification and described by Bauer and colleagues as "the quiet revolution," is roughly one day of useful lead time gained per decade: a five-day forecast today is about as skillful as a three-day forecast was in the early 1990s. That figure is the baseline every AI headline should be measured against. Beating the current GFS or IFS on a medium-range score is genuinely impressive — and it is beating a system that already improved by two full days of lead time within the careers of forecasters still working.

---

## References & further learning

**Accessible starting points**

- [ECMWF: History](https://www.ecmwf.int/en/about/who-we-are/history) — the European line, year by year.
- Fuller, J. F. (1990). *Thor's Legions: Weather Support to the U.S. Air Force and Army, 1937–1987.* American Meteorological Society — the Air Weather Service story.

**Technical depth**

- Shuman, F. G. (1989). ["History of numerical weather prediction at the National Meteorological Center."](https://doi.org/10.1175/1520-0434(1989)004<0286:HONWPA>2.0.CO;2) *Weather and Forecasting*, 4 — the American lineage from inside.
- Kalnay, E., Lord, S. J., & McPherson, R. D. (1998). ["Maturity of operational numerical weather prediction: Medium range."](https://doi.org/10.1175/1520-0477(1998)079<2753:MOONWP>2.0.CO;2) *BAMS*, 79.
- Mesinger, F., Janjić, Z. I., Ničković, S., Gavrilov, D., & Deaven, D. G. (1988). ["The step-mountain coordinate: Model description and performance for cases of Alpine lee cyclogenesis and for a case of an Appalachian redevelopment."](https://doi.org/10.1175/1520-0493(1988)116<1493:TSMCMD>2.0.CO;2) *Monthly Weather Review*, 116 — the Eta coordinate.
- Benjamin, S. G., et al. (2004). ["An hourly assimilation–forecast cycle: The RUC."](https://doi.org/10.1175/1520-0493(2004)132<0495:AHACTR>2.0.CO;2) *Monthly Weather Review*, 132.
- Benjamin, S. G., et al. (2016). ["A North American hourly assimilation and model forecast cycle: The Rapid Refresh."](https://doi.org/10.1175/MWR-D-15-0242.1) *Monthly Weather Review*, 144 — RAP and HRRR.
- Woods, A. (2006). *Medium-Range Weather Prediction: The European Approach.* Springer.

*Next in the series: [Ensembles and the End of the Single Forecast](/blog/ensembles-and-the-end-of-the-single-forecast).*
`,
};

export default article;
