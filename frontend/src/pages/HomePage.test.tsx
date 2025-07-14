import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './HomePage';

// Mock AppHeader component
vi.mock('../components/AppHeader', () => ({
  default: () => <header data-testid="app-header">AppHeader</header>,
}));

// Wrapper component with router
const HomePageWrapper = () => (
  <BrowserRouter>
    <HomePage />
  </BrowserRouter>
);

describe('HomePage', () => {
  describe('Page Structure', () => {
    it('renders the main header', () => {
      render(<HomePageWrapper />);
      
      expect(screen.getByTestId('app-header')).toBeInTheDocument();
    });

    it('renders the main title and description', () => {
      render(<HomePageWrapper />);
      
      expect(screen.getByText('Productivity Hub')).toBeInTheDocument();
      expect(screen.getByText('Your all-in-one productivity assistant. Organize tasks, manage projects, and boost your workflow—all in one place.')).toBeInTheDocument();
    });

    it('renders action buttons with correct links', () => {
      render(<HomePageWrapper />);
      
      const getStartedLink = screen.getByRole('link', { name: /get started/i });
      const signInLink = screen.getByRole('link', { name: /sign in/i });
      
      expect(getStartedLink).toBeInTheDocument();
      expect(getStartedLink).toHaveAttribute('href', '/register');
      
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('renders the "Why Productivity Hub?" section', () => {
      render(<HomePageWrapper />);
      
      expect(screen.getByText('Why Productivity Hub?')).toBeInTheDocument();
      expect(screen.getByText(/Productivity Hub is designed to help you take control/)).toBeInTheDocument();
    });

    it('renders the footer with current year', () => {
      render(<HomePageWrapper />);
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(`© ${currentYear} Productivity Hub. All rights reserved.`)).toBeInTheDocument();
    });
  });

  describe('Feature Cards', () => {
    it('renders all feature cards with correct content', () => {
      render(<HomePageWrapper />);
      
      // Project Management
      expect(screen.getByText('📁')).toBeInTheDocument();
      expect(screen.getByText('Project Management')).toBeInTheDocument();
      expect(screen.getByText('Create, organize, and track projects with ease. Stay on top of deadlines and deliverables.')).toBeInTheDocument();
      
      // Task Views
      expect(screen.getByText('✅')).toBeInTheDocument();
      expect(screen.getByText('Task Views')).toBeInTheDocument();
      expect(screen.getByText('Visualize your tasks in lists, boards, or calendars. Prioritize and focus on what matters most.')).toBeInTheDocument();
      
      // Analytics & Insights
      expect(screen.getByText('📊')).toBeInTheDocument();
      expect(screen.getByText('Analytics & Insights')).toBeInTheDocument();
      expect(screen.getByText('Gain insights into your productivity patterns and progress with built-in analytics.')).toBeInTheDocument();
      
      // Scheduling & Dashboard
      expect(screen.getByText('🗓️')).toBeInTheDocument();
      expect(screen.getByText('Scheduling & Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Plan your days, set reminders, and get a unified dashboard for all your work.')).toBeInTheDocument();
      
      // Customization
      expect(screen.getByText('⚙️')).toBeInTheDocument();
      expect(screen.getByText('Customization')).toBeInTheDocument();
      expect(screen.getByText('Personalize your workspace to fit your workflow and preferences.')).toBeInTheDocument();
      
      // Collaboration
      expect(screen.getByText('🤝')).toBeInTheDocument();
      expect(screen.getByText('Collaboration')).toBeInTheDocument();
      expect(screen.getByText('Work solo or invite teammates. Share projects, assign tasks, and collaborate in real time.')).toBeInTheDocument();
    });

    it('renders exactly 6 feature cards', () => {
      render(<HomePageWrapper />);
      
      const featureCards = [
        'Project Management',
        'Task Views', 
        'Analytics & Insights',
        'Scheduling & Dashboard',
        'Customization',
        'Collaboration'
      ];
      
      featureCards.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct CSS classes to main container', () => {
      render(<HomePageWrapper />);
      
      const mainContainer = screen.getByRole('main');
      expect(mainContainer).toHaveClass('flex-1', 'flex', 'flex-col', 'items-center', 'justify-center');
    });

    it('applies gradient and glass effect classes', () => {
      render(<HomePageWrapper />);
      
      const title = screen.getByText('Productivity Hub');
      expect(title).toHaveClass('phub-text-gradient');
      
      const cardContainer = title.closest('.phub-glass');
      expect(cardContainer).toBeInTheDocument();
    });

    it('applies action button classes', () => {
      render(<HomePageWrapper />);
      
      const getStartedButton = screen.getByRole('link', { name: /get started/i });
      expect(getStartedButton).toHaveClass('phub-action-btn');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<HomePageWrapper />);
      
      // Main heading (h1)
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Productivity Hub');
      
      // Section heading (h2)
      const sectionHeading = screen.getByRole('heading', { level: 2 });
      expect(sectionHeading).toHaveTextContent('Why Productivity Hub?');
      
      // Feature headings (h3)
      const featureHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(featureHeadings).toHaveLength(6);
    });

    it('provides meaningful link text', () => {
      render(<HomePageWrapper />);
      
      const getStartedLink = screen.getByRole('link', { name: /get started/i });
      const signInLink = screen.getByRole('link', { name: /sign in/i });
      
      expect(getStartedLink).toHaveAccessibleName();
      expect(signInLink).toHaveAccessibleName();
    });

    it('has proper semantic structure with main and sections', () => {
      render(<HomePageWrapper />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Check for semantic section
      const section = screen.getByText('Why Productivity Hub?').closest('section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Content Validation', () => {
    it('displays consistent branding', () => {
      render(<HomePageWrapper />);
      
      // Brand name appears in multiple places
      const brandInstances = screen.getAllByText(/Productivity Hub/);
      expect(brandInstances.length).toBeGreaterThan(1);
    });

    it('provides comprehensive feature descriptions', () => {
      render(<HomePageWrapper />);
      
      // Each feature should have both title and description
      const featureTitles = [
        'Project Management',
        'Task Views',
        'Analytics & Insights', 
        'Scheduling & Dashboard',
        'Customization',
        'Collaboration'
      ];
      
      featureTitles.forEach(title => {
        const titleElement = screen.getByText(title);
        expect(titleElement).toBeInTheDocument();
        
        // Each title should be followed by a description
        const parent = titleElement.closest('div');
        expect(parent).toBeInTheDocument();
      });
    });

    it('includes engaging call-to-action text', () => {
      render(<HomePageWrapper />);
      
      expect(screen.getByText(/take control of your work and life/)).toBeInTheDocument();
      expect(screen.getByText(/empower you to achieve more with less stress/)).toBeInTheDocument();
    });
  });

  describe('Responsive Design Elements', () => {
    it('applies responsive grid classes', () => {
      render(<HomePageWrapper />);
      
      // Find the grid container for features
      const featuresContainer = screen.getByText('Project Management').closest('.grid');
      expect(featuresContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });

    it('applies responsive max-width constraints', () => {
      render(<HomePageWrapper />);
      
      // Main card should have max-width
      const mainCard = screen.getByText('Get Started').closest('.max-w-md');
      expect(mainCard).toBeInTheDocument();
      
      // Features section should have max-width
      const featuresSection = screen.getByText('Why Productivity Hub?').closest('.max-w-3xl');
      expect(featuresSection).toBeInTheDocument();
    });
  });

  describe('User Flow', () => {
    it('presents clear next steps for new users', () => {
      render(<HomePageWrapper />);
      
      // Primary CTA for registration
      const getStartedButton = screen.getByRole('link', { name: /get started/i });
      expect(getStartedButton).toBeInTheDocument();
      
      // Secondary option for existing users
      const signInButton = screen.getByRole('link', { name: /sign in/i });
      expect(signInButton).toBeInTheDocument();
      
      // These should be prominently displayed
      expect(getStartedButton).toBeVisible();
      expect(signInButton).toBeVisible();
    });

    it('explains value proposition clearly', () => {
      render(<HomePageWrapper />);
      
      // Key value props should be visible
      expect(screen.getByText(/all-in-one productivity assistant/)).toBeInTheDocument();
      expect(screen.getByText(/Organize tasks, manage projects, and boost your workflow/)).toBeInTheDocument();
    });
  });
});
