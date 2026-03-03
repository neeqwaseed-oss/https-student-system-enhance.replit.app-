import { useState, useCallback } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

let toastQueue: ((toast: Omit<Toast, "id">) => void)[] = [];

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant }: { title: string; description?: string; variant?: "default" | "destructive" }) => {
    const id = Math.random().toString(36).slice(2);
    const type: ToastType = variant === "destructive" ? "error" : "success";
    const newToast: Toast = { id, title, description, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toast, toasts, dismiss };
}
