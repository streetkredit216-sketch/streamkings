'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, onClose, title = 'ERROR', message }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Lock body scroll when modal is open
      document.body.style.overflow = 'hidden';
      setIsVisible(true);
      
      // Trigger glitch effect on open
      setIsGlitching(true);
      const glitchTimer = setTimeout(() => setIsGlitching(false), 600);
      
      return () => {
        clearTimeout(glitchTimer);
        document.body.style.overflow = '';
      };
    } else {
      setIsVisible(false);
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className={`relative w-full max-w-lg mx-auto bg-gradient-to-br from-red-900/20 via-black to-red-900/20 border-2 rounded-2xl shadow-2xl transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${isGlitching ? 'error-glitch' : ''}`}
      >
        {/* Glitch overlay effect */}
        {isGlitching && (
          <div className="absolute inset-0 opacity-30 pointer-events-none error-corruption" />
        )}
        
        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl border-2 border-red-500/50 animate-pulse" />
        
        {/* Content */}
        <div className="relative p-6 sm:p-8">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-300 transition-colors duration-200 z-10"
            aria-label="Close error modal"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <AlertCircle className="w-16 h-16 text-red-500" />
              <div className="absolute inset-0 text-red-500 blur-sm opacity-50 animate-pulse">
                <AlertCircle className="w-16 h-16" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 text-red-500 glitch-text-hover">
            {title}
          </h2>

          {/* Message */}
          <p className="text-white text-center mb-6 text-base sm:text-lg">
            {message}
          </p>

          {/* OK Button */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-600/50 focus:outline-none focus:ring-4 focus:ring-red-500/50"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;

