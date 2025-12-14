import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTaskData, Priority, Status, Task } from '../../types/task.types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().optional(),
  dueDate: z.string().optional().refine((val) => {
    if (val && val.trim()) {
      return !isNaN(Date.parse(val));
    }
    return true;
  }, {
    message: "Invalid date"
  }).refine((val) => {
    if (val && val.trim()) {
      const date = new Date(val);
      const now = new Date();
      return date > now;
    }
    return true;
  }, {
    message: "Due date must be in the future"
  }),
  priority: z.nativeEnum(Priority),
  status: z.nativeEnum(Status),
  assignedToId: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  initialData?: Task;
  onSubmit: (data: CreateTaskData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const MOCK_USERS = [
  { label: 'Unassigned', value: '' },
  { label: 'John Doe', value: 'user-1' },
  { label: 'Jane Smith', value: 'user-2' },
  { label: 'Alex Johnson', value: 'user-3' },
];

export const TaskForm: React.FC<TaskFormProps> = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      priority: Priority.MEDIUM,
      status: Status.TODO,
      assignedToId: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      const formattedDate = initialData.dueDate 
        ? format(new Date(initialData.dueDate), "yyyy-MM-dd'T'HH:mm")
        : '';

      reset({
        title: initialData.title,
        description: initialData.description || '',
        dueDate: formattedDate,
        priority: initialData.priority,
        status: initialData.status,
        assignedToId: initialData.assignedToId || '',
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: TaskFormData) => {
    const formattedData = {
      ...data,
      dueDate: data.dueDate && data.dueDate.trim() ? new Date(data.dueDate).toISOString() : undefined,
      assignedToId: data.assignedToId && data.assignedToId.trim() && !data.assignedToId.startsWith('user-') ? data.assignedToId : undefined
    };
    await onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        label="Task Title"
        placeholder="Enter task title"
        error={errors.title?.message}
        {...register('title')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Priority"
          options={[
            { label: 'Low', value: Priority.LOW },
            { label: 'Medium', value: Priority.MEDIUM },
            { label: 'High', value: Priority.HIGH },
            { label: 'Urgent', value: Priority.URGENT },
          ]}
          error={errors.priority?.message}
          {...register('priority')}
        />

        <Select
          label="Status"
          options={[
            { label: 'To Do', value: Status.TODO },
            { label: 'In Progress', value: Status.IN_PROGRESS },
            { label: 'Review', value: Status.REVIEW },
            { label: 'Completed', value: Status.COMPLETED },
          ]}
          error={errors.status?.message}
          {...register('status')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="datetime-local"
          label="Due Date"
          error={errors.dueDate?.message}
          {...register('dueDate')}
        />

        <Select
          label="Assigned To"
          options={MOCK_USERS}
          error={errors.assignedToId?.message}
          {...register('assignedToId')}
        />
      </div>

      <Textarea
        label="Description"
        placeholder="Enter detailed task description..."
        rows={4}
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel}
          disabled={isSubmitting || isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="primary"
          isLoading={isSubmitting || isLoading}
        >
          {initialData ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};