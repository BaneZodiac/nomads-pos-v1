import { Request } from 'express';

export const qs = (req: Request, key: string, defaultValue: string = ''): string => {
  const val = req.query[key];
  if (Array.isArray(val)) return String(val[0] || defaultValue);
  return String(val || defaultValue);
};

export const qsn = (req: Request, key: string): string | undefined => {
  const val = req.query[key];
  if (Array.isArray(val)) return val[0] ? String(val[0]) : undefined;
  return val ? String(val) : undefined;
};
