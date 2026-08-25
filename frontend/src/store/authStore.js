import { checkHealth } from '../services/api';
import axios from 'axios';

// Lightweight Zustand-style state container for client-side Auth & Workspace management
class AuthStore {
  constructor() {
    this.user = JSON.parse(localStorage.getItem('nexora_user') || 'null');
    this.token = localStorage.getItem('nexora_access_token') || null;
    this.refreshToken = localStorage.getItem('nexora_refresh_token') || null;
    this.workspaces = JSON.parse(localStorage.getItem('nexora_workspaces') || '[]');
    this.activeWorkspace = JSON.parse(localStorage.getItem('nexora_active_workspace') || 'null');
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }

  getState() {
    return {
      user: this.user,
      token: this.token,
      workspaces: this.workspaces,
      activeWorkspace: this.activeWorkspace,
      isAuthenticated: Boolean(this.token && this.user),
    };
  }

  setAuthData(user, tokens, workspaces = []) {
    this.user = user;
    this.token = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.workspaces = workspaces;

    if (workspaces.length > 0) {
      this.activeWorkspace = workspaces[0];
      localStorage.setItem('nexora_active_workspace', JSON.stringify(workspaces[0]));
    }

    localStorage.setItem('nexora_user', JSON.stringify(user));
    localStorage.setItem('nexora_access_token', tokens.accessToken);
    localStorage.setItem('nexora_refresh_token', tokens.refreshToken);
    localStorage.setItem('nexora_workspaces', JSON.stringify(workspaces));

    this.notify();
  }

  setActiveWorkspace(workspace) {
    this.activeWorkspace = workspace;
    localStorage.setItem('nexora_active_workspace', JSON.stringify(workspace));
    this.notify();
  }

  logout() {
    this.user = null;
    this.token = null;
    this.refreshToken = null;
    this.workspaces = [];
    this.activeWorkspace = null;

    localStorage.removeItem('nexora_user');
    localStorage.removeItem('nexora_access_token');
    localStorage.removeItem('nexora_refresh_token');
    localStorage.removeItem('nexora_workspaces');
    localStorage.removeItem('nexora_active_workspace');

    this.notify();
  }
}

export const authStore = new AuthStore();
