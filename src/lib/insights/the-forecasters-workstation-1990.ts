import { AUTHOR, CATEGORY_CRAFT, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 21,
  slug: "the-forecasters-workstation-1990",
  title: "The Forecaster's Workstation, 1990: Gone but Not Forgotten",
  date: "Jul 17, 2026",
  category: CATEGORY_CRAFT,
  author: AUTHOR,
  summary:
    "Teletype observations, fax charts on the rack, a radar scope with a manual tilt, satellite loops, and the forecast funnel. A walk through the bench where the craft was practiced, what each tool taught, and what the AI era should deliberately keep.",
  content: `
This series began with Richardson's failed calculation and has traced the traditional models and the craft that grew up around them. It ends where the craft was practiced: the forecaster's bench around 1990, in the years before the workstation revolution and two decades before the first AI forecast. Those of us who trained as Air Force forecasters in the late 1980s worked this bench. What follows is not nostalgia for the equipment, most of which was inadequate and all of which is rightly gone. It is an inventory of what the *workflow* taught — because that, unlike the hardware, is worth preserving on purpose.

![Schematic: the 1990 forecast bench — teletype observations, fax charts, radar scope, satellite loop, and sounding feeding the forecast funnel from hemispheric scale down to the local forecast.](/images/insights/the-forecasters-workstation-1990.svg)

## The circuits

Observations arrived on teletype circuits as coded text: the hourly surface reports in the old airways format (the METAR code did not replace it in the United States until 1996), the synoptic reports, the upper-air data, the terminal forecasts from neighboring stations. The forecaster decoded them by eye, because after a few months on shift the codes read as fluently as prose, and plotted or logged what mattered. The hourly "obs round" — checking every station in the area of responsibility and noting what had changed — was the heartbeat of the shift. The Weather Service had been moving to the AFOS system, the first generation of office computers with graphics displays, through the 1980s; the Air Force's base weather stations received their equivalent, the Automated Weather Distribution System, in the early 1990s. Before those, and alongside them for years, the station ran on a teletype, a fax machine, and a telephone.

**What it taught.** Decoding raw observations kept the forecaster in contact with the actual atmosphere, hourly. A forecaster who had read three hundred observations that shift knew where the front was, where the fog was forming, and which station's barometer was lying. No summary display provides that intimacy, and its loss is the single biggest change in how the job feels.

## The charts

The National Meteorological Center's charts came over the facsimile circuit — DIFAX, the digital facsimile — on rolls of thermal paper, and the shift's first task was to tear them off, sort them, and hang them on the rack: surface analyses, upper-air analyses at each standard level, the [LFM and NGM prognoses](/blog/the-models-we-ran), the MRF's medium-range charts, the thickness and vorticity panels. The "12Z package" was a stack an inch thick. The surface analysis was reworked by hand in colored pencil — cold fronts in blue, warm in red, isobars in black — as [the hand-analysis article](/blog/hand-analysis) described, and the forecaster's own analysis was compared, chart over chart on the light table, with the model's initial fields.

**What it taught.** Comparison. Every model chart was held up against the forecaster's own analysis and against the other models, every cycle, and the *pattern of disagreement* was the most important information on the rack. Run-to-run continuity — whether the model's day-three solution matched yesterday's day-four — was checked before any forecast was committed. These habits are exactly what [ensemble forecasting](/blog/ensembles-and-the-end-of-the-single-forecast) later formalized.

## The radar

The scope was a WSR-57 or WSR-74 at a Weather Service office and an AN/FPS-77 at most Air Force bases — a reflectivity-only radar with the antenna tilt adjusted by hand and the display read by eye. There was no velocity data and no algorithm; the forecaster identified severe storms from reflectivity structure using the criteria Leslie Lemon codified in the late 1970s — the weak-echo region and its bounded form, the echo overhang, the hook, the tall echo top displaced over the low-level inflow. The WSR-88D Doppler network, a joint Weather Service, Air Force, and FAA program, was deployed through the 1990s and changed everything: velocity fields made rotation visible, and algorithms flagged it. But the Lemon technique's reflectivity reasoning did not become wrong; it became the foundation on which the algorithms were verified.

**What it taught.** Structural reading. A storm is a three-dimensional object, and reading its structure from a two-dimensional scan built the mental model of the storm that the Doppler displays later enriched rather than replaced.

## The satellite

GOES imagery came as prints and, by 1990, as loops on a monitor: visible, infrared, and the water-vapor channel that showed the jet stream and the dry slots of developing cyclones as nothing else did. For the tropics, Vernon Dvorak's technique — estimating a tropical cyclone's intensity from the pattern of its cloud signature, published in 1975 and refined in 1984 — was the standard, and it remains in operational use at every tropical warning center in the world in 2026. Learning to read imagery was a discipline in itself; Bader and colleagues' *Images in Weather Forecasting* was the textbook of the craft.

**What it taught.** Pattern recognition anchored in physics — the comma cloud, the baroclinic leaf, the banding of a strengthening cyclone — and the habit of checking the model's forecast against what the satellite showed was actually happening.

## The funnel and the briefing

Leonard Snellman's **forecast funnel** organized the shift: start at the hemispheric scale with the long waves and the jet, narrow to the synoptic scale with the fronts and cyclones, then to the mesoscale, then to the local forecast — each scale constraining the next, so that the local call was always consistent with the larger picture. For an Air Force forecaster the funnel ended in a briefing: a pilot, a launch officer, or a commander asking a direct question about a specific window, with consequences attached. The forecast was a decision product, and the forecaster stood behind it in person.

**What it taught.** Consistency across scales, and accountability. A forecaster who has to brief a flight crew at 0500 learns to be right about the things that matter and honest about the things he does not know.

## The people

The bench was staffed by an observer, a forecaster, and a senior forecaster, and skill moved between them by apprenticeship: the shift handover, the chart walked through together, the senior's marginal notes on what the NGM did in this pattern. Doswell's essays on the human element made the scientific case for what the apprenticeship did in practice — built judgment, which is the ability to recognize a situation and know what to do about it.

## What was lost, what was kept

The hardware is gone and should be. AWIPS replaced AFOS; gridded forecast editing replaced the written forecast; the WSR-88D replaced the scope; and the models improved by roughly a day of lead time per decade. Some of the craft went with the hardware, and the loss was noticed — by Snellman in 1977, by Sanders and Doswell in 1995, by Mass in 2003, by Stuart and colleagues in 2006 — and it was partly resisted. The Weather Prediction Center still draws its surface analyses. The Storm Prediction Center still reads the raw sounding. Dvorak is still the intensity standard. The funnel is still taught.

What to carry into the AI era is now clear, because every lesson of the 1990 bench applies to a learned model exactly as it applied to the NGM. Analyze before you forecast, so you can tell when the guidance is wrong. Know each model's personality and the boundary of its training. Read disagreement as information and wait for continuity. Verify, locally, against the atmosphere rather than against the model. And keep the human who can overrule the guidance skilled enough to do it, which means keeping him in contact with the raw weather. The AI models in [our companion series](/blog/random-forests-in-weather) are the newest guidance on the rack. The forecaster who treats them as the bench always treated guidance — with respect, with skepticism, and with his own analysis in hand — will get the most out of them. That forecaster is what Aetheris Vision was founded to be.

---

## References & further learning

**Accessible starting points**

- [NWS Heritage](https://vlab.noaa.gov/web/nws-heritage) — the Weather Service's own history of its tools and offices.
- Fuller, J. F. (1990). *Thor's Legions: Weather Support to the U.S. Air Force and Army, 1937–1987.* American Meteorological Society.

**Technical depth**

- Lemon, L. R. (1980). *Severe Thunderstorm Radar Identification Techniques and Warning Criteria.* NOAA Technical Memorandum NWS NSSFC-3.
- Dvorak, V. F. (1975). ["Tropical cyclone intensity analysis and forecasting from satellite imagery."](https://doi.org/10.1175/1520-0493(1975)103<0420:TCIAAF>2.0.CO;2) *Monthly Weather Review*, 103.
- Dvorak, V. F. (1984). *Tropical Cyclone Intensity Analysis Using Satellite Data.* NOAA Technical Report NESDIS 11.
- Bader, M. J., Forbes, G. S., Grant, J. R., Lilley, R. B. E., & Waters, A. J., eds. (1995). *Images in Weather Forecasting: A Practical Guide for Interpreting Satellite and Radar Imagery.* Cambridge University Press.
- Whiton, R. C., Smith, P. L., Bigler, S. G., Wilk, K. E., & Harbuck, A. C. (1998). ["History of operational use of weather radar by U.S. weather services. Part I: The pre-NEXRAD era."](https://doi.org/10.1175/1520-0434(1998)013<0219:HOOUOW>2.0.CO;2) *Weather and Forecasting*, 13.
- Snellman, L. W. (1977). ["Operational forecasting using automated guidance."](https://doi.org/10.1175/1520-0477(1977)058<1036:OFUAG>2.0.CO;2) *BAMS*, 58.
- Stuart, N. A., et al. (2006). ["The future of humans in an increasingly automated forecast process."](https://doi.org/10.1175/BAMS-87-11-1497) *BAMS*, 87.

*This article closes our Traditional NWP and Forecasting Craft series. Continue with the companion AI & Weather series, beginning with [Random Forests in Weather](/blog/random-forests-in-weather).*
`,
};

export default article;
