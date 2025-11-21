'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import { api } from '../lib/api';

interface RegistrationFormProps {
  onComplete: () => void;
}

export default function UserRegistrationForm({ onComplete }: RegistrationFormProps) {
  const { publicKey } = useWallet();
  const [formData, setFormData] = useState({
    username: '',
    profilePic: '',
    role: '',
    description: '',
    email: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData(prev => ({ ...prev, profilePic: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      if (!formData.username || !formData.role) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.username.length > 20) {
        throw new Error('Username must be 20 characters or less');
      }

      console.log('Submitting registration form...', {
        ...formData,
        walletAddress: publicKey.toBase58()
      });

      const response = await fetch(api.users.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          walletAddress: publicKey.toBase58(),
          profilePic: formData.profilePic || '/public/bodysillhouette.png'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      console.log('Registration successful:', data);
      
      // Verify the user was created before completing
      const verifyResponse = await fetch(api.users.get(publicKey.toBase58()));
      if (!verifyResponse.ok) {
        throw new Error('Failed to verify user creation');
      }

      onComplete();
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 p-4 sm:p-8 rounded-lg max-w-md w-full border border-zinc-800 max-h-screen overflow-y-auto">
        <h2 className="text-3xl font-bold mb-6 text-center text-white">Welcome to Stream King</h2>
        <p className="text-zinc-400 mb-8 text-center">Complete your profile to start exploring</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2 text-white">Username</label>
            <input
              id="username"
              type="text"
              required
              maxLength={20}
              placeholder="Choose your username (max 20 characters)"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            />
            <div className="text-xs text-zinc-500 mt-1">
              {formData.username.length}/20 characters
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Profile Picture</label>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="profile-pic"
                title="Choose profile picture"
              />
              <label
                htmlFor="profile-pic"
                className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white hover:bg-zinc-700 cursor-pointer transition-colors"
              >
                Choose File
              </label>
              {imagePreview ? (
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-700 mt-2 sm:mt-0">
                  <Image
                    src={imagePreview}
                    alt="Profile preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center mt-2 sm:mt-0">
                  <span className="text-zinc-500">No image</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2 text-white">What describes you best?</label>
            <select
              id="role"
              required
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              title="Select your role"
            >
              <option value="">Select your role</option>
              <option value="TASTEMAKER">Tastemaker - For the true music fans.</option>
              <option value="DJ" disabled className="opacity-50">DJ/Streamer - For curators who move the crowd and shape the sound.</option>
              <option value="ARTIST" disabled className="opacity-50">Artist - Musicians, Producers, Composers.</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2 text-white">Tell us about yourself</label>
            <textarea
              id="description"
              placeholder="Share your story..."
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 h-24"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-white">Email Address</label>
            <input
              id="email"
              type="email"
              required
              placeholder="Enter your email address"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
          >
            {isSubmitting ? 'Creating Profile...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
} 