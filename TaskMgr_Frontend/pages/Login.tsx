import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';
import { CheckSquare, Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ThreeDBackground } from '../components/ui/ThreeDBackground';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error', error);
      // Toast handled in context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 py-12">
      <ThreeDBackground />
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 text-white flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 shadow-2xl animate-pulse">
            <CheckSquare className="h-12 w-12" />
          </div>
          <h2 className="mt-6 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-white/80 backdrop-blur-sm">
            Or{' '}
            <Link to="/register" className="font-medium text-yellow-300 hover:text-yellow-200 transition-all duration-200 transform hover:scale-105">
              create a new account
            </Link>
          </p>
        </div>

        <Card className="shadow-2xl bg-white/10 backdrop-blur-md border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
              autoComplete="current-password"
              error={errors.password?.message}
              leftIcon={<Lock className="h-5 w-5" />}
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:text-blue-500 transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                isLoading={isSubmitting}
                rightIcon={!isSubmitting && <LogIn className="w-4 h-4" />}
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
            
            <div className="text-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
              <p>Demo Credentials available</p>
              <p>Just click Sign In to test validation logic.</p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;