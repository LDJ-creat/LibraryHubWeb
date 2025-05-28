import { create } from 'zustand';
import { UserProfile } from '@/types/auth'; // 确保路径正确

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  clearAuth: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },
  clearAuth: () => {
    set({ user: null, isAuthenticated: false });
    // 注意：这里不需要清除 HttpOnly cookies，它们由浏览器管理或后端在注销时清除
  },
}));

export default useAuthStore;
