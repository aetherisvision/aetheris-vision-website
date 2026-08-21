import { AUTHOR, CATEGORY_FOUNDATIONS, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 1,
  slug: "random-forests-in-weather",
  title: "Random Forests in Weather: The Workhorse Nobody Hypes",
  date: "Jul 22, 2026",
  category: CATEGORY_FOUNDATIONS,
  author: AUTHOR,
  summary:
    "Before transformers made headlines, tree-based models were quietly improving forecasts every day. Where random forests genuinely help in operational weather, and where they cannot.",
  content: `
When people talk about AI in weather today, they usually mean the headline global models. But a large share of the machine learning that actually touches an operational forecast is far older and far simpler: decision trees, random forests, and gradient boosting. These models rarely make the news, and that is exactly why they are a good place to start a series about cutting through hype. They show what machine learning looks like when it works quietly, inside well-understood limits.

This article is the first in our Foundations track. The plan for every entry is the same: what the model family is, how it is really used in weather, what it is genuinely good at, and where it breaks down.

## The short version

A decision tree asks a sequence of yes/no questions about the inputs — is the forecast dew point above 12 °C, is the wind from the south, is it July — and arrives at a prediction. One tree is crude and easy to fool. A **random forest** builds hundreds of trees, each trained on a random slice of the data and a random subset of the questions, and averages their answers. The randomness makes the trees disagree in useful ways, and the average is far more reliable than any single tree.

That is essentially the whole trick. There is no vision, no attention, no simulated physics. The model learns statistical relationships between input variables laid out in a table and the outcome you care about.

![Schematic: a random forest averages the votes of many decision trees, each trained on a different random slice of the data.](/images/insights/random-forest-voting.svg)

## Where these models actually work in forecasting

The natural home of tree-based models is **post-processing**: taking output from a physics-based numerical weather prediction (NWP) model and correcting it against what actually happened. This has a long pedigree. Model Output Statistics (MOS) — linear regression on NWP output — has been running operationally since the 1970s. Random forests and gradient-boosted trees are, in a real sense, MOS with the ability to learn nonlinear relationships and interactions automatically.

Concretely, tree ensembles are used today to:

- **Correct site-specific biases.** An NWP model may run consistently warm at a valley station at night. A forest trained on years of model-forecast pairs learns the correction, conditioned on season, wind direction, and cloud cover, without anyone hand-coding the rules.
- **Turn model fields into probabilities of hazards.** Given a set of NWP-derived predictors — instability, shear, moisture — tree ensembles estimate probabilities of severe hail, damaging wind, excessive rainfall, or aircraft icing. Forecast centers have used exactly this design for experimental severe-weather and excessive-rainfall guidance.
- **Classify precipitation type** at the surface from vertical temperature and moisture profiles, a problem where the decision boundaries are genuinely rule-like.
- **Calibrate ensembles.** NWP ensembles are often underdispersive — too confident. Tree-based and related statistical methods reshape raw ensemble output into calibrated probabilities.

Notice the pattern: in every case the physics is still done by the NWP model. The forest sits on top, learning the systematic gap between model world and real world.

## Strengths

- **Tabular data is their turf.** When your inputs are a few dozen meaningful numbers per case — not millions of gridded pixels — tree ensembles are still among the best tools available, and frequently beat deep networks on this kind of problem.
- **They work with modest data.** A useful hazard model can be trained on a few seasons of cases on a laptop. No GPU cluster, no reanalysis archive.
- **They are inspectable.** Feature-importance measures and partial-dependence analysis let a forecaster ask *why* the model favors hail today — and check the answer against meteorological judgment. In operations, a model people can interrogate earns trust faster than a black box with a better score.
- **They fail gently.** Averaging many shallow learners resists overfitting, and a forest never predicts something wildly outside what its training targets contained.

## Weaknesses and limits

- **No sense of space.** A forest sees a table of numbers. It does not know that two grid points are neighbors, that a cold front is a coherent object, or that a storm is moving. Spatial structure has to be hand-engineered into predictors — storm-relative helicity, gradients, area maxima — and anything you fail to encode, the model cannot use. This is precisely the gap convolutional networks fill, which is the subject of [the next article in this series](/blog/cnns-in-weather).
- **No extrapolation.** Tree predictions are averages of training outcomes, so a forest cannot output a value beyond the range it has seen. When the climate drifts from the training record, or for a record-breaking event, that is a hard ceiling — the model literally cannot imagine a new extreme.
- **A fixed-relationship assumption.** The learned NWP-to-truth correction is tied to the NWP model version it trained on. Upgrade the physics model, and yesterday's corrections partially stale — a real maintenance cost that rarely appears in papers.
- **No dynamics.** These models predict a quantity at a time; they do not evolve the atmosphere. They are diagnostic tools, not forecast engines.

## The honest summary

Random forests earn their keep in weather every single day, in the unglamorous middle of the pipeline: turning good physics into better local guidance. They are the right tool when the problem is tabular, the dataset is modest, and interpretability matters. They are the wrong tool when spatial structure, temporal evolution, or unprecedented conditions are the heart of the problem.

Any claim that tree-based ML "replaces" forecasting is hype. Any claim that it is obsolete because transformers exist is equally wrong — different problem, different tool.

---

## References & further learning

**Accessible starting points**

- [scikit-learn: Random Forests user guide](https://scikit-learn.org/stable/modules/ensemble.html) — the standard practical reference, with working code.

**Technical depth**

- Breiman, L. (2001). ["Random Forests."](https://doi.org/10.1023/A:1010933404324) *Machine Learning*, 45, 5–32. The original paper — still readable.
- McGovern, A., et al. (2017). ["Using Artificial Intelligence to Improve Real-Time Decision-Making for High-Impact Weather."](https://doi.org/10.1175/BAMS-D-16-0123.1) *BAMS*, 98(10). The canonical survey of tree-based ML in severe-weather operations.
- McGovern, A., et al. (2019). ["Making the Black Box More Transparent: Understanding the Physical Implications of Machine Learning."](https://doi.org/10.1175/BAMS-D-18-0195.1) *BAMS*, 100(11). How to interrogate these models meteorologically.

*Next in the series: [CNNs in Weather: Teaching Machines to See the Atmosphere](/blog/cnns-in-weather).*
`,
};

export default article;
