import React from 'react';
import { ClipboardList, PlusCircle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { useAssignedTasks, useCreatedTasks, useOverdueTasks } from '../../hooks/useTasks';
import { Card } from '../ui/Card';
import { SkeletonLoader } from '../ui/SkeletonLoader';
import { Status } from '../../types/task.types';

export const DashboardStats: React.FC = () => {
  const { tasks: assignedTasks, isLoading: loadingAssigned } = useAssignedTasks();
  const { tasks: createdTasks, isLoading: loadingCreated } = useCreatedTasks();
  const { tasks: overdueTasks, isLoading: loadingOverdue } = useOverdueTasks();

  const completedTasksCount = assignedTasks.filter(t => t.status === Status.COMPLETED).length;

  const stats = [
    {
      label: 'Assigned to Me',
      value: assignedTasks.length,
      icon: ClipboardList,
      color: 'text-blue-600',
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      borderColor: 'border-blue-200',
      loading: loadingAssigned,
    },
    {
      label: 'Created by Me',
      value: createdTasks.length,
      icon: PlusCircle,
      color: 'text-purple-600',
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      borderColor: 'border-purple-200',
      loading: loadingCreated,
    },
    {
      label: 'Overdue Tasks',
      value: overdueTasks.length,
      icon: AlertOctagon,
      color: 'text-red-600',
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
      borderColor: 'border-red-200',
      loading: loadingOverdue,
    },
    {
      label: 'Completed Tasks',
      value: completedTasksCount,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
      borderColor: 'border-green-200',
      loading: loadingAssigned,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className={`transition-all duration-300 hover:-translate-y-2 hover:shadow-lg border ${stat.borderColor} ${stat.bg}`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-2xl ${stat.iconBg} shadow-md mr-4`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{stat.label}</p>
              {stat.loading ? (
                <SkeletonLoader variant="text" width={40} className="mt-1" />
              ) : (
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};