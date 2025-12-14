import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { User, Mail, Calendar, CheckCircle2, ListTodo, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCreatedTasks, useAssignedTasks } from '../hooks/useTasks';
import { UpdateProfileData } from '../types/user.types';
import { authService } from '../services/authService';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Status } from '../types/task.types';
import { showSuccess, showError } from '../utils/toast';

// Schema for Profile Update
const profileSchema = z.object({
  firstName: z.string().min(2, 'First name is too short').max(50, 'First name is too long'),
  lastName: z.string().min(2, 'Last name is too short').max(50, 'Last name is too long'),
  bio: z.string().optional(),
});

// Schema for Password Change
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/(?=.*[A-Z])/, 'One uppercase letter required')
    .regex(/(?=.*\d)/, 'One number required'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { tasks: createdTasks } = useCreatedTasks();
  const { tasks: assignedTasks } = useAssignedTasks();

  const completedTasks = assignedTasks.filter(t => t.status === Status.COMPLETED).length;

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: (user as any)?.bio || '',
    }
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting }
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileUpdate = async (data: ProfileFormData) => {
    try {
      await updateUser(data);
    } catch (error) {
      console.error(error);
    }
  };

  const onPasswordChange = async (data: PasswordFormData) => {
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      showSuccess('Password changed successfully');
      resetPassword();
    } catch (error: any) {
      showError(error.message || 'Failed to change password');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* User Stats Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-white text-blue-600 flex items-center justify-center text-4xl font-bold shadow-lg">
            {user?.firstName?.charAt(0)}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-blue-100 flex items-center justify-center md:justify-start gap-2 mt-1">
              <Mail className="w-4 h-4" /> {user?.email}
            </p>
            <p className="text-blue-100 flex items-center justify-center md:justify-start gap-2 mt-1 text-sm">
              <Calendar className="w-4 h-4" /> 
              Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'N/A'}
            </p>
          </div>
          <div className="flex gap-8 px-8 py-4 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                <ListTodo className="w-6 h-6" />
                {createdTasks.length}
              </div>
              <div className="text-xs text-blue-100 uppercase tracking-wider font-medium">Created</div>
            </div>
            <div className="w-px bg-white/20"></div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                <CheckCircle2 className="w-6 h-6" />
                {completedTasks}
              </div>
              <div className="text-xs text-blue-100 uppercase tracking-wider font-medium">Completed</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Edit Profile Section */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          <Card>
            <form onSubmit={handleProfileSubmit(onProfileUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  error={profileErrors.firstName?.message}
                  leftIcon={<User className="w-4 h-4" />}
                  {...registerProfile('firstName')}
                />
                <Input
                  label="Last Name"
                  error={profileErrors.lastName?.message}
                  leftIcon={<User className="w-4 h-4" />}
                  {...registerProfile('lastName')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">Email address cannot be changed</p>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  isLoading={isProfileSubmitting}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Change Password Section */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          <Card>
            <form onSubmit={handlePasswordSubmit(onPasswordChange)} className="space-y-4">
              <Input
                type="password"
                label="Current Password"
                placeholder="••••••••"
                error={passwordErrors.currentPassword?.message}
                {...registerPassword('currentPassword')}
              />
              
              <Input
                type="password"
                label="New Password"
                placeholder="••••••••"
                error={passwordErrors.newPassword?.message}
                {...registerPassword('newPassword')}
              />
              
              <Input
                type="password"
                label="Confirm New Password"
                placeholder="••••••••"
                error={passwordErrors.confirmNewPassword?.message}
                {...registerPassword('confirmNewPassword')}
              />

              <div className="pt-2 flex justify-end">
                <Button 
                  type="submit" 
                  variant="outline"
                  isLoading={isPasswordSubmitting}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;