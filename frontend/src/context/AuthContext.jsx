import React, { createContext, useContext, useEffect, useState } from 'react';
import { authStore } from '../store/authStore';
import { getMyProfile } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize from authStore
    const state = authStore.getState();
    if (state.isAuthenticated) {
      setUser(state.user);
    }
    setIsInitialized(true);
    setIsLoading(false);

    // Subscribe to authStore changes
    const unsubscribe = authStore.subscribe((newState) => {
      setUser(newState.user);
    });

    return unsubscribe;
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const response = await authStore.login(credentials);
      setUser(response.user);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data) => {
    setIsLoading(true);
    try {
      const response = await authStore.register(data);
      setUser(response.user);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authStore.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    if (!authStore.getState().token) return;
    try {
      const response = await getMyProfile();
      authStore.setAuthData(response.user, authStore.getState().tokens, authStore.getState().workspaces);
    } catch (error) {
      // Token might be expired, authStore interceptor will handle 401
      console.error('Failed to refresh user:', error);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading || !isInitialized,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}