import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { config } from './config';
import { errorHandler } from './middleware/auth';
import { runSeed } from './seed';

const prisma = new PrismaClient();

import authRoutes from './routes/auth';
import tenantRoutes from './routes/tenants';
import subscriptionRoutes from './routes/subscriptions';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import customerRoutes from './routes/customers';
import supplierRoutes from './routes/suppliers';
import saleRoutes from './routes/sales';
import reportRoutes from './routes/reports';
import settingsRoutes from './routes/settings';

async function setupDatabase() {
  try {
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    await runSeed();
  } catch (err) {
    console.warn('DB setup warning (non-fatal):', (err as Error).message);
  }
}

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Nomads POS API is running', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

setupDatabase().then(() => {
  app.listen(config.port, () => {
    console.log(`Nomads POS API running on port ${config.port}`);
  });
}).catch((err) => {
  console.error('Failed to setup database:', err);
  process.exit(1);
});

export default app;
