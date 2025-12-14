import React from 'react';
import { Task } from '../../types/task.types';
import { TaskCard } from './TaskCard';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { CheckSquare } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onView: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, isLoading, onEdit, onDelete, onView }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 h-64 flex flex-col gap-4">
            <div className="flex justify-between">
              <SkeletonLoader variant="text" width="20%" />
              <SkeletonLoader variant="circular" width={24} height={24} />
            </div>
            <SkeletonLoader variant="text" width="80%" height={24} />
            <SkeletonLoader variant="text" width="100%" height={16} />
            <SkeletonLoader variant="text" width="100%" height={16} />
            <div className="mt-auto pt-4 flex justify-between">
              <SkeletonLoader variant="text" width="30%" />
              <SkeletonLoader variant="text" width="30%" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No tasks found"
        description="Get started by creating a new task to track your progress."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tasks.map((task) => (
        <TaskCard 
          key={task.id} 
          task={task} 
          onEdit={onEdit} 
          onDelete={onDelete}
          onClick={onView}
        />
      ))}
    </div>
  );
};