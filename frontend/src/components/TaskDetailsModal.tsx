import React, { useRef } from 'react';
import TaskFormModal from './TaskFormModal';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// SubtaskItem must be defined OUTSIDE the main component to avoid hook order errors
const SubtaskItem = ({ sub, index, moveSubtask, handleSubtaskToggle, handleDeleteSubtask }: any) => {
  const ref = useRef(null);
  const [, drop] = useDrop({
    accept: 'subtask',
    hover(item: any) {
      if (item.index === index) return;
      moveSubtask(item.index, index);
      item.index = index;
    },
  });
  const [{ isDragging }, drag] = useDrag({
    type: 'subtask',
    item: { id: sub.id, index },
    collect: (monitor: any) => ({ isDragging: monitor.isDragging() }),
  });
  drag(drop(ref));
  return (
    <li ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`flex items-center gap-2 p-3 rounded-lg transition border-2 shadow-sm ${sub.completed ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'} hover:bg-blue-100 group cursor-pointer`}
    >
      <input
        type="checkbox"
        checked={sub.completed}
        onChange={e => { e.stopPropagation(); handleSubtaskToggle(sub); }}
        className="accent-blue-600 w-4 h-4"
        tabIndex={-1}
      />
      <span
        className={`flex-1 transition font-medium ${sub.completed ? 'line-through text-gray-400' : 'text-blue-900 group-hover:underline'}`}
        onClick={() => { window.dispatchEvent(new CustomEvent('openTaskDetails', { detail: sub.id })); }}
        title="View subtask details"
        tabIndex={0}
        role="button"
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.dispatchEvent(new CustomEvent('openTaskDetails', { detail: sub.id })); } }}
        aria-label={`Open details for subtask: ${sub.title}`}
      >
        {sub.title}
      </span>
      <button
        className="ml-2 text-red-500 hover:text-red-700 p-1 rounded-full focus:outline-none"
        title="Delete subtask"
        onClick={e => { e.stopPropagation(); handleDeleteSubtask(sub.id); }}
        aria-label="Delete subtask"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      {sub.completed ? (
        <span className="ml-2 text-green-500 text-xs font-semibold">Done</span>
      ) : (
        <span className="ml-2 text-yellow-600 text-xs font-semibold">Incomplete</span>
      )}
      <span className="cursor-move ml-2 text-gray-400" title="Drag to reorder">↕️</span>
    </li>
  );
};

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
    subtasks?: Array<{
      id: number;
      title: string;
      completed: boolean;
    }>;
    parent_id?: number | null; // <-- Add this line
  } | null;
  onEdit?: () => void; // Add onEdit prop
  parentTask?: { id: number; title: string } | null; // Add parent lookup prop
}

