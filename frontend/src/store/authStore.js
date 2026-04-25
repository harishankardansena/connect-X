import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token, isAuthenticated: true });
    return data;
  },

  register: async (userData) => {
    const { data } = await authAPI.register(userData);
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token, isAuthenticated: true });
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (profileData) => {
    const { data } = await authAPI.updateProfile(profileData);
    set({ user: data.user });
    return data;
  },

  sendConnectionRequest: async (targetId) => {
    const { connectionAPI } = await import('../services/api');
    const { data } = await connectionAPI.sendRequest(targetId);
    set({ user: data.user });
    return data;
  },

  acceptConnectionRequest: async (senderId) => {
    const { connectionAPI } = await import('../services/api');
    const { data } = await connectionAPI.acceptRequest(senderId);
    set({ user: data.user });
    return data;
  },

  rejectConnectionRequest: async (senderId) => {
    const { connectionAPI } = await import('../services/api');
    const { data } = await connectionAPI.rejectRequest(senderId);
    set({ user: data.user });
    return data;
  },
}));

export default useAuthStore;
