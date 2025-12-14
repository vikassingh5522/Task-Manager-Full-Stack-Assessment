import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService';

/**
 * GET /api/users/profile
 * Get current user profile
 * Protected route
 */
export async function getUserProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    
    const user = await userService.getUserProfile(userId);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/profile
 * Update current user profile
 * Protected route
 */
export async function updateUserProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const updateData = req.body;
    
    const updatedUser = await userService.updateUserProfile(userId, userId, updateData);
    
    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
}
