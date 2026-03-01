import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

// ============================================================================
// Error Response Interface
// ============================================================================

interface ErrorResponse {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

// Extend AxiosRequestConfig to track retry attempts
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// ============================================================================
// HTTP Client Class
// ============================================================================

class HttpClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: AxiosResponse) => void;
    reject: (error: ErrorResponse) => void;
    config: RetryableRequestConfig;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // Include cookies in requests
      timeout: 30000, // 30 seconds timeout
    });

    this.initializeInterceptors();
  }

  /**
   * Process queued requests after a successful token refresh
   */
  private processQueue(error: ErrorResponse | null): void {
    this.failedQueue.forEach(({ resolve, reject, config }) => {
      if (error) {
        reject(error);
      } else {
        this.client
          .request(config)
          .then(resolve)
          .catch((err: AxiosError<ErrorResponse>) => {
            reject(this.handleError(err));
          });
      }
    });
    this.failedQueue = [];
  }

  /**
   * Initialize request and response interceptors
   */
  private initializeInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      },
    );

    // Response interceptor with automatic token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ErrorResponse>) => {
        const originalRequest = error.config as
          | RetryableRequestConfig
          | undefined;

        // Only attempt refresh on 401, if we have a config, and haven't already retried
        const isRefreshRequest = originalRequest?.url?.includes(
          "/auth/refresh-token",
        );
        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry &&
          !isRefreshRequest
        ) {
          // If a refresh is already in progress, queue this request
          if (this.isRefreshing) {
            return new Promise<AxiosResponse>((resolve, reject) => {
              this.failedQueue.push({
                resolve,
                reject,
                config: originalRequest,
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Attempt to refresh the access token
            await this.client.post("/auth/refresh-token");

            // Refresh succeeded — retry queued requests and the original request
            this.processQueue(null);
            return this.client.request(originalRequest);
          } catch (refreshErr) {
            // Refresh failed — reject queued requests and dispatch unauthorized
            const refreshError = axios.isAxiosError<ErrorResponse>(refreshErr)
              ? this.handleError(refreshErr)
              : { message: "Token refresh failed" };
            this.processQueue(refreshError);

            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("auth:unauthorized"));
            }

            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Non-401 errors or refresh request itself failed
        if (error.response?.status === 401 && isRefreshRequest) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("auth:unauthorized"));
          }
        }

        return Promise.reject(this.handleError(error));
      },
    );
  }

  /**
   * Handle and format errors
   */
  private handleError(error: AxiosError<ErrorResponse>): ErrorResponse {
    if (error.response) {
      // Server responded with error
      return {
        message: error.response.data?.message || "An error occurred",
        statusCode: error.response.status,
        errors: error.response.data?.errors,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        message: "Network error. Please check your connection.",
        statusCode: 0,
      };
    } else {
      // Something else happened
      return {
        message: error.message || "An unexpected error occurred",
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(
      url,
      data,
      config,
    );
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(
      url,
      data,
      config,
    );
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  /**
   * Get the underlying axios instance for advanced usage
   */
  getClient(): AxiosInstance {
    return this.client;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const httpClient = new HttpClient();
