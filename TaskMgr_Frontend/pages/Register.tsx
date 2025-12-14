import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';
import { CheckSquare, User, Mail, Lock, UserPlus, Sparkles } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ThreeDBackground } from '../components/ui/ThreeDBackground';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error', error);
      // Toast handled in AuthContext
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 py-12">
      <ThreeDBackground />
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 text-white flex items-center justify-center rounded-full bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 shadow-2xl animate-pulse">
            <CheckSquare className="h-12 w-12" />
          </div>
          <h2 className="mt-6 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-600">
            Join TaskMgr
          </h2>
          <p className="mt-2 text-sm text-white/80 backdrop-blur-sm">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-yellow-300 hover:text-yellow-200 transition-all duration-200 transform hover:scale-105">
              Sign in
            </Link>
          </p>
        </div>

        <Card className="shadow-2xl bg-white/10 backdrop-blur-md border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="firstName"
                label="First Name"
                placeholder="John"
                error={errors.firstName?.message}
                leftIcon={<User className="h-5 w-5" />}
                {...register('firstName')}
              />
              <Input
                id="lastName"
                label="Last Name"
                placeholder="Doe"
                error={errors.lastName?.message}
                leftIcon={<User className="h-5 w-5" />}
                {...register('lastName')}
              />
            </div>

            <Input
              id="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              leftIcon={<Mail className="h-5 w-5" />}
              {...register('email')}
            />

            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              error={errors.password?.message}
              leftIcon={<Lock className="h-5 w-5" />}
              {...register('password')}
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              leftIcon={<Lock className="h-5 w-5" />}
              {...register('confirmPassword')}
            />

            <div>
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                isLoading={isSubmitting}
                rightIcon={!isSubmitting && <UserPlus className="w-4 h-4" />}
              >
                {isSubmitting ? 'Creating account...' : 'Sign up'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;