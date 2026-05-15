import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  saltRounds: parseInt(process.env.SALT_ROUNDS || '10', 10),
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
};
