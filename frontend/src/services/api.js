import axios from 'axios';
import { authStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Token & Workspace ID
api.interceptors.request.use((config) => {
  const state = authStore.getState();
  if (state.token) {
    config.headers.Authorization = `Bearer ${state.token}`;
  }
  if (state.activeWorkspace?.id) {
    config.headers['x-workspace-id'] = state.activeWorkspace.id;
  }
  return config;
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.error?.message || error.message || 'An unexpected error occurred',
      statusCode: error.response?.status || 500,
      code: error.response?.data?.error?.code || 'NETWORK_ERROR',
      details: error.response?.data?.error?.details || null,
    };
    return Promise.reject(customError);
  }
);

export const checkHealth = () => api.get('/health');
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMyProfile = () => api.get('/auth/me');
export const getWorkspaces = () => api.get('/workspaces');
export const createWorkspace = (data) => api.post('/workspaces', data);

export default api;
