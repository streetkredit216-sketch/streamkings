import { useState, useRef, useEffect } from 'react';
import { HiMenu, HiSearch, HiChevronDown } from 'react-icons/hi';
import { User } from '@/types/user';
import SearchResults from './SearchResults';
import Scoreboard from './Scoreboard';
import { formatUserRole } from '@/lib/utils';

const VIEW_MODES = ['blogs', 'search', 'scoreboard', 'radio'] as const;
type ViewMode = typeof VIEW_MODES[number];
type BlogView = 'following' | 'newest';

interface NavigationMenuProps {
  user: User | undefined;
  viewMode: ViewMode;
  view: BlogView;
  onNavigate: (mode: ViewMode) => void;
  onViewChange: (view: BlogView) => void;
  onProfileClick: () => void;
  onUserClick: (walletAddress: string) => void;
  onUserUpdate: (user: User) => void;
  streamMode: 'tv' | 'radio';
  setStreamMode: (mode: 'tv' | 'radio') => void;
}

export default function NavigationMenu({ 
  user,
  viewMode, 
  view,
  onNavigate,
  onViewChange,
  onProfileClick,
  onUserClick,
  onUserUpdate,
  streamMode,
  setStreamMode
}: NavigationMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cycle through the 3 main view modes
  const cycleViewMode = () => {
    const modes: ViewMode[] = ['blogs', 'search', 'scoreboard'];
    const currentIndex = modes.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    onNavigate(modes[nextIndex]);
  };

  // Get display name for current view mode
  const getViewModeDisplayName = (mode: ViewMode) => {
    switch (mode) {
      case 'blogs': return 'Blogs';
      case 'search': return 'Search';
      case 'scoreboard': return 'Scoreboard';
      case 'radio': return 'Radio';
      default: return 'Blogs';
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="sticky top-0 z-[45] w-full bg-zinc-900 border-b border-white/10">
        <div className="container mx-auto px-4 max-w-6xl w-full flex items-center">
          {/* Profile Button */}
          <button
            onClick={onProfileClick}
            className="flex items-center space-x-3 pr-6 border-r border-white/10 hover:bg-white/5 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10">
              <img
                src={user?.profilePic || "/images/default-profile.png"}
                alt={user?.username || "Default profile"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-left">
              <span className="block text-sm font-medium">{user?.username || "Loading..."}</span>
              <span className="block text-xs text-white/60">{user?.role ? formatUserRole(user.role) : ''}</span>
            </div>
          </button>

          <div className="flex-1 flex items-center justify-between">
            {viewMode === 'blogs' ? (
              <div className="flex-1 flex">
                <button
                  className={`flex-1 py-4 text-center transition-colors ${
                    view === 'following'
                      ? 'text-white border-b-2 border-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                  onClick={() => onViewChange('following')}
                >
                  Following
                </button>
                <button
                  className={`flex-1 py-4 text-center transition-colors ${
                    view === 'newest'
                      ? 'text-white border-b-2 border-white'
                      : 'text-white/70 hover:text-white'
                  }`}
                  onClick={() => onViewChange('newest')}
                >
                  Newest
                </button>
              </div>
            ) : viewMode === 'search' ? (
              <div className="flex-1 px-4">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full bg-white/5 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Mode Switches */}
            <div className="flex items-center space-x-4">
              {/* Desktop: show 3 buttons */}
              <div className="hidden sm:flex items-center space-x-4">
                <button
                  onClick={() => onNavigate('blogs')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'blogs'
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Blogs
                </button>
                <button
                  onClick={() => onNavigate('search')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'search'
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Search
                </button>
                <button
                  onClick={() => onNavigate('scoreboard')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'scoreboard'
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Scoreboard
                </button>
              </div>
              {/* Mobile: single button that cycles through views */}
              <div className="sm:hidden">
                <button
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    ['blogs', 'search', 'scoreboard'].includes(viewMode)
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                  onClick={cycleViewMode}
                >
                  {getViewModeDisplayName(viewMode)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {viewMode === 'search' && searchQuery.trim() && (
        <div className="container mx-auto px-4 max-w-6xl mt-4">
          <SearchResults 
            query={searchQuery} 
            onClose={() => setSearchQuery('')}
            onUserClick={(walletAddress) => {
              onUserClick(walletAddress);
              setSearchQuery('');
              onNavigate('blogs');
            }}
          />
        </div>
      )}

      {/* Scoreboard */}
      {viewMode === 'scoreboard' && (
        <div className="container mx-auto px-4 max-w-6xl mt-4">
          <Scoreboard onUserClick={onUserClick} />
        </div>
      )}
    </div>
  );
}