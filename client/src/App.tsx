import { Switch, Route, useLocation, Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toast";
import { TooltipProvider } from "./components/ui/tooltip";
import { AppSidebar } from "./components/AppSidebar";
import LoginPage from "./pages/LoginPage";
import logoImg from "@assets/image_1772507398400.png";
import Dashboard from "./pages/Dashboard";
import StudentsPage from "./pages/StudentsPage";
import StudentProfile from "./pages/StudentProfile";
import GradesPage from "./pages/GradesPage";
import PaymentsPage from "./pages/PaymentsPage";
import PaymentStudentPage from "./pages/PaymentStudentPage";
import TeachersPage from "./pages/TeachersPage";
import AccountsPage from "./pages/AccountsPage";
import TrashPage from "./pages/TrashPage";
import SalariesPage from "./pages/SalariesPage";
import FinancialReportPage from "./pages/FinancialReportPage";
import InstitutionsPage from "./pages/InstitutionsPage";
import BackupPage from "./pages/BackupPage";
import SupportPage from "./pages/SupportPage";
import HelpPage from "./pages/HelpPage";
import TeacherProfile from "./pages/TeacherProfile";
import PlatformDataPage from "./pages/PlatformDataPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentPortal from "./pages/StudentPortal";
import SettingsPage from "./pages/SettingsPage";
import TeacherMessagesPage from "./pages/TeacherMessagesPage";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ToastVariant } from "./components/ui/toast";

/* ── Auth Context ── */
interface AuthUser { id: string; name: string; role: string; username: string; }
interface AuthCtx { user: AuthUser | null; logout: () => void; }
export const AuthContext = createContext<AuthCtx>({ user: null, logout: () => {} });
export const useAuth = () => useContext(AuthContext);

/* ── Theme Context ── */
export type Theme = "light" | "dark";
interface ThemeCtx { theme: Theme; setTheme: (t: Theme) => void; toggleTheme: () => void; }
export const ThemeContext = createContext<ThemeCtx>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});
export const useTheme = () => useContext(ThemeContext);

/* ── Toast Context ── */
interface ToastItem { id: string; title: string; description?: string; type: ToastVariant; }
interface ToastCtxType {
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  toasts: ToastItem[];
  dismiss: (id: string) => void;
}
export const ToastContext = createContext<ToastCtxType>({ toast: () => {}, toasts: [], dismiss: () => {} });
export const useGlobalToast = () => useContext(ToastContext);

function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toast = useCallback(({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    const id = Math.random().toString(36).slice(2);
    const type: ToastVariant = variant === "destructive" ? "error" : "success";
    setToasts(p => [...p, { id, title, description, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);
  const dismiss = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toast, toasts, dismiss };
}

/* ── ThemeProvider ── */
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    return stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ── Layout ── */
function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden" dir="rtl">
      <AppSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto relative">
        {/* Watermark — centered, large */}
        <div className="fixed inset-0 z-0 pointer-events-none select-none flex items-center justify-center" aria-hidden="true"
          style={{ left: "0", right: "256px" }}>
          <div className="flex flex-col items-center gap-3 opacity-[0.06] dark:opacity-[0.08]">
            <img src={logoImg} alt="" className="w-64 h-64 object-contain" />
            <p className="text-xl font-black text-foreground text-center leading-snug">
              مكتبة عين الإنجاز<br /><span className="text-base font-bold">للخدمات الطلابية</span>
            </p>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

/* ── Router ── */
function Router() {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user && location !== "/login") return <Redirect to="/login" />;
  if (user && location === "/login") return <Redirect to="/" />;

  if (!user) return (
    <Switch>
      <Route path="/login" component={LoginPage} />
    </Switch>
  );

  // Teacher role — restricted portal (no sidebar, no sensitive data)
  if (user.role === "teacher") {
    return (
      <Switch>
        <Route path="/" component={TeacherDashboard} />
        <Route component={TeacherDashboard} />
      </Switch>
    );
  }

  // Student role — self-service portal (profile, grades, payments only)
  if (user.role === "student") {
    return (
      <Switch>
        <Route path="/" component={StudentPortal} />
        <Route component={StudentPortal} />
      </Switch>
    );
  }

  return (
    <AuthenticatedLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/students" component={StudentsPage} />
        <Route path="/students/:internalId" component={StudentProfile} />
        <Route path="/grades" component={GradesPage} />
        <Route path="/payments" component={PaymentsPage} />
        <Route path="/payments-student" component={PaymentStudentPage} />
        <Route path="/teachers" component={TeachersPage} />
        <Route path="/teachers/:id" component={TeacherProfile} />
        <Route path="/accounts" component={AccountsPage} />
        <Route path="/trash" component={TrashPage} />
        <Route path="/salaries" component={SalariesPage} />
        <Route path="/financial-report" component={FinancialReportPage} />
        <Route path="/institutions" component={InstitutionsPage} />
        <Route path="/platform-data" component={PlatformDataPage} />
        <Route path="/backup" component={BackupPage} />
        <Route path="/support" component={SupportPage} />
        <Route path="/help" component={HelpPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/teacher-messages" component={TeacherMessagesPage} />
        <Route>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-6xl font-black text-gradient">404</p>
              <p className="text-muted-foreground mt-2">الصفحة غير موجودة</p>
            </div>
          </div>
        </Route>
      </Switch>
    </AuthenticatedLayout>
  );
}

/* ── App Root ── */
export default function App() {
  const { toast, toasts, dismiss } = useToasts();

  const { data: user } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    queryClient.clear();
    window.location.href = "/login";
  };

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ user: user ?? null, logout }}>
        <ToastContext.Provider value={{ toast, toasts, dismiss }}>
          <TooltipProvider delayDuration={300}>
            <Router />
            <Toaster toasts={toasts} dismiss={dismiss} />
          </TooltipProvider>
        </ToastContext.Provider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
