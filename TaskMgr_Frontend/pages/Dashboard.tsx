import React, { useState } from 'react';
import { useSWRConfig } from 'swr';
import { useAuth } from '../contexts/AuthContext';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { AssignedTasks } from '../components/dashboard/AssignedTasks';
import { CreatedTasks } from '../components/dashboard/CreatedTasks';
import { OverdueTasks } from '../components/dashboard/OverdueTasks';
import { RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { showSuccess, showError } from '../utils/toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { mutate } = useSWRConfig();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Revalidate all keys starting with /tasks
      await mutate(
        (key) => typeof key === 'string' && key.startsWith('/tasks'),
        undefined,
        { revalidate: true }
      );
      setLastUpdated(new Date());
      showSuccess('Dashboard updated');
    } catch (error) {
      showError('Failed to refresh dashboard');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:inline">
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            isLoading={isRefreshing}
            leftIcon={!isRefreshing && <RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Assigned Tasks */}
        <div className="lg:col-span-1">
          <AssignedTasks />
        </div>

        {/* Middle Column - Created Tasks */}
        <div className="lg:col-span-1">
          <CreatedTasks />
        </div>

        {/* Right Column - Overdue Tasks */}
        <div className="lg:col-span-1">
          <OverdueTasks />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;