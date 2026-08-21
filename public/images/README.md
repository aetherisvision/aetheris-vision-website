# Stock Photo Archive System

## Directory Structure
```
website/public/images/
├── home/          # Homepage hero/section backgrounds (see below)
├── blog/          # Blog page backgrounds (see below)
├── law/           # Legal imagery (courthouse, books, scales of justice)
├── restaurant/    # Food, dining, kitchen, chef photos
├── contractor/    # Construction, tools, homes, workers
├── healthcare/    # Medical, clinic, professional healthcare
├── general/       # Business people, offices, handshakes
├── nonprofit/     # Community, helping, volunteers
├── analytics/     # Data, charts, dashboards, tech
├── international/ # Global, cultural, diverse foods
└── tech/          # Software, coding, modern office
```

## Image Naming Convention
```
{category}_{type}_{description}_{size}.{ext}
Examples:
- law_hero_courthouse_1920x1080.jpg
- restaurant_interior_dining_1200x800.jpg  
- contractor_team_professional_800x600.jpg
```

## Usage in Components
```typescript
import { getImageUrl } from '@/lib/images';

// Professional hero image
<Image 
  src={getImageUrl('law', 'hero', 'courthouse')} 
  alt="Professional courthouse exterior"
  width={1920} 
  height={1080}
/>
```

## Stock Photo Sources
- **Adobe Stock** (paid) - Premium professional photos
- **Unsplash** (free) - High quality, attribution required  
- **Pexels** (free) - Good business imagery
- **Shutterstock** (paid) - Extensive selection

## MCP Integration
- Use `unsplash` MCP server to search and download
- Use `filesystem` MCP server to organize and manage
- Automatic optimization with Next.js Image component

## Image Sizes
- **Hero:** 1920x1080 (16:9)
- **Card:** 400x300 (4:3)  
- **Portrait:** 300x400 (3:4)
- **Banner:** 1200x400 (3:1)

## Optimization
- WebP format for modern browsers
- Progressive JPEG fallback
- Lazy loading with Next.js Image
- Responsive srcset for different screen sizes

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

These assets are generated custom high-fidelity `.webp` images to ensure professional, realistic, and cohesive visuals across Aetheris Vision and its demo sites.

### weather-ai/ — Weather AI service page

| File | Shows | Source |
|---|---|---|
| `ai-weather-analysis-gemini-1024x559.png` | Concept illustration of a robotic AI system analyzing hurricane forecast data | AI-generated with Google Gemini; supplied by Aetheris Vision |

### home/ — Homepage backgrounds
- `applied-meteorology-workspace-v1.webp` - Forecaster's workspace with charts and displays (How We Work section).

### Demos (restaurant/, contractor/, healthcare/) — Photography-forward Demo upgrades
- `restaurant/restaurant_hero_dining_1920x1080.webp/.jpg` - Cozy dining room during evening service.
- `restaurant/restaurant_hero_chef_1920x1080.webp/.jpg` - Chef plating a gourmet dish.
- `contractor/contractor_hero_construction_1920x1080.webp/.jpg` - Beautiful luxury home under construction.
- `healthcare/healthcare_hero_clinic_1920x1080.webp/.jpg` - Modern reception lobby.
- `healthcare/healthcare_team_portrait_800x600.webp/.jpg` - Professional portrait of Dr. Sarah Okonkwo.
