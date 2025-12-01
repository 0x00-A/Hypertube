export interface IPaginationOptions {
  page: number; // TODO: validate >=1
  limit: number; // TODO: max cap
}

export interface IPaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number; // TODO: compute via count
  totalPages?: number;
}
