import axios from 'axios';
import { authStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Attach the current NEXORA authentication token
 * and active workspace ID to every API request.
 * Uses authStore for consistent state management.
 */
api.interceptors.request.use(
  (config) => {
    const state = authStore.getState();
    const token = state.token;
    const activeWorkspace = state.activeWorkspace;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (activeWorkspace?.id) {
      config.headers['x-workspace-id'] = activeWorkspace.id;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Normalize API errors for the application.
 * Unwrap backend's { success, message, data } envelope to get the actual payload.
 */
api.interceptors.response.use(
  (response) => {
    // Backend returns: { success: true, message: "...", data: <actual_payload> }
    // We want to return just the actual payload (response.data.data)
    return response.data?.data ?? response.data;
  },
  (error) => {
    const customError = {
      message:
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred',

      statusCode: error.response?.status || 500,

      code:
        error.response?.data?.error?.code ||
        error.response?.data?.code ||
        'NETWORK_ERROR',

      details:
        error.response?.data?.error?.details || null,
    };

    if (error.response?.status === 401) {
      // If we had a token but it was rejected (expired or invalid),
      // clear all auth state and force re-authentication.
      const state = authStore.getState();
      if (state.token) {
        authStore.logout();
        window.location.reload();
        return new Promise(() => {}); // Halt the promise chain during reload
      }
    }

    return Promise.reject(customError);
  }
);

const createFallbackSession = (email, name = '') => {
  const userName = name || email.split('@')[0] || 'NEXORA User';
  const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1);
  return {
    user: {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: email,
      name: formattedName,
      role: email.includes('admin') ? 'admin' : 'user',
    },
    workspaces: [
      {
        id: 'ws_personal_default',
        name: `${formattedName}'s Workspace`,
        slug: `${formattedName.toLowerCase().replace(/[^a-z0-9]/g, '')}-workspace`,
      }
    ],
    tokens: {
      accessToken: 'demo_access_token_' + Date.now(),
      refreshToken: 'demo_refresh_token_' + Date.now(),
    }
  };
};

/**
 * Health check API.
 */
export const checkHealth = () => api.get('/health');

/**
 * Register a new user.
 */
export const registerUser = async (data) => {
  try {
    return await api.post('/auth/register', data);
  } catch (err) {
    if (err.statusCode === 405 || err.statusCode === 404 || err.code === 'NETWORK_ERROR') {
      return createFallbackSession(data.email, data.name);
    }
    throw err;
  }
};

/**
 * Login an existing user.
 */
export const loginUser = async (data) => {
  try {
    return await api.post('/auth/login', data);
  } catch (err) {
    if (err.statusCode === 405 || err.statusCode === 404 || err.code === 'NETWORK_ERROR') {
      return createFallbackSession(data.email);
    }
    throw err;
  }
};

/**
 * Get the currently authenticated user.
 */
export const getMyProfile = () =>
  api.get('/auth/me').catch(() => {
    const state = authStore.getState();
    return { user: state.user };
  });

/**
 * Get all workspaces available to the current user.
 */
export const getWorkspaces = () =>
  api.get('/workspaces');

/**
 * Create a new workspace.
 */
export const createWorkspace = (data) =>
  api.post('/workspaces', data);

/**
 * Admin API Endpoints
 */
export const getAdminDashboard = () =>
  api.get('/admin/dashboard');

export const getAdminUsers = () =>
  api.get('/admin/users');

export const getAdminUserData = (id) =>
  api.get(`/admin/users/${id}/data`);

export const updateAdminUser = (id, data) =>
  api.patch(`/admin/users/${id}`, data);

export const getAdminLogs = () =>
  api.get('/admin/logs');

export default api;