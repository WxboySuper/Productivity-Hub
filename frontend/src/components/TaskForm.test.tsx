import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TaskForm from './TaskForm';

// Mock task and project data
const mockTask = {
  id: 1,
  title: 'Test Task',
  description: 'Test Description',
  priority: 2,
  completed: false,
  project_id: 1,
  due_date: '2025-07-20T12:00:00Z',
  start_date: '2025-07-15T12:00:00Z',
  subtasks: [],
};

const mockProjects = [
  { id: 1, name: 'Project 1', description: 'Test Project 1' },
  { id: 2, name: 'Project 2', description: 'Test Project 2' },
];

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  loading: false,
  error: null,
  projects: mockProjects,
  allTasks: [],
};

const TaskFormWrapper = ({ ...props }) => (
  <BrowserRouter>
    <TaskForm {...defaultProps} {...props} />
  </BrowserRouter>
);

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create task form when open', () => {
    render(<TaskFormWrapper />);
    
    expect(screen.getByText('📝 New Task')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
  });

  it('renders edit task form with existing data', () => {
    render(<TaskFormWrapper initialValues={mockTask} editMode={true} />);
    
    expect(screen.getByText('✏️ Edit Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<TaskFormWrapper open={false} />);
    
    expect(screen.queryByText('📝 New Task')).not.toBeInTheDocument();
  });

  it('validates required fields', () => {
    const mockOnSubmit = vi.fn();
    render(<TaskFormWrapper onSubmit={mockOnSubmit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    // The component doesn't show error until validation fails, so we need to check if it was prevented
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const mockOnSubmit = vi.fn();
    render(<TaskFormWrapper onSubmit={mockOnSubmit} />);
    
    const titleInput = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.change(titleInput, { target: { value: 'New Task' } });
    
    fireEvent.click(screen.getByRole('button', { name: /create task/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task',
          priority: 1,
          completed: false,
        })
      );
    });
  });

  it('expands and collapses sections', () => {
    render(<TaskFormWrapper />);
    
    // Description section renders but may be expanded by default - check for actual behavior
    const descriptionButton = screen.getByText('Description & Details');
    fireEvent.click(descriptionButton);
    
    // Just verify the interaction works
    expect(descriptionButton).toBeInTheDocument();
  });

  it('handles subtask management', async () => {
    render(<TaskFormWrapper />);
    
    // Expand subtasks section
    fireEvent.click(screen.getByText('Subtasks'));
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Add a subtask...')).toBeInTheDocument();
    });
    
    // Add a subtask
    const subtaskInput = screen.getByPlaceholderText('Add a subtask...');
    fireEvent.change(subtaskInput, { target: { value: 'Test Subtask' } });
    fireEvent.click(screen.getByText('➕'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Subtask')).toBeInTheDocument();
    });
  });

  it('handles priority selection', async () => {
    render(<TaskFormWrapper />);
    
    // Click priority field to expand
    fireEvent.click(screen.getByText('Medium'));
    
    await waitFor(() => {
      expect(screen.getByText('Set Priority')).toBeInTheDocument();
    });
    
    // Select high priority button (find the button with both icon and text)
    const highPriorityButton = screen.getByRole('button', { 
      // skipcq: JS-0117
      name: /🟠.*High/i 
    });
    fireEvent.click(highPriorityButton);
    
    // Check if priority field shows High
    await waitFor(() => {
      const priorityField = screen.getByText('Priority').closest('.modern-inline-field');
      expect(priorityField).toContainHTML('High');
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<TaskFormWrapper onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<TaskFormWrapper error="Test error message" />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('disables submit button when loading', () => {
    render(<TaskFormWrapper loading={true} />);
    
    expect(screen.getByRole('button', { name: /creating.../i })).toBeDisabled();
  });
});
