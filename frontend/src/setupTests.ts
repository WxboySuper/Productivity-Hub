// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock global Notification API for testing
const mockNotificationConstructor = function(this: Notification, title: string, options?: NotificationOptions) {
  Object.defineProperty(this, 'title', {
    value: title,
    writable: false,
    configurable: true,
    enumerable: true,
  });
  Object.defineProperty(this, 'body', {
    value: options?.body,
    writable: false,
    configurable: true,
    enumerable: true,
  });
  this.close = () => {
    throw new Error('Method not implemented.');
  };
};

mockNotificationConstructor.permission = 'default' as NotificationPermission;
mockNotificationConstructor.requestPermission = () => Promise.resolve('granted' as NotificationPermission);

Object.defineProperty(global, 'Notification', {
  value: mockNotificationConstructor,
  configurable: true,
});
