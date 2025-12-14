import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '../types/api.types';

// Use environment variable or fallback for development
const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const apiError: ApiError = {
      message: error.message || 'An unexpected error occurred',
      status: error.response?.status || 500,
    };

    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as any;
      apiError.message = data.message || apiError.message;
      apiError.code = data.code;
      apiError.errors = data.errors;
    }

    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., clear token and redirect)
      localStorage.removeItem('token');
      // Ideally emit an event or use a callback to redirect to login
      // window.location.href = '/login'; // Avoiding direct window manipulation if possible
    }

    return Promise.reject(apiError);
  }
);

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error) && error.response) {
    return {
      message: error.response.data?.message || 'An error occurred',
      status: error.response.status,
      errors: error.response.data?.errors,
    };
  }
  return {
    message: (error as Error).message || 'An unexpected error occurred',
    status: 500,
  };
};

export default api;