import { User, IUser } from '../models/User';
import { AuthorizationError, NotFoundError, ValidationError } from '../middleware/errors';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export async function getUserProfile(userId: string): Promise<Omit<IUser, 'password'>> {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user.toJSON() as unknown as Omit<IUser, 'password'>;
}

export async function updateUserProfile(
  userId: string,
  profileUserId: string,
  data: UpdateProfileData
): Promise<Omit<IUser, 'password'>> {
  if (userId !== profileUserId) {
    throw new AuthorizationError('You can only update your own profile');
  }

  const user = await User.findById(profileUserId);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

    if (data.firstName !== undefined) {
    if (!data.firstName || data.firstName.trim().length === 0) {
      throw new ValidationError('First name cannot be empty');
    }
    user.firstName = data.firstName.trim();
  }

  if (data.lastName !== undefined) {
    if (!data.lastName || data.lastName.trim().length === 0) {
      throw new ValidationError('Last name cannot be empty');
    }
    user.lastName = data.lastName.trim();
  }

  if (data.bio !== undefined) {
    user.bio = data.bio ? data.bio.trim() : undefined;
  }

  if (data.phoneNumber !== undefined) {
    user.phoneNumber = data.phoneNumber ? data.phoneNumber.trim() : undefined;
  }

  if (data.avatarUrl !== undefined) {
    user.avatarUrl = data.avatarUrl ? data.avatarUrl.trim() : undefined;
  }

  // Save updated user
  await user.save();

  return user.toJSON() as unknown as Omit<IUser, 'password'>;
}
