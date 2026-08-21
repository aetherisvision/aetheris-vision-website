import { AUTHOR, CATEGORY_CRAFT, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 18,
  slug: "hand-analysis",
  title: "Hand Analysis: Drawing the Map Yourself",
  date: "Jul 6, 2026",
  category: CATEGORY_CRAFT,
  author: AUTHOR,
  summary:
    "Before the model, the forecaster drew: plotted stations, isobars every four millibars, fronts placed by evidence. What the discipline of hand analysis taught, how it was done, and why the best forecast centers never fully gave it up.",
  content: `
The first thing a forecaster of the old school did on shift was not to look at the model. It was to analyze: to take the plotted chart of the latest observations and, with a pencil, draw the atmosphere — isobars, fronts, troughs, the centers of pressure and their tendencies — until the map said something coherent. Sverre Petterssen's textbook was built around the principle: *analysis before prognosis.* You do not forecast what you have not first understood. This article is about that craft: what it involved, what it built in the person who practiced it, and why it belongs on the short list of skills worth preserving deliberately.

![Schematic: a plotted station model beside a hand-drawn surface analysis — isobars, a cold front, a warm front, and a low center with pressure falls ahead of it.](/images/insights/hand-analysis.svg)

## The station model

An hourly surface observation contains a dozen quantities, and the plotting convention packs them into a glyph the size of a fingernail: the station circle filled to show cloud cover, a wind barb with its feathers, temperature upper left, dew point lower left, sea-level pressure upper right in coded tenths of a millibar, the three-hour pressure tendency and its trace beside it, present weather as a symbol, visibility, cloud types above and below. A trained eye reads a plotted map of several hundred stations the way a musician reads a score. That reading is the first skill, and it is nearly extinct outside the forecast centers — and yet the ability to look at raw observations and see the weather, rather than a model's rendering of it, is precisely what separates a forecaster from a consumer of guidance.

## Drawing isobars

Isobars were drawn at four-millibar intervals, smooth, continuous, and consistent with the wind — which, by Buys Ballot's law, blows with low pressure to the left in the Northern Hemisphere, crossing the isobars slightly toward lower pressure over land. The rule sounds mechanical; the practice was anything but. Drawing isobars forces the analyst to look at *every* observation and reconcile them with one another and with physics. Contradictions surface immediately: a pressure that does not fit its neighbors is a bad barometer or a miscoded report; a wind that crosses the isobars the wrong way means the pressure field is wrong or a front has been missed. The act of drawing is an act of quality control that no automated scheme of the day performed as well, and it left the analyst with a physical picture of the pressure field that a contoured computer product, glanced at, does not create.

## Fronts and the Norwegian model

Fronts were placed by evidence, not by the model: the temperature and dew-point contrast, the wind shift, the pressure trough and the characteristic pattern of tendencies — falls ahead, rises behind — and the weather along the boundary. The conceptual framework was the Norwegian cyclone model of Jacob Bjerknes and Halvor Solberg (1922): the polar front, the wave that forms on it, the warm sector narrowing as the cold front overtakes the warm front, the occlusion, the decay. Every forecaster learned the life cycle as a story, and every surface chart was read as a frame from it. The model has been refined — Shapiro and Keyser's 1990 variant, with its bent-back front and warm seclusion, describes many oceanic storms better — but the habit of reading a chart as a stage in a life cycle remains the quickest route from observations to expectation.

## Upper air

The upper-air charts — 850, 700, 500, 300 and 250 hPa — were plotted from the twice-daily radiosonde network and analyzed for height contours, isotherms, and winds. The 500 hPa chart was the forecaster's compass: the troughs and ridges of the mid-troposphere steer surface systems and, through vorticity advection, drive their development. Analysts estimated vorticity by eye from the curvature and shear of the flow, marked the "vort max," found the jet streaks on the 300 hPa chart, and identified warm and cold advection where isotherms crossed height contours. Petterssen's development equation — surface cyclone development occurs beneath the region of maximum cyclonic vorticity advection aloft — was applied by inspection, chart over chart, on a light table. Later, the jet-streak models of Uccellini and colleagues added the four-quadrant picture of where rising motion sits relative to the jet core. None of this required a computer. All of it required understanding.

## The tropics, and the tendency chart

Two specialties deserve mention. In the tropics, where pressure gradients are weak and isobars tell little, analysts drew **streamlines and isotachs** — the flow itself — to locate the easterly waves, troughs, and circulations that organize tropical weather. Air Force forecasters posted to the Pacific learned streamline analysis as a second language. And at all latitudes, the **isallobaric** chart of three-hour pressure tendencies was a leading indicator: a deepening area of falls ahead of a low told of development before the isobars showed it.

## What hand analysis built

The product of hand analysis was never really the chart. It was the analyst. Drawing the atmosphere every shift for years built a mental model — of how fronts behave in this terrain, of how the jet arranges the rain, of what the pattern implies for the next twelve hours — that could then be used to *evaluate guidance*. A forecaster who had just drawn the surface front through Kansas could see at once that the model's initial analysis had it in Oklahoma, and could reason about what that error would do to the forecast. Fred Sanders and Charles Doswell made exactly this case in 1995: detailed surface analysis was being abandoned just as mesoscale forecasting demanded it most, and the loss was not of a product but of a way of understanding.

The best forecast centers never fully gave it up. The U.S. Weather Prediction Center's surface analyses are still drawn by forecasters, with software assistance, every three hours — because an analysis that has been reasoned through by a person who must defend it is still the most reliable depiction of the surface weather available. The skill is diminished, not gone. What follows in this series is a look at the next instrument on the old bench: the [sounding](/blog/reading-the-skew-t), and the art of reading one.

---

## References & further learning

**Accessible starting points**

- [NWS Weather Prediction Center: Surface analysis](https://www.wpc.ncep.noaa.gov/html/sfc2.shtml) — the living practice, updated every three hours.
- Sanders, F., & Doswell, C. A. III (1995). ["A case for detailed surface analysis."](https://doi.org/10.1175/1520-0477(1995)076<0505:ACFDSA>2.0.CO;2) *BAMS*, 76 — the argument for the craft, from two of its masters.

**Technical depth**

- Petterssen, S. (1956). *Weather Analysis and Forecasting*, 2nd ed. McGraw-Hill — the text a generation learned from.
- Saucier, W. J. (1955). *Principles of Meteorological Analysis.* University of Chicago Press.
- Bjerknes, J., & Solberg, H. (1922). "Life cycle of cyclones and the polar front theory of atmospheric circulation." *Geofysiske Publikasjoner*, 3(1).
- Shapiro, M. A., & Keyser, D. (1990). "Fronts, jet streams and the tropopause." In *Extratropical Cyclones: The Erik Palmén Memorial Volume*, American Meteorological Society.
- Uccellini, L. W., & Kocin, P. J. (1987). ["The interaction of jet streak circulations during heavy snow events along the East Coast of the United States."](https://doi.org/10.1175/1520-0434(1987)002<0289:TIOJSC>2.0.CO;2) *Weather and Forecasting*, 2.

*Next in the series: [Reading the Skew-T](/blog/reading-the-skew-t).*
`,
};

export default article;
