import api from './api';
import { 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResponse, 
  User,
  ChangePasswordData
} from '../types/auth.types';
import { UpdateProfileData, UserProfile } from '../types/user.types';
import { ApiResponse } from '../types/api.types';

export const authService = {
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', credentials);
    return response.data.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const response = await api.put<ApiResponse<UserProfile>>('/users/profile', data);
    return response.data.data;
  },

  async changePassword(data: ChangePasswordData): Promise<void> {
    await api.put('/auth/change-password', data);
  }
};