export enum UserRole {
  TASTEMAKER = 'TASTEMAKER',
  DJ = 'DJ', // This will be displayed as "DJ/Streamer" in the UI
  ARTIST = 'ARTIST'
}

export interface User {
  id: string;
  walletAddress: string;
  username: string;
  email: string;
  profilePic?: string;
  profileBanner?: string;
  role: UserRole;
  description: string;
  streetCredit: number;
  ranking: number;
  createdAt: Date;
  updatedAt: Date;
} 