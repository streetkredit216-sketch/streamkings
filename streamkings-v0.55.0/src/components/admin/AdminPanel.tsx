'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/user';

interface AdminUser extends User {
  _count: {
    blogs: number;
    songs: number;
    photos: number;
    followers: number;
  };
}

const AdminPanel = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // You'll need to set this admin key in your environment or get it from somewhere secure
    const key = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
    setAdminKey(key);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        headers: {
          'x-admin-key': adminKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'TASTEMAKER' | 'DJ' | 'ARTIST') => {
    try {
      setUpdating(userId);
      setError('');

      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }

      const result = await response.json();
      console.log('Role updated:', result);

      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ARTIST': return 'bg-purple-600';
      case 'DJ': return 'bg-blue-600';
      case 'TASTEMAKER': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  if (!adminKey) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-lg">
        <h2 className="text-xl font-bold text-red-400 mb-2">Admin Access Required</h2>
        <p className="text-red-300">Admin key not configured. Please set NEXT_PUBLIC_ADMIN_KEY in your environment.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-zinc-900 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
        >
          {loading ? 'Loading...' : 'Refresh Users'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-700">
              <th className="pb-3 text-zinc-300">User</th>
              <th className="pb-3 text-zinc-300">Role</th>
              <th className="pb-3 text-zinc-300">Street Credit</th>
              <th className="pb-3 text-zinc-300">Content</th>
              <th className="pb-3 text-zinc-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-zinc-800">
                <td className="py-4">
                  <div>
                    <div className="font-medium text-white">{user.username}</div>
                    <div className="text-sm text-zinc-400">{user.walletAddress.slice(0, 8)}...</div>
                  </div>
                </td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-4 text-white">{user.streetCredit.toLocaleString()}</td>
                <td className="py-4 text-zinc-300">
                  {user._count.blogs} blogs, {user._count.songs} songs, {user._count.photos} photos
                </td>
                <td className="py-4">
                  <div className="flex space-x-2">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                      disabled={updating === user.id}
                      className="px-2 py-1 bg-zinc-800 text-white rounded border border-zinc-600"
                    >
                      <option value="TASTEMAKER">Tastemaker</option>
                      <option value="DJ">DJ</option>
                      <option value="ARTIST">Artist</option>
                    </select>
                    {updating === user.id && (
                      <span className="text-zinc-400 text-sm">Updating...</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !loading && (
        <div className="text-center py-8 text-zinc-400">
          No users found
        </div>
      )}
    </div>
  );
};

export default AdminPanel;




