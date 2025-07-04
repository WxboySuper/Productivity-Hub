import React, { useState, useCallback, useEffect } from 'react';

interface ProjectFormProps {
  onCreate: (project: { name: string; description?: string }) => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  initialName?: string;
  initialDescription?: string;
  editMode?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onCreate, onClose, loading, error, initialName = '', initialDescription = '', editMode = false }) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription);
  }, [initialName, initialDescription]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value), []);
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value), []);
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ name, description: description.trim() ? description : undefined });
  }, [name, description, onCreate]);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col gap-4 border border-blue-200">
        <h3 className="text-xl font-bold mb-2 text-blue-700">{editMode ? 'Edit Project' : 'Create New Project'}</h3>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <label className="font-medium">Project Name
          <input
            className="w-full border rounded px-3 py-2 mt-1"
            type="text"
            value={name}
            onChange={handleNameChange}
            required
          />
        </label>
        <label className="font-medium">Description (optional)
          <textarea
            className="w-full border rounded px-3 py-2 mt-1"
            value={description}
            onChange={handleDescriptionChange}
            rows={3}
          />
        </label>
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            className={`flex-1 ${editMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold py-2 rounded transition`}
            disabled={loading}
          >
            {loading ? (editMode ? 'Saving...' : 'Creating...') : (editMode ? 'Save Changes' : 'Create Project')}
          </button>
          <button
            type="button"
            className="flex-1 bg-gray-100 text-blue-700 font-semibold py-2 rounded hover:bg-gray-200 transition"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;
