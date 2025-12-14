import api from './api';
import { Task, CreateTaskData, UpdateTaskData } from '../types/task.types';
import { ApiResponse, PaginatedResponse } from '../types/api.types';

// Define a type for filters
export interface TaskFilters {
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const taskService = {
  async getTasks(filters: TaskFilters = {}, sort?: string): Promise<PaginatedResponse<Task>> {
    const params = { ...filters, sort };
    const response = await api.get<ApiResponse<PaginatedResponse<Task>>>('/tasks', { params });
    return response.data.data;
  },

  async getTaskById(id: string): Promise<Task> {
    const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data.data;
  },

  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await api.post<ApiResponse<Task>>('/tasks', data);
    return response.data.data;
  },

  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    return response.data.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },

  async getAssignedTasks(): Promise<Task[]> {
    const response = await api.get<ApiResponse<Task[]>>('/tasks/assigned');
    return response.data.data;
  },

  async getCreatedTasks(): Promise<Task[]> {
    const response = await api.get<ApiResponse<Task[]>>('/tasks/created');
    return response.data.data;
  },

  async getOverdueTasks(): Promise<Task[]> {
    const response = await api.get<ApiResponse<Task[]>>('/tasks/overdue');
    return response.data.data;
  }
};