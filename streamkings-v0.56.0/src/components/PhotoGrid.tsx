'use client';

import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { api } from '@/lib/api';

interface Photo {
  id: string;
  imageUrl: string;
  description: string;
  createdAt: string;
  author: {
    username: string;
    profilePic: string;
    walletAddress: string;
  };
  _count?: {
    comments: number;
    savedBy: number;
  };
}

interface PhotoGridProps {
  initialPhotos: Photo[];
  onUserClick: (walletAddress: string) => void;
}

export default function PhotoGrid({ initialPhotos, onUserClick }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchPhotos = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (userId) {
        params.append('userId', userId);
      }
      
      const response = await fetch(`${api.photos.list}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch photos');
      const data = await response.json();
      setPhotos(data);
    } catch (error) {
      console.error('Error fetching photos:', error);
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const response = await fetch(`${api.photos.delete(photoId)}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete photo');
      await fetchPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo');
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => setSelectedPhoto(photo)}
          >
            <Image
              src={photo.imageUrl}
              alt={photo.description || 'Photo'}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center space-x-2">
                  <img
                    src={photo.author.profilePic}
                    alt={photo.author.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-white text-sm font-medium">{photo.author.username}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
          <div className="min-h-screen">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="fixed top-6 right-6 z-[51] p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close photo view"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="max-w-5xl mx-auto px-4 py-16">
              <div className="bg-zinc-900 rounded-lg overflow-hidden">
                <div className="relative aspect-video">
                  <Image
                    src={selectedPhoto.imageUrl}
                    alt={selectedPhoto.description || 'Photo'}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUserClick(selectedPhoto.author.walletAddress);
                      }}
                      className="flex items-center space-x-3"
                    >
                      <img
                        src={selectedPhoto.author.profilePic}
                        alt={selectedPhoto.author.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-white">{selectedPhoto.author.username}</div>
                        <div className="text-sm text-white/60">
                          {format(new Date(selectedPhoto.createdAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </button>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white">
                      Save Photo
                    </button>
                  </div>
                  {selectedPhoto.description && (
                    <p className="text-white/90 whitespace-pre-wrap">{selectedPhoto.description}</p>
                  )}
                  <div className="mt-4 flex items-center space-x-4 text-white/60 text-sm">
                    <span>{selectedPhoto._count?.comments || 0} comments</span>
                    <span>·</span>
                    <span>{selectedPhoto._count?.savedBy || 0} saves</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 