import { useState } from 'react';

interface BlogEditorProps {
  onClose: () => void;
  onSubmit: (blog: { title: string; content: string }) => Promise<void>;
  initialBlog?: { title: string; content: string };
  isEditing?: boolean;
}

export default function BlogEditor({ onClose, onSubmit, initialBlog, isEditing }: BlogEditorProps) {
  const [blog, setBlog] = useState({ 
    title: initialBlog?.title || '', 
    content: initialBlog?.content || '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBlog({ ...blog, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blog.title.trim() || !blog.content.trim()) return alert('Please fill in both fields.');
    if (blog.content.length > 1000) return alert('Content exceeds 1000 characters.');

    setIsSubmitting(true);
    try {
      await onSubmit(blog);
      onClose();
    } catch (error) {
      console.error('Error submitting blog:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Blog' : 'New Blog'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          value={blog.title}
          onChange={handleChange}
          placeholder="Enter blog title..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
        />
        <textarea
          name="content"
          value={blog.content}
          onChange={handleChange}
          placeholder="Write your blog content..."
          maxLength={1000}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-40 resize-none text-black"
        />
        <div className="text-right text-sm text-gray-500">{blog.content.length}/1000</div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg text-white transition ${
              isSubmitting ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isEditing ? 'Save' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}
