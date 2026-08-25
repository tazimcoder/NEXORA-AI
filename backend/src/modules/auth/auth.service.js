import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { authRepository } from './auth.repository.js';
import { workspacesRepository } from '../workspaces/workspaces.repository.js';
import { ApiError } from '../../utils/apiError.js';
import { logger } from '../../utils/logger.js';

export class AuthService {
  generateTokens(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiration,
    });

    const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiration,
    });

    return { accessToken, refreshToken };
  }

  async register({ email, password, name }) {
    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      throw ApiError.badRequest('An account with this email address already exists', 'EMAIL_TAKEN');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await authRepository.createUser({ email, passwordHash, name });

    // Create a default Personal Workspace for the new user
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${user.id.slice(0, 6)}`;
    const workspace = await workspacesRepository.createWorkspace({
      name: `${name}'s Workspace`,
      slug,
      ownerId: user.id,
    });

    logger.info(`Registered new user: ${user.email} with personal workspace: ${workspace.name}`);

    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      workspace,
      tokens,
    };
  }

  async login({ email, password }) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password credentials');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden('Your user account has been deactivated');
    }

    const workspaces = await workspacesRepository.findWorkspacesByUserId(user.id);
    const tokens = this.generateTokens(user);

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      workspaces,
      tokens,
    };
  }

  async refreshTokens(refreshToken) {
    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret);
      if (decoded.type !== 'refresh') {
        throw ApiError.unauthorized('Invalid refresh token type');
      }

      const user = await authRepository.findUserById(decoded.sub);
      if (!user || user.status !== 'active') {
        throw ApiError.unauthorized('User associated with refresh token is invalid or inactive');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw ApiError.unauthorized('Refresh token is expired or invalid');
    }
  }

  async logout(userId) {
    logger.info(`User session terminated for user ID: ${userId}`);
    return { loggedOut: true };
  }

  async getCurrentUser(userId) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found');
    }
    const workspaces = await workspacesRepository.findWorkspacesByUserId(userId);
    return { user, workspaces };
  }
}

export const authService = new AuthService();
