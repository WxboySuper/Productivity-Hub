import React, { useState, useCallback, useEffect } from "react";

interface ProjectFormHeaderProps {
  editMode: boolean;
  handleCloseButtonClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}
const ProjectFormHeader: React.FC<ProjectFormHeaderProps> = ({
  editMode,
  handleCloseButtonClick,
}) => (
  <div className="phub-productive-form-header">
    <h2 className="phub-productive-form-title">
      {editMode ? "✏️ Edit Project" : "📁 New Project"}
    </h2>
    <p className="phub-productive-form-subtitle">
      {editMode
        ? "Update project details"
        : "Organize your tasks into projects"}
    </p>
    <button
      className="phub-productive-close-btn"
      onClick={handleCloseButtonClick}
      type="button"
    >
      ×
    </button>
  </div>
);

interface ProjectFormBodyProps {
  name: string;
  description: string;
  projectType: string;
  fieldErrors: Record<string, string>;
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleProjectTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  projectTypes: Array<{
    value: string;
    label: string;
    icon: string;
    color: string;
    description: string;
  }>;
  currentType?: {
    value: string;
    label: string;
    icon: string;
    color: string;
    description: string;
  };
  error: string | null;
}
const ProjectNameField: React.FC<{
  name: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ name, error, onChange }) => (
  <div className={`phub-field-group${error ? " phub-field-error" : ""}`}>
    <label className="phub-field-label" htmlFor="project-name">
      Project Name <span className="phub-field-required">*</span>
    </label>
    <input
      id="project-name"
      type="text"
      className="phub-input"
      placeholder="Project name..."
      value={name}
      onChange={onChange}
    />
    {error && (
      <div
        className="phub-error-message"
        style={{ fontSize: "0.75rem", marginTop: "2px" }}
      >
        <span>⚠️</span>
        {error}
      </div>
    )}
    <div className="phub-char-counter" style={{ fontSize: "0.7rem" }}>
      {name.length}/100
    </div>
  </div>
);

const ProjectTypeField: React.FC<{
  projectType: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  projectTypes: Array<{
    value: string;
    label: string;
    icon: string;
    color: string;
    description: string;
  }>;
  currentType?: {
    value: string;
    label: string;
    icon: string;
    color: string;
    description: string;
  };
}> = ({ projectType, onChange, projectTypes, currentType }) => (
  <div className="phub-field-group">
    <label className="phub-field-label" htmlFor="project-type">
      Type
    </label>
    <select
      id="project-type"
      className="phub-select"
      value={projectType}
      onChange={onChange}
      style={{
        background: `linear-gradient(135deg, ${currentType?.color}08, ${currentType?.color}15)`,
        borderColor: currentType?.color,
      }}
    >
      {projectTypes.map((type) => (
        <option key={type.value} value={type.value}>
          {type.icon} {type.label}
        </option>
      ))}
    </select>
    <div
      style={{
        fontSize: "0.75rem",
        color: "var(--phub-gray-600)",
        marginTop: "2px",
      }}
    >
      {currentType?.description}
    </div>
  </div>
);

const ProjectDescriptionField: React.FC<{
  description: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}> = ({ description, error, onChange }) => (
  <div
    className={`phub-field-group${error ? " phub-field-error" : ""}`}
    style={{ marginBottom: "var(--phub-space-sm)" }}
  >
    <label className="phub-field-label" htmlFor="project-description">
      Description
    </label>
    <textarea
      id="project-description"
      className="phub-textarea"
      placeholder="Describe your project goals and scope..."
      value={description}
      onChange={onChange}
      rows={2}
      style={{ minHeight: "60px" }}
    />
    {error && (
      <div
        className="phub-error-message"
        style={{ fontSize: "0.75rem", marginTop: "2px" }}
      >
        <span>⚠️</span>
        {error}
      </div>
    )}
    <div className="phub-char-counter" style={{ fontSize: "0.7rem" }}>
      {description.length}/500
    </div>
  </div>
);

const ProjectFormBody: React.FC<ProjectFormBodyProps> = ({
  name,
  description,
  projectType,
  fieldErrors,
  handleNameChange,
  handleDescriptionChange,
  handleProjectTypeChange,
  projectTypes,
  currentType,
  error,
}) => (
  <div className="phub-productive-form-body" style={{ paddingBottom: 0 }}>
    {error && (
      <div
        data-testid="project-error"
        className="phub-error-message"
        style={{ marginBottom: "var(--phub-space-sm)" }}
      >
        <span>⚠️</span>
        {error}
      </div>
    )}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "var(--phub-space-sm)",
        marginBottom: "var(--phub-space-sm)",
      }}
    >
      <ProjectNameField
        name={name}
        error={fieldErrors.name}
        onChange={handleNameChange}
      />
      <ProjectTypeField
        projectType={projectType}
        onChange={handleProjectTypeChange}
        projectTypes={projectTypes}
        currentType={currentType}
      />
    </div>
    <ProjectDescriptionField
      description={description}
      error={fieldErrors.description}
      onChange={handleDescriptionChange}
    />
  </div>
);

