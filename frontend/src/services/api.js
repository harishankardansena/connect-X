import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
    : '/api',
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
};

// Users
export const userAPI = {
  search: (q) => api.get('/users/search', { params: { q } }),
  getById: (id) => api.get(`/users/${id}`),
  getByUsername: (username) => api.get(`/users/username/${username}`),
};

// Connections
export const connectionAPI = {
  sendRequest: (id) => api.post(`/connections/request/${id}`),
  acceptRequest: (id) => api.post(`/connections/accept/${id}`),
  rejectRequest: (id) => api.post(`/connections/reject/${id}`),
};

// Messages
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getConversation: (userId, page = 1) => api.get(`/messages/${userId}`, { params: { page } }),
  sendMessage: (data) => api.post('/messages/send', data),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  deleteChat: (userId) => api.delete(`/messages/chat/${userId}`),
};

// Media
export const mediaAPI = {
  upload: (formData, onProgress) =>
    api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    }),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  suspendUser: (id, reason) => api.patch(`/admin/users/${id}/suspend`, { reason }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getCallLogs: (params) => api.get('/admin/call-logs', { params }),
};

export default api;
