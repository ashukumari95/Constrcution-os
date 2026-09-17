import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  organizationName: string;
  role: string;
  permissions: string[];
  subscriptionStatus?: string;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('constructionos_token'),
  isAuthenticated: !!localStorage.getItem('constructionos_token'),
  setAuth: (user, token) => {
    localStorage.setItem('constructionos_token', token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('constructionos_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  hasPermission: (permission: string) => {
    const user = get().user;
    if (!user) return false;
    return user.permissions.includes('all') || user.permissions.includes(permission);
  },
}));
