import { create } from 'zustand';

interface ErrorAlertState {
  message: string | null;
  show(message: string): void;
  dismiss(): void;
}

let timeout: ReturnType<typeof setTimeout> | null = null;

export const useErrorAlert = create<ErrorAlertState>((set) => ({
  message: null,
  show: (message) => {
    if (timeout) clearTimeout(timeout);
    set({ message });
    timeout = setTimeout(() => set({ message: null }), 1000);
  },
  dismiss: () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
    set({ message: null });
  },
}));
