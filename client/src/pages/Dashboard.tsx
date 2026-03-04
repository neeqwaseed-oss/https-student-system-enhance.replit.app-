import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Users, Wallet, UserCheck, TrendingUp, GraduationCap, BookOpen,
  ArrowLeft, Star, Activity, Building2, DollarSign, BarChart3, HelpCircle,
  RefreshCw
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/App";
import type { Student, Payment } from "@shared/schema";

interface Stats {
  totalStudents: number;
  activeStudents: number;
  totalPayments: number;
  totalRevenue: number;
  totalTeachers: number;
}

const statCards = [
  { key: "totalStudents" as keyof Stats, label: "إجمالي المشتركين", icon: Users, grad: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)", glow: "rgba(139,92,246,0.35)", href: "/students" },
  { key: "activeStudents" as keyof Stats, label: "المشتركون النشطون", icon: UserCheck, grad: "linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)", glow: "rgba(16,185,129,0.35)", href: "/students" },
  { key: "totalRevenue" as keyof Stats, label: "إجمالي الإيرادات", icon: TrendingUp, grad: "linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)", glow: "rgba(245,158,11,0.35)", href: "/payments", currency: true },
  { key: "totalPayments" as keyof Stats, label: "عدد المدفوعات", icon: Wallet, grad: "linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)", glow: "rgba(59,130,246,0.35)", href: "/payments" },
  { key: "totalTeachers" as keyof Stats, label: "المدرسون", icon: BookOpen, grad: "linear-gradient(135deg, #F43F5E 0%, #E11D48 50%, #BE123C 100%)", glow: "rgba(244,63,94,0.35)", href: "/teachers" },
];

function StatCard({ stat, value, idx }: { stat: typeof statCards[number]; value: number; idx: number }) {
  const Icon = stat.icon;
  const display = stat.currency ? formatCurrency(value) : value.toLocaleString("ar");

  return (
    <Link href={stat.href}>
      <div className="relative rounded-2xl p-5 overflow-hidden cursor-pointer group animate-fade-in"
        style={{ background: stat.grad, boxShadow: `0 8px 32px ${stat.glow}, 0 2px 8px rgba(0,0,0,0.1)`, animationDelay: `${idx * 0.08}s` }}>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)" }} />
        <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <Activity className="h-4 w-4 text-white/40 group-hover:text-white/60 transition-colors" />
          </div>
          <p className="text-3xl font-black text-white mb-1 leading-none">{display}</p>
          <p className="text-xs font-semibold text-white/75">{stat.label}</p>
        </div>
        <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
          <ArrowLeft className="h-4 w-4 text-white/60" />
        </div>
      </div>
    </Link>
  );
}

