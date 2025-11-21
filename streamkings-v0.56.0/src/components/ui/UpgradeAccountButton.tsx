'use client';

interface UpgradeAccountButtonProps {
  className?: string;
}

export default function UpgradeAccountButton({ className = '' }: UpgradeAccountButtonProps) {
  return (
    <a
      href="https://docs.google.com/forms/d/e/1FAIpQLSfCcV1xR1-JFy04-STO4YNxOGVu8X-yoSSKFj73Uv8MzzraEw/viewform?usp=dialog"
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} px-4 py-2 bg-phantom/20 hover:bg-phantom/30 text-phantom rounded-lg transition-colors inline-flex items-center space-x-2 holographic-hover border border-phantom/30 hover:border-phantom/50 shadow-phantom-glow`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span>Upgrade Account</span>
    </a>
  );
}
