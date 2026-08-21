import { AUTHOR, CATEGORY_CRAFT, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 19,
  slug: "reading-the-skew-t",
  title: "Reading the Skew-T: The Sounding as a Story",
  date: "Jul 9, 2026",
  category: CATEGORY_CRAFT,
  author: AUTHOR,
  summary:
    "One balloon, one diagram, and most of what a forecaster needed to know about the day: stability, cloud, fog, icing, storms. How the skew-T was read, the Air Weather Service technique that made it a checklist, and why reading the raw profile still beats the indices.",
  content: `
Twice a day, at 0000 and 1200 UTC, balloons rise from several hundred stations around the world and radio back temperature, humidity, pressure, and wind through the depth of the troposphere. Plotted on a **skew-T log-p diagram**, that single profile tells an experienced reader whether the afternoon will bring thunderstorms, whether the morning fog will burn off by nine, where aircraft will ice, how warm the day will get, and whether the rain will reach the ground as snow. The sounding is the most information-dense product in operational meteorology, and reading it was a core skill of every forecaster trained before the indices were computed for him. This article teaches the reading — intuition first, then the machinery — and closes with the technique the Air Force built around it.

![Schematic: a skew-T log-p diagram with the temperature and dew-point profiles, a lifted parcel path, and the LCL, LFC, and equilibrium level marked; positive area shaded as CAPE.](/images/insights/reading-the-skew-t.svg)

## The diagram

### The intuition

The skew-T is a picture of a column of air. Height runs upward (as pressure, decreasing), temperature runs across — but tilted 45 degrees to the right, which is the trick that makes the diagram work: a rising parcel of dry air, cooling at a fixed rate, traces a line nearly perpendicular to the tilted isotherms, so stability differences stand out as angles you can see at a glance. Two curves are plotted: the temperature of the air at each level and its dew point. Where they lie close together, the air is nearly saturated — cloud. Where they spread apart, it is dry.

### Under the hood

Besides the isotherms and isobars, the diagram carries three families of reference lines: **dry adiabats** (the temperature path of an unsaturated parcel rising without heat exchange, about 10 °C per kilometer), **moist adiabats** (the path once the parcel is saturated and condensation releases latent heat, a slower cooling of roughly 6 °C per kilometer in the lower troposphere), and **mixing-ratio lines** (constant water-vapor content). Wind barbs along the right margin give the profile of wind with height. The diagram was introduced by Nicolai Herlofson in 1947 as a refinement of the older emagram, and the U.S. Air Weather Service's manual on its use became the standard reference for two generations of military and civilian forecasters.

## Parcel theory: lifting the air

### The intuition

Imagine lifting a bubble of surface air. It cools as it rises. If it is cooler than its surroundings it is heavier and sinks back — stable air. If it is warmer it is lighter and keeps rising — unstable air, the fuel of thunderstorms. The sounding lets you do this thought experiment with a pencil, and the answer comes out as areas on the diagram: the area where the parcel is warmer than the environment is energy available for a storm; the area where it is cooler is the lid that must be broken first.

### Under the hood

Lift a surface parcel along a dry adiabat until it reaches its mixing-ratio line — the **lifted condensation level (LCL)**, the cloud base. Continue along a moist adiabat. If the parcel path crosses to the warm side of the environmental temperature, that crossing is the **level of free convection (LFC)**; the parcel then rises on its own until it crosses back at the **equilibrium level (EL)**, near the storm's anvil. The positive area between LFC and EL, integrated, is **convective available potential energy (CAPE)**; the negative area below the LFC is **convective inhibition (CIN)**, the cap. CAPE of 1,000 J/kg is a respectable storm environment; 3,000 or more is a violent one — provided something lifts the air through the cap. A sounding with large CAPE and a strong cap is the "loaded gun": nothing happens until a front, dryline, or afternoon heating fires it, and then everything does.

## The indices

Before computers, integrating areas on a diagram took too long for a busy desk, and a generation of shortcuts was born. The **Showalter index** (1953) lifts a parcel from 850 hPa to 500 hPa and compares its temperature with the environment's. The **Lifted Index** (Galway, 1956) does the same from the surface, with negative values indicating instability: −4 and below meant severe storms were possible. The **K index** (George, 1960) folded in low-level moisture to flag heavy-rain and air-mass thunderstorm potential. The **Total Totals** and **SWEAT** indices were contributions of the Air Force Global Weather Central's Robert Miller, the latter adding wind shear to thermodynamics for severe-storm and tornado discrimination. The indices were fast and could be transmitted by teletype; they were also blunt. Each summarizes a profile in one number and is blind to everything the number does not capture — the shape of the cap, the depth of the moist layer, the elevated instability above a cool surface. Forecasters who read only the index missed the storms the full sounding would have shown them.

## The Miller technique

Miller's *Notes on Analysis and Severe-Storm Forecasting Procedures of the Air Force Global Weather Central* (Technical Report 200, revised 1972) turned sounding analysis and chart analysis into a checklist that Air Weather Service forecasters applied for decades and that the civilian severe-storms community adopted wholesale. The composite chart overlaid the features that matter on one map: the low-level moisture axis at 850 hPa, the dry intrusion and thermal ridge at 700 hPa, the vorticity and jet at 500 and 300 hPa, the surface features, and the instability. Miller also classified soundings into types: the **Type I** loaded-gun profile with deep moisture capped by a dry, warm layer — the classic Plains tornado sounding; the **Type II** uncapped, deeply moist tropical profile; the **Type III** cold-core profile of pulse storms under an upper low; and the **Type IV** inverted-V profile, dry in the low levels — a hail producer in Miller's description and, as later research showed, the classic dry-microburst profile. Each type carried its own expectations for storm mode and hazard. The method was a way of reasoning, not a formula, and it is the direct ancestor of the ingredients-based severe-weather forecasting practiced today.

## Beyond storms

The sounding answered the quiet questions too, and much of a forecaster's daily skill lived there.

- **Fog and stratus.** A morning sounding with the temperature and dew point together at the surface under an inversion is fog; whether it burns off depends on how much heating is needed to mix the inversion out. The **convective temperature** — the surface temperature at which the low-level air will mix dry-adiabatically through the inversion — was read off the diagram and compared to the expected high, giving a clearing time.
- **Maximum temperature.** Mix the morning profile: draw a dry adiabat from the top of the expected mixed layer (often from 850 hPa) to the surface, and read the temperature. The "850 mb max-temperature technique" beat climatology and often beat the model.
- **Icing and turbulence.** Moist layers between 0 and −15 °C mark aircraft icing; strong vertical wind shear in the barbs marks turbulence. For a base weather station, these were the forecasts that grounded or launched aircraft.
- **Precipitation type.** A warm layer aloft — the "warm nose" above a sub-freezing surface — turns snow into sleet or freezing rain. The sounding, not any rule of thumb, decides.

## The hodograph

The skew-T's companion plots the wind profile as a curve of wind vectors with height. Its shape — straight or curved, long or short — encodes the vertical shear that organizes storms, and the research of the 1980s (Weisman and Klemp among others) turned hodograph reading into a science: strong, deep shear supports supercells; a curved low-level hodograph supplies the rotation for tornadoes. Where the indices of the 1950s captured thermodynamics alone, the hodograph added the dynamics, and the modern sounding analysis combines both.

## Gone but not forgotten

Every quantity above is now computed automatically and displayed with the sounding; no forecaster integrates CAPE with a planimeter. But the habit of reading the raw profile — the shape of the cap, the depth of the moisture, the warm nose, the layer the index did not see — is what catches the day the computed numbers mislead. The Storm Prediction Center's forecasters still read soundings this way, and the Air Weather Service manual is still worth the afternoon it takes to work through. The next article collects the rules of thumb that grew up alongside the sounding — the [forecaster's lore](/blog/rules-of-thumb) — and asks which of them still deserve to be believed.

---

## References & further learning

**Accessible starting points**

- [Storm Prediction Center: Sounding analysis](https://www.spc.noaa.gov/exper/soundings/) — live observed soundings with the full parameter suite.
- [COMET / MetEd](https://www.meted.ucar.edu/) — skew-T and convective-forecasting training modules.

**Technical depth**

- Air Weather Service (1990). *The Use of the Skew T, Log P Diagram in Analysis and Forecasting.* AWS/TR-79/006 (revised) — the manual.
- Miller, R. C. (1972). *Notes on Analysis and Severe-Storm Forecasting Procedures of the Air Force Global Weather Central.* AFGWC Technical Report 200 (revised).
- Showalter, A. K. (1953). ["A stability index for thunderstorm forecasting."](https://doi.org/10.1175/1520-0477-34.6.250) *BAMS*, 34.
- Galway, J. G. (1956). ["The lifted index as a predictor of latent instability."](https://doi.org/10.1175/1520-0477-37.10.528) *BAMS*, 37.
- Moncrieff, M. W., & Miller, M. J. (1976). ["The dynamics and simulation of tropical cumulonimbus and squall lines."](https://doi.org/10.1002/qj.49710243208) *QJRMS*, 102 — CAPE as a named quantity.
- Weisman, M. L., & Klemp, J. B. (1982). ["The dependence of numerically simulated convective storms on vertical wind shear and buoyancy."](https://doi.org/10.1175/1520-0493(1982)110<0504:TDONSC>2.0.CO;2) *Monthly Weather Review*, 110.

*Next in the series: [Thickness, the 540 Line, and Other Forecaster Lore](/blog/rules-of-thumb).*
`,
};

export default article;
