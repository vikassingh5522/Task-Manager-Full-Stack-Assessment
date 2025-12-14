import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { Task, CreateTaskData, UpdateTaskData } from '../types/task.types';
import { TaskList } from '../components/tasks/TaskList';
import { TaskForm } from '../components/tasks/TaskForm';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { format } from 'date-fns';

const Tasks: React.FC = () => {
  const { tasks, isLoading } = useTasks();
  const { createTask } = useCreateTask();
  const { updateTask } = useUpdateTask();
  const { deleteTask } = useDeleteTask();

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const handleCreate = async (data: CreateTaskData) => {
    try {
      await createTask(data);
      setIsCreateOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdate = async (data: CreateTaskData) => {
    if (!editingTask) return;
    try {
      await updateTask(editingTask.id, data as UpdateTaskData);
      setEditingTask(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!deletingTask) return;
    try {
      await deleteTask(deletingTask.id);
      setDeletingTask(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tasks</h1>
          <p className="text-sm text-gray-500">Manage and track your team's work</p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-5 h-5" />}
        >
          Create Task
        </Button>
      </div>

      {/* Task List */}
      <TaskList 
        tasks={tasks} 
        isLoading={isLoading} 
        onEdit={setEditingTask}
        onDelete={setDeletingTask}
        onView={setViewingTask}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Task"
        size="lg"
      >
        <TaskForm 
          onSubmit={handleCreate} 
          onCancel={() => setIsCreateOpen(false)} 
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Edit Task"
        size="lg"
      >
        {editingTask && (
          <TaskForm 
            initialData={editingTask}
            onSubmit={handleUpdate} 
            onCancel={() => setEditingTask(null)} 
          />
        )}
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={!!viewingTask}
        onClose={() => setViewingTask(null)}
        title="Task Details"
        size="lg"
        footer={
          <Button onClick={() => setViewingTask(null)} variant="secondary">
            Close
          </Button>
        }
      >
        {viewingTask && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{viewingTask.title}</h2>
              <div className="flex gap-2">
                <Badge variant={viewingTask.priority === 'URGENT' ? 'danger' : 'neutral'}>
                  {viewingTask.priority}
                </Badge>
                <Badge variant="info">{viewingTask.status.replace('_', ' ')}</Badge>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap">
              {viewingTask.description}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-gray-500 font-medium">Due Date</span>
                <span className="text-gray-900">
                  {viewingTask.dueDate 
                    ? format(new Date(viewingTask.dueDate), 'PPP p') 
                    : 'No due date'}
                </span>
              </div>
              <div>
                <span className="block text-gray-500 font-medium">Assigned To</span>
                <span className="text-gray-900">
                  {viewingTask.assignedToId || 'Unassigned'}
                </span>
              </div>
              <div>
                 <span className="block text-gray-500 font-medium">Created On</span>
                 <span className="text-gray-900">
                   {format(new Date(viewingTask.createdAt), 'PPP')}
                 </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        title="Confirm Delete"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingTask(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-gray-600">
          Are you sure you want to delete <span className="font-semibold">{deletingTask?.title}</span>? 
          This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Tasks;