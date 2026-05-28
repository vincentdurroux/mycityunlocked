import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { ImageOff } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  className?: string;
}

export function SafeImage({ 
  src, 
  fallbackSrc = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', 
  className,
  alt = '',
  ...props 
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const [errorCount, setErrorCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setErrorCount(0);
    setIsLoaded(false);
  }, [src]);

  const handleError = () => {
    if (errorCount < 1 && fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      setErrorCount(prev => prev + 1);
    } else {
      setImgSrc(undefined);
    }
  };

  if (!imgSrc && errorCount >= 1) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-slate-50 text-slate-300", className)}>
        <ImageOff className="w-1/3 h-1/3 opacity-20" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!isLoaded && !imgSrc?.includes('data:') && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse" />
      )}
      <img
        {...props}
        src={imgSrc}
        alt={alt}
        onError={handleError}
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "transition-opacity duration-300 w-full h-full",
          isLoaded ? "opacity-100" : "opacity-0",
          !className?.includes('object-') && "object-cover"
        )}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
