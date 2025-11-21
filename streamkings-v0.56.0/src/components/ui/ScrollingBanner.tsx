'use client';

import React from 'react';

interface ScrollingBannerProps {
  items: string[];
}

const ScrollingBanner: React.FC<ScrollingBannerProps> = ({ items }) => {
  // Duplicate items multiple times for truly seamless infinite scroll
  // We need enough duplicates so the animation can loop smoothly
  const duplicatedItems = [...items, ...items, ...items, ...items];

  return (
    <div className="w-full overflow-hidden banner-gradient border-b border-white/10 shadow-[0_2px_8px_rgba(139,92,246,0.15)]">
      <div className="relative h-12 sm:h-14 flex items-center">
        {/* Animated scroll container */}
        <div className="absolute inset-0 flex items-center whitespace-nowrap animate-scroll">
          {duplicatedItems.map((item, index) => (
            <div
              key={`banner-item-${index}`}
              className="banner-text inline-flex items-center mx-6 sm:mx-8 text-xs sm:text-sm md:text-base font-bold"
            >
              <span className="inline-flex items-center">
                <span className="banner-arrow">▸</span>
                <span className="mx-2 banner-text-content">{item}</span>
                <span className="banner-arrow">◂</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScrollingBanner;

