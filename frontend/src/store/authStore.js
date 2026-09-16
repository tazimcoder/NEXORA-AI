class AuthStore {
  constructor() {
    this.user = JSON.parse(localStorage.getItem('nexora_user') || 'null');
    this.token = localStorage.getItem('nexora_access_token') || null;
    this.refreshToken =
      localStorage.getItem('nexora_refresh_token') || null;
    this.workspaces = JSON.parse(
      localStorage.getItem('nexora_workspaces') || '[]'
    );
    this.activeWorkspace = JSON.parse(
      localStorage.getItem('nexora_active_workspace') || 'null'
    );
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
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
      refreshToken: this.refreshToken,
      workspaces: this.workspaces,
      activeWorkspace: this.activeWorkspace,
      isAuthenticated: Boolean(this.token && this.user),
    };
  }

  setAuthData(user, tokens, workspaces = []) {
    this.user = user;
    this.token = tokens?.accessToken || null;
    this.refreshToken = tokens?.refreshToken || null;
    this.workspaces = Array.isArray(workspaces) ? workspaces : [];

    if (this.workspaces.length > 0) {
      this.activeWorkspace = this.workspaces[0];

      localStorage.setItem(
        'nexora_active_workspace',
        JSON.stringify(this.activeWorkspace)
      );
    } else {
      this.activeWorkspace = null;
      localStorage.removeItem('nexora_active_workspace');
    }

    if (this.user) {
      localStorage.setItem(
        'nexora_user',
        JSON.stringify(this.user)
      );
    }

    if (this.token) {
      localStorage.setItem(
        'nexora_access_token',
        this.token
      );
    }

    if (this.refreshToken) {
      localStorage.setItem(
        'nexora_refresh_token',
        this.refreshToken
      );
    }

    localStorage.setItem(
      'nexora_workspaces',
      JSON.stringify(this.workspaces)
    );

    this.notify();
  }

  setActiveWorkspace(workspace) {
    this.activeWorkspace = workspace || null;

    if (workspace) {
      localStorage.setItem(
        'nexora_active_workspace',
        JSON.stringify(workspace)
      );
    } else {
      localStorage.removeItem('nexora_active_workspace');
    }

    this.notify();
  }

  async login(credentials) {
    const { loginUser } = await import('../services/api');
    const response = await loginUser(credentials);
    this.setAuthData(response.user, response.tokens, response.workspaces);
    return response;
  }

  async register(data) {
    const { registerUser } = await import('../services/api');
    const response = await registerUser(data);
    // Registration doesn't auto-login, user needs to sign in
    return response;
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