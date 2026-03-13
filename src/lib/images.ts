/**
 * Image utility functions for managing portfolio demo images
 */

export type ImageCategory = 
  | 'law' 
  | 'restaurant' 
  | 'contractor' 
  | 'healthcare' 
  | 'general' 
  | 'nonprofit' 
  | 'analytics' 
  | 'international' 
  | 'tech';

export type ImageType = 'hero' | 'card' | 'portrait' | 'banner' | 'interior' | 'team' | 'product';

export type ImageSize = '1920x1080' | '1200x800' | '800x600' | '400x300' | '300x400' | '1200x400';

/**
 * Get optimized image URL for portfolio demos
 */
export function getImageUrl(
  category: ImageCategory,
  type: ImageType,
  description: string,
  size: ImageSize = '1920x1080',
  format: 'jpg' | 'webp' = 'jpg'
): string {
  return `/images/${category}/${category}_${type}_${description}_${size}.${format}`;
}

/**
 * Get image with WebP and fallback support
 */
export function getOptimizedImageSet(
  category: ImageCategory,
  type: ImageType,
  description: string,
  size: ImageSize = '1920x1080'
) {
  return {
    webp: getImageUrl(category, type, description, size, 'webp'),
    fallback: getImageUrl(category, type, description, size, 'jpg'),
    alt: `${category} ${type} - ${description.replace(/[_-]/g, ' ')}`
  };
}

/**
 * Stock photo inventory for each demo
 */
export const DEMO_IMAGES = {
  law: {
    hero: {
      courthouse: 'Professional courthouse with columns and American flag',
      scales: 'Scales of justice in dramatic lighting',
      books: 'Row of legal books with leather bindings'
    },
    team: {
      lawyers: 'Professional lawyers in conference room',
      handshake: 'Client consultation handshake'
    }
  },
  restaurant: {
    hero: {
      dining: 'Warm restaurant interior with ambient lighting',
      chef: 'Chef preparing fresh food in kitchen'
    },
    food: {
      plated: 'Beautifully plated signature dishes',
      ingredients: 'Fresh local ingredients and spices'
    }
  },
  contractor: {
    hero: {
      construction: 'Modern home construction site',
      tools: 'Professional construction tools organized'
    },
    team: {
      workers: 'Skilled contractors on job site',
      safety: 'Team wearing proper safety equipment'
    }
  }
} as const;

/**
 * Get placeholder image while loading
 */
export function getPlaceholderImage(width: number, height: number, category?: ImageCategory): string {
  const color = category ? getCategoryColor(category) : '64748b';
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='100%25' height='100%25' fill='%23${color}'/%3E%3C/svg%3E`;
}

/**
 * Get brand color for each category
 */
function getCategoryColor(category: ImageCategory): string {
  const colors = {
    law: '1e3a5f',        // Navy blue
    restaurant: '92400e',  // Warm brown
    contractor: '1d4ed8',  // Blue
    healthcare: '059669',  // Green
    general: '64748b',     // Slate
    nonprofit: 'dc2626',   // Red
    analytics: '7c3aed',   // Purple
    international: '059669', // Emerald
    tech: '0f172a'         // Dark
  };
  return colors[category];
}