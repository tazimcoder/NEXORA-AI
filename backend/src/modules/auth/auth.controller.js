import { authService } from './auth.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register({ email, password, name });
      return ApiResponse.created(res, result, 'User registration successful');
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      return ApiResponse.success(res, result, 'Authentication successful');
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshTokens(refreshToken);
      return ApiResponse.success(res, tokens, 'Tokens refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const result = await authService.logout(req.user.id);
      return ApiResponse.success(res, result, 'User logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const profile = await authService.getCurrentUser(req.user.id);
      return ApiResponse.success(res, profile, 'User profile retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
