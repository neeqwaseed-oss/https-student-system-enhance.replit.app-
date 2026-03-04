import { Link, useLocation } from "wouter";
import { useAuth, useTheme } from "../App";
import {
  LayoutDashboard, Users, GraduationCap, Wallet, BookOpen,
  UserCog, Trash2, LogOut, Moon, Sun, ChevronDown,
  ChevronRight, Building2, Database, HelpCircle,
  MessageSquare, DollarSign, BarChart3, Shield, UserPlus,
  FileText, RefreshCcw, KeyRound, Settings
} from "lucide-react";
import { useState } from "react";
import logoImg from "@assets/image_1772507398400.png";

const roleLabels: Record<string, string> = {
  admin: "مدير النظام",
  moderator: "مشرف",
  staff: "موظف",
  teacher: "مدرس",
  student: "طالب",
};

const roleGrads: Record<string, string> = {
  admin: "#8B5CF6, #7C3AED",
  moderator: "#3B82F6, #4F46E5",
  staff: "#10B981, #0D9488",
  teacher: "#F59E0B, #EA580C",
  student: "#F43F5E, #DB2777",
};

interface NavChild {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  label: string;
  icon: React.ElementType;
  color: string;
  href?: string;
  children?: NavChild[];
}

const sections: NavSection[] = [
  {
    label: "لوحة التحكم",
    icon: LayoutDashboard,
    color: "#8B5CF6",
    href: "/",
  },
  {
    label: "إدارة الحسابات",
    icon: Shield,
    color: "#06B6D4",
    href: "/accounts",
  },
  {
    label: "إدارة المشتركين",
    icon: Users,
    color: "#3B82F6",
    children: [
      { href: "/students", label: "جميع المشتركين", icon: Users },
      { href: "/grades", label: "الدرجات", icon: GraduationCap },
      { href: "/payments-student", label: "سداد مشتركات", icon: Wallet },
      { href: "/students?new=1", label: "إضافة مشترك جديد", icon: UserPlus },
      { href: "/platform-data", label: "بيانات المنصة", icon: KeyRound },
    ],
  },
  {
    label: "إدارة المدرسين",
    icon: BookOpen,
    color: "#F43F5E",
    children: [
      { href: "/teachers", label: "جميع المدرسين", icon: BookOpen },
      { href: "/salaries", label: "إدارة الرواتب", icon: DollarSign },
      { href: "/teacher-messages", label: "رسائل المدرسين", icon: MessageSquare },
    ],
  },
  {
    label: "النظام المالي",
    icon: BarChart3,
    color: "#F59E0B",
    children: [
      { href: "/financial-report", label: "التقرير المالي", icon: BarChart3 },
      { href: "/payments", label: "كشف المدفوعات", icon: FileText },
    ],
  },
  {
    label: "الجهة التعليمية",
    icon: Building2,
    color: "#10B981",
    href: "/institutions",
  },
  {
    label: "البيانات والنسخ الاحتياطي",
    icon: Database,
    color: "#6366F1",
    children: [
      { href: "/backup", label: "إدارة النسخ الاحتياطية", icon: Database },
      { href: "/trash", label: "سلة المحذوفات", icon: Trash2 },
      { href: "/payments", label: "تصدير جميع البيانات", icon: RefreshCcw },
    ],
  },
  {
    label: "الدعم الفني",
    icon: MessageSquare,
    color: "#EC4899",
    href: "/support",
  },
  {
    label: "المساعدة والدعم",
    icon: HelpCircle,
    color: "#64748B",
    href: "/help",
  },
  {
    label: "إعدادات النظام",
    icon: Settings,
    color: "#8B5CF6",
    href: "/settings",
  },
];

