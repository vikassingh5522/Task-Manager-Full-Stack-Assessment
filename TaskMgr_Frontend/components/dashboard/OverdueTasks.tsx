import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { useOverdueTasks } from '../../hooks/useTasks';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { EmptyState } from '../ui/EmptyState';

export const OverdueTasks: React.FC = () => {
  const { tasks, isLoading } = useOverdueTasks();
  
  const recentTasks = tasks.slice(0, 5);

  return (
    <Card 
      title="Overdue Tasks" 
      className="h-full border-t-4 border-t-red-500"
      footer={
        tasks.length > 0 ? (
          <Link to="/tasks" className="text-sm text-red-600 hover:text-red-800 flex items-center font-medium">
            View all overdue <ArrowRight className="w-4 h-4 ml-1" />
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
          icon={CheckCircle}
          title="Great job!"
          description="You have no overdue tasks."
          className="py-6 border-0"
        />
      ) : (
        <div className="space-y-3">
          {recentTasks.map(task => (
            <div key={task.id} className="p-3 bg-red-50 border border-red-100 rounded-lg flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{task.title}</h4>
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="danger" className="text-[10px] px-1.5">{task.priority}</Badge>
                {task.dueDate && (
                  <span className="text-xs font-bold text-red-600">
                    Due {format(new Date(task.dueDate), 'MMM d')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};