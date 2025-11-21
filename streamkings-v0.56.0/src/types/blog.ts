export interface BlogAuthor {
  id: string;
  username: string;
  profilePic: string;
  walletAddress: string;
  isFollowed: boolean;
}

export interface SavedBlogReference {
  id: string;
  userId: string;
  blogId: string;
  createdAt: string;
  blog: BlogData;
}

export interface BlogData {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: BlogAuthor;
  _count?: {
    comments: number;
    savedBy: number;
  };
  isSaved?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    profilePic: string;
  };
}

export type BlogView = 'following' | 'newest'; 