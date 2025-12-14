import { User } from './auth.types';

export interface UserProfile extends User {
  bio?: string;
  phoneNumber?: string;
  preferences?: {
    theme: 'light' | 'dark';
    emailNotifications: boolean;
  };
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  phoneNumber?: string;
}