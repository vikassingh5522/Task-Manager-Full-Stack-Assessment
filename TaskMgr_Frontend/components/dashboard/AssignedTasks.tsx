import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, ArrowRight, ClipboardList } from 'lucide-react';
import { useAssignedTasks } from '../../hooks/useTasks';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { EmptyState } from '../ui/EmptyState';

export const AssignedTasks: React.FC = () => {
  const { tasks, isLoading } = useAssignedTasks();
  
  const recentTasks = tasks.slice(0, 5);

  return (
    <Card 
      title="Assigned to Me" 
      className="h-full"
      footer={
        tasks.length > 0 ? (
          <Link to="/tasks" className="text-sm text-primary hover:text-blue-700 flex items-center font-medium">
            View all tasks <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <SkeletonLoader key={i} variant="rectangular" height={60} />
          ))}
        </div>
      ) : recentTasks.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="All caught up!"
          description="No pending tasks assigned to you."
          className="py-6 border-0"
        />
      ) : (
        <div className="space-y-3">
          {recentTasks.map(task => (
            <div key={task.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
              <div className="flex justify-between items-start mb-1">
                <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{task.title}</h4>
                <Badge variant={task.priority === 'URGENT' ? 'danger' : 'neutral'}>{task.priority}</Badge>
              </div>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="info" className="text-[10px] px-1.5">{task.status.replace('_', ' ')}</Badge>
                {task.dueDate && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(task.dueDate), 'MMM d')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};