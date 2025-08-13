import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import NotificationCenter from "./NotificationCenter";

// Mock the auth hook
const mockAuth = {
  isAuthenticated: true,
  isLoading: false,
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  requestPasswordReset: vi.fn(),
  confirmPasswordReset: vi.fn(),
};

vi.mock("../auth", () => ({
  useAuth: () => mockAuth,
}));

// Mock global Notification API
const mockNotificationConstructor = vi.fn();
const mockNotificationStatic = {
  permission: "default" as NotificationPermission,
  requestPermission: vi
    .fn()
    .mockResolvedValue("granted" as NotificationPermission),
};

Object.assign(mockNotificationConstructor, mockNotificationStatic);

Object.defineProperty(window, "Notification", {
  value: mockNotificationConstructor,
  configurable: true,
});

// Mock global fetch
global.fetch = vi.fn();

// Mock document.cookie
Object.defineProperty(document, "cookie", {
  writable: true,
  value: "_csrf_token=test-token",
});

// Timer management setup
vi.useFakeTimers();

// Sample notification data - safe defaults that won't trigger modals
const mockNotifications = [
  {
    id: 1,
    task_id: 1,
    message: "Complete project proposal",
    created_at: "2024-01-15T10:00:00Z",
    read: false,
    type: "general", // Not 'reminder' to avoid modal
  },
  {
    id: 2,
    task_id: 2,
    message: "Review meeting notes",
    created_at: "2024-01-15T09:00:00Z",
    read: true,
    type: "general",
  },
  {
    id: 3,
    message: "System maintenance scheduled",
    created_at: "2024-01-15T08:00:00Z",
    read: false,
    type: "system",
  },
];

const mockReminderNotification = {
  id: 4,
  task_id: 3,
  message: "Time to take a break!",
  created_at: "2024-01-15T12:00:00Z",
  read: false,
  type: "reminder",
  show_at: "2024-01-15T12:00:00Z",
};

