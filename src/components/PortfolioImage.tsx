import Image from 'next/image';
import { useState } from 'react';
import { getOptimizedImageSet, getPlaceholderImage, type ImageCategory, type ImageType, type ImageSize } from '@/lib/images';

interface PortfolioImageProps {
  category: ImageCategory;
  type: ImageType;
  description: string;
  size?: ImageSize;
  width: number;
  height: number;
  alt?: string;
  className?: string;
  priority?: boolean;
}

export default function PortfolioImage({
  category,
  type,
  description,
  size = '1920x1080',
  width,
  height,
  alt,
  className = '',
  priority = false
}: PortfolioImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const imageSet = getOptimizedImageSet(category, type, description, size);
  const fallbackAlt = alt || imageSet.alt;

  // If image fails to load, show placeholder
  if (imageError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
        aria-label={fallbackAlt}
      >
        <div className="text-gray-400 text-center p-4">
          <div className="text-sm font-medium mb-1">Image Loading</div>
          <div className="text-xs opacity-75">{category} • {type}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Loading placeholder */}
      {isLoading && (
        <div 
          className="absolute inset-0 animate-pulse bg-gray-200"
          style={{
            backgroundImage: `url(${getPlaceholderImage(width, height, category)})`
          }}
        />
      )}
      
      {/* Optimized image with WebP support */}
      <picture>
        <source srcSet={imageSet.webp} type="image/webp" />
        <Image
          src={imageSet.fallback}
          alt={fallbackAlt}
          width={width}
          height={height}
          priority={priority}
          className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          style={{ objectFit: 'cover' }}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setImageError(true);
          }}
        />
      </picture>
    </div>
  );
}

// Convenience components for common use cases
export function HeroImage({ category, description, className = '' }: {
  category: ImageCategory;
  description: string;
  className?: string;
}) {
  return (
    <PortfolioImage
      category={category}
      type="hero"
      description={description}
      width={1920}
      height={1080}
      priority={true}
      className={`w-full h-96 lg:h-[500px] object-cover ${className}`}
    />
  );
}

export function CardImage({ category, type, description, className = '' }: {
  category: ImageCategory;
  type: ImageType;
  description: string;
  className?: string;
}) {
  return (
    <PortfolioImage
      category={category}
      type={type}
      description={description}
      size="400x300"
      width={400}
      height={300}
      className={`rounded-lg object-cover ${className}`}
    />
  );
}