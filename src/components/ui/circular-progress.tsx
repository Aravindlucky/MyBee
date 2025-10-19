'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  strokeWidth?: number;
  color?: string;
  animate?: boolean;
}

const CircularProgress = React.forwardRef<
  HTMLDivElement,
  CircularProgressProps
>(
  (
    {
      className,
      value = 0,
      strokeWidth = 10,
      color,
      animate = true,
      ...props
    },
    ref
  ) => {
    const radius = 50 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div
        ref={ref}
        className={cn('relative h-full w-full', className)}
        {...props}
      >
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full -rotate-90 transform"
        >
          {/* Background Circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-secondary"
            fill="transparent"
          />
          {/* Foreground Circle (Progress) */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            strokeWidth={strokeWidth}
            className={cn(
              'stroke-current text-primary transition-all',
              animate && 'animate-progress-ring', // Use animation from globals.css
              color // Pass custom color
            )}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }
);
CircularProgress.displayName = 'CircularProgress';

export { CircularProgress };