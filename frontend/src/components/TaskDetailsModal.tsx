import React from 'react';
import TaskFormModal from './TaskFormModal';

interface TaskDetailsModalProps {
  open: boolean;
  onClose: () => void;
  task: {
    id: number;
    title: string;
    description?: string;
    due_date?: string;
    start_date?: string;
    priority?: number;
    recurrence?: string;
    completed: boolean;
    project_id?: number;
    projectName?: string;
    next_occurrence?: string; // Added for recurrence support
  } | null;
  onEdit?: () => void; // Add onEdit prop
}

const priorityLabels = ['Low', 'Medium', 'High', 'Critical'];

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ open, onClose, task, onEdit }) => {
  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setShowForm(false);
    }
  }, [open, task]);

  if (!open || !task) return null;

  // Check if task is before its start date/time
  let beforeStart = false;
  if (task.start_date) {
    const now = new Date();
    const start = new Date(task.start_date);
    beforeStart = now < start;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        {showForm ? (
          <TaskFormModal
            open={showForm}
            onClose={() => setShowForm(false)}
            onSubmit={values => {
              setShowForm(false);
              if (onEdit) onEdit(); // Call onEdit prop to trigger edit in parent
            }}
            loading={false}
            error={null}
            projects={[]}
            initialValues={task}
            editMode
          />
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-2 text-blue-800">{task.title}</h2>
            {beforeStart && task.start_date && (
              <div className="mb-2 text-sm text-blue-600 font-semibold flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Not started yet (starts {new Date(task.start_date || '').toLocaleString()})
              </div>
            )}
            {typeof task.completed === 'boolean' && (
              <div className="mb-2 text-gray-700">
                <span className="font-semibold">Status:</span>{' '}
                <span className={task.completed ? 'text-green-600' : 'text-yellow-600'}>
                  {task.completed ? 'Completed' : 'Incomplete'}
                </span>
              </div>
            )}
            {task.description && (
              <div className="mb-2">
                <span className="font-semibold">Description:</span>
                <div className="text-gray-600 whitespace-pre-line">{task.description}</div>
              </div>
            )}
            {task.due_date && (
              <div className="mb-2">
                <span className="font-semibold">Due Date:</span> {new Date(task.due_date).toLocaleString()}
              </div>
            )}
            {task.start_date && (
              <div className="mb-2">
                <span className="font-semibold">Start Date:</span> {new Date(task.start_date).toLocaleString()}
              </div>
            )}
            {typeof task.priority === 'number' && !isNaN(task.priority) && (
              <div className="mb-2">
                <span className="font-semibold">Priority:</span> {priorityLabels[task.priority] || task.priority}
              </div>
            )}
            {task.recurrence && (
              <div className="mb-2">
                <span className="font-semibold">Recurrence:</span> {task.recurrence}
              </div>
            )}
            {task.recurrence && task.next_occurrence && (
              <div className="mb-2">
                <span className="font-semibold">Next Occurrence:</span> {new Date(task.next_occurrence).toLocaleString()}
              </div>
            )}
            {task.projectName && (
              <div className="mb-2">
                <span className="font-semibold">Project:</span> {task.projectName}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                onClick={onClose}
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                onClick={() => {
                  if (onEdit) onEdit();
                  else setShowForm(true);
                }}
              >
                Edit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskDetailsModal;
