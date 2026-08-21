import { AUTHOR, CATEGORY_FOUNDATIONS, type ArticleSeed } from "./types";

const article: ArticleSeed = {
  id: 2,
  slug: "cnns-in-weather",
  title: "CNNs in Weather: Teaching Machines to See the Atmosphere",
  date: "Jul 29, 2026",
  category: CATEGORY_FOUNDATIONS,
  author: AUTHOR,
  summary:
    "Convolutional networks treat atmospheric fields the way they treat photographs — and that one idea powers modern nowcasting, downscaling, and satellite retrievals. Strengths, blur, and the double penalty.",
  content: `
The [previous article](/blog/random-forests-in-weather) covered models that see the atmosphere as a table of numbers. This one covers the family that learned to see it as a *picture* — and why that single change of perspective made machine learning genuinely useful for radar, satellite, and short-range prediction.

## The short version

A radar mosaic, a satellite channel, a pressure field on a grid: each is an image — a two-dimensional array where nearby values are related. A **convolutional neural network (CNN)** exploits exactly that. Instead of learning one rule per pixel, it learns small reusable filters — a few pixels wide — that slide across the whole image looking for local patterns: an edge, a gradient, a curl. Early layers find simple textures; deeper layers compose them into larger structures like cells, bands, and fronts.

Two properties make this fit weather naturally. **Locality:** atmospheric fields are spatially coherent, so nearby pixels genuinely carry shared information. **Translation invariance:** a supercell is a supercell whether it is over Oklahoma or Ohio, so a filter learned once applies everywhere.

![Schematic: a small convolutional filter slides across a radar field, building feature maps that deeper layers compose into storm-scale structure.](/images/insights/cnn-filters.svg)

## Where CNNs actually work in weather

**Nowcasting — the flagship application.** For the next zero to two hours, the best information about future precipitation is current radar, extrapolated. CNN-based systems learn motion *and* growth/decay from sequences of radar frames, and consistently beat traditional optical-flow extrapolation in the first hour or two. DeepMind's DGMR generative nowcaster was judged more useful than alternatives by professional forecasters in a blind Met Office evaluation, and Google's MetNet line pushed CNN-family nowcasting out to several hours over the continental U.S.

**Satellite retrievals.** CNNs map raw satellite imagery to quantities that are otherwise hard to observe: rainfall rate from infrared and passive-microwave channels, tropical cyclone intensity from cloud structure, lightning risk from rapidly cooling cloud tops. These are pattern-recognition problems in the most literal sense.

**Detection and classification on grids.** Frontal boundaries, convective mode, tropical-cyclone centers, atmospheric rivers — U-Net-style architectures (an encoder-decoder CNN originally built for medical image segmentation) label these structures in analysis fields at a consistency no human team can match at scale.

**Statistical downscaling.** Super-resolution CNNs — the same family that sharpens photographs — learn to map coarse model output to fine local detail, conditioned on terrain. Used carefully, this is a cheap complement to running a high-resolution physical model, though the added detail is statistical, not dynamical.

## Strengths

- **Spatial structure comes free.** No hand-engineering of gradient and neighborhood predictors; the network learns its own spatial features. This is the exact weakness of tree-based models, repaired.
- **Speed at inference.** Once trained, a CNN nowcast for a whole radar domain takes seconds — fast enough to rerun every few minutes, which is the tempo nowcasting demands.
- **A mature, battle-tested toolbox.** A decade of computer-vision research — architectures, training tricks, augmentation — transfers to gridded weather data with little modification.

## Weaknesses and limits

- **Blur — the defining failure mode.** Train a network to minimize average pixel error and it learns a rational strategy: when uncertain, predict something smooth between the possible outcomes. The result is forecasts that fade sharp cells into plausible-looking mush precisely at longer lead times, where decisions matter most. Generative approaches (like DGMR, and later the diffusion models covered in [our GenCast profile](/blog/gencast)) exist largely to fight this.
- **The double penalty.** Score a sharp forecast against a sharp reality with pixelwise metrics and a storm displaced by 20 km is punished twice — once for the miss, once for the false alarm — while a blurry forecast is punished only once. Verification that is not neighborhood- or object-aware systematically flatters blur. Whenever you read "the ML model beat the baseline," ask which metric.
- **A limited horizon.** Standard convolutions see only a local neighborhood per layer. Stacking layers grows the receptive field, but capturing genuinely global structure — a planetary wave — this way is inefficient. This limitation is the direct motivation for the transformer and graph architectures in [the next article](/blog/transformers-and-graph-networks-in-weather).
- **No physics inside.** Nothing constrains a CNN to conserve mass or respect thermodynamics. Outputs can look meteorological while being physically inconsistent, which matters as soon as they feed downstream computation.
- **Rare events are rare in training data, too.** The situations forecasters care most about are the ones the network has seen least. Performance on the tail — violent tornadoes, record rainfall — is always worse than headline averages suggest.

## The honest summary

CNNs earned a permanent place in the weather stack: nowcasting, satellite retrieval, detection, and downscaling are all real, deployed, and better because of them. Inside a two-hour radar horizon, they are arguably the most consequential ML in daily public forecasting. But convolution alone hits a wall at planetary scale and longer leads — blur, bounded receptive fields, no physics. The global "AI weather model" headlines belong to the next family.

---

## References & further learning

**Accessible starting points**

- [DeepMind: Nowcasting the next hour of rain](https://deepmind.google/discover/blog/nowcasting-the-next-hour-of-rain/) — readable account of DGMR, including the forecaster evaluation.
- [distill.pub: Feature Visualization](https://distill.pub/2017/feature-visualization/) — what CNN filters actually learn, beautifully illustrated.

**Technical depth**

- Shi, X., et al. (2015). ["Convolutional LSTM Network: A Machine Learning Approach for Precipitation Nowcasting."](https://arxiv.org/abs/1506.04214) The paper that started ML nowcasting in earnest.
- Ravuri, S., et al. (2021). ["Skilful precipitation nowcasting using deep generative models of radar."](https://doi.org/10.1038/s41586-021-03854-z) *Nature*, 597. DGMR, and the case for generative modeling against blur.
- Andrychowicz, M., et al. (2023). ["Deep Learning for Day Forecasts from Sparse Observations."](https://arxiv.org/abs/2306.06079) The MetNet-3 paper — CNN-family nowcasting at operational scale.
- Lagerquist, R., et al. (2019). ["Deep Learning for Spatially Explicit Prediction of Synoptic-Scale Fronts."](https://doi.org/10.1175/WAF-D-18-0183.1) *Weather and Forecasting*, 34. U-Nets meeting synoptic meteorology.

*Next in the series: [Transformers and Graph Networks: The Models Behind the Headlines](/blog/transformers-and-graph-networks-in-weather).*
`,
};

export default article;
