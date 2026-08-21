# Image Archive

```
website/public/images/
├── about/        # About page imagery
├── blog/         # Blog page backgrounds
├── book/         # Book a Consultation page
├── contact/      # Contact page
├── credentials/  # Credential and registration marks
├── home/         # Homepage section backgrounds
├── insights/     # Article schematics (generated in-house)
├── omni-gridder/ # Omni Gridder page figures
├── portfolio/    # Screenshots of delivered client work
└── weather-ai/   # Weather AI service page
```

The demo-site catalogue and all of its stock photography (`law/`, `restaurant/`,
`contractor/`, `healthcare/`, `photography/`, `real-estate/`, `wp-editorial/`) were
removed in August 2026 when the demo pages were retired. Everything under
`portfolio/` is now a screenshot of real, delivered client work.

---

# Self-hosted site backgrounds (`home/`, `blog/`, page folders)

These were previously hotlinked from `images.unsplash.com`; three of those hotlinks
went 404 in production (deleted from Unsplash), so all decorative backgrounds are now
committed here.

All photos are from Unsplash and used under the [Unsplash License](https://unsplash.com/license)
(free for commercial use, no attribution required). Sources recorded below for provenance.
Files were downloaded pre-sized (≤1920px wide) and pre-compressed as WebP via Unsplash's
imgix params (`fm=webp&q=55–75`), then served through `next/image`.

## insights/ — article diagrams

Original schematic SVGs created in-house for the Insights series (no external sources;
generated programmatically, safe to regenerate or edit). One per article.

AI & Weather series: `random-forest-voting`, `cnn-filters`, `global-attention`,
`fourcastnet-fourier`, `pangu-temporal`, `graphcast-mesh`, `gencast-ensemble`,
`aifs-pipeline`, `aurora-foundation`, `neuralgcm-hybrid`, `ai-weather-timeline`.

Traditional NWP + Forecasting Craft series: `richardsons-dream`, `inside-a-weather-model`,
`data-assimilation-cycle`, `the-models-we-ran`, `ensemble-spread`, `mos-and-the-forecaster`,
`hand-analysis`, `reading-the-skew-t`, `rules-of-thumb`, `the-forecasters-workstation-1990`.

## home/ — homepage section backgrounds

| File | Shows | Source | Photographer |
|---|---|---|---|
| `applied-meteorology-workspace-v1.webp` | Forecaster's workspace (How We Work section) | Custom generated imagery (see below) | — |

## about/ — About page imagery

| File | Shows | Source | Photographer |
|---|---|---|---|
| `field-research-balloon.webp` | NOAA researchers launching an ozonesonde weather balloon at a polar station at dusk (founder-section work-context shot) | https://unsplash.com/photos/5hZJVGPG6vo (`photo-1561484930-ac8e09d9cbc4`) | NOAA |

## book/ — Book a Consultation page

| File | Shows | Source | Photographer |
|---|---|---|---|
| `plans-review.webp` | Civilian assessment team in helmets reviewing structural plans together, monochrome (header background) | https://unsplash.com/photos/yaDGlZOsYoM (`photo-1581094374631-2154f20c2726`) | ThisisEngineering |

## contact/ — Contact page

| File | Shows | Source | Photographer |
|---|---|---|---|
| `damage-assessment.webp` | Two wildland fire crew members surveying a burned landscape (header background) | https://unsplash.com/photos/gnMxtPPImQ4 (`photo-1752553030578-ca6126fd80d4`) | Troy Olson |

## blog/ — blog page backgrounds

| File | Shows | Source | Photographer |
|---|---|---|---|
| `blog-index-bg.webp` | Towering storm clouds | https://images.unsplash.com/photo-1534088568595-a066f410bcda (pre-existing site asset, localized as-is) | — |
| `blog-post-bg.webp` | Earth's atmospheric limb, deep navy | https://unsplash.com/photos/t7EL2iG3jMc (`photo-1534996858221-380b92700493`) | ActionVance |

## Custom Premium Generated Imagery

These assets are generated custom high-fidelity `.webp` images to ensure professional, realistic, and cohesive visuals for Aetheris Vision.

### weather-ai/ — Weather AI service page

| File | Shows | Source |
|---|---|---|
| `ai-weather-analysis-gemini-1024x559.png` | Concept illustration of a robotic AI system analyzing hurricane forecast data | AI-generated with Google Gemini; supplied by Aetheris Vision |

### home/ — Homepage backgrounds
- `applied-meteorology-workspace-v1.webp` - Forecaster's workspace with charts and displays (How We Work section).

