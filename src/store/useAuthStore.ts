import { create } from 'zustand';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  login: (token, user) => {
    localStorage.setItem('auth_token', token);
    set({ token, user, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ token: null, user: null, isLoading: false });
  },

  initAuth: async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        set({ token: null, user: null, isLoading: false });
        return;
      }

      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          set({ token, user: data.user, isLoading: false });
          return;
        }
      }

      // If token invalid
      localStorage.removeItem('auth_token');
      set({ token: null, user: null, isLoading: false });
    } catch {
      set({ token: null, user: null, isLoading: false });
    }
  },
}));
