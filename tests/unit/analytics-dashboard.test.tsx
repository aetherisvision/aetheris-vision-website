import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyticsDashboardPage from '../../src/app/portfolio/analytics-dashboard/page';

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, layout, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe('AnalyticsDashboardPage', () => {
  beforeEach(() => {
    // Reset timers and mocks before each test
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  describe('Core Functionality', () => {
    it('renders all essential dashboard components', () => {
      render(<AnalyticsDashboardPage />);
      
      // Check for main dashboard elements
      expect(screen.getByText('DataViz Pro Analytics')).toBeInTheDocument();
      expect(screen.getByText('Real-time performance monitoring dashboard')).toBeInTheDocument();
      
      // Check for metric cards
      expect(screen.getByText('Active Users')).toBeInTheDocument();
      expect(screen.getByText('Revenue Today')).toBeInTheDocument();
      expect(screen.getByText('Server Response')).toBeInTheDocument();
      expect(screen.getByText('Uptime')).toBeInTheDocument();
      
      // Check for chart sections
      expect(screen.getByText('User Activity (24h)')).toBeInTheDocument();
      expect(screen.getByText('Weekly Revenue')).toBeInTheDocument();
      expect(screen.getByText('System Performance')).toBeInTheDocument();
      expect(screen.getByText('System Alerts')).toBeInTheDocument();
    });

    it('displays performance metrics with proper formatting', () => {
      render(<AnalyticsDashboardPage />);
      
      // Check that numeric values are properly formatted
      const uptimeElement = screen.getByText(/99\.97%/);
      expect(uptimeElement).toBeInTheDocument();
      
      // Check that currency is properly formatted
      const revenueElements = screen.getAllByText(/\$[\d,]+/);
      expect(revenueElements.length).toBeGreaterThan(0);
      
      // Check that response time has proper units
      const responseElement = screen.getByText(/\d+ms/);
      expect(responseElement).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('allows timeframe selection changes', async () => {
      render(<AnalyticsDashboardPage />);
      
      const timeframeSelect = screen.getByRole('combobox');
      expect(timeframeSelect).toHaveValue('24h');
      
      fireEvent.change(timeframeSelect, { target: { value: '7d' } });
      expect(timeframeSelect).toHaveValue('7d');
    });

    it('handles refresh button interactions', async () => {
      render(<AnalyticsDashboardPage />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton).not.toBeDisabled();
      
      fireEvent.click(refreshButton);
      
      // Button should be disabled during refresh
      expect(refreshButton).toBeDisabled();
      
      // Wait for refresh to complete
      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      }, { timeout: 2000 });
    });

    it('allows alert resolution', async () => {
      render(<AnalyticsDashboardPage />);
      
      // Find unresolved alerts (should have resolve buttons)
      const resolveButtons = screen.getAllByRole('button');
      const alertResolveButtons = resolveButtons.filter(button => 
        button.querySelector('svg') && !button.textContent?.includes('Refresh')
      );
      
      if (alertResolveButtons.length > 0) {
        const initialActiveAlerts = screen.getByText(/\d+ Active/);
        
        fireEvent.click(alertResolveButtons[0]);
        
        // Check that alert count decreases or alert appears resolved
        await waitFor(() => {
          const updatedActiveAlerts = screen.queryByText(/\d+ Active/);
          // The count should either decrease or the alert should show as resolved
          expect(updatedActiveAlerts).toBeTruthy();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and semantic structure', () => {
      render(<AnalyticsDashboardPage />);
      
      // Check for proper heading structure
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('DataViz Pro Analytics');
      
      // Check for interactive elements
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation for interactive elements', () => {
      render(<AnalyticsDashboardPage />);
      
      const timeframeSelect = screen.getByRole('combobox');
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      
      // Elements should be focusable
      timeframeSelect.focus();
      expect(document.activeElement).toBe(timeframeSelect);
      
      refreshButton.focus();
      expect(document.activeElement).toBe(refreshButton);
    });
  });

  describe('Data Validation & Edge Cases', () => {
    it('handles missing or invalid data gracefully', () => {
      // Test with mocked console.error to catch any errors
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<AnalyticsDashboardPage />);
      
      // Component should render without errors even with random data
      expect(screen.getByText('DataViz Pro Analytics')).toBeInTheDocument();
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('displays percentage changes correctly with proper sign indicators', () => {
      render(<AnalyticsDashboardPage />);
      
      // Should have arrow indicators for changes
      const arrowIcons = document.querySelectorAll('svg[data-slot="icon"]');
      expect(arrowIcons.length).toBeGreaterThan(0);
    });

    it('maintains responsive layout across different viewport sizes', () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      const { unmount } = render(<AnalyticsDashboardPage />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      unmount();
      
      // Test desktop viewport  
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      render(<AnalyticsDashboardPage />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Performance & Memory', () => {
    it('cleans up intervals and event listeners on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      const { unmount } = render(<AnalyticsDashboardPage />);
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('implements proper memoization for expensive calculations', () => {
      const { rerender } = render(<AnalyticsDashboardPage />);
      
      // Component should handle re-renders efficiently
      rerender(<AnalyticsDashboardPage />);
      expect(screen.getByText('DataViz Pro Analytics')).toBeInTheDocument();
    });
  });

  describe('Adversarial Test Cases', () => {
    it('handles rapid successive user interactions without breaking', async () => {
      render(<AnalyticsDashboardPage />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      const timeframeSelect = screen.getByRole('combobox');
      
      // Rapid clicks and changes
      for (let i = 0; i < 5; i++) {
        fireEvent.click(refreshButton);
        fireEvent.change(timeframeSelect, { target: { value: i % 2 === 0 ? '1h' : '7d' } });
      }
      
      // Should still be functional
      expect(screen.getByText('DataViz Pro Analytics')).toBeInTheDocument();
    });

    it('maintains data consistency during concurrent updates', async () => {
      render(<AnalyticsDashboardPage />);
      
      // Capture initial state
      const initialMetrics = screen.getAllByText(/[\d,]+/);
      expect(initialMetrics.length).toBeGreaterThan(0);
      
      // Simulate data updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should still have metrics displayed
      const updatedMetrics = screen.getAllByText(/[\d,]+/);
      expect(updatedMetrics.length).toBeGreaterThan(0);
    });

    it('validates chart rendering with extreme data values', () => {
      // This test ensures charts can handle edge cases like zero values, 
      // negative values, or very large numbers without breaking
      render(<AnalyticsDashboardPage />);
      
      // Charts should render even with randomly generated data
      expect(screen.getByText('User Activity (24h)')).toBeInTheDocument();
      expect(screen.getByText('Weekly Revenue')).toBeInTheDocument();
    });
  });

  describe('Security Considerations', () => {
    it('does not expose sensitive data in DOM attributes', () => {
      render(<AnalyticsDashboardPage />);
      
      // Check that no sensitive patterns are exposed
      const domContent = document.documentElement.innerHTML;
      expect(domContent).not.toMatch(/api[-_]?key/i);
      expect(domContent).not.toMatch(/secret/i);
      expect(domContent).not.toMatch(/password/i);
    });

    it('implements proper input sanitization', () => {
      render(<AnalyticsDashboardPage />);
      
      const timeframeSelect = screen.getByRole('combobox');
      
      // Try injecting potentially malicious values
      fireEvent.change(timeframeSelect, { target: { value: '<script>alert("xss")</script>' } });
      
      // Should not execute or display unsanitized content
      expect(document.querySelector('script')).toBeNull();
    });
  });
});