import { AUTHOR, CATEGORY_NWP, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 17,
  slug: "mos-and-the-forecaster",
  title: "MOS and the Forecaster: The Forty-Year Argument About What the Human Adds",
  date: "Jul 1, 2026",
  category: CATEGORY_NWP,
  author: AUTHOR,
  summary:
    "Statistical guidance turned model fields into the numbers people actually wanted — and started a debate about the forecaster's role that the AI era has reopened word for word. Where MOS came from, what it got right, and what the record says about human skill.",
  content: `
A weather model produces fields: pressure, wind, temperature on a grid. Almost nobody wants those. A pilot wants the ceiling at 0600, a farmer wants the chance of rain, a city wants tomorrow's high. Bridging the gap between model fields and usable numbers at a point is the job of statistical post-processing, and for half a century its dominant form has been **Model Output Statistics** — MOS. This article explains what MOS is, why it worked, and the argument it started: once the machine produces a good local forecast, what does the forecaster add? That question, first asked in the 1970s, is being asked again about AI models with the same words and, so far, the same answers.

![Schematic: model forecast fields feed regression equations developed against years of observations, producing station forecasts; the forecaster reviews, adjusts, and issues.](/images/insights/mos-and-the-forecaster.svg)

## Two ways to get from fields to numbers

**Perfect prog** (William Klein, 1959) relates observed weather to *analyzed* atmospheric fields — the relationship between, say, the 850 hPa temperature and the surface maximum at a station, built from years of analyses. Apply the relationship to a forecast of the 850 hPa temperature and you get a forecast maximum, on the assumption that the model's forecast is perfect. The advantage is a long, stable development sample that does not depend on any model. The disadvantage is in the name: models are not perfect, and perfect prog faithfully passes their errors through.

**Model Output Statistics** (Harry Glahn and Dale Lowry, 1972) relates observed weather directly to the *model's own forecasts*. Develop the regression on a few years of a model's output paired with what actually happened, and the equations learn the model's biases along with the physics — if the model is habitually two degrees too warm at a station, MOS corrects it. The price is that MOS is tied to a specific model; change the model and the equations must be redeveloped. In practice the trade was worth it, and MOS became the U.S. standard, with equations for hundreds of stations, by season and forecast projection, for maximum and minimum temperature, probability of precipitation, wind, ceiling and visibility, thunderstorm probability, and more.

### Under the hood

Classical MOS is multiple linear regression with forward screening of predictors drawn from model fields (and from climatology and the observation at forecast issue time), one equation per predictand, station, season, and projection. Probability of precipitation is handled by regressing on a binary predictand — an early, practical form of probabilistic forecasting. PoP had entered public forecasts in 1965 as a subjective product; objective guidance followed, first by perfect prog and, from the early 1970s, by MOS. The method's descendants are direct: the tree ensembles and gradient boosting discussed in [our random-forests article](/blog/random-forests-in-weather) are MOS with a more flexible function, and the modern U.S. National Blend of Models is MOS-style calibration applied across an ensemble of models.

## Why MOS was good — and where it was not

MOS corrected systematic bias, injected local climatology the model could not know, produced calibrated probabilities, and did so for every station, every cycle, without fatigue. On routine days it was very hard to beat. Its weaknesses were the weaknesses of any statistical fit. It regressed toward the mean, so it under-forecast extremes — the record high, the big snow. It knew nothing about today's situation that was not encoded in its predictors, and it had no ability to recognize that the model run it was post-processing had initialized badly. And it was developed on a sample of ordinary weather, which made it least reliable exactly when the forecast mattered most.

## The argument

Leonard Snellman, a senior Weather Service scientist, put the problem sharply in 1977 in a paper that every forecaster of the following generation was made to read. He warned of "meteorological cancer": the forecaster who, faced with good objective guidance, stops analyzing, stops reasoning, and simply passes the guidance through — and thereby loses the skill that made him valuable, until the day the guidance is badly wrong and there is no one left who can tell. Snellman's answer was not to reject guidance but to practice a disciplined process — the **forecast funnel** he described in 1982, working from the hemispheric pattern down to the local detail — so that the forecaster always understood the situation well enough to know when to trust the numbers and when to overrule them.

The empirical record on forecasters versus MOS is consistent across decades. On average, human forecasts beat MOS by a modest margin — a few percent on temperature error, a little more on precipitation probability skill — and the margin is larger in active, changeable weather and smaller in quiet regimes. The margin also narrowed as models and MOS improved. Roebber and Bosart showed that experience and education measurably raise forecast skill; Doswell argued that the human contribution is a particular kind of reasoning — recognizing the situation, weighing evidence, knowing the guidance's failure modes — that statistics do not supply. Critics of the automation push, notably Cliff Mass in 2003, warned that gridded-forecast editing systems were turning forecasters into editors of model output rather than analysts of weather.

## Where the human adds value, honestly

The literature and the experience of the people who lived it converge on a short list.

- **Recognizing when the guidance is wrong.** A forecaster who has done his own analysis can see that the model's initial state misplaced the front, that the convective scheme fired too early, or that two models disagree in a way that signals low predictability. MOS cannot.
- **The extremes.** Statistical guidance hedges. Knowing when *not* to hedge — when the pattern supports the record event — is judgment.
- **Local and mesoscale effects** not represented in the predictors: sea breezes, cold pools, terrain, the lake.
- **Translating forecasts into decisions.** A ceiling forecast for an airfield, a launch window, a school-closing call — the forecaster sits between the numbers and consequences.

And a short list of where the human subtracts value: editing good guidance in quiet weather, where changes are as likely to hurt as help; inconsistency between forecasters and shifts; overconfidence. Stuart and colleagues, writing in 2006 on "the future of humans in an increasingly automated forecast process," concluded that the forecaster's role would shift toward situations of high impact and low predictability, and toward communication — a prediction that has largely come true.

## The same argument, reopened

Replace "MOS" with "AI model" in the previous three sections and nearly every sentence still holds. Learned models correct bias and capture climatology superbly, hedge toward the mean, under-forecast extremes, cannot recognize a bad initialization, and were trained on a sample dominated by ordinary weather. The questions the forecasting profession worked out between 1972 and 2006 — when to trust the guidance, what the human must keep doing to remain able to overrule it, how to organize the work so skill is not lost — are the questions of 2026. Snellman's warning needs no updating. The next articles in this series turn to the craft he wanted preserved: the analysis and reasoning skills that made the judgment possible.

---

## References & further learning

**Accessible starting points**

- [NWS Meteorological Development Laboratory: MOS](https://vlab.noaa.gov/web/mdl/mos) — the operational products and their documentation.
- Doswell, C. A. III (2004). ["Weather forecasting by humans — heuristics and decision making."](https://doi.org/10.1175/WAF-821.1) *Weather and Forecasting*, 19 — a readable essay on what forecasters actually do.

**Technical depth**

- Klein, W. H., Lewis, B. M., & Enger, I. (1959). ["Objective prediction of five-day mean temperatures during winter."](https://doi.org/10.1175/1520-0469(1959)016<0672:OPOFDM>2.0.CO;2) *Journal of Meteorology*, 16 — perfect prog.
- Glahn, H. R., & Lowry, D. A. (1972). ["The use of Model Output Statistics (MOS) in objective weather forecasting."](https://doi.org/10.1175/1520-0450(1972)011<1203:TUOMOS>2.0.CO;2) *Journal of Applied Meteorology*, 11.
- Snellman, L. W. (1977). ["Operational forecasting using automated guidance."](https://doi.org/10.1175/1520-0477(1977)058<1036:OFUAG>2.0.CO;2) *BAMS*, 58 — the "meteorological cancer" paper.
- Roebber, P. J., & Bosart, L. F. (1996). ["The contributions of education and experience to forecast skill."](https://doi.org/10.1175/1520-0434(1996)011<0021:TCOEAE>2.0.CO;2) *Weather and Forecasting*, 11.
- Bosart, L. F. (2003). ["Whither the weather analysis and forecasting process?"](https://doi.org/10.1175/1520-0434(2003)18<520:WTWAAF>2.0.CO;2) *Weather and Forecasting*, 18.
- Mass, C. F. (2003). ["IFPS and the future of the National Weather Service."](https://doi.org/10.1175/1520-0434(2003)018<0075:IATFOT>2.0.CO;2) *Weather and Forecasting*, 18.
- Stuart, N. A., et al. (2006). ["The future of humans in an increasingly automated forecast process."](https://doi.org/10.1175/BAMS-87-11-1497) *BAMS*, 87.

*Next in the series: [Hand Analysis](/blog/hand-analysis) — drawing the map yourself, and why it built the judgment everything else depended on.*
`,
};

export default article;
