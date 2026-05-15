import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/helpers';
import { JwtPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.isSuperAdmin) {
    res.status(403).json({ success: false, error: 'Super Admin access required' });
    return;
  }
  next();
};

export const requireTenantAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.tenantId) {
    res.status(403).json({ success: false, error: 'Tenant access required' });
    return;
  }
  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user?.roleSlug && !req.user?.isSuperAdmin) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }
    if (req.user?.isSuperAdmin || roles.includes(req.user?.roleSlug || '')) {
      next();
    } else {
      res.status(403).json({ success: false, error: `Required role: ${roles.join(', ')}` });
    }
  };
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};
