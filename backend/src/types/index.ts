export interface JwtPayload {
  id: string;
  email: string;
  tenantId?: string;
  isSuperAdmin: boolean;
  roleId?: string;
  roleSlug?: string;
  locationId?: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
