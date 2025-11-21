// src/hooks/useMusicData.ts
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Song } from '@/types/song';
import { Playlist } from '@/types/playlist';

export function useMusicData(userId: string | undefined) {
  const [uploads, setUploads] = useState<Song[]>([]);
  const [library, setLibrary] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  const fetchUploads = useCallback(async () => {
    if (!userId) return;
    setLoadingUploads(true);
    try {
      const res = await fetch(`${api.songs.list}?userId=${userId}`);
      const data = await res.json();
      setUploads(data);
    } catch {
      setUploads([]);
    } finally {
      setLoadingUploads(false);
    }
  }, [userId]);

  const fetchLibrary = useCallback(async () => {
    if (!userId) return;
    setLoadingLibrary(true);
    try {
      const res = await fetch(`${api.songs.library}?userId=${userId}`);
      const data = await res.json();
      setLibrary(data);
    } catch {
      setLibrary([]);
    } finally {
      setLoadingLibrary(false);
    }
  }, [userId]);

  const fetchPlaylists = useCallback(async () => {
    if (!userId) return;
    setLoadingPlaylists(true);
    try {
      const res = await fetch(api.playlists.getUserPlaylists(userId));
      const data = await res.json();
      setPlaylists(data);
    } catch {
      setPlaylists([]);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchUploads();
    fetchLibrary();
    fetchPlaylists();
  }, [fetchUploads, fetchLibrary, fetchPlaylists]);

  return {
    uploads, loadingUploads, fetchUploads,
    library, loadingLibrary, fetchLibrary,
    playlists, loadingPlaylists, fetchPlaylists,
  };
}