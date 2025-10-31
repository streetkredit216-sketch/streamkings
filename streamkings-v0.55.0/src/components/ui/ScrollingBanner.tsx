'use client';

import React from 'react';

interface ScrollingBannerProps {
  items: string[];
}

const ScrollingBanner: React.FC<ScrollingBannerProps> = ({ items }) => {
  // Duplicate items for seamless scroll effect
  const duplicatedItems = [...items, ...items];

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-cyan-900/30 via-blue-900/30 to-purple-900/30 border-b border-cyan-500/20 shadow-[0_2px_8px_rgba(0,255,255,0.15)]">
      <div className="relative h-12 sm:h-14 flex items-center">
        {/* Animated scroll container */}
        <div className="absolute inset-0 flex items-center whitespace-nowrap animate-scroll">
          {duplicatedItems.map((item, index) => (
            <div
              key={`banner-item-${index}`}
              className="banner-text inline-flex items-center mx-6 sm:mx-8 text-xs sm:text-sm md:text-base font-bold text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]"
            >
              <span className="inline-flex items-center">
                <span className="text-cyan-400">▸</span>
                <span className="mx-2">{item}</span>
                <span className="text-cyan-400">◂</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScrollingBanner;

