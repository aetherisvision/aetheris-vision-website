import { AUTHOR, CATEGORY_NWP, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 12,
  slug: "richardsons-dream",
  title: "Richardson's Dream: How the Weather Became a Calculation",
  date: "Jun 8, 2026",
  category: CATEGORY_NWP,
  author: AUTHOR,
  summary:
    "A century before AI forecasting, a Quaker ambulance driver computed the weather by hand and got it spectacularly wrong. Why he failed, who fixed it, and what the first numerical forecasts taught the field.",
  content: `
Every AI weather model in our [AI & Weather series](/blog/state-of-ai-weather-models-2026) is trained on reanalysis produced by physical models, and initialized from analyses produced the same way. That infrastructure did not arrive with the computers. It was imagined first, failed first, and succeeded only after a generation of mathematicians and meteorologists understood *why* it had failed. This series tells that story — the traditional models and the forecasting craft that grew up around them — because you cannot judge what is new until you know what it stands on.

## A problem stated in 1904

Vilhelm Bjerknes, a Norwegian physicist, published a short paper in 1904 that defined the entire field. Forecasting, he argued, is an initial-value problem: if you know the state of the atmosphere now, and you know the physical laws governing it, the future state follows by calculation. He listed the seven unknowns — three wind components, pressure, temperature, density, humidity — and the seven equations that govern them: the three equations of motion, the continuity equation, the thermodynamic equation, the equation of state, and a moisture equation. Everything since has been an attempt to carry out the program he wrote down.

Bjerknes also saw the two obstacles clearly. You need an adequate *diagnosis* — observations dense enough to define the present state — and a practical *method* for integrating equations that have no general solution. The first problem took the rest of the century. The second was attacked by a man with no computer.

![Schematic timeline: Bjerknes states the problem in 1904; Richardson's 1922 hand calculation fails; the 1950 ENIAC forecast succeeds; routine operational forecasting begins in 1954–55.](/images/insights/richardsons-dream.svg)

## Richardson's forecast

Lewis Fry Richardson was a British mathematician and Quaker who, during the First World War, served with a Friends' Ambulance Unit in France. Between shifts, in a cold billet, he carried out by hand the first numerical weather forecast: a six-hour prediction of pressure change over central Europe for 20 May 1910, a day chosen because Bjerknes had published an unusually complete set of observations for it.

The method was essentially modern. He divided the region into a checkerboard of cells, assigned each a column of atmospheric layers, and stepped the equations forward in time using finite differences. The arithmetic took him weeks. The answer was a pressure rise of 145 hectopascals in six hours — a physically absurd number, roughly a seventh of the atmosphere's entire weight appearing over Bavaria. The observed change was close to zero.

He published anyway, in *Weather Prediction by Numerical Process* (1922), with the failure explained as honestly as the method. And he closed with a famous fantasy: a "forecast factory," a vast hall shaped like a theater, with 64,000 human computers each calculating one cell, coordinated by a conductor in the center — the number he estimated would be needed to compute the weather as fast as it happened.

## Why it failed

The calculation was not wrong. The *input* was. Richardson's initial state, assembled from observations that were never meant to be mutually consistent, contained small imbalances between the pressure and wind fields — and the primitive equations faithfully amplified those imbalances into enormous, fast-moving gravity waves that swamped the real weather signal. In the 1990s and 2000s, Peter Lynch repeated Richardson's forecast with the original data and showed that a modest filtering of the initial fields, the kind of *initialization* every modern model performs, turns the absurd 145 hPa into a sensible tendency of about a hectopascal.

That is the first lesson of numerical prediction, and it is worth carrying forward to the AI era: **the initial state is the forecast's foundation, and it cannot simply be copied from observations.** Getting the initial state right would become a discipline of its own — [data assimilation](/blog/data-assimilation-the-initial-state) — and it remains, in 2026, a physics-and-supercomputer problem that every learned model quietly depends on.

## The first success: ENIAC, 1950

The two pieces Richardson lacked arrived together after the Second World War. One was the machine: John von Neumann, a consultant to the ENIAC who was building its successor at Princeton, wanted a scientific problem worthy of such machines and chose the weather. The other was a theory for taming the equations: Jule Charney's 1948 work on *filtering* — simplifying the equations so the fast gravity waves that wrecked Richardson's forecast could not exist in the model at all.

In April 1950, Charney, Ragnar Fjørtoft, and von Neumann ran the first successful numerical forecasts on the ENIAC at Aberdeen Proving Ground. The model was the *barotropic vorticity equation* — a single equation for a single level, treating the mid-troposphere (the 500 hPa surface) as a two-dimensional fluid that conserves absolute vorticity. It could not predict rain, temperature, or anything at the surface. What it could do was move troughs and ridges across North America for 24 hours in a way that resembled the real atmosphere. The computation itself took about 24 hours — the forecast barely kept pace with the weather — but the point was made, and the paper appeared in *Tellus* that year.

## Operational forecasting begins

Routine operational numerical forecasting started not in the United States but in Sweden, where Carl-Gustaf Rossby's group at Stockholm ran barotropic forecasts on the BESK computer beginning in late 1954. In the United States, the Weather Bureau, the Air Force, and the Navy pooled their resources into the Joint Numerical Weather Prediction Unit, which began operational forecasts in May 1955. The Air Force's involvement from the very first day is worth remembering: military aviation needed forecasts as badly as anyone, and Air Weather Service forecasters would work alongside numerical guidance for the rest of the century.

The early years were humbling. The first operational models were often worse than the experienced forecasters they were meant to help, and the subjective forecaster remained the product. Improvement came from three directions at once: better physics in the models, better observations (especially from the satellites of the 1960s and 1970s), and better computers. By 1966 the U.S. center was running a six-layer primitive-equation model — Richardson's full equations, properly initialized, at last — and the steady climb in skill that Peter Bauer and colleagues later called "the quiet revolution" had begun.

## What the beginning teaches

Three things from this history matter for anyone evaluating forecasting technology today.

**The equations were never the hard part.** Bjerknes wrote them in 1904. The hard parts were the initial state and the computational discipline to integrate without amplifying noise — problems that do not disappear when the dynamics are replaced by a learned function, as the [AI series](/blog/transformers-and-graph-networks-in-weather) discusses under the heading of compounding error.

**Filtering was a bet, and it paid off.** Charney's insight was to throw away the part of the physics that could not be computed reliably. Every successful forecasting system since has made a version of that bet — deciding what to resolve, what to approximate, and what to ignore.

**Operational credibility was earned slowly against a skeptical profession.** The forecasters of the 1950s were right to be skeptical, and the modelers were right to persist. The next several articles follow that relationship through the models forecasters actually used, and then through the craft those forecasters practiced — the skills that built the judgment numerical guidance was always meant to inform, not replace.

---

## References & further learning

**Accessible starting points**

- Lynch, P. (2006). *The Emergence of Numerical Weather Prediction: Richardson's Dream.* Cambridge University Press — the definitive account, including the reconstruction of Richardson's forecast.
- Harper, K. C. (2008). *Weather by the Numbers: The Genesis of Modern Meteorology.* MIT Press — the institutional and human story of the American program.
- [NCEP Environmental Modeling Center: Our history](https://www.emc.ncep.noaa.gov/emc/pages/ourhistory.php) — the American modeling center's own timeline.

**Technical depth**

- Bjerknes, V. (1904). "Das Problem der Wettervorhersage, betrachtet vom Standpunkte der Mechanik und der Physik." *Meteorologische Zeitschrift*, 21 — the problem statement.
- Richardson, L. F. (1922). *Weather Prediction by Numerical Process.* Cambridge University Press (reissued 2007 with an introduction by Lynch).
- Charney, J. G., Fjørtoft, R., & von Neumann, J. (1950). ["Numerical integration of the barotropic vorticity equation."](https://doi.org/10.3402/tellusa.v2i4.8607) *Tellus*, 2 — the ENIAC forecast.
- Lynch, P. (2008). ["The origins of computer weather prediction and climate modeling."](https://doi.org/10.1016/j.jcp.2007.02.034) *Journal of Computational Physics*, 227.
- Harper, K., Uccellini, L. W., Kalnay, E., Carey, K., & Morone, L. (2007). ["50th anniversary of operational numerical weather prediction."](https://doi.org/10.1175/BAMS-88-5-639) *BAMS*, 88.
- Bauer, P., Thorpe, A., & Brunet, G. (2015). ["The quiet revolution of numerical weather prediction."](https://doi.org/10.1038/nature14956) *Nature*, 525.

*Next in the series: [Inside a Weather Model](/blog/inside-a-weather-model) — what the equations are, what the grid can and cannot see, and why parameterization is where the art lives.*
`,
};

export default article;
