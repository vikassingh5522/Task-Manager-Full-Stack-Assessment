import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '../types/auth.types';
import { authService } from '../services/authService';
import { UpdateProfileData } from '../types/user.types';
import { showSuccess, showError } from '../utils/toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (data: UpdateProfileData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to fetch user', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { user, token } = await authService.login(credentials);
      localStorage.setItem('token', token);
      setUser(user);
      showSuccess(`Welcome back, ${user.firstName}!`);
    } catch (error: any) {
      showError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    try {
      const { user, token } = await authService.register(credentials);
      localStorage.setItem('token', token);
      setUser(user);
      showSuccess('Account created successfully!');
    } catch (error: any) {
      showError(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout().catch(console.error); // Call API but don't block
    localStorage.removeItem('token');
    setUser(null);
    showSuccess('Logged out successfully');
  };

  const updateUser = async (data: UpdateProfileData) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      showSuccess('Profile updated successfully');
    } catch (error: any) {
      showError('Failed to update profile');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};