import React, { useState } from 'react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSvg?: React.ReactNode;
}

export const ImageWithFallback: React.FC<ImageProps> = ({ src, alt, className, fallbackSvg, ...props }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <>
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          className={className}
          onError={() => setHasError(true)}
          loading="lazy"
          {...props}
        />
      ) : (
        <div className={`flex items-center justify-center bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.3)] ${className}`}>
          {fallbackSvg || (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          )}
        </div>
      )}
    </>
  );
};
