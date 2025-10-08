// This is a simple wrapper around the design system toast
// In a real implementation, you would import and use the actual toast from @uts/design-system/ui

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

// Simple toast implementation for now
// TODO: Replace with actual @uts/design-system/ui toast when available
export function showToast(type: ToastType, message: string, options?: ToastOptions) {
  // For now, we'll use a simple alert - replace with actual toast component
  console.log(`${type.toUpperCase()}: ${message}`, options);

  // In a real implementation, this would trigger the design system toast
  // Example: toast({ variant: type, title: message, ...options });
}

export const toast = {
  success: (message: string, options?: ToastOptions) => showToast('success', message, options),
  error: (message: string, options?: ToastOptions) => showToast('error', message, options),
  warning: (message: string, options?: ToastOptions) => showToast('warning', message, options),
  info: (message: string, options?: ToastOptions) => showToast('info', message, options),
};
