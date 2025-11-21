import { BlogData } from '@/types/blog';
import { useWallet } from '@solana/wallet-adapter-react';
import { HiPencil } from 'react-icons/hi';
import { HiTrash } from 'react-icons/hi';

interface BlogActionsProps {
  blog: BlogData;
  onEdit: () => void;
  onDelete: () => void;
}

export default function BlogActions({ blog, onEdit, onDelete }: BlogActionsProps) {
  const { publicKey } = useWallet();
  const userWallet = publicKey?.toBase58();

  if (!userWallet || blog.author.walletAddress !== userWallet) return null;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this blog?')) {
      onDelete();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="p-2 hover:bg-white/10 rounded-full transition-colors"
        aria-label="Edit blog"
      >
        <HiPencil size={18} className="text-white" />
      </button>
      <button
        onClick={handleDelete}
        className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-500"
        aria-label="Delete blog"
      >
        <HiTrash size={18} />
      </button>
    </div>
  );
}