const ProjectFormTips: React.FC = () => (
  <div
    style={{
      background: "#f8fafc",
      borderRadius: "8px",
      padding: "var(--phub-space-sm)",
      border: "1px solid #e2e8f0",
      marginBottom: "var(--phub-space-sm)",
    }}
  >
    <div
      style={{
        fontSize: "0.85rem",
        fontWeight: "600",
        color: "#334155",
        marginBottom: "var(--phub-space-xs)",
        display: "flex",
        alignItems: "center",
        gap: "var(--phub-space-xs)",
      }}
    >
      <span>💡</span>
      <span>Quick Tips</span>
    </div>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "var(--phub-space-xs)",
        fontSize: "0.75rem",
        color: "#475569",
      }}
    >
      <div>
        <strong>Clear vision:</strong> Define success
      </div>
      <div>
        <strong>Break it down:</strong> Use tasks
      </div>
      <div>
        <strong>Set milestones:</strong> Track progress
      </div>
      <div>
        <strong>Stay organized:</strong> Group work
      </div>
    </div>
  </div>
);

interface ProjectFormFooterProps {
  onClose: () => void;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  name: string;
  editMode: boolean;
  currentType?: { icon: string; color: string };
}

const ProjectFormFooter: React.FC<ProjectFormFooterProps> = ({
  onClose,
  loading,
  handleSubmit,
  name,
  editMode,
  currentType,
}) => (
  <div
    className="phub-form-actions"
    style={{
      borderTop: "1px solid #e2e8f0",
      background: "#f8fafc",
      margin: 0,
      padding: "var(--phub-space-sm) var(--phub-space-lg)",
      flexShrink: 0,
    }}
  >
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
      className={`phub-btn phub-btn-primary ${loading ? "phub-loading" : ""}`}
      onClick={handleSubmit}
      disabled={loading || !name.trim()}
    >
      {loading ? (
        <>
          <span style={{ animation: "spin 1s linear infinite" }}>⏳</span>
          {editMode ? "Saving..." : "Creating..."}
        </>
      ) : (
        <>
          <span style={{ color: currentType?.color }}>{currentType?.icon}</span>
          {editMode ? "Save Changes" : "Create Project"}
        </>
      )}
    </button>
  </div>
);
import "../styles/ProjectForm.css";

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
  initialName = "",
  initialDescription = "",
  editMode = false,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [projectType, setProjectType] = useState("work");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const projectTypes = [
    {
      value: "work",
      label: "Work",
      icon: "💼",
      color: "#3b82f6",
      description: "Professional projects",
    },
    {
      value: "personal",
      label: "Personal",
      icon: "🏠",
      color: "#10b981",
      description: "Personal goals & life",
    },
    {
      value: "creative",
      label: "Creative",
      icon: "🎨",
      color: "#8b5cf6",
      description: "Art, design, writing",
    },
    {
      value: "learning",
      label: "Learning",
      icon: "📚",
      color: "#f59e0b",
      description: "Education & skills",
    },
    {
      value: "health",
      label: "Health",
      icon: "💪",
      color: "#ef4444",
      description: "Fitness & wellness",
    },
    {
      value: "other",
      label: "Other",
      icon: "📂",
      color: "#6b7280",
      description: "Everything else",
    },
  ];

  useEffect(() => {
    setName(initialName);
    setDescription(initialDescription);
  }, [initialName, initialDescription]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
      if (fieldErrors.name) {
        setFieldErrors((prev) => ({ ...prev, name: "" }));
      }
    },
    [fieldErrors.name],
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDescription(e.target.value);
    },
    [],
  );

  const handleProjectTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setProjectType(e.target.value);
    },
    [],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleCloseButtonClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    },
    [onClose],
  );

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Project name is required";
    } else if (name.trim().length < 2) {
      errors.name = "Project name must be at least 2 characters";
    } else if (name.trim().length > 100) {
      errors.name = "Project name must be less than 100 characters";
    }

    if (description.trim().length > 500) {
      errors.description = "Description must be less than 500 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      onCreate({
        name: name.trim(),
        description: description.trim() ? description.trim() : undefined,
      });
    },
    [name, description, onCreate],
  );

  const currentType = projectTypes.find((t) => t.value === projectType);

  const handleBackdropKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      /* v8 ignore start */
      if (e.key === "Escape") {
        onClose();
      }
      /* v8 ignore stop */
    },
    [onClose],
  );

  return (
    // skipcq: JS-0760
    <div
      className="phub-productive-modal-backdrop"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
    >
      <div
        className="phub-productive-form-container"
        style={{
          maxWidth: "40rem",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ProjectFormHeader
          editMode={editMode}
          handleCloseButtonClick={handleCloseButtonClick}
        />
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <form onSubmit={handleSubmit}>
            <ProjectFormBody
              name={name}
              description={description}
              projectType={projectType}
              fieldErrors={fieldErrors}
              handleNameChange={handleNameChange}
              handleDescriptionChange={handleDescriptionChange}
              handleProjectTypeChange={handleProjectTypeChange}
              projectTypes={projectTypes}
              currentType={currentType}
              error={error}
            />
            <ProjectFormTips />
          </form>
        </div>
        <ProjectFormFooter
          onClose={onClose}
          loading={loading}
          handleSubmit={handleSubmit}
          name={name}
          editMode={editMode}
          currentType={currentType}
        />
      </div>
    </div>
  );
};

export default ProjectForm;
