import React, { useState } from 'react';

interface ProjectFormProps {
  onCreate: (project: { name: string; description?: string }) => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onCreate, onClose, loading, error }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ name, description: description.trim() ? description : undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col gap-4 border border-blue-200">
        <h3 className="text-xl font-bold mb-2 text-blue-700">Create New Project</h3>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <label className="font-medium">Project Name
          <input
            className="w-full border rounded px-3 py-2 mt-1"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label className="font-medium">Description (optional)
          <textarea
            className="w-full border rounded px-3 py-2 mt-1"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
        </label>
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Project'}
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
