export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER';
  avatarUrl?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string; 
}

export interface RegisterCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}