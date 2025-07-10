import React, { useState, useEffect } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

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

  // Subtasks state for inline editing
  const [subtasks, setSubtasks] = useState(initialValues.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Dependency state
  const [blockedBy, setBlockedBy] = useState(initialValues.blocked_by || []);
  const [blocking, setBlocking] = useState(initialValues.blocking || []);
  const [blockingOptions, setBlockingOptions] = useState<any[]>([]);
  const [blockingOptionsLoading, setBlockingOptionsLoading] = useState(false);

  // Reminder fields state
  const [reminderEnabled, setReminderEnabled] = useState(
    typeof initialValues.reminder_enabled === 'boolean' ? initialValues.reminder_enabled : true
  );
  // Always convert backend UTC ISO string to local datetime-local string for input
  const [reminderTime, setReminderTime] = useState(
    initialValues.reminder_time
      ? (() => {
          // Only convert backend UTC to local for input field
          const d = new Date(initialValues.reminder_time);
          // No manual offsetting, just use toISOString and slice for input
          return d.toISOString().slice(0, 16);
        })()
      : ''
  );
  const [reminderRecurring, setReminderRecurring] = useState(initialValues.reminder_recurring || '');

  // Track previous open state for form reset
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
      setSubtasks(initialValues.subtasks || []);
      setNewSubtaskTitle('');
      setBlockedBy(initialValues.blocked_by || []);
      setBlocking(initialValues.blocking || []);
      setReminderEnabled(typeof initialValues.reminder_enabled === 'boolean' ? initialValues.reminder_enabled : true);
      setReminderTime(initialValues.reminder_time ? new Date(initialValues.reminder_time).toISOString().slice(0, 16) : '');
      setReminderRecurring(initialValues.reminder_recurring || '');
    }
    prevOpenRef.current = open;
  }, [open, initialValues]);

  // Track previous open state for blocking options fetch
  const prevOpenRefBlockingOptions = React.useRef(false);
  useEffect(() => {
    if (open && !prevOpenRefBlockingOptions.current) {
      setBlockingOptionsLoading(true);
      let url = '/api/tasks/blocking-options';
      if (editMode && initialValues.id) {
        url += `?exclude_task_id=${initialValues.id}`;
      }
      fetch(url, { credentials: 'include' })
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch blocking options'))
        .then(data => {
          setBlockingOptions(Array.isArray(data) ? data : (data.tasks || []));
        })
        .catch(() => setBlockingOptions([]))
        .finally(() => setBlockingOptionsLoading(false));
    }
    prevOpenRefBlockingOptions.current = open;
  }, [open, editMode, initialValues.id]);

  const handleRecurrenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setRecurrenceMode(value);
    if (value !== 'custom') {
      setCustomRecurrence('');
    }
  };

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      setSubtasks([...subtasks, { id: Date.now(), title: newSubtaskTitle.trim(), completed: false, isNew: true }]);
      setNewSubtaskTitle('');
    }
  };
  const handleRemoveSubtask = (id: number) => {
    setSubtasks(subtasks.filter((st: any) => st.id !== id));
  };
  const handleToggleSubtask = (id: number) => {
    setSubtasks(subtasks.map((st: any) => st.id === id ? { ...st, completed: !st.completed } : st));
  };

  // Utility: Convert local datetime string (YYYY-MM-DDTHH:mm) to UTC ISO string
  function localDateTimeToUTC(localDateTime: string): string {
    // Always treat as local time and convert to UTC
    return new Date(localDateTime).toISOString();
  }

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
      due_date: dueDate ? localDateTimeToUTC(dueDate) : null,
      start_date: startDate ? localDateTimeToUTC(startDate) : null,
      priority: Number(priority),
      recurrence: recurrenceValue,
      project_id: projectId === '' ? undefined : Number(projectId),
      subtasks: subtasks.map((st: any) => ({ title: st.title, completed: st.completed, id: st.isNew ? undefined : st.id })),
      blocked_by: blockedBy,
      blocking: blocking,
      // Reminder fields
      reminder_enabled: reminderEnabled,
      reminder_time: reminderTime ? localDateTimeToUTC(reminderTime) : null,
      reminder_recurring: reminderRecurring || null,
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
        <div className="mb-3">
          <label className="block font-semibold mb-1">Subtasks</label>
          <ul className="mb-2">
            {subtasks.map((st: any) => (
              <li key={st.id} className="flex items-center gap-2 mb-1">
                <input type="checkbox" checked={st.completed} onChange={() => handleToggleSubtask(st.id)} />
                <span className={st.completed ? 'line-through text-gray-400' : ''}>{st.title}</span>
                <button type="button" className="text-red-500 hover:text-red-700 ml-2" onClick={() => handleRemoveSubtask(st.id)}>Remove</button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              className="border rounded px-2 py-1 flex-1"
              value={newSubtaskTitle}
              onChange={e => setNewSubtaskTitle(e.target.value)}
              placeholder="Add a subtask..."
              disabled={loading}
            />
            <button type="button" className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={handleAddSubtask} disabled={loading || !newSubtaskTitle.trim()}>Add</button>
          </div>
        </div>
        <div className="mb-3">
          <label className="block font-semibold mb-1">Dependencies</label>
          <div className="flex flex-col gap-2">
            {/* Blocked By is not directly editable; shown for info only */}
            <div>
              <span className="font-medium">Blocked By:</span>
              <div className="w-full border rounded px-3 py-2 mt-1 bg-gray-50 text-gray-700 text-sm min-h-[2.5rem]">
                {blockedBy.length === 0
                  ? <span className="text-gray-400">None</span>
                  : blockingOptions.filter(t => blockedBy.includes(t.id)).map(t => t.title).join(', ')}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                This list is automatically derived from other tasks' "Blocking" fields. To make this task blocked by another, edit that other task's "Blocking" field to include this task.
              </div>
            </div>
            <div>
              <span className="font-medium">Blocking:</span>
              <Autocomplete
                multiple
                options={blockingOptions}
                getOptionLabel={option => option.title}
                value={blockingOptions.filter(opt => blocking.includes(opt.id))}
                onChange={(_, newValue) => setBlocking(newValue.map(opt => opt.id))}
                loading={blockingOptionsLoading}
                filterSelectedOptions
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={params => (
                  <TextField {...params} label="Select tasks to block" placeholder="Type to filter..." variant="outlined" size="small" />
                )}
                disabled={loading}
              />
              <div className="text-xs text-gray-500 mt-1">
                To block another task, add it to this list. The other task will then show this one in its "Blocked By" list.
              </div>
            </div>
          </div>
        </div>
        <div className="mb-3 flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <label className="block font-semibold mb-1">Reminders</label>
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={reminderEnabled} onChange={e => setReminderEnabled(e.target.checked)} disabled={loading} id="reminder-enabled" />
              <label htmlFor="reminder-enabled" className="text-sm">Enable Reminder</label>
            </div>
            <label className="block text-sm mb-1">Reminder Time</label>
            <input
              type="datetime-local"
              className="w-full border rounded px-3 py-2 mb-2"
              value={reminderTime}
              onChange={e => setReminderTime(e.target.value)}
              disabled={loading || !reminderEnabled}
            />
            <label className="block text-sm mb-1">Reminder Recurrence</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={reminderRecurring}
              onChange={e => setReminderRecurring(e.target.value)}
              disabled={loading || !reminderEnabled}
              placeholder="e.g. DAILY, WEEKLY, or rrule string (optional)"
            />
            <div className="text-xs text-gray-500 mt-1">Leave recurrence blank for one-time reminders. Use iCal RRULE format for advanced recurrence.</div>
          </div>
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
