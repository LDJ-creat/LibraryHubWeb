import { create } from 'zustand';
import { UserProfile } from '@/types/auth'; // 确保路径正确

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  csrfToken: string | null;
  setUser: (user: UserProfile | null) => void;
  setCsrfToken: (token: string | null) => void;
  clearAuth: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  csrfToken: null,
  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    },
  setCsrfToken: (token) =>{
    set({ csrfToken: token });
    },
    clearAuth: () => {
    set({ user: null, isAuthenticated: false, csrfToken: null });
    // 注意：这里不需要清除 HttpOnly cookies，它们由浏览器管理或后端在注销时清除
  },
}));

export default useAuthStore;
