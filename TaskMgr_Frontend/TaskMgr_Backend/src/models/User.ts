import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'USER';
  avatarUrl?: string;
  bio?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'USER'],
      default: 'USER',
    },
    avatarUrl: String,
    bio: String,
    phoneNumber: String,
  },
  {
    timestamps: true,
    toJSON: {
      // Transform function to format user data when converting to JSON
      // Converts _id to id, removes internal fields, and excludes password
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Create unique index on email for fast lookups and uniqueness constraint
UserSchema.index({ email: 1 }, { unique: true });

/**
 * User model
 * Provides methods for querying and manipulating user documents
 */
export const User = mongoose.model<IUser>('User', UserSchema);
