import useSWR, { useSWRConfig } from 'swr';
import { taskService, TaskFilters } from '../services/taskService';
import { CreateTaskData, UpdateTaskData, Task } from '../types/task.types';
import { PaginatedResponse } from '../types/api.types';
import { showSuccess, showError } from '../utils/toast';

// Keys
const TASKS_KEY = '/tasks';
const ASSIGNED_TASKS_KEY = '/tasks/assigned';
const CREATED_TASKS_KEY = '/tasks/created';
const OVERDUE_TASKS_KEY = '/tasks/overdue';

export const useTasks = (filters?: TaskFilters, sort?: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    [TASKS_KEY, filters, sort],
    ([_, f, s]) => taskService.getTasks(f, s)
  );

  return {
    tasks: data?.items || [],
    pagination: data ? { total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages } : null,
    isLoading,
    isError: error,
    mutate,
  };
};

export const useTask = (id: string | undefined) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `${TASKS_KEY}/${id}` : null,
    () => taskService.getTaskById(id!)
  );

  return {
    task: data,
    isLoading,
    isError: error,
    mutate,
  };
};

export const useCreateTask = () => {
  const { mutate } = useSWRConfig();

  const createTask = async (data: CreateTaskData) => {
    try {
      const newTask = await taskService.createTask(data);
      showSuccess('Task created successfully');
      
      // Invalidate relevant queries
      mutate((key: any) => Array.isArray(key) && key[0] === TASKS_KEY);
      mutate(CREATED_TASKS_KEY);
      return newTask;
    } catch (error: any) {
      showError(error.message || 'Failed to create task');
      throw error;
    }
  };

  return { createTask };
};

export const useUpdateTask = () => {
  const { mutate } = useSWRConfig();

  const updateTask = async (id: string, data: UpdateTaskData) => {
    const key = `${TASKS_KEY}/${id}`;
    
    // Optimistic UI update for single task view
    await mutate(
      key,
      (currentTask: Task | undefined) => {
        if (!currentTask) return undefined;
        return { ...currentTask, ...data, updatedAt: new Date().toISOString() };
      },
      { revalidate: false }
    );

    // Optimistic UI update for list view (complex due to pagination/filtering, might just revalidate)
    // Here we choose to just invalidate list to stay consistent or manually map if critical
    
    try {
      const updatedTask = await taskService.updateTask(id, data);
      showSuccess('Task updated successfully');
      
      // Trigger revalidation to ensure data consistency
      mutate(key);
      mutate((k: any) => Array.isArray(k) && k[0] === TASKS_KEY);
      mutate(ASSIGNED_TASKS_KEY);
      mutate(OVERDUE_TASKS_KEY);
      
      return updatedTask;
    } catch (error: any) {
      showError(error.message || 'Failed to update task');
      // Rollback logic handled automatically by SWR if we used the populate cache option, 
      // but here we just revalidate to get true server state
      mutate(key);
      throw error;
    }
  };

  return { updateTask };
};

export const useDeleteTask = () => {
  const { mutate } = useSWRConfig();

  const deleteTask = async (id: string) => {
    try {
      await taskService.deleteTask(id);
      showSuccess('Task deleted successfully');
      
      // Remove from cache
      mutate((key: any) => Array.isArray(key) && key[0] === TASKS_KEY);
      mutate(CREATED_TASKS_KEY);
      mutate(ASSIGNED_TASKS_KEY);
      mutate(`${TASKS_KEY}/${id}`, null, { revalidate: false });
    } catch (error: any) {
      showError(error.message || 'Failed to delete task');
      throw error;
    }
  };

  return { deleteTask };
};

export const useAssignedTasks = () => {
  const { data, error, isLoading } = useSWR(ASSIGNED_TASKS_KEY, taskService.getAssignedTasks);
  return {
    tasks: data || [],
    isLoading,
    isError: error
  };
};

export const useCreatedTasks = () => {
  const { data, error, isLoading } = useSWR(CREATED_TASKS_KEY, taskService.getCreatedTasks);
  return {
    tasks: data || [],
    isLoading,
    isError: error
  };
};

export const useOverdueTasks = () => {
  const { data, error, isLoading } = useSWR(OVERDUE_TASKS_KEY, taskService.getOverdueTasks);
  return {
    tasks: data || [],
    isLoading,
    isError: error
  };
};