function InstitutionBarChart({ students }: { students: Student[] }) {
  const grouped = students.reduce((acc, s) => {
    const inst = s.institution || "غير محدد";
    acc[inst] = (acc[inst] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(...data.map(d => d[1]), 1);

  const colors = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#F43F5E", "#06B6D4", "#EC4899", "#6366F1"];

  if (data.length === 0) return <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">لا بيانات</div>;

  return (
    <div className="space-y-3">
      {data.map(([inst, count], i) => (
        <div key={inst} className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground text-right truncate" style={{ minWidth: "90px", maxWidth: "90px" }}>{inst}</p>
          <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted) / 0.5)" }}>
            <div className="h-full rounded-full flex items-center pr-2 transition-all duration-700"
              style={{ width: `${(count / max) * 100}%`, background: colors[i % colors.length] }}>
              <span className="text-[10px] font-black text-white">{count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const roleLabels: Record<string, string> = {
  admin: "مدير النظام",
  moderator: "مشرف",
  staff: "موظف",
  teacher: "مدرس",
  student: "طالب",
};

const SHORTCUTS = [
  { href: "/students?new=1", icon: Users, label: "إضافة مشترك", grad: "#8B5CF6, #7C3AED" },
  { href: "/payments-student", icon: Wallet, label: "تسجيل دفعة", grad: "#F59E0B, #EA580C" },
  { href: "/grades", icon: GraduationCap, label: "إدخال درجات", grad: "#10B981, #059669" },
  { href: "/teachers", icon: BookOpen, label: "المدرسون", grad: "#F43F5E, #DB2777" },
  { href: "/financial-report", icon: BarChart3, label: "التقرير المالي", grad: "#3B82F6, #4F46E5" },
  { href: "/institutions", icon: Building2, label: "الجهات", grad: "#06B6D4, #0284C7" },
  { href: "/salaries", icon: DollarSign, label: "الرواتب", grad: "#6366F1, #4338CA" },
  { href: "/support", icon: HelpCircle, label: "الدعم الفني", grad: "#EC4899, #DB2777" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading, refetch } = useQuery<Stats>({ queryKey: ["/api/dashboard/stats"] });
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: payments = [] } = useQuery<Payment[]>({ queryKey: ["/api/payments"] });

  const recentStudents = students.slice(0, 5);
  const recentPayments = payments.slice(0, 5);

  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5" dir="rtl">

      {/* Welcome card */}
      {user && (
        <div className="glass-card rounded-2xl p-5 animate-fade-in overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.05))" }}>
          <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full opacity-10"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }} />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-black text-foreground">مرحباً، {user.name} 👋</p>
                <p className="text-xs text-muted-foreground">{roleLabels[user.role] || user.role} — {dateStr}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => refetch()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold border bg-white/50 hover:bg-white transition-all"
                style={{ borderColor: "rgba(139,92,246,0.2)" }}>
                <RefreshCw className={`h-3 w-3 ${statsLoading ? "animate-spin" : ""}`} />
                تحديث البيانات
              </button>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">نظام مكتبة عين انجاز</p>
                <p className="text-xs font-bold text-primary">للخدمات الطلابية</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-36 rounded-2xl skeleton-wave" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat, idx) => (
            <StatCard key={stat.key} stat={stat} value={stats ? stats[stat.key] : 0} idx={idx} />
          ))}
        </div>
      )}

      {/* Quick shortcuts */}
      <div className="glass-card rounded-2xl p-5 animate-fade-in">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-primary" /> اختصارات سريعة
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {SHORTCUTS.map(({ href, icon: Icon, label, grad }) => (
            <Link key={href} href={href}>
              <button className="w-full flex flex-col items-center gap-2 py-3 px-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${grad})`, opacity: 0.88 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}>
                <Icon className="h-5 w-5 text-white" />
                <span className="text-[10px] font-bold text-white text-center leading-tight">{label}</span>
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Institution chart */}
        <div className="glass-card rounded-2xl p-5 lg:col-span-1 animate-fade-in">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-emerald-500" /> توزيع المشتركين حسب الجهات
          </h2>
          <InstitutionBarChart students={students} />
        </div>

        {/* Recent Students */}
        <div className="glass-card rounded-2xl overflow-hidden animate-fade-in">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
                <Users className="h-3.5 w-3.5 text-white" />
              </div>
              <h2 className="font-bold text-foreground text-sm">آخر المشتركين</h2>
            </div>
            <Link href="/students">
              <span className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1">
                عرض الكل <ArrowLeft className="h-3 w-3" />
              </span>
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {recentStudents.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground text-sm">لا يوجد مشتركون</p>
            ) : (
              recentStudents.map(student => (
                <Link key={student.id} href={`/students/${student.internalId}`}>
                  <div className="px-5 py-3 hover:bg-primary/4 transition-colors cursor-pointer flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: "linear-gradient(135deg, #8B5CF6, #4F46E5)" }}>
                      {student.studentName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{student.studentName}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.institution || "—"}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${student.isActive ? "badge-success" : "badge-danger"}`}>
                      {student.isActive ? "نشط" : "غير نشط"}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="glass-card rounded-2xl overflow-hidden animate-fade-in">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)" }}>
                <Wallet className="h-3.5 w-3.5 text-white" />
              </div>
              <h2 className="font-bold text-foreground text-sm">آخر المدفوعات</h2>
            </div>
            <Link href="/payments">
              <span className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1">
                عرض الكل <ArrowLeft className="h-3 w-3" />
              </span>
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {recentPayments.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground text-sm">لا توجد مدفوعات</p>
            ) : (
              recentPayments.map(payment => (
                <div key={payment.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)" }}>
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{payment.studentName || "—"}</p>
                    <p className="text-xs text-muted-foreground">{payment.paymentDate || "—"}</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#10B981" }}>{formatCurrency(payment.amount || 0)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
