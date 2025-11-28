/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

export abstract class APIService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:40301";
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private isRetrying = false;

  private setupInterceptors() {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          const originalRequest = error.config;

          // Retry once before redirecting (in case cookies are settling from auth redirect)
          if (!this.isRetrying && !originalRequest._retry) {
            this.isRetrying = true;
            originalRequest._retry = true;

            console.log("[API] 401 detected, retrying in 1s to allow cookies to settle...");

            // Wait for cookies to settle
            await new Promise((resolve) => setTimeout(resolve, 1000));

            try {
              // Retry the request
              const result = await this.axiosInstance.request(originalRequest);
              console.log("[API] Retry successful!");
              this.isRetrying = false;
              return result;
            } catch (retryError: any) {
              this.isRetrying = false;

              // Still 401 after retry, redirect to login
              if (retryError.response?.status === 401) {
                console.log("[API] Still 401 after retry, redirecting to login...");
                const currentPath = window.location.pathname + window.location.search;
                const authWebUrl = process.env.NEXT_PUBLIC_AUTH_WEB_URL || "http://localhost:3000";
                window.location.href = `${authWebUrl}/login?redirect=${encodeURIComponent(currentPath)}&from=pm`;
              }

              return Promise.reject(retryError);
            }
          }

          // Already retried, redirect to login
          if (!this.isRetrying) {
            const currentPath = window.location.pathname + window.location.search;
            const authWebUrl = process.env.NEXT_PUBLIC_AUTH_WEB_URL || "http://localhost:3000";
            window.location.href = `${authWebUrl}/login?redirect=${encodeURIComponent(currentPath)}&from=pm`;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get(url: string, params = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.get(url, {
      ...params,
      ...config,
    });
  }

  post(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.post(url, data, config);
  }

  put(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.put(url, data, config);
  }

  patch(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.patch(url, data, config);
  }

  delete(url: string, data?: any, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.delete(url, { data, ...config });
  }

  request(config = {}) {
    return this.axiosInstance(config);
  }
}
