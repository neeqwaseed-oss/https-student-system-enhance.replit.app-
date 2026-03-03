import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastProps {
  id: string;
  title: string;
  description?: string;
  type?: ToastVariant;
  onDismiss: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const styles = {
  success: "border-green-500/30 bg-green-50 dark:bg-green-950/50",
  error: "border-red-500/30 bg-red-50 dark:bg-red-950/50",
  warning: "border-amber-500/30 bg-amber-50 dark:bg-amber-950/50",
  info: "border-blue-500/30 bg-blue-50 dark:bg-blue-950/50",
};

const iconStyles = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-blue-600 dark:text-blue-400",
};

export function Toast({ id, title, description, type = "info", onDismiss }: ToastProps) {
  const Icon = icons[type];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 shadow-lg max-w-sm w-full animate-fade-in",
        styles[type]
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", iconStyles[type])} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button onClick={() => onDismiss(id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toaster({ toasts, dismiss }: { toasts: Array<{ id: string; title: string; description?: string; type: ToastVariant }>; dismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-h-screen overflow-hidden">
      {toasts.map(t => (
        <Toast key={t.id} {...t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
