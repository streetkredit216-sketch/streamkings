import { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { formatUserRole } from '@/lib/utils';

interface ScoreboardProps {
  onUserClick: (walletAddress: string) => void;
}

interface LeaderboardEntry {
  user: User;
  change: number;
  rank: number;
}

export default function Scoreboard({ onUserClick }: ScoreboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${api.users.leaderboard}?limit=100`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const users = await response.json();
      
      // Users are already sorted by street credit from the backend
      // Calculate percentage changes (mock data for now - you'll need to implement this in your backend)
      const leaderboardData = users.map((user: User, index: number) => ({
        user,
        change: Math.random() * 20 - 10, // Mock change between -10% and +10%
        rank: index + 1
      }));

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-zinc-800/50 rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-zinc-700/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-zinc-800/50 rounded-lg p-4 crt-overlay">
      <h2 className="text-xl font-bold text-white mb-4 text-center">Street Kredit Scoreboard</h2>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {leaderboard.map((entry) => (
            <motion.div
              key={entry.user.walletAddress}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-zinc-700/30 rounded-lg hover:bg-zinc-700/50 transition-colors cursor-pointer gap-2"
              onClick={() => onUserClick(entry.user.walletAddress)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-white/60 w-6 text-sm font-medium">
                  {entry.rank <= 3 ? (
                    <span className={`text-lg ${entry.rank === 1 ? 'text-yellow-400' : entry.rank === 2 ? 'text-gray-300' : 'text-orange-400'}`}>
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    entry.rank
                  )}
                </span>
                <img
                  src={entry.user.profilePic || "/images/default-profile.png"}
                  alt={entry.user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium truncate glitch-text-hover">{entry.user.username}</div>
                  <div className="text-white/60 text-xs font-mono truncate">{entry.user.walletAddress}</div>
                  <div className="text-white/60 text-sm">{formatUserRole(entry.user.role)}</div>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2">
                <div className="text-white font-medium text-right kred-pulse">
                  {entry.user.streetCredit.toLocaleString()}
                </div>
                <div className={`text-sm ${entry.change >= 0 ? 'text-green-400' : 'text-red-400'} kred-pulse`}>
                  {entry.change >= 0 ? '+' : ''}{entry.change.toFixed(1)}%
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {leaderboard.length === 0 && !isLoading && (
          <div className="text-center text-white/60 py-8">
            No users found
          </div>
        )}
      </div>
    </div>
  );
} 