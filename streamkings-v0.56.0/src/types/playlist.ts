import { Song } from './song';

export interface PlaylistSong {
  id: string;
  songId: string;
  song: Song;
}

export interface Playlist {
  id: string;
  name: string;
  authorId: string;
  songs: PlaylistSong[];
  createdAt: string;
  updatedAt: string;
} 