import { render } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

// Mock the auth module
vi.mock('./auth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

test('renders app without crashing', () => {
  render(<App />);
  // Just check that the app renders without errors
  expect(document.body).toBeInTheDocument();
});
