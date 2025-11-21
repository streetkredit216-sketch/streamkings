import { User } from './user';

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  blogId: string;
  author: User;
}

export interface CreateCommentData {
  content: string;
  authorId: string;
  blogId: string;
}

export interface UpdateCommentData {
  content: string;
  authorId: string;
} 