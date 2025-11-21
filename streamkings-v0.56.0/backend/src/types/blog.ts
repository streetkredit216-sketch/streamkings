import { User } from './user';

export interface Blog {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author: User;
  _count?: {
    comments: number;
    savedBy: number;
  };
}

export interface BlogWithAuthor extends Blog {
  author: User & {
    isFollowed?: boolean;
  };
} 