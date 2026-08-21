import { AUTHOR, CATEGORY_NWP, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 13,
  slug: "inside-a-weather-model",
  title: "Inside a Weather Model: Equations, Grids, and the Art of Parameterization",
  date: "Jun 12, 2026",
  category: CATEGORY_NWP,
  author: AUTHOR,
  summary:
    "What a numerical weather model actually computes — the governing equations, the grid that decides what it can see, the time step that keeps it stable, and the sub-grid physics where most of the judgment lives. Explained twice: plain language, then the machinery.",
  content: `
"The model says" is the most common phrase in a forecast office, and one of the least examined. This article opens the box. A numerical weather prediction model is five things bolted together: a set of physical equations, a grid on which to solve them, a scheme for stepping forward in time, a collection of approximations for everything the grid cannot see, and a starting state. Each section below gives the intuition first and the machinery second, in the same two-register format as our [transformers article](/blog/transformers-and-graph-networks-in-weather) — because the models that AI now learns from deserve at least as careful a look.

![Schematic: a single grid column of the atmosphere — resolved dynamics on the grid, with radiation, convection, turbulence, and surface exchange handled by parameterizations beneath the grid scale.](/images/insights/inside-a-weather-model.svg)

## The equations

### The intuition

The atmosphere is a thin shell of gas on a rotating sphere, heated unevenly by the sun. Everything a model computes follows from a few conservation laws you already know in some form: Newton's second law (air accelerates when pushed by pressure differences, deflected by the Earth's rotation, and slowed by friction), conservation of mass (air that converges must rise), conservation of energy (air warms when compressed or heated, cools when it expands or radiates), and conservation of water (vapor condenses, falls, evaporates). Add the ideal-gas law to tie pressure, temperature, and density together, and you have Bjerknes's seven equations in seven unknowns from [the previous article](/blog/richardsons-dream).

### Under the hood

The horizontal momentum equations balance acceleration against the pressure-gradient force, the Coriolis term, and friction; in their full form they are the Navier–Stokes equations in a rotating frame. The vertical momentum equation is usually replaced by the **hydrostatic approximation** — pressure at any height simply equals the weight of the air above — which is excellent when horizontal scales are much larger than vertical ones, and fails exactly where convection lives. That is why global models were hydrostatic for decades and why convection-allowing models such as the HRRR must be **non-hydrostatic**, carrying a real vertical acceleration. The thermodynamic equation is the first law with a heating term; the continuity equation links wind divergence to vertical motion; and moisture is carried as one or more tracers with sources and sinks. These are the **primitive equations** — "primitive" meaning unfiltered, the full set Richardson attempted, as opposed to the filtered barotropic equation that succeeded in 1950.

## The grid

### The intuition

A model cannot compute the atmosphere everywhere; it computes it at points — a three-dimensional lattice of columns and layers. The spacing between points is the model's *resolution*, and it is the single number that most determines what the model can and cannot see. A useful rule: a weather feature needs to span several grid spacings before the model represents it with any fidelity. A 25-kilometer global model does not "see" a 25-kilometer thunderstorm complex; it begins to see something of a 150-kilometer system.

### Under the hood

Horizontal discretization comes in two families. **Grid-point** models store values at lattice points and approximate derivatives with finite differences (or finite volumes). **Spectral** models represent each field as a sum of spherical harmonics — global waves — and are described by a truncation number: T126 keeps waves down to roughly one degree, about 100 km. The spectral approach, used by the U.S. global model from 1980 and by ECMWF from 1983, computes derivatives exactly in wave space and transforms back to a grid for the physics. Vertically, models use terrain-following coordinates (sigma, or hybrid sigma-pressure) so the lowest layer hugs the ground; the Eta model's distinctive step-mountain coordinate was one alternative. Effective resolution is worse than the grid spacing: the numerical schemes damp the smallest waves, and a feature is typically well represented only at five to seven grid lengths and above.

## The time step

### The intuition

Having computed how fast everything is changing, the model advances the clock by a small step, recomputes, and repeats — thousands of times for a ten-day forecast. The step cannot be arbitrarily long. Information must not travel more than one grid spacing per step, or the calculation tears itself apart. Finer grids therefore force shorter steps, which is why doubling resolution costs far more than double the computing.

### Under the hood

The constraint is the Courant–Friedrichs–Lewy (CFL) condition of 1928: for an explicit scheme, the time step must satisfy $\\Delta t \\le \\Delta x / c$, where $c$ is the fastest signal the equations support. In the primitive equations that signal is a gravity wave or, without the hydrostatic assumption, sound — hundreds of meters per second — which would force steps of seconds on a fine grid. Two tricks rescue operational models: **semi-implicit** time stepping treats the fast waves implicitly so they no longer limit the step, and **semi-Lagrangian** advection follows air parcels backward along trajectories instead of differencing across fixed points. Together they let global models take steps of several minutes at grid spacings under ten kilometers — a computational foundation as important as any physics.

## Parameterization: where the art lives

### The intuition

Everything smaller than the grid still matters. Cumulus clouds, turbulent eddies, radiation passing through cloud droplets, heat and moisture exchanging with soil and sea — none of these are resolved, yet together they drive the weather. A **parameterization** is a formula that estimates the net effect of an unresolved process on a grid column from the resolved variables in that column. It is a physically informed approximation, and every one of them embodies choices. This is where models differ most, why two models with the same equations give different forecasts, and why each model has a "personality" forecasters learn.

### Under the hood

The standard suite: **radiation** (shortwave and longwave transfer through gases, clouds, and aerosols), **convection** (the deep and shallow cumulus schemes — mass-flux closures such as Arakawa–Schubert, Kain–Fritsch, Tiedtke — that decide when and how a column overturns), **cloud microphysics** (condensation, the growth of drops and ice, precipitation fallout), **boundary-layer turbulence** (mixing of heat, moisture, and momentum in the lowest kilometer), **land-surface** models (soil moisture, vegetation, snow), and **gravity-wave drag** from unresolved mountains. Each scheme has tunable constants, and a model's biases — the famous tendencies toward too-early afternoon convection, too-light widespread drizzle, or a warm bias in the boundary layer — are mostly parameterization signatures. Convection-allowing models at grid spacings of about 4 km or finer switch the deep-convection scheme off entirely and let the dynamics build storms explicitly, which is why those models produce storm structures that look real and why they are the tool of choice for the day's severe weather.

## Boundary conditions

A global model needs only an initial state and a lower boundary: sea-surface temperature, sea ice, soil state, snow cover. A **limited-area** model — the regional workhorses from the LFM of 1971 to today's HRRR — additionally needs lateral boundary conditions supplied by a global model, and inherits that model's errors at the edges. The Air Force's relocatable theater models of the late 1980s and 1990s were limited-area models in this sense, nested inside global guidance so that a forecast could be produced for wherever the mission was. Boundary conditions are a second channel, after the initial state, through which a regional forecast is never better than the global forecast that surrounds it.

## Reading model output like a forecaster

Understanding the machinery changes how output should be read. Precipitation amounts from a 25-km model are grid-box averages, not point values; the heaviest rain in a real storm is always more intense than the model's bullseye. The first few hours of a forecast are **spin-up**, as the parameterizations adjust to an initial state that did not come from the model's own physics. A model's climatology — its habitual biases — is a fact about its parameterizations, not about the day. And resolution determines the category of feature a forecaster may trust: synoptic systems from a global model, mesoscale structure from a regional model, individual storm cells only from a convection-allowing one, and even then with limited predictability.

## What this means for AI models

Every AI model in [our series](/blog/state-of-ai-weather-models-2026) is trained on the output of a system like this one, running in reanalysis mode. The learned model's strengths and blind spots are inherited: it knows the atmosphere at the resolution and with the biases of its training analyses. There is also a deeper parallel. A parameterization is a learned-from-physics closure for what the grid cannot resolve; a data-driven model is, in effect, one enormous closure for everything. The NeuralGCM approach — keep the resolved dynamics, learn the closure — is the most direct acknowledgment yet that the traditional architecture had the division of labor right.

---

## References & further learning

**Accessible starting points**

- [COMET / MetEd: Numerical Weather Prediction courses](https://www.meted.ucar.edu/) — the operational forecaster's standard training material on model fundamentals.
- [ECMWF: IFS documentation](https://www.ecmwf.int/en/publications/ifs-documentation) — the full scientific description of a modern global model, physics and dynamics, freely available.

**Technical depth**

- Kalnay, E. (2003). *Atmospheric Modeling, Data Assimilation and Predictability.* Cambridge University Press — the standard graduate text.
- Warner, T. T. (2011). *Numerical Weather and Climate Prediction.* Cambridge University Press.
- Stensrud, D. J. (2007). *Parameterization Schemes: Keys to Understanding Numerical Weather Prediction Models.* Cambridge University Press.
- Courant, R., Friedrichs, K., & Lewy, H. (1928). ["Über die partiellen Differenzengleichungen der mathematischen Physik."](https://doi.org/10.1007/BF01448839) *Mathematische Annalen*, 100 — the CFL condition.
- Arakawa, A., & Schubert, W. H. (1974). ["Interaction of a cumulus cloud ensemble with the large-scale environment, Part I."](https://doi.org/10.1175/1520-0469(1974)031<0674:IOACCE>2.0.CO;2) *Journal of the Atmospheric Sciences*, 31.
- Kain, J. S., & Fritsch, J. M. (1990). ["A one-dimensional entraining/detraining plume model and its application in convective parameterization."](https://doi.org/10.1175/1520-0469(1990)047<2784:AODEPM>2.0.CO;2) *Journal of the Atmospheric Sciences*, 47.
- Skamarock, W. C. (2004). ["Evaluating mesoscale NWP models using kinetic energy spectra."](https://doi.org/10.1175/MWR2830.1) *Monthly Weather Review*, 132 — effective resolution.

*Next in the series: [The Initial State](/blog/data-assimilation-the-initial-state) — data assimilation, the discipline Richardson lacked.*
`,
};

export default article;
