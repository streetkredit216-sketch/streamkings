import { useState, useEffect } from 'react';
import BlogArticle from './BlogArticle';
import PhotoGrid from '../PhotoGrid';
import { SavedBlogReference, BlogData } from '@/types/blog';
import { User } from '@/types/user';
import { Comment } from '@/types/comment';
import { api } from '@/lib/api';

type SupportTab = 'blogs' | 'photos' | 'comments';

interface SupportSectionProps {
  savedBlogs: SavedBlogReference[];
  savedPhotos: any[]; // Update this type based on your photo type
  savedComments: any[]; // Saved comment references
  onUnsaveItem: (type: 'blog' | 'photo' | 'comment', id: string) => Promise<void>;
  onUserClick: (walletAddress: string) => void;
  setSelectedBlog: (blog: BlogData | null) => void;
  user: User | null;
  onFollowToggle: (userId: string) => Promise<void>;
  onBlogUpdate?: () => void;
}

export default function SupportSection({
  savedBlogs,
  savedPhotos,
  savedComments,
  onUnsaveItem,
  onUserClick,
  setSelectedBlog,
  user,
  onFollowToggle,
  onBlogUpdate
}: SupportSectionProps) {
  const [activeTab, setActiveTab] = useState<SupportTab>('blogs');

  return (
    <div>
      {/* Sub-tabs for different types of saved content */}
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={() => setActiveTab('blogs')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'blogs'
              ? 'bg-white/10 text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Saved Blogs
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'comments'
              ? 'bg-white/10 text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Saved Comments
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'photos'
              ? 'bg-white/10 text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Saved Photos
        </button>
      </div>

      {/* Content area */}
      <div>
        {activeTab === 'blogs' && (
          <div className="grid grid-cols-1 gap-6">
            {!savedBlogs || savedBlogs.length === 0 ? (
              <p className="text-center text-white/60">No saved blogs yet</p>
            ) : (
              savedBlogs.map((savedBlog) => (
                <BlogArticle
                  key={savedBlog.id}
                  blog={savedBlog.blog}
                  setSelectedBlog={setSelectedBlog}
                  user={user}
                  onFollowToggle={onFollowToggle}
                  onUnsave={() => onUnsaveItem('blog', savedBlog.id)}
                  showUnsaveButton
                  onBlogUpdate={onBlogUpdate}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            {!savedComments || savedComments.length === 0 ? (
              <p className="text-center text-white/60">No saved comments yet</p>
            ) : (
              savedComments.map((savedComment) => (
                <div key={savedComment.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <img
                      src={savedComment.comment.author.profilePic}
                      alt={savedComment.comment.author.username}
                      className="w-10 h-10 rounded-full cursor-pointer"
                      onClick={() => onUserClick(savedComment.comment.author.walletAddress)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 
                            className="font-semibold text-white cursor-pointer hover:text-white/80"
                            onClick={() => onUserClick(savedComment.comment.author.walletAddress)}
                          >
                            {savedComment.comment.author.username}
                          </h4>
                        </div>
                        <button
                          onClick={() => onUnsaveItem('comment', savedComment.id)}
                          className="text-white/60 hover:text-white/80 text-sm"
                        >
                          Unsave
                        </button>
                      </div>
                      <p className="text-white/90 mt-2">{savedComment.comment.content}</p>
                      <div className="text-white/60 text-sm mt-2">
                        Comment on: {savedComment.comment.blog?.title || 'Unknown blog'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div>
            {savedPhotos.length === 0 ? (
              <p className="text-center text-white/60">No saved photos yet</p>
            ) : (
              <PhotoGrid
                initialPhotos={savedPhotos.map(sp => sp.photo)}
                onUserClick={onUserClick}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
} 