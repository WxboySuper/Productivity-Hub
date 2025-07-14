import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectForm from './ProjectForm';

const defaultProps = {
  onCreate: vi.fn(),
  onClose: vi.fn(),
  loading: false,
  error: null,
};

describe('ProjectForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create project form', () => {
    render(<ProjectForm {...defaultProps} />);
    
    expect(screen.getByText('📁 New Project')).toBeInTheDocument();
    expect(screen.getByText('Organize your tasks into projects')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Project name...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe your project goals and scope...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument();
  });

  it('renders edit project form with initial data', () => {
    render(
      <ProjectForm 
        {...defaultProps} 
        initialName="Test Project"
        initialDescription="Test Description"
        editMode={true}
      />
    );
    
    expect(screen.getByText('✏️ Edit Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('validates required fields', () => {
    const mockOnCreate = vi.fn();
    render(<ProjectForm {...defaultProps} onCreate={mockOnCreate} />);
    
    // Find the submit button and click it directly
    const submitButton = screen.getByRole('button', { name: /create project/i });
    fireEvent.click(submitButton);

    // Since the submit button should be disabled when name is empty,
    // let's check that the button is disabled instead of looking for error message
    expect(submitButton).toBeDisabled();
    expect(mockOnCreate).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const mockOnCreate = vi.fn();
    render(<ProjectForm {...defaultProps} onCreate={mockOnCreate} />);
    
    const nameInput = screen.getByPlaceholderText('Project name...');
    fireEvent.change(nameInput, { target: { value: 'New Project' } });
    
    const descriptionInput = screen.getByPlaceholderText('Describe your project goals and scope...');
    fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
    
    fireEvent.click(screen.getByRole('button', { name: /create project/i }));

    await waitFor(() => {
      expect(mockOnCreate).toHaveBeenCalledWith({
        name: 'New Project',
        description: 'New Description',
      });
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<ProjectForm {...defaultProps} onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<ProjectForm {...defaultProps} error="Test error message" />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('disables submit button when loading', () => {
    render(<ProjectForm {...defaultProps} loading={true} />);
    
    expect(screen.getByRole('button', { name: /creating.../i })).toBeDisabled();
  });

  it('allows project type selection', () => {
    render(<ProjectForm {...defaultProps} />);
    
    // Check if project type options are available by checking the select element
    // skipcq: JS-0117
    const selectElement = screen.getByDisplayValue(/💼.*Work/);
    expect(selectElement).toBeInTheDocument();
    
    // Check if the options exist in the select
    const options = screen.getAllByRole('option');
    const optionTexts = options.map(option => option.textContent);
    
    expect(optionTexts).toContain('💼 Work');
    expect(optionTexts).toContain('🏠 Personal');
    expect(optionTexts).toContain('🎨 Creative');
  });
});
