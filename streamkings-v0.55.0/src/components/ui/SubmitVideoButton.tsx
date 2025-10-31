'use client';

interface SubmitVideoButtonProps {
  className?: string;
}

export default function SubmitVideoButton({ className = '' }: SubmitVideoButtonProps) {
  return (
    <a
      href="https://docs.google.com/forms/d/e/1FAIpQLScQN2wmYs5nFxZP9uPYItKxjxqtmKuanWRLpLSHYgFTTHTKnA/viewform?usp=dialog"
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors inline-flex items-center space-x-2 holographic-hover border border-green-500/30 hover:border-green-500/50 shadow-green-glow whitespace-nowrap`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <span className="hidden sm:inline">Video </span><span>Submit</span>
    </a>
  );
}
