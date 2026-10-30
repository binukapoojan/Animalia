import React from 'react';

export interface AudioWaveformIconProps {
  isPlaying?: boolean;
  className?: string;
  barClassName?: string;
}

export function AudioWaveformIcon({
  isPlaying = false,
  className = 'w-4 h-4',
  barClassName = 'bg-current'
}: AudioWaveformIconProps) {
  return (
    <span className={`inline-flex items-center justify-center gap-[2px] h-4 w-4 ${className}`} aria-hidden="true">
      <span
        className={`w-[2.5px] rounded-full transition-all duration-300 ${barClassName} ${
          isPlaying ? 'animate-[bounce_0.6s_ease-in-out_infinite_alternate] h-3.5' : 'h-1.5'
        }`}
      />
      <span
        className={`w-[2.5px] rounded-full transition-all duration-300 ${barClassName} ${
          isPlaying ? 'animate-[bounce_0.8s_ease-in-out_infinite_alternate_0.2s] h-4' : 'h-3'
        }`}
      />
      <span
        className={`w-[2.5px] rounded-full transition-all duration-300 ${barClassName} ${
          isPlaying ? 'animate-[bounce_0.5s_ease-in-out_infinite_alternate_0.4s] h-3' : 'h-2'
        }`}
      />
      <span
        className={`w-[2.5px] rounded-full transition-all duration-300 ${barClassName} ${
          isPlaying ? 'animate-[bounce_0.7s_ease-in-out_infinite_alternate_0.1s] h-2.5' : 'h-1.5'
        }`}
      />
    </span>
  );
}
