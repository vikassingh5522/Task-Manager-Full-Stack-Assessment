import mongoose, { Schema, Document } from 'mongoose';

/**
 * Notification document interface
 * Represents a notification sent to a user about system events
 */
export interface INotification extends Document {
  /** ID of the user who receives this notification */
  userId: mongoose.Types.ObjectId;
  /** Type of notification */
  type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'DEADLINE_APPROACHING' | 'MENTION';
  /** Notification title */
  title: string;
  /** Notification message content */
  message: string;
  /** Whether the notification has been read */
  read: boolean;
  /** Optional ID of the related resource (e.g., task ID) */
  resourceId?: mongoose.Types.ObjectId;
  /** Optional type of the related resource */
  resourceType?: 'TASK' | 'COMMENT';
  /** Timestamp when notification was created */
  createdAt: Date;
  /** Timestamp when notification was last updated */
  updatedAt: Date;
}

/**
 * Mongoose schema for Notification model
 * Defines the structure and validation rules for notification documents
 */
const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['TASK_ASSIGNED', 'TASK_UPDATED', 'DEADLINE_APPROACHING', 'MENTION'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
    },
    resourceType: {
      type: String,
      enum: ['TASK', 'COMMENT'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Transform function to format notification data when converting to JSON
      // Converts _id to id and removes internal fields
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for efficient queries
// Index for finding notifications by user, ordered by creation date (newest first)
NotificationSchema.index({ userId: 1, createdAt: -1 });
// Index for finding unread notifications by user
NotificationSchema.index({ userId: 1, read: 1 });

/**
 * Notification model
 * Provides methods for querying and manipulating notification documents
 */
export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
