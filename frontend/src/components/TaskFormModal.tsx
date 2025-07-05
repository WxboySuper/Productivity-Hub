import React, { useState, useEffect } from 'react';

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: any) => void;
  loading?: boolean;
  error?: string | null;
  projects: { id: number; name: string }[];
  initialValues?: any;
  editMode?: boolean;
}

const priorities = [
  { value: 0, label: 'Low' },
  { value: 1, label: 'Medium' },
  { value: 2, label: 'High' },
  { value: 3, label: 'Critical' },
];

const recurrenceOptions = [
  { value: '', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom...' },
];

const TaskFormModal: React.FC<TaskFormModalProps> = (props) => {
  // Ensure initialValues is always an object
  const {
    open,
    onClose,
    onSubmit,
    loading,
    error,
    projects,
    initialValues: rawInitialValues,
    editMode
  } = props;
  const initialValues = rawInitialValues || {};

  const [title, setTitle] = useState(initialValues.title || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [dueDate, setDueDate] = useState(initialValues.due_date ? initialValues.due_date.slice(0, 16) : '');
  const [startDate, setStartDate] = useState(initialValues.start_date ? initialValues.start_date.slice(0, 16) : '');
  const [priority, setPriority] = useState(typeof initialValues.priority === 'number' ? initialValues.priority : 1);
  const [recurrenceMode, setRecurrenceMode] = useState(
    recurrenceOptions.some(opt => opt.value === (initialValues.recurrence || ''))
      ? (initialValues.recurrence || '')
      : 'custom'
  );
  const [customRecurrence, setCustomRecurrence] = useState(
    recurrenceMode === 'custom' ? (initialValues.recurrence || '') : ''
  );
  const [projectId, setProjectId] = useState(initialValues.project_id || initialValues.projectId || '');

  // Track previous open state to only reset when opening
  const prevOpenRef = React.useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setTitle(initialValues.title || '');
      setDescription(initialValues.description || '');
      setDueDate(initialValues.due_date ? initialValues.due_date.slice(0, 16) : '');
      setStartDate(initialValues.start_date ? initialValues.start_date.slice(0, 16) : '');
      setPriority(typeof initialValues.priority === 'number' ? initialValues.priority : 1);
      const rec = initialValues.recurrence || '';
      if (recurrenceOptions.some(opt => opt.value === rec)) {
        setRecurrenceMode(rec);
        setCustomRecurrence('');
      } else if (rec) {
        setRecurrenceMode('custom');
        setCustomRecurrence(rec);
      } else {
        setRecurrenceMode('');
        setCustomRecurrence('');
      }
      setProjectId(initialValues.project_id || initialValues.projectId || '');
    }
    prevOpenRef.current = open;
  }, [open, initialValues]);

  const handleRecurrenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setRecurrenceMode(value);
    if (value !== 'custom') {
      setCustomRecurrence('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let recurrenceValue = undefined;
    if (recurrenceMode === 'custom') {
      recurrenceValue = customRecurrence || undefined;
    } else if (recurrenceMode) {
      recurrenceValue = recurrenceMode;
    }
    onSubmit({
      title,
      description,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      start_date: startDate ? new Date(startDate).toISOString() : undefined,
      priority: Number(priority),
      recurrence: recurrenceValue,
      project_id: projectId === '' ? undefined : Number(projectId), // Allow clearing project (quick task)
    });
  };

  console.log('TaskFormModal rendered. open:', open);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <form className="bg-white rounded-lg shadow-lg max-w-2xl w-full sm:w-[32rem] p-6 relative" onSubmit={handleSubmit}>
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-blue-800">{editMode ? 'Edit Task' : 'Add New Task'}</h2>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <div className="mb-3">
          <label className="block font-semibold mb-1">Title<span className="text-red-500">*</span></label>
          <input type="text" className="w-full border rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} required disabled={loading} />
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Description</label>
          <textarea className="w-full border rounded px-3 py-2" value={description} onChange={e => setDescription(e.target.value)} disabled={loading} />
        </div>
        <div className="mb-3 flex flex-col sm:flex-row gap-2">
          <div className="flex-1 min-w-0">
            <label className="block font-semibold mb-1">Due Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 bg-white"
              value={dueDate ? dueDate.slice(0, 10) : ''}
              onChange={e => setDueDate(e.target.value ? e.target.value : '')}
              disabled={loading}
            />
            <input
              type="time"
              className="w-full border rounded px-3 py-2 bg-white mt-1"
              value={dueDate && dueDate.length >= 16 ? dueDate.slice(11, 16) : ''}
              onChange={e => setDueDate(dueDate ? (dueDate.slice(0, 10) + (e.target.value ? 'T' + e.target.value : '')) : (e.target.value ? 'T' + e.target.value : ''))}
              disabled={loading}
              placeholder="Optional time"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block font-semibold mb-1">Start Date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 bg-white"
              value={startDate ? startDate.slice(0, 10) : ''}
              onChange={e => setStartDate(e.target.value ? e.target.value : '')}
              disabled={loading}
            />
            <input
              type="time"
              className="w-full border rounded px-3 py-2 bg-white mt-1"
              value={startDate && startDate.length >= 16 ? startDate.slice(11, 16) : ''}
              onChange={e => setStartDate(startDate ? (startDate.slice(0, 10) + (e.target.value ? 'T' + e.target.value : '')) : (e.target.value ? 'T' + e.target.value : ''))}
              disabled={loading}
              placeholder="Optional time"
            />
          </div>
        </div>
        <div className="mb-3 flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <label className="block font-semibold mb-1">Priority</label>
            <select className="w-full border rounded px-3 py-2" value={priority} onChange={e => setPriority(Number(e.target.value))} disabled={loading}>
              {priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-1">Recurrence</label>
            <select className="w-full border rounded px-3 py-2 mb-1" value={recurrenceMode} onChange={handleRecurrenceChange} disabled={loading}>
              {recurrenceOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {recurrenceMode === 'custom' && (
              <input
                type="text"
                className="w-full border rounded px-3 py-2 mt-1"
                value={customRecurrence}
                onChange={e => setCustomRecurrence(e.target.value)}
                disabled={loading}
                placeholder="e.g. every other day, every Monday, every 2 weeks"
              />
            )}
            <div className="text-xs text-gray-500 mt-1">Examples: daily, weekly, every other day, every Monday, every 2 weeks</div>
          </div>
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Project</label>
          <select className="w-full border rounded px-3 py-2" value={projectId} onChange={e => setProjectId(e.target.value)} disabled={loading}>
            <option value="">None (Quick Task)</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition" disabled={loading}>{editMode ? 'Save Changes' : 'Add Task'}</button>
        </div>
      </form>
    </div>
  );
};

export default TaskFormModal;