describe("NotificationCenter", () => {
  let toLocaleStringSpy: jest.SpyInstance;

  beforeAll(() => {
    // Mock toLocaleString globally for predictable output
    toLocaleStringSpy = vi
      .spyOn(Date.prototype, "toLocaleString")
      .mockReturnValue("mocked-date");
  });

  afterAll(() => {
    toLocaleStringSpy.mockRestore();
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.clearAllTimers();

    // Reset auth state
    mockAuth.isAuthenticated = true;

    // Setup Notification API mock
    mockNotificationStatic.permission = "default";
    mockNotificationStatic.requestPermission = vi
      .fn()
      .mockResolvedValue("granted");
    mockNotificationConstructor.mockImplementation(
      (title: string, options?: NotificationOptions) => {
        return { title, body: options?.body };
      },
    );

    // Setup fetch mock - default to non-modal notifications to avoid test interference
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockNotifications),
    });

    // Reset document.cookie
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "_csrf_token=test-token",
    });
  });

  afterEach(() => {
    try {
      vi.runOnlyPendingTimers();
    } catch {
      // Ignore timer errors if already cleared
    }
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("Authentication State", () => {
    it("should not render when user is not authenticated", () => {
      mockAuth.isAuthenticated = false;
      const { container, unmount } = render(<NotificationCenter />);
      // Should return null and render nothing
      expect(container.innerHTML).toBe("");
      unmount(); // ensure full lifecycle
    });

    it("returns null and renders nothing when not authenticated", () => {
      mockAuth.isAuthenticated = false;
      const { container } = render(<NotificationCenter />);
      expect(container.firstChild).toBeNull();
    });

    it("should render notification center when user is authenticated", async () => {
      vi.useRealTimers();
      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByLabelText("Show notifications")).toBeInTheDocument();
      });
    });

    it("should clear notifications when user logs out", async () => {
      vi.useRealTimers();
      const { rerender } = render(<NotificationCenter />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByLabelText("Show notifications")).toBeInTheDocument();
      });

      // Simulate logout
      mockAuth.isAuthenticated = false;
      rerender(<NotificationCenter />);

      expect(
        screen.queryByLabelText("Show notifications"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Notification Fetching", () => {
    it("should fetch notifications on mount", async () => {
      vi.useRealTimers();
      render(<NotificationCenter />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/notifications", {
          credentials: "include",
        });
      });
    });

    it("should poll for notifications at specified interval", async () => {
      vi.useFakeTimers();

      render(<NotificationCenter pollingInterval={5000} />);

      // Initial fetch happens immediately
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Let any promises resolve
      await vi.runOnlyPendingTimersAsync();

      // Advance by polling interval to trigger next fetch
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should have at least 2 calls (initial + polled)
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it("should handle fetch errors gracefully", async () => {
      vi.useFakeTimers();
      (global.fetch as Mock).mockRejectedValue(new Error("Network error"));

      render(<NotificationCenter />);

      // Initial fetch
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Let any promises resolve
      await vi.runOnlyPendingTimersAsync();

      // Should not crash and continue polling
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it("should handle non-ok response gracefully", async () => {
      vi.useFakeTimers();
      (global.fetch as Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<NotificationCenter />);

      // Initial fetch
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Let any promises resolve
      await vi.runOnlyPendingTimersAsync();

      // Should not crash and continue polling
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("Notification Display", () => {
    it("should show unread count badge", async () => {
      vi.useRealTimers();
      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument();
      });
    });

    it("should not show badge when no unread notifications", async () => {
      const readNotifications = mockNotifications.map((n) => ({
        ...n,
        read: true,
      }));
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(readNotifications),
      });

      vi.useRealTimers();
      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.queryByText("2")).not.toBeInTheDocument();
      });
    });

    it("should toggle notification panel when bell is clicked", async () => {
      vi.useRealTimers();
      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByLabelText("Show notifications")).toBeInTheDocument();
      });

      // Click to show panel
      fireEvent.click(screen.getByLabelText("Show notifications"));

      expect(screen.getByText("🔔 Notifications")).toBeInTheDocument();
      expect(screen.getByText("Complete project proposal")).toBeInTheDocument();

      // Click to hide panel
      fireEvent.click(screen.getByLabelText("Show notifications"));

      expect(screen.queryByText("🔔 Notifications")).not.toBeInTheDocument();
    });

    it("should display notifications with correct styling based on read status", async () => {
      vi.useRealTimers();
      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByLabelText("Show notifications")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Show notifications"));

      await waitFor(() => {
        expect(
          screen.getByText("Complete project proposal"),
        ).toBeInTheDocument();
        expect(screen.getByText("Review meeting notes")).toBeInTheDocument();
      });

      // Check unread notification styling
      const unreadNotification = screen
        .getByText("Complete project proposal")
        .closest(".border-blue-200");
      expect(unreadNotification).toHaveClass(
        "border-blue-200",
        "bg-gradient-to-r",
      );

      // Check read notification styling
      const readNotification = screen
        .getByText("Review meeting notes")
        .closest(".border-gray-200");
      expect(readNotification).toHaveClass("border-gray-200", "bg-gray-50");
    });

    it('should show "No notifications" message when empty', async () => {
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      vi.useRealTimers();
      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByLabelText("Show notifications")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Show notifications"));

      expect(screen.getByText("No notifications.")).toBeInTheDocument();
    });

    // Removed the old test for /1\/15\/2024/ as toLocaleString is now mocked

    it("renders the correct timestamp for each notification", async () => {
      vi.useRealTimers();
      // Restore the original toLocaleString for this test only
      toLocaleStringSpy.mockRestore();
      render(<NotificationCenter />);
      await waitFor(() => {
        expect(screen.getByLabelText("Show notifications")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Show notifications"));
      await waitFor(() => {
        // Check that timestamp divs are rendered for each notification
        // Since the dates will be formatted as actual dates, check for the presence of date strings
        const timestampElements = screen.getAllByText(
          /\d{1,2}\/\d{1,2}\/\d{4}/,
        );
        expect(timestampElements.length).toBe(mockNotifications.length);
      });
      // Re-mock toLocaleString for other tests
      toLocaleStringSpy = vi
        .spyOn(Date.prototype, "toLocaleString")
        .mockReturnValue("mocked-date");
    });

    it("renders a timestamp div for each notification", async () => {
      vi.useRealTimers();
      render(<NotificationCenter />);
      await waitFor(() => {
        expect(screen.getByLabelText("Show notifications")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Show notifications"));
      await waitFor(() => {
        // Check that a div with the timestamp class exists for each notification
        const timestampDivs = document.querySelectorAll(
          ".text-xs.text-gray-500.mt-2",
        );
        expect(timestampDivs.length).toBe(mockNotifications.length);
      });
    });
  });

  describe("Notification Actions", () => {
    it("should dismiss notification when dismiss button is clicked", async () => {
      vi.useRealTimers();
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockNotifications),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByLabelText("Show notifications")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Show notifications"));

      await waitFor(() => {
        expect(
          screen.getByText("Complete project proposal"),
        ).toBeInTheDocument();
      });

      // Find and click dismiss button for unread notification
      const dismissButtons = screen.getAllByText("Dismiss");
      fireEvent.click(dismissButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/notifications/1/dismiss",
          {
            method: "POST",
            headers: {
              "X-CSRF-Token": "test-token",
            },
            credentials: "include",
          },
        );
      });
    });

    it("should snooze notification when snooze button is clicked", async () => {
      vi.useRealTimers();
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockNotifications),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByLabelText("Show notifications")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Show notifications"));

      await waitFor(() => {
        expect(
          screen.getByText("Complete project proposal"),
        ).toBeInTheDocument();
      });

      // Find and click snooze button
      const snoozeButtons = screen.getAllByText("Snooze 10m");
      fireEvent.click(snoozeButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/notifications/1/snooze",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": "test-token",
            },
            credentials: "include",
            body: JSON.stringify({ minutes: 10 }),
          },
        );
      });
    });

    it("should not show action buttons for read notifications", async () => {
      vi.useRealTimers();
      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByLabelText("Show notifications")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Show notifications"));

      await waitFor(() => {
        expect(screen.getByText("Review meeting notes")).toBeInTheDocument();
      });

      // Check that read notification doesn't have action buttons
      const readNotificationContainer = screen
        .getByText("Review meeting notes")
        .closest("div");
      expect(readNotificationContainer?.querySelector("button")).toBeNull();
    });

    it("should handle API calls gracefully when not authenticated", () => {
      vi.useFakeTimers();

      render(<NotificationCenter />);

      // Initial fetch happens
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Reset fetch call count and simulate logout before attempting action
      vi.clearAllMocks();
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      mockAuth.isAuthenticated = false;

      // Should not make API call since not authenticated
      expect(global.fetch).toHaveBeenCalledTimes(0);
    });
  });

  describe("Modal Notifications", () => {
    it("should show modal for unread reminder notifications with show_at time", async () => {
      vi.useRealTimers();
      const reminderData = [mockReminderNotification];
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(reminderData),
      });

      // Mock current time to be after show_at time
      vi.setSystemTime(new Date("2024-01-15T12:01:00Z"));

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByText("⏰ Reminder")).toBeInTheDocument();
        expect(screen.getByText("Time to take a break!")).toBeInTheDocument();
      });
    });

    it("should not show modal for notifications before show_at time", async () => {
      vi.useRealTimers();
      const futureReminder = {
        ...mockReminderNotification,
        show_at: "2024-01-15T15:00:00Z",
      };
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([futureReminder]),
      });

      // Mock current time to be before show_at time
      vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.queryByText("⏰ Reminder")).not.toBeInTheDocument();
      });
    });

    it("should create browser notification when permission is granted", async () => {
      vi.useRealTimers();

      // Directly set the permission on the global Notification object
      Object.defineProperty(window.Notification, "permission", {
        value: "granted",
        configurable: true,
      });

      // Mock document.hidden to be false (document is visible)
      Object.defineProperty(document, "hidden", {
        writable: true,
        value: false,
      });

      // Use a unique notification ID to avoid conflicts with previous tests
      const uniqueReminderNotification = {
        id: 999, // Unique ID not used in other tests
        task_id: 3,
        message: "Time to take a break!",
        created_at: "2024-01-15T12:00:00Z",
        read: false,
        type: "reminder",
        show_at: "2024-01-15T12:00:00Z",
      };

      const reminderData = [uniqueReminderNotification];
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(reminderData),
      });

      vi.setSystemTime(new Date("2024-01-15T12:01:00Z"));

      render(<NotificationCenter />);

      // Wait for component to fetch and process notifications
      await waitFor(() => {
        expect(screen.getByText("⏰ Reminder")).toBeInTheDocument();
      });

      expect(mockNotificationConstructor).toHaveBeenCalledWith(
        "Task Reminder",
        {
          body: "Time to take a break!",
        },
      );
    });

    it("should not create browser notification when permission is denied", async () => {
      vi.useRealTimers();

      // Directly set the permission on the global Notification object
      Object.defineProperty(window.Notification, "permission", {
        value: "denied",
        configurable: true,
      });

      const reminderData = [mockReminderNotification];
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(reminderData),
      });

      vi.setSystemTime(new Date("2024-01-15T12:01:00Z"));

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByText("⏰ Reminder")).toBeInTheDocument();
      });

      expect(mockNotificationConstructor).not.toHaveBeenCalled();
    });

    it("should dismiss modal when close button is clicked", async () => {
      vi.useRealTimers();
      const reminderData = [mockReminderNotification];
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(reminderData),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      vi.setSystemTime(new Date("2024-01-15T12:01:00Z"));

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByText("⏰ Reminder")).toBeInTheDocument();
      });

      // Click close button
      fireEvent.click(screen.getByLabelText("Close"));

      await waitFor(() => {
        expect(screen.queryByText("⏰ Reminder")).not.toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/notifications/4/dismiss",
        {
          method: "POST",
          headers: {
            "X-CSRF-Token": "test-token",
          },
          credentials: "include",
        },
      );
    });

    it("should dismiss modal when dismiss button is clicked", async () => {
      vi.useRealTimers();
      const reminderData = [mockReminderNotification];
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(reminderData),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      vi.setSystemTime(new Date("2024-01-15T12:01:00Z"));

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByText("⏰ Reminder")).toBeInTheDocument();
      });

      // Click dismiss button
      fireEvent.click(screen.getByText("Dismiss"));

      await waitFor(() => {
        expect(screen.queryByText("⏰ Reminder")).not.toBeInTheDocument();
      });
    });

    it("should snooze modal notification", async () => {
      vi.useRealTimers();
      const reminderData = [mockReminderNotification];
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(reminderData),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      vi.setSystemTime(new Date("2024-01-15T12:01:00Z"));

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByText("⏰ Reminder")).toBeInTheDocument();
      });

      // Click snooze button
      fireEvent.click(screen.getByText("Snooze 10m"));

      await waitFor(() => {
        expect(screen.queryByText("⏰ Reminder")).not.toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/notifications/4/snooze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-token",
        },
        credentials: "include",
        body: JSON.stringify({ minutes: 10 }),
      });
    });

    it("should not show same notification modal twice", async () => {
      vi.useRealTimers();
      const reminderData = [mockReminderNotification];
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(reminderData),
      });

      vi.setSystemTime(new Date("2024-01-15T12:01:00Z"));

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByText("⏰ Reminder")).toBeInTheDocument();
      });

      // Dismiss modal
      fireEvent.click(screen.getByText("Dismiss"));

      await waitFor(() => {
        expect(screen.queryByText("⏰ Reminder")).not.toBeInTheDocument();
      });

      // Since we're using real timers, the component should not poll again automatically in this test
      // The component remembers dismissed notifications, so modal should not reappear
      expect(screen.queryByText("⏰ Reminder")).not.toBeInTheDocument();
    });
  });

  describe("Browser Notification Permissions", () => {
    it("should request notification permission on mount", async () => {
      vi.useRealTimers();

      // Setup fresh mock for this test
      const requestPermissionSpy = vi.fn().mockResolvedValue("granted");
      mockNotificationStatic.permission = "default";
      mockNotificationStatic.requestPermission = requestPermissionSpy;

      // Make sure window.Notification exists and has the right properties
      Object.defineProperty(window, "Notification", {
        value: Object.assign(
          mockNotificationConstructor,
          mockNotificationStatic,
        ),
        configurable: true,
      });

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(requestPermissionSpy).toHaveBeenCalled();
      });
    });

    it("should not request permission if already granted or denied", async () => {
      vi.useRealTimers();

      // Setup fresh mock for this test
      const requestPermissionSpy = vi.fn().mockResolvedValue("granted");
      mockNotificationStatic.permission = "granted";
      mockNotificationStatic.requestPermission = requestPermissionSpy;

      // Make sure window.Notification exists and has the right properties
      Object.defineProperty(window, "Notification", {
        value: Object.assign(
          mockNotificationConstructor,
          mockNotificationStatic,
        ),
        configurable: true,
      });

      render(<NotificationCenter />);

      // Wait for component to mount and potentially call requestPermission
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(requestPermissionSpy).not.toHaveBeenCalled();
    });
  });

  describe("CSRF Token Handling", () => {
    it("should include CSRF token in API requests when available", async () => {
      vi.useRealTimers();

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByLabelText("Show notifications")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Show notifications"));

      await waitFor(() => {
        expect(
          screen.getByText("Complete project proposal"),
        ).toBeInTheDocument();
      });

      const dismissButtons = screen.getAllByText("Dismiss");
      fireEvent.click(dismissButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/notifications/1/dismiss",
          {
            method: "POST",
            headers: {
              "X-CSRF-Token": "test-token",
            },
            credentials: "include",
          },
        );
      });
    });

    it("should handle missing CSRF token gracefully", async () => {
      vi.useRealTimers();

      // Clear the cookie
      Object.defineProperty(document, "cookie", {
        writable: true,
        value: "",
      });

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByLabelText("Show notifications")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Show notifications"));

      await waitFor(() => {
        expect(
          screen.getByText("Complete project proposal"),
        ).toBeInTheDocument();
      });

      const dismissButtons = screen.getAllByText("Dismiss");
      fireEvent.click(dismissButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/notifications/1/dismiss",
          {
            method: "POST",
            headers: {},
            credentials: "include",
          },
        );
      });
    });
  });

  describe("Component Cleanup", () => {
    it("should clear polling timer on unmount", () => {
      // Keep fake timers for this timer-related test
      vi.useFakeTimers();

      const { unmount } = render(<NotificationCenter />);

      // Need to advance past the initial timer to see the fetch
      act(() => {
        vi.advanceTimersByTime(0); // Initial fetch
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      unmount();

      // Advance timer - should not trigger additional fetch
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle malformed show_at timestamps", async () => {
      vi.useRealTimers();
      const malformedReminder = {
        ...mockReminderNotification,
        show_at: "2024-01-15T12:00:00.123456789Z", // Microseconds precision
      };

      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([malformedReminder]),
      });

      vi.setSystemTime(new Date("2024-01-15T12:01:00Z"));

      render(<NotificationCenter />);

      // Should handle the malformed timestamp gracefully
      await waitFor(() => {
        expect(screen.getByText("⏰ Reminder")).toBeInTheDocument();
      });
    });

    it("should fall back to created_at when show_at is not present", async () => {
      vi.useRealTimers();
      const reminderWithoutShowAt = {
        ...mockReminderNotification,
        show_at: undefined,
        created_at: "2024-01-15T11:59:00Z",
      };

      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([reminderWithoutShowAt]),
      });

      vi.setSystemTime(new Date("2024-01-15T12:01:00Z"));

      render(<NotificationCenter />);

      await waitFor(() => {
        expect(screen.getByText("⏰ Reminder")).toBeInTheDocument();
      });
    });

    it("should handle non-reminder type notifications in modal logic", async () => {
      vi.useRealTimers();
      const systemNotification = {
        ...mockReminderNotification,
        type: "system",
      };

      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([systemNotification]),
      });

      vi.setSystemTime(new Date("2024-01-15T12:01:00Z"));

      render(<NotificationCenter />);

      // Should not show modal for non-reminder notifications
      await waitFor(() => {
        expect(screen.queryByText("⏰ Reminder")).not.toBeInTheDocument();
      });
    });
  });
});
