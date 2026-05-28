import React from 'react';
import { cn } from '../lib/utils';
import { SafeImage } from './SafeImage';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
}

export function Logo({ className, showTagline = false }: LogoProps) {
  return (
    <div className={cn("flex flex-col items-center flex-shrink-0", className)}>
      <SafeImage 
        src="/logo.png?v=3" 
        alt="Unlocked Logo" 
        className="h-10 md:h-14 w-auto object-contain flex-shrink-0 bg-transparent"
        fallbackSrc="/logo.png"
      />

      {showTagline && (
        <p className="text-[11px] md:text-[14px] font-bold text-slate-400 mt-2 tracking-wide uppercase">
          Unlock your <span className="text-brand-blue">new city</span> together.
        </p>
      )}
    </div>
  );
}
