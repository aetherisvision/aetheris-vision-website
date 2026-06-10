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
| `hero-earth.webp` | Earth at night from orbit (hero video fallback) | https://unsplash.com/photos/Q1p7bh3SHj8 (`photo-1451187580459-43490279c0fa`) | NASA |
| `philosophy-atmosphere.webp` | Earth's clouds and atmosphere from the ISS | https://unsplash.com/photos/yZygONrUBe8 (`photo-1446776811953-b23d57bd21aa`) | NASA |

## blog/ — blog page backgrounds

| File | Shows | Source | Photographer |
|---|---|---|---|
| `blog-index-bg.webp` | Towering storm clouds | https://images.unsplash.com/photo-1534088568595-a066f410bcda (pre-existing site asset, localized as-is) | — |
| `blog-post-bg.webp` | Earth's atmospheric limb, deep navy | https://unsplash.com/photos/t7EL2iG3jMc (`photo-1534996858221-380b92700493`) | ActionVance |