function NavSectionItem({ section }: { section: NavSection }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(() => {
    if (section.href) return false;
    return section.children?.some(c => location === c.href || location.startsWith(c.href.split("?")[0])) ?? false;
  });

  const isActiveHref = section.href
    ? (section.href === "/" ? location === "/" : location.startsWith(section.href))
    : false;

  if (section.href) {
    return (
      <Link href={section.href}>
        <button
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          style={isActiveHref
            ? { background: `linear-gradient(135deg, ${section.color}, ${section.color}cc)`, color: "white", boxShadow: "0 4px 14px rgba(0,0,0,0.25)" }
            : { color: "hsl(var(--sidebar-foreground) / 0.65)", background: "transparent" }
          }
          onMouseEnter={e => { if (!isActiveHref) { const el = e.currentTarget as HTMLElement; el.style.background = "hsl(var(--sidebar-accent))"; el.style.color = "hsl(var(--sidebar-foreground))"; } }}
          onMouseLeave={e => { if (!isActiveHref) { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "hsl(var(--sidebar-foreground) / 0.65)"; } }}
          data-testid={`nav-${section.href.replace("/", "") || "home"}`}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={isActiveHref ? { background: "rgba(255,255,255,0.2)" } : { background: `${section.color}22` }}>
            <section.icon className="h-3.5 w-3.5" style={isActiveHref ? {} : { color: section.color }} />
          </div>
          <span className="flex-1 text-right">{section.label}</span>
          {isActiveHref && <ChevronRight className="h-3 w-3 opacity-60" />}
        </button>
      </Link>
    );
  }

  const isChildActive = section.children?.some(c => location === c.href.split("?")[0] || location.startsWith(c.href.split("?")[0]));

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
        style={isChildActive
          ? { color: "white", background: `${section.color}22` }
          : { color: "hsl(var(--sidebar-foreground) / 0.65)", background: "transparent" }
        }
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "hsl(var(--sidebar-accent))"; el.style.color = "hsl(var(--sidebar-foreground))"; }}
        onMouseLeave={e => { if (!isChildActive) { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "hsl(var(--sidebar-foreground) / 0.65)"; } else { const el = e.currentTarget as HTMLElement; el.style.background = `${section.color}22`; el.style.color = "white"; } }}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${section.color}22` }}>
          <section.icon className="h-3.5 w-3.5" style={{ color: section.color }} />
        </div>
        <span className="flex-1 text-right">{section.label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 opacity-50 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-0.5 mb-1 mr-4 pr-3 space-y-0.5" style={{ borderRight: `2px solid ${section.color}44` }}>
          {section.children?.map(child => {
            const childHref = child.href.split("?")[0];
            const isActive = location === childHref || (childHref !== "/" && location.startsWith(childHref));
            return (
              <Link key={child.href} href={child.href}>
                <button
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
                  style={isActive
                    ? { background: `${section.color}22`, color: section.color }
                    : { color: "hsl(var(--sidebar-foreground) / 0.55)", background: "transparent" }
                  }
                  onMouseEnter={e => { if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.background = "hsl(var(--sidebar-accent))"; el.style.color = "hsl(var(--sidebar-foreground))"; } }}
                  onMouseLeave={e => { if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "hsl(var(--sidebar-foreground) / 0.55)"; } }}
                  data-testid={`nav-${childHref.replace("/", "")}`}
                >
                  <child.icon className="h-3 w-3 shrink-0" />
                  <span>{child.label}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full mr-auto" style={{ background: section.color }} />}
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      className="flex flex-col h-full w-64 shrink-0"
      style={{ background: "hsl(var(--sidebar))", borderLeft: "1px solid hsl(var(--sidebar-border))" }}
      dir="rtl"
    >
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg flex items-center justify-center"
              style={{ background: "white", border: "1.5px solid rgba(139,92,246,0.3)" }}>
              <img src={logoImg} alt="عين الإنجاز" className="w-10 h-10 object-contain" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-white leading-tight truncate">عين الإنجاز</p>
            <p className="text-[10px] mt-0.5 truncate" style={{ color: "hsl(var(--sidebar-muted))" }}>
              للخدمات الطلابية
            </p>
          </div>
        </div>
        <div className="mt-3 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--sidebar-border)), transparent)" }} />
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5 pb-2 scrollbar-thin">
        <p className="text-[9px] font-black uppercase tracking-widest px-2 mb-2 mt-1" style={{ color: "hsl(var(--sidebar-muted))" }}>
          القائمة الرئيسية
        </p>
        {sections.map((section, i) => (
          <NavSectionItem key={i} section={section} />
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="px-3 pb-4 pt-2 space-y-2" style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
          style={{ color: "hsl(var(--sidebar-foreground) / 0.6)" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "hsl(var(--sidebar-accent))"; el.style.color = "hsl(var(--sidebar-foreground))"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "hsl(var(--sidebar-foreground) / 0.6)"; }}
          data-testid="button-toggle-theme"
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: theme === "dark" ? "rgba(251,191,36,0.15)" : "rgba(139,92,246,0.15)" }}>
            {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-violet-400" />}
          </div>
          <span>{theme === "dark" ? "وضع النهار" : "وضع الليل"}</span>
        </button>

        {user && (
          <div className="rounded-xl p-3" style={{ background: "hsl(var(--sidebar-accent))" }}>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-md shrink-0"
                style={{ background: `linear-gradient(135deg, ${roleGrads[user.role] || "#8B5CF6, #7C3AED"})` }}>
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] truncate" style={{ color: "hsl(var(--sidebar-muted))" }}>
                  {roleLabels[user.role] || user.role}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{ color: "rgb(251,113,133)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(244,63,94,0.12)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              data-testid="button-logout"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        )}

        {/* Copyright Footer */}
        <div className="pt-3 mt-2" style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}>
          <div className="flex items-center gap-2 px-1 opacity-40">
            <img src={logoImg} alt="" className="w-5 h-5 object-contain shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold leading-tight" style={{ color: "hsl(var(--sidebar-muted))" }}>
                © {new Date().getFullYear()} عين الإنجاز
              </p>
              <p className="text-[8px] leading-tight truncate" style={{ color: "hsl(var(--sidebar-muted))" }}>
                جميع الحقوق محفوظة
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
