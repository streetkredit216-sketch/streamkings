const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const STREAM_SERVER_URL = process.env.NEXT_PUBLIC_STREAM_SERVER_URL || '';


export const api = {
  baseUrl: API_BASE_URL,
  
  songs: {
    upload: `/api/songs`,
    list: `/api/songs`,
    like: `/api/songs/like`,
    library: `/api/songs/library`,
    playlist: `/api/songs/playlist`,
  },
  
  users: {
    register: `/api/users/register`,
    get: (id: string) => `/api/users/${id}`,
    search: `/api/users/search`,
    updateProfilePic: (id: string) => `/api/users/${id}/profile-pic`,
    updateBanner: (id: string) => `/api/users/${id}/banner`,
    updateDescription: (walletAddress: string) => `/api/users/${walletAddress}/description`,
    follow: (userId: string) => `/api/users/follow/${userId}`,
    following: (userId: string) => `/api/users/following/${userId}`,
    updateStreetCredit: (walletAddress: string) => `/api/users/${walletAddress}/street-credit`,
    leaderboard: `/api/users/leaderboard`
  },
  
  blogs: {
    
    list: `/api/blogs`,
    create: `/api/blogs`,
    update: (id: string) => `/api/blogs/${id}`,
    delete: (id: string) => `/api/blogs/${id}`,
    saved: (userId: string) => `/api/blogs/saved/${userId}`,
    save: (id: string) => `/api/blogs/${id}/save`,
  },

  comments: {
    list: (blogId: string) => `/api/comments/blog/${blogId}`,
    create: `/api/comments`,
    update: (id: string) => `/api/comments/${id}`,
    delete: (id: string) => `/api/comments/${id}`,
    save: (id: string) => `/api/comments/${id}/save`,
    saved: (userId: string) => `/api/comments/saved/${userId}`,
  },
  
  photos: {
    upload: `/api/photos`,
    list: `/api/photos`,
    delete: (id: string) => `/api/photos/${id}`,
    saved: `/api/photos/saved`,
    save: (id: string) => `/api/photos/${id}/save`,
  },

  videos: {
    upload: `/api/videos`,
    list: `/api/videos`,
    random: `/api/videos/random`,
    delete: (id: string) => `/api/videos/${id}`,
  },

  playlists: {
    create: `/api/songs/playlist`, 
    list: `/api/songs/playlists`,
    addSong: `/api/songs/add`, 
    getUserPlaylists: (userId: string) => `/api/songs/playlists/user/${userId}`,
    getPlaylist: (playlistId: string) => `/api/songs/playlists/single/${playlistId}`,
  },

  radio: {
    fetchRandomVideo: `/api/radio/fetch-random-video`,
    getState: `/api/radio/state`,
  },
}; 