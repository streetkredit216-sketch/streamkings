// src/components/OnboardingModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onJoin }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
      // Small delay for smooth animation
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      setIsVisible(false);
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
                 <div
                   className={`relative w-full max-w-4xl mx-auto max-h-[85vh] overflow-y-auto overscroll-contain bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl transform transition-all duration-300 ${
                     isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                   }`}
                 >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors duration-200 z-10"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-4 sm:p-6 h-full flex flex-col">
          {/* Header */}
          <div className="text-center mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-2">
              HOW IT WORKS
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto rounded-full"></div>
          </div>

          {/* Main Message */}
          <div className="text-center mb-4">
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-2">
              Stream Kings isn't just another streaming platform. It's a compass for guiding music culture.
            </p>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Every stream, comment, and connection fuels the underground waves, pushing artists forward not through labels or algorithms, but through the artist and listener communities.
            </p>
          </div>

          {/* Steps - Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 flex-1">
            <div className="text-center">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
                1
              </div>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                <span className="font-semibold text-white">Stream music, interact, and back the artists you believe in.</span>
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
                2
              </div>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                <span className="font-semibold text-white">Earn STREET KREDIT, the community-powered ranking system.</span>
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
                3
              </div>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                <span className="font-semibold text-white">Watch the charts evolve in real time — not by industry gatekeepers, but by collective consensus.</span>
              </p>
            </div>
          </div>

          {/* Inspirational Message */}
          <div className="text-center mb-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/30">
            <p className="text-xs text-gray-400 italic leading-relaxed mb-2">
              "No bots. No pay-to-play. No Billboard politics.<br />
              Just raw energy, creativity, and recognition driven by the people who matter most: the artists and their listeners."
            </p>
            <p className="text-xs text-gray-500">
              By joining, you're part of a movement that rewards authenticity, amplifies voices, and builds a culture bigger than any mainstream chart.
            </p>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <button
              onClick={onJoin}
              className="group relative px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
            >
              <span className="relative z-10">I'm ready to join the revolution</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            {/* Manifesto and White Paper Links */}
            <div className="mt-2 flex justify-center gap-4">
              <a
                href="https://docs.google.com/presentation/d/1jSb2tosgEwHez1mbJ4owHdpM7qHitKHxmwFp-g90aMA/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-400 transition-colors duration-200 underline"
              >
                Manifesto
              </a>
              <a
                href="https://docs.google.com/document/d/1tO8RnTWYa71vFCY-krJ73BeqBQKNxXnj5n2kjnIefkQ/edit?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-400 transition-colors duration-200 underline"
              >
                White Paper
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
