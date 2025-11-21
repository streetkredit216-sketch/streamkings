export interface Song {
  id: string;
  title: string;
  artist: string; // Wallet address of the artist
  genre: string;
  audioUrl?: string;
  coverImage?: string;
  videoUrl?: string;
  createdAt: string; // DateTime in Prisma is usually serialized as a string
  updatedAt: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    profilePic?: string;
    walletAddress: string; // Add wallet address to author object
  };
  isLiked?: boolean;
}
  