const priorityLabels = ['Low', 'Medium', 'High', 'Critical'];

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ open, onClose, task, onEdit, parentTask }) => {
  // All hooks must be called before any early return and initialized with static values
  const [showForm, setShowForm] = React.useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');
  const [addLoading, setAddLoading] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [reorderLoading, setReorderLoading] = React.useState(false);
  const [localTask, setLocalTask] = React.useState<TaskDetailsModalProps['task']>(null);
  const [editingTitle, setEditingTitle] = React.useState(false);
  const [editingDescription, setEditingDescription] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState('');
  const [descDraft, setDescDraft] = React.useState('');

  // Always update localTask when task changes
  React.useEffect(() => { setLocalTask(task || {} as TaskDetailsModalProps['task']); }, [task]);
  React.useEffect(() => {
    if (open) {
      setShowForm(false);
    }
  }, [open, task]);
  React.useEffect(() => {
    setTitleDraft(localTask && localTask.title ? localTask.title : '');
    setDescDraft(localTask && localTask.description ? localTask.description : '');
  }, [localTask]);

  // Early return after all hooks
  if (!open || !localTask || !localTask.id) return null;

  // Check if task is before its start date/time
  let beforeStart = false;
  if (localTask.start_date) {
    const now = new Date();
    const start = new Date(localTask.start_date);
    beforeStart = now < start;
  }

  // Prevent parent completion if subtasks exist and any are incomplete
  const parentCompletionDisabled = localTask.subtasks && localTask.subtasks.length > 0 && localTask.subtasks.some(st => !st.completed);

  // Handler for parent completion
  const handleParentToggle = async () => {
    if (!parentCompletionDisabled && localTask) {
      const csrfToken = getCsrfToken();
      const res = await fetch(`/api/tasks/${localTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
        body: JSON.stringify({ completed: !localTask.completed }),
        credentials: 'include',
      });
      if (res.ok) {
        const updated = await res.json();
        setLocalTask(updated);
      }
    }
  };

  // Update subtask completion handler to update local state
  const handleSubtaskToggle = async (sub: any) => {
    const csrfToken = getCsrfToken();
    await fetch(`/api/tasks/${sub.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      body: JSON.stringify({ completed: !sub.completed }),
      credentials: 'include',
    });
    // Refetch parent task and update local state
    if (localTask && localTask.id) {
      const res = await fetch(`/api/tasks/${localTask.id}`);
      if (res.ok) {
        const updated = await res.json();
        setLocalTask(updated);
      }
    }
  };

  // Subtask progress calculation
  const subtaskCount = localTask.subtasks ? localTask.subtasks.length : 0;
  const completedCount = localTask.subtasks ? localTask.subtasks.filter(st => st.completed).length : 0;
  const progress = subtaskCount > 0 ? completedCount / subtaskCount : 0;

  // Subtask deletion handler
  const handleDeleteSubtask = async (subId: number) => {
    const csrfToken = getCsrfToken();
    await fetch(`/api/tasks/${subId}`, {
      method: 'DELETE',
      headers: {
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      credentials: 'include',
    });
    // Refetch parent task and update local state
    if (localTask && localTask.id) {
      const res = await fetch(`/api/tasks/${localTask.id}`);
      if (res.ok) {
        const updated = await res.json();
        setLocalTask(updated);
      }
    }
  };

  // Add subtask handler
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    setAddLoading(true);
    setAddError(null);
    const csrfToken = getCsrfToken();
    const res = await fetch(`/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      body: JSON.stringify({
        title: newSubtaskTitle.trim(),
        completed: false,
        parent_id: localTask.id,
      }),
      credentials: 'include',
    });
    if (res.ok) {
      setNewSubtaskTitle('');
      const updated = await fetch(`/api/tasks/${localTask.id}`);
      if (updated.ok) {
        setLocalTask(await updated.json());
      }
    } else {
      setAddError('Failed to add subtask.');
    }
    setAddLoading(false);
  };

  // Drag-and-drop reordering for subtasks
  const moveSubtask = (dragIndex: number, hoverIndex: number) => {
    if (!localTask.subtasks) return;
    const updated = [...localTask.subtasks];
    const [removed] = updated.splice(dragIndex, 1);
    updated.splice(hoverIndex, 0, removed);
    setLocalTask({ ...localTask, subtasks: updated });
  };
  const handleReorderSave = async () => {
    if (!localTask.subtasks) return;
    setReorderLoading(true);
    const csrfToken = getCsrfToken();
    await fetch(`/api/tasks/${localTask.id}/reorder_subtasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      body: JSON.stringify({ subtask_ids: localTask.subtasks.map(st => st.id) }),
      credentials: 'include',
    });
    // Refetch parent task and update local state
    const res = await fetch(`/api/tasks/${localTask.id}`);
    if (res.ok) setLocalTask(await res.json());
    setReorderLoading(false);
  };

  // Inline editing state for title/description
  // REMOVE these lines (they are causing hook order errors):
  // const [titleDraftState, setTitleDraftState] = React.useState(titleDraft);
  // const [descDraftState, setDescDraftState] = React.useState(descDraft);

  // Inline save for title/description
  const handleTitleSave = async () => {
    if (!titleDraft.trim() || titleDraft === localTask.title) { setEditingTitle(false); return; }
    const csrfToken = getCsrfToken();
    const res = await fetch(`/api/tasks/${localTask.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      body: JSON.stringify({ title: titleDraft }),
      credentials: 'include',
    });
    if (res.ok) {
      setLocalTask(await res.json());
      setEditingTitle(false);
    }
  };
  const handleDescSave = async () => {
    if (descDraft === localTask.description) { setEditingDescription(false); return; }
    const csrfToken = getCsrfToken();
    const res = await fetch(`/api/tasks/${localTask.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      body: JSON.stringify({ description: descDraft }),
      credentials: 'include',
    });
    if (res.ok) {
      setLocalTask(await res.json());
      setEditingDescription(false);
    }
  };

  // Helper to get CSRF token
  const getCsrfToken = () => document.cookie.match(/_csrf_token=([^;]+)/)?.[1];

  // Helper to format date: if time is midnight, show only date
  function formatDateOrDateTime(dtStr: string | undefined) {
    if (!dtStr) return '';
    const dt = new Date(dtStr);
    if (dt.getHours() === 0 && dt.getMinutes() === 0 && dt.getSeconds() === 0) {
      return dt.toLocaleDateString();
    }
    return dt.toLocaleString();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-300/60 via-gray-200/70 to-blue-100/60">
      <div className="bg-gray-100 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative border-2 border-blue-100 animate-fade-in">
        {/* Loading overlay for reorder or add/delete */}
        {(addLoading || reorderLoading) && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-50 rounded-2xl">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 animate-spin border-blue-500"></div>
          </div>
        )}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-blue-700 text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-full transition"
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
              if (onEdit) onEdit();
            }}
            loading={false}
            error={null}
            projects={[]}
            initialValues={task}
            editMode
          />
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              {editingTitle ? (
                <input
                  className="text-3xl font-extrabold text-blue-800 tracking-tight flex-1 break-words border-b-2 border-blue-400 bg-white px-2"
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') { setEditingTitle(false); setTitleDraft(localTask.title); } }}
                  autoFocus
                />
              ) : (
                <h2 className="text-3xl font-extrabold text-blue-800 tracking-tight flex-1 break-words" onClick={() => setEditingTitle(true)} title="Click to edit title">{localTask.title}</h2>
              )}
              {localTask.parent_id && parentTask && (
                <span className="px-2 py-1 rounded bg-blue-200 text-blue-800 text-xs font-bold mr-2">
                  Subtask of{' '}
                  <span
                    className="underline cursor-pointer hover:text-blue-600"
                    onClick={() => window.dispatchEvent(new CustomEvent('openTaskDetails', { detail: parentTask.id }))}
                  >
                    {parentTask.title}
                  </span>
                </span>
              )}
              {localTask.completed && <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">Completed</span>}
              {!localTask.completed && <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">Incomplete</span>}
            </div>
            {beforeStart && localTask.start_date && (
              <div className="mb-2 text-sm text-blue-600 font-semibold flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Not started yet (starts {formatDateOrDateTime(localTask.start_date)})
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {localTask.due_date && (
                <div>
                  <span className="font-semibold text-gray-700">Due Date:</span>
                  <div className="text-gray-800">{formatDateOrDateTime(localTask.due_date)}</div>
                </div>
              )}
              {localTask.start_date && (
                <div>
                  <span className="font-semibold text-gray-700">Start Date:</span>
                  <div className="text-gray-800">{formatDateOrDateTime(localTask.start_date)}</div>
                </div>
              )}
              {typeof localTask.priority === 'number' && !isNaN(localTask.priority) && (
                <div>
                  <span className="font-semibold text-gray-700">Priority:</span>
                  <div className={`inline-block px-2 py-1 rounded text-xs font-bold ${localTask.priority === 3 ? 'bg-red-100 text-red-700' : localTask.priority === 2 ? 'bg-yellow-100 text-yellow-700' : localTask.priority === 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{priorityLabels[localTask.priority] || localTask.priority}</div>
                </div>
              )}
              {localTask.projectName && (
                <div>
                  <span className="font-semibold text-gray-700">Project:</span>
                  <div className="text-blue-700 font-medium">{localTask.projectName}</div>
                </div>
              )}
              {localTask.recurrence && (
                <div>
                  <span className="font-semibold text-gray-700">Recurrence:</span>
                  <div className="text-gray-800">{localTask.recurrence}</div>
                </div>
              )}
              {localTask.recurrence && localTask.next_occurrence && (
                <div>
                  <span className="font-semibold text-gray-700">Next Occurrence:</span>
                  <div className="text-gray-800">{formatDateOrDateTime(localTask.next_occurrence)}</div>
                </div>
              )}
            </div>
            {localTask.description !== undefined && (
              <div className="mb-4">
                <span className="font-semibold text-gray-700">Description:</span>
                {editingDescription ? (
                  <textarea
                    className="text-gray-700 whitespace-pre-line bg-white rounded p-3 mt-1 border-2 border-blue-200 shadow-inner w-full"
                    value={descDraft}
                    onChange={e => setDescDraft(e.target.value)}
                    onBlur={handleDescSave}
                    onKeyDown={e => { if (e.key === 'Escape') { setEditingDescription(false); setDescDraft(localTask.description || ''); } }}
                    autoFocus
                  />
                ) : (
                  <div className="text-gray-700 whitespace-pre-line bg-gray-50 rounded p-3 mt-1 border border-gray-100 shadow-inner" onClick={() => setEditingDescription(true)} title="Click to edit description">{localTask.description}</div>
                )}
              </div>
            )}
            {typeof localTask.completed === 'boolean' && (
              <div className="mb-4 flex items-center gap-2">
                <span className="font-semibold text-gray-700">Mark Complete:</span>
                <input
                  type="checkbox"
                  checked={localTask.completed}
                  onChange={handleParentToggle}
                  disabled={parentCompletionDisabled}
                  title={parentCompletionDisabled ? 'Complete all subtasks first' : ''}
                  className="ml-2 accent-blue-600 w-5 h-5"
                />
                {parentCompletionDisabled && <span className="text-xs text-blue-500 ml-2">Complete all subtasks first</span>}
              </div>
            )}
            {/* Subtask progress indicator */}
            {subtaskCount > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-blue-700 font-semibold">{completedCount} / {subtaskCount} done</span>
                </div>
              </div>
            )}
            {/* Subtasks list with drag-and-drop */}
            {localTask.subtasks && localTask.subtasks.length > 0 && (
              <DndProvider backend={HTML5Backend}>
                <div className="mb-2">
                  <span className="font-semibold text-blue-700">Subtasks:</span>
                  <ul className="ml-0 mt-2 space-y-2">
                    {localTask.subtasks.map((sub: any, idx: number) => (
                      <SubtaskItem key={sub.id} sub={sub} index={idx} moveSubtask={moveSubtask} handleSubtaskToggle={handleSubtaskToggle} handleDeleteSubtask={handleDeleteSubtask} />
                    ))}
                  </ul>
                  <button
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-700 text-xs font-semibold"
                    onClick={handleReorderSave}
                    disabled={reorderLoading}
                    title="Save subtask order"
                  >Save Order</button>
                  {/* Add subtask input */}
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="Add subtask..."
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask(); }}
                      disabled={addLoading}
                    />
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold"
                      onClick={handleAddSubtask}
                      disabled={addLoading}
                    >Add</button>
                  </div>
                  {addError && <div className="text-red-600 text-xs mt-1">{addError}</div>}
                </div>
              </DndProvider>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskDetailsModal;
