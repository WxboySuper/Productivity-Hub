import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BackgroundProvider, useBackground } from '../context/BackgroundContext';
import BackgroundSwitcher from './BackgroundSwitcher';
import { BackgroundType } from './Background';

// Test component to access context
const TestBackgroundComponent = () => {
  const { backgroundType, setBackgroundType } = useBackground();
  
  return (
    <div>
      <div data-testid="current-background">{backgroundType}</div>
      <button onClick={() => setBackgroundType('neural-network' as BackgroundType)}>
        Change Background
      </button>
    </div>
  );
};

describe('BackgroundContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides default background', () => {
    render(
      <BackgroundProvider>
        <TestBackgroundComponent />
      </BackgroundProvider>
    );
    
    expect(screen.getByTestId('current-background')).toHaveTextContent('creative-dots');
  });

  it('allows changing background', () => {
    render(
      <BackgroundProvider>
        <TestBackgroundComponent />
      </BackgroundProvider>
    );
    
    fireEvent.click(screen.getByText('Change Background'));
    
    expect(screen.getByTestId('current-background')).toHaveTextContent('neural-network');
  });
});

describe('BackgroundSwitcher', () => {
  const defaultProps = {
    currentBackground: 'creative-dots' as BackgroundType,
    onBackgroundChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders background switcher button', () => {
    render(<BackgroundSwitcher {...defaultProps} />);
    
    const button = screen.getByLabelText('Change background style');
    expect(button).toBeInTheDocument();
  });

  it('shows background options when opened', () => {
    render(<BackgroundSwitcher {...defaultProps} />);
    
    fireEvent.click(screen.getByLabelText('Change background style'));
    
    expect(screen.getByText('🎨 Background Style')).toBeInTheDocument();
    expect(screen.getByText('Creative Dots')).toBeInTheDocument();
    expect(screen.getByText('Neural Network')).toBeInTheDocument();
    expect(screen.getByText('Cosmic Waves')).toBeInTheDocument();
  });

  it('calls onBackgroundChange when option is selected', () => {
    const mockOnChange = vi.fn();
    render(<BackgroundSwitcher {...defaultProps} onBackgroundChange={mockOnChange} />);
    
    fireEvent.click(screen.getByLabelText('Change background style'));
    fireEvent.click(screen.getByText('Neural Network'));
    
    expect(mockOnChange).toHaveBeenCalledWith('neural-network');
  });

  it('closes dropdown after selection', () => {
    render(<BackgroundSwitcher {...defaultProps} />);
    
    fireEvent.click(screen.getByLabelText('Change background style'));
    expect(screen.getByText('Creative Dots')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Neural Network'));
    expect(screen.queryByText('Creative Dots')).not.toBeInTheDocument();
  });

  it('shows current background selection', () => {
    render(<BackgroundSwitcher {...defaultProps} />);
    
    fireEvent.click(screen.getByLabelText('Change background style'));
    
    expect(screen.getByText('Current: Creative Dots')).toBeInTheDocument();
  });

  it('highlights currently selected background', () => {
    render(<BackgroundSwitcher {...defaultProps} />);
    
    fireEvent.click(screen.getByLabelText('Change background style'));
    
    const currentOption = screen.getByText('Creative Dots').closest('button');
    expect(currentOption).toHaveClass('border-blue-400', 'bg-blue-50');
  });
});
