'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { HiMenu } from 'react-icons/hi';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import UserRegistrationForm from '@/components/UserRegistrationForm';
import { useStreetCredit } from '@/hooks/useStreetCredit';
import { formatUserRole } from '@/lib/utils';

interface User {
  username: string;
  profilePic: string;
  profileBanner?: string;
  role: 'TASTEMAKER' | 'DJ' | 'ARTIST';
  description: string;
  streetCredit: number;
  ranking: number;
  email: string;
}

type ProfileTab = 'blogs' | 'events' | 'music' | 'photos';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('blogs');
  const { publicKey } = useWallet();
  const router = useRouter();
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const { balance, isLoading: isBalanceLoading, error: balanceError } = useStreetCredit();

  useEffect(() => {
    if (publicKey) {
      setIsWalletConnected(true);
      fetchUser();
    } else {
      setIsWalletConnected(false);
      setUser(null);
    }
  }, [publicKey]);

  const fetchUser = async () => {
    if (publicKey) {
      try {
        const response = await fetch(`/api/users/${publicKey.toBase58()}`);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else if (response.status === 404) {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      }
    }
    setIsLoading(false);
  };

  const handleNavigate = (route: string) => {
    console.log('Navigating to:', route);
    setShowMenu(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!publicKey) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <p>Please connect your wallet to view your profile.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white px-2 sm:px-4">
      {/* Profile Banner */}
      <div className="relative h-64 sm:h-[400px] md:h-[600px] lg:h-[750px] w-full">
        {user.profileBanner ? (
          <Image
            src={user.profileBanner}
            alt="Profile Banner"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-zinc-800 to-zinc-900" />
        )}
        
        {/* Menu Icon */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Open navigation menu"
          >
            <HiMenu size={24} className="text-white" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-zinc-800 rounded-lg shadow-lg py-2 border border-white/10">
              <button
                onClick={() => handleNavigate('search')}
                className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
              >
                Search
              </button>
              <button
                onClick={() => handleNavigate('blogs')}
                className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
              >
                Blogs
              </button>
              <button
                onClick={() => handleNavigate('radio')}
                className="w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
              >
                Radio
              </button>
            </div>
          )}
        </div>

        {/* Profile Picture */}
        <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2">
          <div className="w-32 h-32 sm:w-64 sm:h-64 md:w-[400px] md:h-[400px] lg:w-[550px] lg:h-[550px] rounded-full overflow-hidden border-4 border-zinc-900 mx-auto">
            {user.profilePic ? (
              <Image
                src={user.profilePic}
                alt={user.username}
                width={550}
                height={550}
                className="object-cover"
              />
            ) : (
              <Image
                src="/images/default-profile.png"
                alt="Default profile"
                width={550}
                height={550}
                className="object-cover"
              />
            )}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="mt-40 sm:mt-64 md:mt-[300px] text-center">
        <h1 className="text-4xl font-bold mb-4">{user.username}</h1>
        <div className="flex justify-center space-x-8 mb-6">
          <div>
            <div className="text-3xl font-bold text-white">
              {isBalanceLoading ? '...' : balanceError ? (
                <span className="text-red-500 text-sm">{balanceError}</span>
              ) : balance}
            </div>
            <div className="text-white/60">Street Credit</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">#{user.ranking}</div>
            <div className="text-white/60">Ranking</div>
          </div>
        </div>
        <div className="mb-4 text-xl text-phantom">{formatUserRole(user.role)}</div>
        <p className="max-w-2xl mx-auto text-white/80 mb-8">{user.description}</p>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-8 border-b border-white/10">
          {(['blogs', 'events', 'music', 'photos'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-6 text-lg transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-4 sm:py-8">
          {activeTab === 'blogs' && (
            <div className="grid grid-cols-1 gap-6">
              {/* Blog content will go here */}
              <p className="text-center text-white/60">No blogs yet</p>
            </div>
          )}
          {activeTab === 'events' && (
            <div className="grid grid-cols-1 gap-6">
              {/* Events content will go here */}
              <p className="text-center text-white/60">No events yet</p>
            </div>
          )}
          {activeTab === 'music' && (
            <div className="grid grid-cols-1 gap-6">
              {/* Music content will go here */}
              <p className="text-center text-white/60">No music yet</p>
            </div>
          )}
          {activeTab === 'photos' && (
            <div className="grid grid-cols-1 gap-6">
              {/* Photos content will go here */}
              <p className="text-center text-white/60">No photos yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 