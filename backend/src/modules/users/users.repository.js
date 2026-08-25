import { getDbPool } from '../../config/db.config.js';

export class UsersRepository {
  async findById(id) {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT id, email, name, role, status, created_at, updated_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async updateProfile(id, { name }) {
    const pool = getDbPool();
    await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, id]);
    return this.findById(id);
  }

  async updatePasswordHash(id, passwordHash) {
    const pool = getDbPool();
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
    return true;
  }
}

export const usersRepository = new UsersRepository();
