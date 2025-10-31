'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import UserRegistrationForm from '@/components/UserRegistrationForm';
import RadioStation from '@/components/RadioStation';
import BlogSection from '@/components/BlogSection';
import { useEffect, useState } from 'react';
import SongStream from '@/components/SongStream';
import TopBar from '@/components/ui/TopBar';
import ScrollingBanner from '@/components/ui/ScrollingBanner';
import { User } from '@/types/user';
import { api } from '@/lib/api';
import OnboardingModal from '@/components/OnboardingModal';

const WalletButton = dynamic(() => import('@/components/WalletButton'), { ssr: false });

const LAUNCH_DATE = new Date(Date.UTC(2025, 6, 4, 4, 0, 0)); // July 4, 2025, 12:00 AM EDT (UTC-4)

// Slogans for animation
const slogans = [
  'A movement to rescue authenticity.',
  'When the art is worth more than bots.',
];

function getTimeLeft() {
  const now = new Date();
  const diff = Math.max(0, LAUNCH_DATE.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export default function Home() {
  const { isNewUser, isLoading, connected, publicKey, setIsNewUser } = useAuth();
  const [streamMode, setStreamMode] = useState<'tv' | 'radio'>('tv');
  const [user, setUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  // Slogan animation state
  const [sloganIndex, setSloganIndex] = useState(0);
  const [showSlogan, setShowSlogan] = useState(false);
  const [showFinalSlogan, setShowFinalSlogan] = useState(false);
  const [showFinalSloganFadeOut, setShowFinalSloganFadeOut] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      // Start transition fadeout
      setIsTransitioning(true);
      // Wait for fadeout to complete before fetching user
      setTimeout(() => {
        fetchUser();
        // Reset transition state after user is fetched
        setIsTransitioning(false);
      }, 1000); // 1 second fadeout
    }
  }, [connected, publicKey]);

  // Show onboarding for first-time users
  useEffect(() => {
    if (user && !localStorage.getItem('hasSeenOnboarding')) {
      setShowOnboarding(true);
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Slogan animation sequence
  useEffect(() => {
    if (!connected || !publicKey) {
      setTimeout(() => setShowSlogan(true), 2000); // First slogan in after 2s
      setTimeout(() => setShowSlogan(false), 6000); // First slogan out after 6s (3s display time)
      setTimeout(() => {
        setSloganIndex(1);
        setShowSlogan(true);
      }, 9000); // Second slogan in after 9s (3s gap)
      setTimeout(() => setShowSlogan(false), 13000); // Second slogan out after 13s (4s display time)
      setTimeout(() => setShowFinalSlogan(true), 14000); // Final slogan in after 14s (1s gap)
      setTimeout(() => setShowFinalSloganFadeOut(true), 18000); // Final slogan fade out after 18s (4s display time)
      setTimeout(() => setShowFinalSlogan(false), 19000); // Final slogan hidden after 19s (1s fade out)
    }
  }, [connected, publicKey]);

  const handleRegistrationComplete = () => setIsNewUser(false);

  const fetchUser = async () => {
    if (!publicKey) return;
    try {
      const response = await fetch(api.users.get(publicKey.toBase58()));
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const handleUserClick = async (walletAddress: string) => {
    if (!walletAddress) {
      setViewingUser(null);
      return;
    }
    try {
      const response = await fetch(api.users.get(walletAddress));
      if (response.ok) {
        const userData = await response.json();
        console.log('User data received in handleUserClick:', userData);
        console.log('User ID from API:', userData.id, 'type:', typeof userData.id);
        console.log('User walletAddress from API:', userData.walletAddress);
        setViewingUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleCloseProfile = () => {
    setViewingUser(null);
  };

  const handleJoinRevolution = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const handleFollowToggle = async (userId: string) => {
    if (!user?.walletAddress) return;
    try {
      const response = await fetch(api.users.follow(userId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: user.walletAddress }),
      });
      if (response.ok) {
        // Refresh the current user's data to update following status
        await fetchUser();
        // Refresh the viewed user's data if we're viewing their profile
        if (viewingUser?.id === userId) {
          await handleUserClick(viewingUser.walletAddress);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  if (isLoading || isTransitioning) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <main className="frontpage-bg min-h-screen bg-black font-bank-gothic relative w-full">
      {/* Watermark Overlay */}
      <div className="watermark-overlay">
        <div className="watermark-text">STREAM KINGS</div>
        <div className="watermark-text">STREAM KINGS</div>
        <div className="watermark-text">STREAM KINGS</div>
        <div className="watermark-text">STREAM KINGS</div>
      </div>
      {/* Video Background - Only for Title Screen */}
      {(!connected || !publicKey) ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="fixed inset-2 w-[calc(100%-1rem)] h-[calc(100%-1rem)] object-cover z-0 pointer-events-none border border-white/10"
          style={{ filter: 'grayscale(1)', opacity: 0.6 }}
        >
          <source src="/compressed-bg.mp4" type="video/mp4" />
        </video>
      ) : null}
      {!connected || !publicKey ? (
        <div className="flex flex-col items-center justify-center min-h-screen w-full px-2 py-4 relative z-10">
          {/* TITLE - At the top with fade in */}
          <div className="relative w-full flex justify-center mb-2">
            <h1
              className={`text-[clamp(2.5rem,8vw,5rem)] font-bold tracking-widest text-center text-white z-10 title-entrance transition-opacity duration-2000 ${
                !showFinalSlogan && showFinalSloganFadeOut ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                textShadow: `
                  0 0 16px #ff3c3c,
                  0 0 32px #ff3c3c,
                  2px 2px 4px rgba(255, 255, 255, 0.3),
                  4px 4px 8px rgba(255, 60, 60, 0.5)
                `,
                letterSpacing: '0.22em',
                transform: !showFinalSlogan && showFinalSloganFadeOut ? 'translateY(0) scale(1)' : 'translateY(-50px) scale(0.8)',
                filter: !showFinalSlogan && showFinalSloganFadeOut ? 'blur(0)' : 'blur(10px)',
                transition: 'opacity 2s ease-out, transform 2s ease-out, filter 2s ease-out'
              }}
            >
              STREAM KINGS
            </h1>
            {/* Subtitle */}
            <div
              className={`absolute top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 pointer-events-none transition-opacity duration-2000 ${
                !showFinalSlogan && showFinalSloganFadeOut ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                letterSpacing: '0.1em',
                transform: !showFinalSlogan && showFinalSloganFadeOut ? 'translateX(-50%) translateY(0) scale(1)' : 'translateX(-50%) translateY(-50px) scale(0.8)',
                filter: !showFinalSlogan && showFinalSloganFadeOut ? 'blur(0)' : 'blur(10px)',
                transition: 'opacity 2s ease-out, transform 2s ease-out, filter 2s ease-out'
              }}
            >
              <span className="text-xs sm:text-sm text-gray-400 font-mono">
                devnet beta
              </span>
            </div>
            {/* Strong red flash from center */}
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-2000 ${
                !showFinalSlogan && showFinalSloganFadeOut ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                width: '90%',
                height: '120%',
                zIndex: 0,
                filter: 'blur(40px)',
                background: 'radial-gradient(circle at center, #ff3c3c 0%, #ff3c3c77 30%, transparent 70%)',
                opacity: !showFinalSlogan && showFinalSloganFadeOut ? 0.85 : 0
              }}
            />
          </div>

          {/* COUNTDOWN TIMER - Four corners */}
          <div className="fixed inset-0 pointer-events-none z-20">
            {/* Top Left */}
            <div className="absolute top-4 left-4">
              <div className="flex flex-col items-center">
                <span className="text-4xl sm:text-6xl font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="text-xs sm:text-sm text-[#ff3c3c] tracking-widest mt-1" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>
                  DAY
                </span>
              </div>
            </div>
            
            {/* Top Right */}
            <div className="absolute top-4 right-4">
              <div className="flex flex-col items-center">
                <span className="text-4xl sm:text-6xl font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-xs sm:text-sm text-[#ff3c3c] tracking-widest mt-1" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>
                  HOUR
                </span>
              </div>
            </div>
            
            {/* Bottom Left */}
            <div className="absolute bottom-4 left-4">
              <div className="flex flex-col items-center">
                <span className="text-4xl sm:text-6xl font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-xs sm:text-sm text-[#ff3c3c] tracking-widest mt-1" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>
                  MINUTE
                </span>
              </div>
            </div>
            
            {/* Bottom Right */}
            <div className="absolute bottom-4 right-4">
              <div className="flex flex-col items-center">
                <span className="text-4xl sm:text-6xl font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-xs sm:text-sm text-[#ff3c3c] tracking-widest mt-1" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)' }}>
                  SECOND
                </span>
              </div>
            </div>
          </div>

          {/* SLOGANS - Always in position with fade transitions */}
          <div className="w-full max-w-2xl mt-1 min-h-[2rem]">
            {/* Animated slogans */}
            <div
              className={`text-white text-base sm:text-lg font-light transition-opacity duration-1000 ${
                showSlogan ? 'opacity-100' : 'opacity-0'
              } ${sloganIndex === 0 ? 'text-left' : 'text-right'}`}
              style={{ 
                minHeight: '2.5rem',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(255, 255, 255, 0.3)'
              }}
            >
              {slogans[sloganIndex]}
            </div>
            {/* Final slogan */}
            <div
              className={`text-center text-white text-xl sm:text-2xl font-bold mt-2 transition-opacity duration-1000 ${
                showFinalSlogan ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(255, 255, 255, 0.3)'
              }}
            >
              A community driven platfrom to rescue music from bad actors and algorithms...
            </div>
          </div>

          {/* CTA - Appears when final slogan fades out */}
          <div className={`flex flex-col items-center mt-4 transition-opacity duration-1000 ${
            !showFinalSlogan && showFinalSloganFadeOut ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="text-[#ffefb0] text-base sm:text-lg font-bold mb-1 tracking-widest drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(255, 239, 176, 0.5)' }}>
              JOIN THE REVOLUTION.
            </div>
            <WalletButton />
          </div>
        </div>
      ) : isNewUser ? (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24 max-w-full overflow-hidden">
          <UserRegistrationForm onComplete={handleRegistrationComplete} />
        </div>
      ) : (
        <>
          <TopBar streamMode={streamMode} setStreamMode={setStreamMode} />
          <ScrollingBanner items={[
            'NO MORE BOTS. NO MORE FAKE HYPE.',
            'GET YOUR STREET KRED UP. IT PAYS TO BE AUTHENTIC.',
            'THE MEDIA IS MIND CONTROL. STREAM REALITY.',
            'STREET KREDIT. REAL POWER.',
            'AUTHENTICITY WINS.'
          ]} />
          <div className="w-full bg-zinc-900">
            <div className="aspect-video w-full max-w-full">
              {streamMode === 'tv' ? user && <SongStream user={user} /> : <RadioStation />}
            </div>
          </div>
          <div className="w-full">
            <BlogSection
              user={user}
              viewingUser={viewingUser}
              onUserClick={handleUserClick}
              onFollowToggle={handleFollowToggle}
              onUserUpdate={handleUserUpdate}
              onCloseProfile={handleCloseProfile}
            />
          </div>
        </>
      )}

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onJoin={handleJoinRevolution}
      />
    </main>
  );
}
