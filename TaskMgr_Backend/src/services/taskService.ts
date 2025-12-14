import { Task, ITask } from '../models/Task';
import { ValidationError, AuthorizationError, NotFoundError } from '../middleware/errors';
import mongoose from 'mongoose';
import * as socketService from './socketService';
import * as notificationService from './notificationService';

export interface TaskFilters {
  status?: string;
  priority?: string;
  search?: string;
  creatorId?: string;
  assignedToId?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  assignedToId?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  dueDate?: Date;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  assignedToId?: string;
}

export async function createTask(userId: string, data: CreateTaskData): Promise<ITask> {
  const { title, description, dueDate, priority, status, assignedToId } = data;

  if (!title || title.trim().length === 0) {
    throw new ValidationError('Title is required');
  }

  const taskData: any = {
    title: title.trim(),
    creatorId: new mongoose.Types.ObjectId(userId),
  };

    if (description !== undefined) taskData.description = description;
  if (dueDate !== undefined) taskData.dueDate = dueDate;
  if (priority !== undefined) taskData.priority = priority;
  if (status !== undefined) taskData.status = status;
  if (assignedToId !== undefined) {
    taskData.assignedToId = new mongoose.Types.ObjectId(assignedToId);
  }

    const task = await Task.create(taskData);

  await task.populate('creatorId', 'firstName lastName email');
  await task.populate('assignedToId', 'firstName lastName email');

  if (assignedToId && assignedToId !== userId) {
    const creator = task.creatorId as any;
    const creatorName = `${creator.firstName} ${creator.lastName}`;
    
    await notificationService.createNotification({
      userId: assignedToId,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `${creatorName} assigned you a task: "${task.title}"`,
      resourceId: task._id.toString(),
      resourceType: 'TASK',
    });
  }

  socketService.emitTaskCreated(task);

  return task;
}

export async function getTasks(
  userId: string,
  filters: TaskFilters = {},
  pagination: PaginationParams = { page: 1, limit: 10 }
): Promise<PaginatedResponse<ITask>> {
  const { status, priority, search } = filters;
  const { page, limit } = pagination;

  const query: any = {
    $or: [
      { creatorId: new mongoose.Types.ObjectId(userId) },
      { assignedToId: new mongoose.Types.ObjectId(userId) },
    ],
  };

  if (status) query.status = status;
  if (priority) query.priority = priority;

  if (search) {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ],
    });
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Task.find(query)
      .skip(skip)
      .limit(limit)
      .populate('creatorId', 'firstName lastName email')
      .populate('assignedToId', 'firstName lastName email')
      .sort({ createdAt: -1 }),
    Task.countDocuments(query),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getTaskById(taskId: string, userId: string): Promise<ITask> {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new NotFoundError('Task not found');
  }

  const task = await Task.findById(taskId)
    .populate('creatorId', 'firstName lastName email')
    .populate('assignedToId', 'firstName lastName email');

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const isCreator = task.creatorId._id.equals(userObjectId);
  const isAssignee = task.assignedToId && task.assignedToId._id.equals(userObjectId);

  if (!isCreator && !isAssignee) {
    throw new AuthorizationError('You do not have access to this task');
  }

  return task;
}

export async function updateTask(
  taskId: string,
  userId: string,
  data: UpdateTaskData
): Promise<ITask> {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new NotFoundError('Task not found');
  }

  const task = await Task.findById(taskId);

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const isCreator = task.creatorId.equals(userObjectId);
  const isAssignee = task.assignedToId && task.assignedToId.equals(userObjectId);

  if (!isCreator && !isAssignee) {
    throw new AuthorizationError('You do not have access to update this task');
  }

  const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  if (data.status && !validStatuses.includes(data.status)) {
    throw new ValidationError('Invalid status value');
  }

  if (data.priority && !validPriorities.includes(data.priority)) {
    throw new ValidationError('Invalid priority value');
  }

  const oldAssignedToId = task.assignedToId?.toString();
  const newAssignedToId = data.assignedToId;
  const assignmentChanged = data.assignedToId !== undefined && oldAssignedToId !== newAssignedToId;

  if (data.title !== undefined) task.title = data.title.trim();
  if (data.description !== undefined) task.description = data.description;
  if (data.dueDate !== undefined) task.dueDate = data.dueDate;
  if (data.priority !== undefined) task.priority = data.priority;
  if (data.status !== undefined) task.status = data.status;
  if (data.assignedToId !== undefined) {
    task.assignedToId = data.assignedToId
      ? new mongoose.Types.ObjectId(data.assignedToId)
      : undefined;
  }

  await task.save();

  await task.populate('creatorId', 'firstName lastName email');
  await task.populate('assignedToId', 'firstName lastName email');

  const updater = await mongoose.model('User').findById(userId).select('firstName lastName');
  const updaterName = updater ? `${updater.firstName} ${updater.lastName}` : 'Someone';

  if (assignmentChanged && newAssignedToId && newAssignedToId !== userId) {
    await notificationService.createNotification({
      userId: newAssignedToId,
      type: 'TASK_ASSIGNED',
      title: 'Task Assigned to You',
      message: `${updaterName} assigned you a task: "${task.title}"`,
      resourceId: task._id.toString(),
      resourceType: 'TASK',
    });
  }

  const notifyUserIds = new Set<string>();
  
  const creatorId = task.creatorId._id.toString();
  if (creatorId !== userId) {
    notifyUserIds.add(creatorId);
  }

  if (task.assignedToId && task.assignedToId._id.toString() !== userId) {
    notifyUserIds.add(task.assignedToId._id.toString());
  }

  for (const notifyUserId of notifyUserIds) {
    await notificationService.createNotification({
      userId: notifyUserId,
      type: 'TASK_UPDATED',
      title: 'Task Updated',
      message: `${updaterName} updated the task: "${task.title}"`,
      resourceId: task._id.toString(),
      resourceType: 'TASK',
    });
  }

  socketService.emitTaskUpdated(task);

  return task;
}

export async function deleteTask(
  taskId: string,
  userId: string
): Promise<{ message: string }> {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new NotFoundError('Task not found');
  }

  const task = await Task.findById(taskId);

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const isCreator = task.creatorId.equals(userObjectId);

  if (!isCreator) {
    throw new AuthorizationError('Only the task creator can delete this task');
  }

  await Task.findByIdAndDelete(taskId);

  socketService.emitTaskDeleted(taskId);

  return {
    message: 'Task deleted successfully',
  };
}

export async function getAssignedTasks(userId: string): Promise<ITask[]> {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const tasks = await Task.find({ assignedToId: userObjectId })
    .populate('creatorId', 'firstName lastName email')
    .populate('assignedToId', 'firstName lastName email')
    .sort({
      priority: -1, 
      dueDate: 1,   
    });

  return tasks;
}

export async function getCreatedTasks(userId: string): Promise<ITask[]> {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const tasks = await Task.find({ creatorId: userObjectId })
    .populate('creatorId', 'firstName lastName email')
    .populate('assignedToId', 'firstName lastName email')
    .sort({ createdAt: -1 });

  return tasks;
}

export async function getOverdueTasks(userId: string): Promise<ITask[]> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  const tasks = await Task.find({
    $or: [
      { creatorId: userObjectId },
      { assignedToId: userObjectId },
    ],
    dueDate: { $lt: now },
    status: { $ne: 'COMPLETED' },
  })
    .populate('creatorId', 'firstName lastName email')
    .populate('assignedToId', 'firstName lastName email')
    .sort({ dueDate: 1 });

  return tasks;
}
