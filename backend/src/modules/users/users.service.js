import bcrypt from 'bcryptjs';
import { usersRepository } from './users.repository.js';
import { authRepository } from '../auth/auth.repository.js';
import { ApiError } from '../../utils/apiError.js';

export class UsersService {
  async getProfile(userId) {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found');
    }
    return user;
  }

  async updateProfile(userId, { name }) {
    if (!name || name.trim().length < 2) {
      throw ApiError.badRequest('Name must be at least 2 characters long');
    }
    return await usersRepository.updateProfile(userId, { name: name.trim() });
  }

  async changePassword(userId, { oldPassword, newPassword }) {
    if (!oldPassword || !newPassword || newPassword.length < 8) {
      throw ApiError.badRequest('New password must be at least 8 characters long');
    }

    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('User account not found');
    }

    const fullUser = await authRepository.findUserByEmail(user.email);
    const isValid = await bcrypt.compare(oldPassword, fullUser.password_hash);
    if (!isValid) {
      throw ApiError.unauthorized('Current password is incorrect', 'INVALID_OLD_PASSWORD');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await usersRepository.updatePasswordHash(userId, newHash);
    return { success: true, message: 'Password updated successfully' };
  }
}

export const usersService = new UsersService();
