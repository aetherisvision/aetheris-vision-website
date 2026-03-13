# Stock Photo Archive System

## Directory Structure
```
website/public/images/
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