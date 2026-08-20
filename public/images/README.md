# Stock Photo Archive System

## Directory Structure
```
website/public/images/
├── competencies/  # Homepage Core Competencies card backgrounds (see below)
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

# Self-hosted site backgrounds (`competencies/`, `home/`, `blog/`)

These were previously hotlinked from `images.unsplash.com`; three of those hotlinks
went 404 in production (deleted from Unsplash), so all decorative backgrounds are now
committed here.

All photos are from Unsplash and used under the [Unsplash License](https://unsplash.com/license)
(free for commercial use, no attribution required). Sources recorded below for provenance.
Files were downloaded pre-sized (≤1920px wide) and pre-compressed as WebP via Unsplash's
imgix params (`fm=webp&q=55–75`), then served through `next/image`.

## competencies/ — homepage Core Competencies card backgrounds

| File | Shows | Source | Photographer |
|---|---|---|---|
| `applied-meteorology.webp` | Supercell storm structure with rain shafts over plains | https://unsplash.com/photos/drQtGkdBz8E (`photo-1618604943672-faaf34b4c3b2`) | Raychel Sanner |
| `ai-ml-integration.webp` | Teal neural-mesh / point-cloud network visualization | https://unsplash.com/photos/11KDtiUWRq4 (`photo-1590859808308-3d2d9c515b1a`) | Uriel SC |
| `web-digital-solutions.webp` | Dark laptop screen with source code | https://unsplash.com/photos/f77Bh3inUpE (`photo-1555066931-4365d14bab8c`) | Arnold Francisca |
| `technical-advisory.webp` | Blue-lit geometric stair structure on dark | https://unsplash.com/photos/mufeb7CMUxo (`photo-1550602883-4c2d2c705db2`) | Dawid Sokołowski |
| `technical-leadership.webp` | Chess pieces mid-game, dark monochrome | https://unsplash.com/photos/nAjil1z3eLk (`photo-1528819622765-d6bcf132f793`) | Felix Mittermeier |
| `state-federal-contracting.webp` | U.S. Capitol dome at night, monochrome (brightness lifted via imgix `bri=22&gam=15` for card visibility) | https://unsplash.com/photos/vZkZH6K5mCo (`photo-1635255752782-febbe92c2da6`) | MIKE STOLL |

## home/ — homepage section backgrounds

| File | Shows | Source | Photographer |
|---|---|---|---|
| `hero-earth.webp` | Earth at night from orbit (former hero fallback; currently unused) | https://unsplash.com/photos/Q1p7bh3SHj8 (`photo-1451187580459-43490279c0fa`) | NASA |
| `hero-earth-weather.jpg` | Earth from orbit with active cloud cover — still frame extracted from `/hero-1.mp4` (hero video fallback for mobile/reduced-motion) | Derived from `public/hero-1.mp4` | — |
| `philosophy-atmosphere.webp` | Earth's clouds and atmosphere from the ISS | https://unsplash.com/photos/yZygONrUBe8 (`photo-1446776811953-b23d57bd21aa`) | NASA |
| `cta-storm-watch.webp` | Storm observer standing on a plains dirt road as lightning strikes ("Ready to build something?" CTA card) | https://unsplash.com/photos/Kug730pBflE (`photo-1658590094012-4e6f34fcf3a2`) | Nikolas Noonan |

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

### home/ & competencies/ — Homepage backgrounds
- `hero-earth.webp` - Cinematic view of Earth at night with glowing satellite tracks.
- `hero-earth-weather.jpg` - Earth from orbit with cloud cover; still frame of `hero-1.mp4` (current hero fallback).
- `philosophy-atmosphere.webp` - Atmospheric limb sunrise from space.
- `cta-storm-watch.webp` - Meteorologist facing a supercell storm on a plains road.
- `applied-meteorology.webp` - Supercell storm cloud structure over plains.
- `ai-ml-integration.webp` - Abstract glowing teal neural network point-cloud mesh.
- `web-digital-solutions.webp` - Developer desk with colorful code on a laptop.
- `technical-advisory.webp` - Architectural skyscraper facade with blueprint overlay.
- `technical-leadership.webp` - Dramatic photo of a hand moving a dark glass chess piece.
- `state-federal-contracting.webp` - Illuminated United States Capitol dome at night.

### clients/ — Potential Client Showcase
- `client_law.webp` - Modern conference room meeting with lawyers.
- `client_healthcare.webp` - Professional female physician in a clinic.
- `client_restaurant.webp` - Upscale dining room and chef plating in the background.
- `client_contractor.webp` - Contractor and client reviewing blueprints at a home framing site.
- `client_tech.webp` - Sleek dark mode SaaS analytics dashboard UI.
- `client_government.webp` - EOC operations center weather briefing for officials.

### Demos (restaurant/, contractor/, healthcare/) — Photography-forward Demo upgrades
- `restaurant/restaurant_hero_dining_1920x1080.webp/.jpg` - Cozy dining room during evening service.
- `restaurant/restaurant_hero_chef_1920x1080.webp/.jpg` - Chef plating a gourmet dish.
- `contractor/contractor_hero_construction_1920x1080.webp/.jpg` - Beautiful luxury home under construction.
- `healthcare/healthcare_hero_clinic_1920x1080.webp/.jpg` - Modern reception lobby.
- `healthcare/healthcare_team_portrait_800x600.webp/.jpg` - Professional portrait of Dr. Sarah Okonkwo.
