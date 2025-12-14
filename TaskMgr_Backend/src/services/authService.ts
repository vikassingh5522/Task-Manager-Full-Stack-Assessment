import { User, IUser } from '../models/User';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { generateToken, AuthTokenPayload } from '../utils/jwt';
import { ValidationError, AuthenticationError } from '../middleware/errors';

export interface AuthResponse {
  user: Omit<IUser, 'password'>;
  token: string;
  expiresIn: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const { email, password, firstName, lastName } = data;

  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    throw new ValidationError(passwordValidation.message);
  }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ValidationError('Email already registered');
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    email: email.toLowerCase(),
    password: hashedPassword,
    firstName,
    lastName,
  });

  const tokenPayload: AuthTokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  const token = generateToken(tokenPayload);

    return {
    user: user.toJSON() as unknown as Omit<IUser, 'password'>,
    token,
    expiresIn: '24h',
  };
}

/**
 * Login a user
 * @param data Login credentials
 * @returns Authentication response with user and token
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  const { email, password } = data;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  
  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

    const tokenPayload: AuthTokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  const token = generateToken(tokenPayload);

    return {
    user: user.toJSON() as unknown as Omit<IUser, 'password'>,
    token,
    expiresIn: '24h',
  };
}

/**
 * Logout a user (client-side token removal)
 * Note: JWT tokens are stateless, so logout is handled client-side
 * This function exists for API consistency and future enhancements
 * @returns Success message
 */
export async function logout(): Promise<{ message: string }> {
    return {
    message: 'Logged out successfully',
  };
}

/**
 * Get current user by ID
 * @param userId User ID from JWT token
 * @returns User data without password
 */
export async function getCurrentUser(userId: string): Promise<Omit<IUser, 'password'>> {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  return user.toJSON() as unknown as Omit<IUser, 'password'>;
}

/**
 * Change user password
 * @param userId User ID from JWT token
 * @param data Password change data
 * @returns Success message
 */
export async function changePassword(
  userId: string,
  data: ChangePasswordData
): Promise<{ message: string }> {
  const { currentPassword, newPassword } = data;
  const user = await User.findById(userId).select('+password');
  
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new AuthenticationError('Current password is incorrect');
  }

  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    throw new ValidationError(passwordValidation.message);
  }

  const hashedPassword = await hashPassword(newPassword);

  user.password = hashedPassword;
  await user.save();

  return {
    message: 'Password changed successfully',
  };
}
