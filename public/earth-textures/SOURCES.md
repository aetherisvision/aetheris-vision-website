# Earth texture sources

These optimized WebP textures are derived from the public-domain Natural Earth III dataset by Tom Patterson:

- `day-4k.webp`: [Earth without clouds](https://www.shadedrelief.com/natural3/pages/textures.html), resized from the 8,192 × 4,096 source to 4,096 × 2,048 with restrained output sharpening.
- `day-2k.webp`: Hero day surface. Derivative of `day-4k.webp`, resized to 2,048 × 1,024. The page keeps this map; it does not swap in an 8K texture.
- `day-8k.webp`: [Earth without clouds](https://www.shadedrelief.com/natural3/pages/textures.html), optimized at the original 8,192 × 4,096 resolution. Retained in the repo and not requested by the site.
- `hero-poster.webp`: Still of the hero globe at its initial rotation (day, night lights, and clouds; no starfield), rendered with the same scene, camera, and materials as `RotatingEarth`. Shown before WebGL is ready, and for visitors who do not get a canvas. Regenerate with `npx tsx scripts/render-hero-poster.ts`.
- `night-2k.webp`: [Earth at night](https://www.shadedrelief.com/natural3/pages/textures.html), resized from the 8,192 × 4,096 source to 2,048 × 1,024.
- `clouds-4k.webp`: [Fair-weather cloud map](https://www.shadedrelief.com/natural3/pages/clouds.html), resized from the 8,192 × 4,096 source to 4,096 × 2,048 with restrained output sharpening.
- `storm-clouds-2k.webp`: Hero cloud layer. Derivative of `storm-clouds-4k.webp`, resized to 2,048 × 1,024. The page keeps this map; it does not swap in an 8K texture.
- `storm-clouds-4k.webp`: [Storm cloud map](https://www.shadedrelief.com/natural3/pages/clouds.html), resized from the 8,192 × 4,096 source to 4,096 × 2,048 for the globe's fast first render.
- `storm-clouds-8k.webp`: [Storm cloud map](https://www.shadedrelief.com/natural3/pages/clouds.html), optimized at the original 8,192 × 4,096 resolution. The source includes a cyclone, a typhoon, and two hurricanes. Retained in the repo and not requested by the site.

Natural Earth III permits modification and commercial use without attribution. Its [terms of use](https://www.shadedrelief.com/natural3/pages/use.html) place the data and images in the public domain.
