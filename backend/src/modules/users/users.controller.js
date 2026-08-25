import { usersService } from './users.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class UsersController {
  async getProfile(req, res, next) {
    try {
      const user = await usersService.getProfile(req.user.id);
      return ApiResponse.success(res, user, 'User profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { name } = req.body;
      const updatedUser = await usersService.updateProfile(req.user.id, { name });
      return ApiResponse.success(res, updatedUser, 'User profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const result = await usersService.changePassword(req.user.id, { oldPassword, newPassword });
      return ApiResponse.success(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
