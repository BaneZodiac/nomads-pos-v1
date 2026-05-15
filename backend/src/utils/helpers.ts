import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: Record<string, any>): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as any);
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, config.jwtSecret);
};

export const generateInvoiceNo = (prefix: string = 'INV-'): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

export const generateSku = (name: string): string => {
  const prefix = name.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${random}`;
};

export const slugify = (text: string): string => {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

export const calculateTotals = (items: { quantity: number; unitPrice: number; discount?: number; tax?: number }[]) => {
  let subtotal = 0, discountTotal = 0, taxTotal = 0;
  for (const item of items) {
    const lineTotal = item.quantity * item.unitPrice;
    subtotal += lineTotal;
    discountTotal += (item.discount || 0);
    taxTotal += (item.tax || 0);
  }
  return { subtotal, discountTotal, taxTotal, grandTotal: subtotal + taxTotal - discountTotal };
};
