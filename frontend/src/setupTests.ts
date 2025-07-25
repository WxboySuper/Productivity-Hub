// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock global Notification API for all tests
const mockNotificationConstructor = vi.fn().mockImplementation(function (
  this: Notification,
  title: string,
  options?: NotificationOptions,
) {
  Object.defineProperty(this, "title", {
    value: title,
    writable: false,
    configurable: true,
    enumerable: true,
  });
  Object.defineProperty(this, "body", {
    value: options?.body,
    writable: false,
    configurable: true,
    enumerable: true,
  });
  this.close = vi.fn();
});

// Add static properties to the mock
Object.assign(mockNotificationConstructor, {
  permission: "default" as NotificationPermission,
  requestPermission: vi
    .fn()
    .mockResolvedValue("granted" as NotificationPermission),
});

Object.defineProperty(window, "Notification", {
  value: mockNotificationConstructor,
  configurable: true,
});

// Mock global fetch
global.fetch = vi.fn();
