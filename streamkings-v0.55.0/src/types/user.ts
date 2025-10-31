import { BlogData } from '@/types/blog';
import { Photo } from '@/types/photo';

export type ProfileTab = 'blogs' | 'events' | 'music' | 'photos' | 'support';

export interface User {
  id: string;
  walletAddress: string;
  username: string;
  profilePic?: string;
  profileBanner?: string;
  role: 'TASTEMAKER' | 'DJ' | 'ARTIST'; // DJ is displayed as "DJ/Streamer" in the UI
  description: string;
  streetCredit: number;
  ranking: number;
  email: string;
  savedBlogs?: SavedBlog[];
  savedPhotos?: SavedPhoto[];
}

interface SavedBlog {
  id: string;
  blog: BlogData;
  createdAt: Date;
}

interface SavedPhoto {
  id: string;
  photo: Photo;
  createdAt: Date;
}

// You can also add other user-related types here
export interface UserStats {
  followers: number;
  following: number;
  blogs: number;
  photos: number;
  songs: number;
} 