import { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { api } from '@/lib/api';

interface SearchResultsProps {
  query: string;
  onClose: () => void;
  onUserClick: (walletAddress: string) => void;
}

export default function SearchResults({ query, onClose, onUserClick }: SearchResultsProps) {
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`${api.users.search}?q=${encodeURIComponent(query)}`);
        console.log('Search response:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Search results:', data);
          setResults(data);
        } else {
          console.error('Search failed:', await response.text());
        }
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  if (!query.trim()) return null;

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-lg p-4 crt-overlay">
      {isSearching ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          {results.map((user) => (
            <div
              key={user.walletAddress}
              onClick={() => onUserClick(user.walletAddress)}
              className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                <img
                  src={user.profilePic || '/images/default-profile.png'}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-white glitch-text-hover">{user.username}</h3>
                <p className="text-white/60 text-xs font-mono">{user.walletAddress}</p>
                <p className="text-white/60 text-sm">{user.role}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-white/60 py-8">No users found</p>
      )}
    </div>
  );
}
