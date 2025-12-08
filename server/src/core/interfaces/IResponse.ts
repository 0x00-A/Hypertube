// 1. Generic Response Wrapper
export interface IResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
