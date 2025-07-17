import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import MainManagementWindow from '../MainManagementWindow';
import { AuthProvider } from '../../auth';
import { BackgroundProvider } from '../../context/BackgroundContext';
import { ToastProvider } from '../../components/ToastProvider';
import {
  setupFetchMock,
  setupBeforeEach,
  mockAuth,
  mockBackgroundContext,
  mockToastContext,
  mockNavigate,
} from '../__tests__/testUtils';

// Setup global fetch mock
setupFetchMock();

// Mock AuthProvider
vi.mock('../../auth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
  useAuth: () => mockAuth,
}));

// Mock BackgroundProvider
vi.mock('../../context/BackgroundContext', () => ({
  BackgroundProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="background-provider">{children}</div>
  ),
  useBackground: () => mockBackgroundContext,
}));

// Mock ToastProvider
vi.mock('../../components/ToastProvider', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toast-provider">{children}</div>
  ),
  useToast: () => mockToastContext,
}));

// Mock router navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the BackgroundSwitcher component
vi.mock('../../components/BackgroundSwitcher', () => ({
  default: ({
    currentBackground,
    onBackgroundChange,
  }: {
    currentBackground: string;
    onBackgroundChange: (type: string) => void;
  }) => (
    <button
      data-testid="background-switcher"
      onClick={() => onBackgroundChange('neural-network')}
    >
      Background: {currentBackground}
    </button>
  ),
}));

const MainManagementWindowWrapper: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <BackgroundProvider>
        <ToastProvider>
          <MainManagementWindow />
        </ToastProvider>
      </BackgroundProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('MainManagementWindow - Background Management', () => {
  beforeEach(() => {
    setupBeforeEach();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Background Changes', () => {
    it('changes background when background switcher is used', () => {
      act(() => {
        render(<MainManagementWindowWrapper />);
      });
      
      const backgroundSwitcher = screen.getByTestId('background-switcher');
      act(() => {
        fireEvent.click(backgroundSwitcher);
      });
      
      expect(mockBackgroundContext.setBackgroundType).toHaveBeenCalledWith('neural-network');
    });
  });
});