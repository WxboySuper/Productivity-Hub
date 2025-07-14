import React, { useState, useCallback, useEffect } from 'react';
import '../styles/ProjectForm.css';

interface ProjectFormProps {
  onCreate: (project: { name: string; description?: string }) => void;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  initialName?: string;
  initialDescription?: string;
  editMode?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ 
  onCreate, 
  onClose, 
  loading, 
  error, 
  initialName = '', 
  initialDescription = '', 
  editMode = false 
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [projectType, setProjectType] = useState('work');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const projectTypes = [
    { value: 'work', label: 'Work', icon: '💼', color: '#3b82f6', description: 'Professional projects' },
    { value: 'personal', label: 'Personal', icon: '🏠', color: '#10b981', description: 'Personal goals & life' },
    { value: 'creative', label: 'Creative', icon: '🎨', color: '#8b5cf6', description: 'Art, design, writing' },
    { value: 'learning', label: 'Learning', icon: '📚', color: '#f59e0b', description: 'Education & skills' },
    { value: 'health', label: 'Health', icon: '💪', color: '#ef4444', description: 'Fitness & wellness' },
    { value: 'other', label: 'Other', icon: '📂', color: '#6b7280', description: 'Everything else' },
  ];

  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription);
  }, [initialName, initialDescription]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (fieldErrors.name) {
      setFieldErrors(prev => ({ ...prev, name: '' }));
    }
  }, [fieldErrors.name]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = 'Project name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Project name must be at least 2 characters';
    } else if (name.trim().length > 100) {
      errors.name = 'Project name must be less than 100 characters';
    }
    
    if (description.trim().length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onCreate({ 
      name: name.trim(), 
      description: description.trim() ? description.trim() : undefined 
    });
  }, [name, description, onCreate]);

  const currentType = projectTypes.find(t => t.value === projectType);

  return (
    <div className="phub-productive-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="phub-productive-form-container" style={{ 
        maxWidth: '40rem', 
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header - Fixed */}
        <div className="phub-productive-form-header">
          <h2 className="phub-productive-form-title">
            {editMode ? '✏️ Edit Project' : '📁 New Project'}
          </h2>
          <p className="phub-productive-form-subtitle">
            {editMode ? 'Update project details' : 'Organize your tasks into projects'}
          </p>
          <button 
            className="phub-productive-close-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            type="button"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          minHeight: 0 // Important for flex shrinking
        }}>
          <form onSubmit={handleSubmit}>
            <div className="phub-productive-form-body" style={{ paddingBottom: 0 }}>
              {/* Error Display */}
              {error && (
                <div className="phub-error-message" style={{ marginBottom: 'var(--phub-space-sm)' }}>
                  <span>⚠️</span>
                  {error}
                </div>
              )}

              {/* Compact Layout */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 'var(--phub-space-sm)',
                marginBottom: 'var(--phub-space-sm)'
              }}>
                {/* Name Field */}
                <div className={`phub-field-group ${fieldErrors.name ? 'phub-field-error' : ''}`}>
                  <label className="phub-field-label">
                    Project Name <span className="phub-field-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="phub-input"
                    placeholder="Project name..."
                    value={name}
                    onChange={handleNameChange}
                    autoFocus
                  />
                  {fieldErrors.name && (
                    <div className="phub-error-message" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                      <span>⚠️</span>
                      {fieldErrors.name}
                    </div>
                  )}
                  <div className="phub-char-counter" style={{ fontSize: '0.7rem' }}>
                    {name.length}/100
                  </div>
                </div>

                {/* Project Type Dropdown */}
                <div className="phub-field-group">
                  <label className="phub-field-label">Type</label>
                  <select
                    className="phub-select"
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    style={{ 
                      background: `linear-gradient(135deg, ${currentType?.color}08, ${currentType?.color}15)`,
                      borderColor: currentType?.color
                    }}
                  >
                    {projectTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--phub-gray-600)', marginTop: '2px' }}>
                    {currentType?.description}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className={`phub-field-group ${fieldErrors.description ? 'phub-field-error' : ''}`} style={{ marginBottom: 'var(--phub-space-sm)' }}>
                <label className="phub-field-label">Description</label>
                <textarea
                  className="phub-textarea"
                  placeholder="Describe your project goals and scope..."
                  value={description}
                  onChange={handleDescriptionChange}
                  rows={2}
                  style={{ minHeight: '60px' }}
                />
                {fieldErrors.description && (
                  <div className="phub-error-message" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                    <span>⚠️</span>
                    {fieldErrors.description}
                  </div>
                )}
                <div className="phub-char-counter" style={{ fontSize: '0.7rem' }}>
                  {description.length}/500
                </div>
              </div>

              {/* Compact Tips */}
              <div style={{ 
                background: '#f8fafc', 
                borderRadius: '8px', 
                padding: 'var(--phub-space-sm)',
                border: '1px solid #e2e8f0',
                marginBottom: 'var(--phub-space-sm)'
              }}>
                <div style={{ 
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#334155',
                  marginBottom: 'var(--phub-space-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--phub-space-xs)'
                }}>
                  <span>💡</span>
                  <span>Quick Tips</span>
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: 'var(--phub-space-xs)',
                  fontSize: '0.75rem',
                  color: '#475569'
                }}>
                  <div><strong>Clear vision:</strong> Define success</div>
                  <div><strong>Break it down:</strong> Use tasks</div>
                  <div><strong>Set milestones:</strong> Track progress</div>
                  <div><strong>Stay organized:</strong> Group work</div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="phub-form-actions" style={{ 
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          margin: 0,
          padding: 'var(--phub-space-sm) var(--phub-space-lg)',
          flexShrink: 0
        }}>
          <button
            type="button"
            className="phub-btn phub-btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`phub-btn phub-btn-primary ${loading ? 'phub-loading' : ''}`}
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                {editMode ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              <>
                <span style={{ color: currentType?.color }}>{currentType?.icon}</span>
                {editMode ? 'Save Changes' : 'Create Project'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;
