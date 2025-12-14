import React from 'react';
import { format, isPast } from 'date-fns';
import { Calendar, User, Edit2, Trash2, Clock } from 'lucide-react';
import { Task, Priority, Status } from '../../types/task.types';
import { Card } from '../ui/Card';
import { Badge, BadgeVariant } from '../ui/Badge';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onClick: (task: Task) => void;
}

const getPriorityBadgeVariant = (priority: Priority): BadgeVariant => {
  switch (priority) {
    case Priority.URGENT: return 'danger';
    case Priority.HIGH: return 'warning';
    case Priority.MEDIUM: return 'info';
    case Priority.LOW: return 'success';
    default: return 'neutral';
  }
};

const getStatusBadgeVariant = (status: Status): BadgeVariant => {
  switch (status) {
    case Status.COMPLETED: return 'success';
    case Status.IN_PROGRESS: return 'info';
    case Status.REVIEW: return 'warning';
    case Status.TODO: return 'neutral';
    default: return 'neutral';
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onClick }) => {
  const isOverdue = task.dueDate 
    ? isPast(new Date(task.dueDate)) && task.status !== Status.COMPLETED
    : false;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(task);
  };

  return (
    <div 
      onClick={() => onClick(task)}
      className="group relative cursor-pointer transition-transform duration-200 hover:-translate-y-1"
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <Badge variant={getPriorityBadgeVariant(task.priority)}>
            {task.priority}
          </Badge>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleEdit}
              className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
              title="Edit Task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDelete}
              className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate" title={task.title}>
          {task.title}
        </h3>

        <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
          {task.description}
        </p>

        <div className="mt-auto space-y-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
             <Badge variant={getStatusBadgeVariant(task.status)}>
              {task.status.replace('_', ' ')}
            </Badge>
            {task.dueDate && (
              <div className={`flex items-center ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                <Calendar className="w-3 h-3 mr-1" />
                {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              <span>{task.assignedToId ? 'Assigned' : 'Unassigned'}</span>
            </div>
             <div className="flex items-center" title="Last updated">
              <Clock className="w-3 h-3 mr-1" />
              {format(new Date(task.updatedAt), 'MMM d')}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};