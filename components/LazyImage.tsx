
import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, ...props }) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
  const placeholderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let observer: IntersectionObserver;

    const currentRef = placeholderRef.current;
    if (currentRef) {
      observer = new IntersectionObserver(
        ([entry]) => {
          // When the placeholder enters the viewport, set the image source
          if (entry.isIntersecting) {
            if (typeof src === 'string') {
              setImageSrc(src);
            }
            observer.disconnect(); // Clean up the observer
          }
        },
        { rootMargin: '100px 0px' } // Load the image 100px before it's visible
      );
      observer.observe(currentRef);
    }

    return () => {
      // Cleanup on unmount
      if (observer && currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [src]);

  // If the image source is set, render the actual image
  if (imageSrc) {
    return <img src={imageSrc} alt={alt} className={className} {...props} />;
  }

  // Otherwise, render a placeholder div that will be observed
  // The placeholder uses the same className to maintain layout and dimensions
  return <div ref={placeholderRef} className={`${className} bg-black/40 animate-pulse`} />;
};

export default LazyImage;
