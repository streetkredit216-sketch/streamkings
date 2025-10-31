import { create } from 'zustand';

interface AuthState {
  user: any | null;
  setUser: (user: any | null) => void;
  isAuthenticated: boolean;
  login: (walletAddress: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  login: async (walletAddress) => {
    try {
      const response = await fetch(`/api/users/${walletAddress}`);
      if (response.ok) {
        const userData = await response.json();
        set({ user: userData, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Error logging in:', error);
      set({ user: null, isAuthenticated: false });
    }
  },
  logout: () => set({ user: null, isAuthenticated: false })
})); 