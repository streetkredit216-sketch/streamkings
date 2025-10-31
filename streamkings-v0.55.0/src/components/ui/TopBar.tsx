interface TopBarProps {
  streamMode: 'tv' | 'radio';
  setStreamMode: (mode: 'tv' | 'radio') => void;
}

export default function TopBar({ streamMode, setStreamMode }: TopBarProps) {
  return (
    <div className="sticky top-0 z-50 w-full bg-zinc-900 border-b border-white/10 shadow-lg">
      <div className="container mx-auto px-2 sm:px-4 max-w-6xl w-full flex items-center justify-between h-14 sm:h-16 py-2 sm:py-0">
        {/* Title */}
        <button
          className="navbar-title text-xl sm:text-2xl md:text-3xl font-bold tracking-widest text-[#ffefb0] hover:text-[#ff3c3c] transition-colors flex-shrink-0"
          style={{ fontFamily: 'Bank Gothic, sans-serif', letterSpacing: '0.1em' }}
          onClick={() => window.location.reload()}
        >
          Stream Kings
        </button>
        {/* Stream Mode Switcher - Responsive */}
        <button
          className={`px-2 sm:px-6 py-1 sm:py-2 rounded-lg transition-all duration-300 font-bold text-xs sm:text-base flex-shrink-0 ${
            streamMode === 'tv' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50 hover:bg-blue-700' 
              : 'bg-red-600 text-white shadow-lg shadow-red-600/50 hover:bg-red-700'
          }`}
          onClick={() => setStreamMode(streamMode === 'tv' ? 'radio' : 'tv')}
        >
          <span className="hidden sm:inline">{streamMode === 'tv' ? 'Stream Kings.Radio' : 'Stream Kings.TV'}</span>
          <span className="sm:hidden">{streamMode === 'tv' ? 'Radio' : 'TV'}</span>
        </button>
      </div>
    </div>
  );
}
