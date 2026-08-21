import { AUTHOR, CATEGORY_CRAFT, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 20,
  slug: "rules-of-thumb",
  title: "Thickness, the 540 Line, and Other Forecaster Lore",
  date: "Jul 13, 2026",
  category: CATEGORY_CRAFT,
  author: AUTHOR,
  summary:
    "The rules of thumb were compressed physics and climatology, built for a desk without a computer. What each one says, why it worked, where it failed — and what the lore teaches about any rule learned from data, including the ones inside AI models.",
  content: `
Every trade has its lore, and forecasting's was unusually rich because the problem was hard and the tools were slow. A rule of thumb is a piece of physics or climatology compressed into a number a forecaster can apply in seconds at a desk with no computer. The best of them were remarkably good; all of them failed somewhere; and the habit of knowing *where* each rule failed was itself the skill. This article collects the lore of the bench — rain versus snow, snowfall amounts, fog, cloud base, persistence and analogs — and ends with the reason it belongs in a series that also covers AI models: a learned rule is a rule of thumb with more parameters, and it fails in the same way.

![Schematic: 1000–500 hPa thickness lines across a map, the 540-decameter line separating rain from snow, with the exceptions marked — shallow cold air, elevation, and the warm nose.](/images/insights/rules-of-thumb.svg)

## Thickness and the 540 line

**The rule.** The thickness of the layer between 1000 and 500 hPa — the vertical distance between those two pressure surfaces, in decameters — measures the mean temperature of the lower half of the troposphere. Below about 540 dam the column is cold enough for snow; above it, rain. Forecasters drew the 540 line on the prognostic charts and called the rain–snow boundary from it.

**Why it worked.** Thickness is proportional to the layer's mean virtual temperature, a physically sound proxy for whether falling snow survives the descent. Wagner formalized the relationship in 1957, and in the lowlands of the eastern United States, where cold air is usually deep, the 540 criterion verified well.

**Where it failed.** Everywhere the cold air was shallow or the ground was high. A thin layer of sub-freezing air under a warm layer aloft gives freezing rain with a "snow" thickness; a mountain station at 2,000 meters sees snow at thicknesses the rule calls rain. Forecasters learned regional critical values — 534 in elevated terrain, 546 or more near the coasts — and supplemented the deep-layer rule with shallower ones: the 1000–850 hPa thickness near 130 dam, the 850 hPa 0 °C isotherm, and above all the sounding's warm nose. Heppner's 1992 paper title said what every forecaster eventually learned: look beyond the magic numbers.

## How much snow

**The rule.** Ten inches of snow per inch of liquid water — the 10:1 ratio — and for amounts, the "Magic Chart" (Chaston, 1989) relating 700 hPa vertical motion to twelve-hour snowfall, or the Garcia method (1994) reading snowfall from the 700 hPa mixing ratio on an isentropic surface.

**Why they worked.** Snowfall is, to first order, moisture times lift. The Magic Chart and the Garcia method each took one of those factors from the model and calibrated it against observed events; both were honest empirical fits, and both were useful in the right regime.

**Where they failed.** The 10:1 ratio is a median, not a law; real ratios run from 5:1 in wet coastal snow to 30:1 in cold, dry powder, and Roebber and colleagues showed in 2003 that a modest statistical model of the ratio beats the fixed number handily. The amount methods fail when the other factor — the one they did not use — controls the event, and when the model's vertical motion or moisture is wrong, which the forecaster had to judge separately.

## Fog, cloud base, and the aviation rules

**Cloud base** from the surface temperature–dew point spread: roughly 400 feet of height for every degree Celsius of spread (the dry adiabat and the dew-point lapse converge at that rate), so a 5 °C spread put the cumulus base near 2,000 feet. **Radiation fog** when the sky was clear, the wind light, the spread small in the evening, and the ground moist — a four-part rule that verified well on still autumn nights and failed as soon as a weak wind mixed the surface layer or cloud drifted over. **Fog burn-off** by the convective temperature from the morning [sounding](/blog/reading-the-skew-t). For a base weather station forecasting takeoff and landing conditions, these were the rules applied hourly, and they were good because they encoded the physics of the boundary layer in terms a forecaster could observe directly.

## Persistence, climatology, and the analog

The oldest rules are the benchmarks. **Persistence** — tomorrow like today — is surprisingly hard to beat for a day or two in a settled regime, and any forecast method that cannot beat it has no skill. **Climatology** — the long-term average for the date — is the right forecast for anything beyond the range of predictability, and the base rate against which every rare-event forecast should be judged. And the **analog method** — find a past day whose pattern resembles today's and see what followed — was the intuitive forecaster's secret weapon and the explicit subject of one of Lorenz's most important papers. In 1969 he searched for naturally occurring analogs in the observational record and found that genuinely close matches for the whole hemisphere almost never occur: the atmosphere has too many degrees of freedom for history to repeat in detail. The practical forecaster's analogs were therefore always *partial* — a similar trough here, a similar moisture feed there — and their reliability depended on how much of the situation they captured. Lorenz's analog paper is, read today, the founding critique of data-driven forecasting, written half a century before the data-driven era.

## Convective lore

The severe-weather bench had its own catalog, much of it from the [Miller technique](/blog/reading-the-skew-t): the loaded-gun sounding, the 850 hPa moisture axis, the dryline bulge that fires storms first, the surface winds backing to southeasterly under a veering profile aloft, three-hour pressure falls marking where the low-level jet will focus convergence, the afternoon "cap strength" that decides between a quiet evening and an outbreak. These rules survive nearly intact because they were ingredients, not thresholds — statements about what must be present rather than claims that a number guarantees an outcome. Ingredients-based reasoning is the part of the old craft that modern convective forecasting kept whole.

## The status of lore

What to make of all this now? Three things.

**Rules of thumb are compressed models.** Each encodes a relationship that holds in the regime it was fit to — the eastern lowlands, the autumn evening, the Plains in May. Inside that regime, the rule is physics made fast. Outside it, the rule is a confident wrong answer. The discipline was never the rule; it was knowing its boundary.

**The modern forecaster should verify his rules.** The tools to check a thickness threshold against twenty years of local observations are now on every desk. Most lore, checked, turns out to be right in the center and wrong at the edges — which is exactly what a thoughtful forecaster always suspected.

**A learned model is lore at scale.** A random forest fit to twenty years of station data, or a global model trained on forty years of reanalysis, has learned a vast number of relationships that hold in the regime of the training sample. It will be superb in the center of that regime and confidently wrong beyond it, and it will not tell you which is which. Everything the old forecaster knew about the 540 line applies to the AI model: use it, respect it, and know where it stops being true. The final article in this series walks through the bench where all these skills were practiced — the [forecaster's workstation of 1990](/blog/the-forecasters-workstation-1990) — and asks what to carry forward.

---

## References & further learning

**Accessible starting points**

- [COMET / MetEd: Winter weather and precipitation-type courses](https://www.meted.ucar.edu/) — where the rules are taught with their caveats.
- [NWS Weather Prediction Center: Winter weather](https://www.wpc.ncep.noaa.gov/wwd/winter_wx.shtml) — the operational products that replaced the hand-drawn 540 line.

**Technical depth**

- Wagner, A. J. (1957). ["Mean temperature from 1000 mb to 500 mb as a predictor of precipitation type."](https://doi.org/10.1175/1520-0477-38.10.584) *BAMS*, 38.
- Heppner, P. O. G. (1992). ["Snow versus rain: Looking beyond the 'magic' numbers."](https://doi.org/10.1175/1520-0434(1992)007<0683:SVRLBT>2.0.CO;2) *Weather and Forecasting*, 7.
- Chaston, P. R. (1989). "The Magic Chart for forecasting snow amounts." *National Weather Digest*, 14(2).
- Garcia, C. (1994). *Forecasting Snowfall Using Mixing Ratios on an Isentropic Surface — An Empirical Study.* NOAA Technical Memorandum NWS CR-105.
- Roebber, P. J., Bruening, S. L., Schultz, D. M., & Cortinas, J. V. (2003). ["Improving snowfall forecasting by diagnosing snow density."](https://doi.org/10.1175/1520-0434(2003)018<0264:ISFBDS>2.0.CO;2) *Weather and Forecasting*, 18.
- Lorenz, E. N. (1969). ["Atmospheric predictability as revealed by naturally occurring analogues."](https://doi.org/10.1175/1520-0469(1969)26<636:APARBN>2.0.CO;2) *Journal of the Atmospheric Sciences*, 26.

*Next in the series: [The Forecaster's Workstation, 1990](/blog/the-forecasters-workstation-1990).*
`,
};

export default article;
