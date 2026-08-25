import { getDbPool } from '../../config/db.config.js';
import crypto from 'crypto';

export class AuthRepository {
  async findUserByEmail(email) {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    return rows[0] || null;
  }

  async findUserById(id) {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT id, email, name, role, status, created_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async createUser({ email, passwordHash, name, role = 'user' }) {
    const pool = getDbPool();
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO users (id, email, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, email.toLowerCase().trim(), passwordHash, name, role, 'active']
    );
    return this.findUserById(id);
  }
}

export const authRepository = new AuthRepository();
