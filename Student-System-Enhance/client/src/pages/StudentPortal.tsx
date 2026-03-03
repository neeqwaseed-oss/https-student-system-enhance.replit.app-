import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { useTheme } from "@/App";
import type { Student, Grade, Payment } from "@shared/schema";
import {
  User, GraduationCap, CreditCard, LogOut, Sun, Moon,
  BookOpen, Monitor, FileText, BarChart3, Award,
  Calendar, Phone, Building2, Tag, CheckCircle2, XCircle,
  TrendingUp, Banknote, Clock3, ChevronDown, ChevronUp,
  BadgeCheck, Star, Wallet, Receipt, ShieldCheck
} from "lucide-react";
import { useState } from "react";

interface StudentMeData { student: Student; grades: Grade | null; payments: Payment[]; }

/* ─── helpers ─────────────────────────────────────────────────── */
const fmt  = (n?: number | null) => (n ?? 0).toFixed(1);
const fmtC = (n?: number | null) => `${(n ?? 0).toLocaleString("ar-SA")} ر.س`;
const fmtD = (d?: string | null) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return d; }
};

/* ─── ScoreRing ────────────────────────────────────────────────── */
function ScoreRing({ value, max = 100, size = 64, color = "#8B5CF6", label }: {
  value: number; max?: number; size?: number; color?: string; label?: string;
}) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, (value ?? 0) / max);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={8} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black" style={{ color }}>{fmt(value)}</span>
        </div>
      </div>
      {label && <p className="text-[10px] text-muted-foreground text-center leading-tight max-w-12">{label}</p>}
    </div>
  );
}

/* ─── ScoreBar ─────────────────────────────────────────────────── */
function ScoreBar({ value, max = 100, color = "#8B5CF6" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, ((value ?? 0) / max) * 100);
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: "width 0.8s ease" }} />
      </div>
      <span className="text-[10px] font-black w-7 text-end tabular-nums" style={{ color }}>{fmt(value)}</span>
    </div>
  );
}

/* ─── SubjectCard ──────────────────────────────────────────────── */
function SubjectCard({ title, icon, color, items }: {
  title: string; icon: React.ReactNode; color: string;
  items: { label: string; value: number; max?: number }[];
}) {
  const [open, setOpen] = useState(false);
  const avg = items.length ? items.reduce((s, i) => s + (i.value ?? 0), 0) / items.length : 0;
  const max100 = items[0]?.max ?? 100;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${color}30`, background: "hsl(var(--card))" }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-white"
        style={{ background: `linear-gradient(135deg, ${color}ee, ${color}99)` }}>
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
          {icon}
        </div>
        <div className="flex-1 text-start">
          <p className="text-sm font-black leading-none">{title}</p>
          <p className="text-[10px] opacity-75 mt-0.5">متوسط الدرجات: {fmt(avg)} / {max100}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
            {Math.round((avg / max100) * 100)}%
          </div>
          {open ? <ChevronUp className="w-4 h-4 opacity-70" /> : <ChevronDown className="w-4 h-4 opacity-70" />}
        </div>
      </button>
      {open && (
        <div className="px-4 py-3 space-y-2.5">
          {items.map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-bold" style={{ color }}>{fmt(item.value)} <span className="text-muted-foreground font-normal">/ {item.max ?? 100}</span></span>
              </div>
              <ScoreBar value={item.value} max={item.max ?? 100} color={color} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── InfoRow ──────────────────────────────────────────────────── */
function InfoRow({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 [&>svg]:w-4 [&>svg]:h-4"
        style={{ background: accent ? `${accent}18` : "hsl(var(--muted))", color: accent ?? "hsl(var(--muted-foreground))" }}>
        {icon}
      </div>
      <span className="text-xs text-muted-foreground flex-1">{label}</span>
      <span className="text-sm font-bold text-foreground text-end">{value ?? "—"}</span>
    </div>
  );
}

/* ─── NavTab ───────────────────────────────────────────────────── */
function NavTab({ id, label, icon, active, onClick }: {
  id: string; label: string; icon: React.ReactNode; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} data-testid={`tab-${id}`}
      className="flex-1 flex flex-col items-center gap-1 py-3 transition-all relative"
    >
      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all [&>svg]:w-4.5 [&>svg]:h-4.5 ${active ? "text-white shadow-lg" : "text-muted-foreground"}`}
        style={active ? { background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", boxShadow: "0 4px 14px rgba(139,92,246,0.4)" } : { background: "transparent" }}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
      {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />}
    </button>
  );
}

/* ─── Main ─────────────────────────────────────────────────────── */
export default function StudentPortal() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"profile" | "grades" | "payments">("profile");

  const { data, isLoading } = useQuery<StudentMeData>({
    queryKey: ["/api/student/me"],
    staleTime: 0,
    refetchOnMount: true,
  });

  /* Loading */
  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" dir="rtl"
      style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" }}>
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl"
        style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}>
        <BookOpen className="w-8 h-8 text-white" />
      </div>
      <div className="w-10 h-10 rounded-full border-4 border-violet-400 border-t-transparent animate-spin" />
      <p className="text-white/60 text-sm">جاري تحميل ملفك الشخصي...</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" dir="rtl">
      <XCircle className="w-14 h-14 text-destructive" />
      <p className="font-bold text-foreground">تعذّر تحميل البيانات</p>
      <button onClick={logout} className="px-5 py-2.5 text-white rounded-2xl text-sm font-bold"
        style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}>تسجيل الخروج</button>
    </div>
  );

  const { student, grades, payments } = data;
  const netPrice   = (student.subscriptionPrice ?? 0) - (student.discountValue ?? 0);
  const totalPaid  = payments.filter(p => !p.isDeleted).reduce((s, p) => s + (p.amount ?? 0), 0);
  const remaining  = netPrice - totalPaid;
  const paidPct    = netPrice > 0 ? Math.min(100, Math.round((totalPaid / netPrice) * 100)) : 0;
  const activePays = payments.filter(p => !p.isDeleted);

  const gradesSections = grades ? [
    { title: "ويندوز",     icon: <Monitor />,    color: "#0EA5E9",
      items: [{ label: "نموذج 1", value: grades.windowsModel1 ?? 0 }, { label: "نموذج 2", value: grades.windowsModel2 ?? 0 },
              { label: "اختبار تجريبي", value: grades.practiceQuizWindows ?? 0 }, { label: "اختبار رسمي", value: grades.quizWindows ?? 0 }] },
    { title: "وورد",      icon: <FileText />,   color: "#2563EB",
      items: [{ label: "نموذج 1", value: grades.wordModel1 ?? 0 }, { label: "نموذج 2", value: grades.wordModel2 ?? 0 },
              { label: "نموذج 3", value: grades.wordModel3 ?? 0 }, { label: "نموذج 4", value: grades.wordModel4 ?? 0 },
              { label: "اختبار تجريبي", value: grades.practiceQuizWord ?? 0 }, { label: "اختبار رسمي", value: grades.quizWord ?? 0 }] },
    { title: "إكسل",      icon: <BarChart3 />,  color: "#16A34A",
      items: [{ label: "نموذج 1", value: grades.excelModel1 ?? 0 }, { label: "نموذج 2", value: grades.excelModel2 ?? 0 },
              { label: "نموذج 3", value: grades.excelModel3 ?? 0 }, { label: "نموذج 4", value: grades.excelModel4 ?? 0 },
              { label: "نموذج 5", value: grades.excelModel5 ?? 0 }, { label: "اختبار تجريبي", value: grades.practiceQuizExcel ?? 0 },
              { label: "اختبار رسمي", value: grades.quizExcel ?? 0 }] },
    { title: "باوربوينت", icon: <TrendingUp />,  color: "#EA580C",
      items: [{ label: "نموذج 1", value: grades.pptModel1 ?? 0 }, { label: "نموذج 2", value: grades.pptModel2 ?? 0 },
              { label: "نموذج 3", value: grades.pptModel3 ?? 0 }, { label: "نموذج 4", value: grades.pptModel4 ?? 0 },
              { label: "اختبار تجريبي", value: grades.practiceQuizPowerpoint ?? 0 }, { label: "اختبار رسمي", value: grades.quizPowerpoint ?? 0 }] },
    { title: "الاختبارات الكبرى", icon: <Award />, color: "#7C3AED",
      items: [{ label: "نصف السنة تجريبي", value: grades.practiceMidterm ?? 0 }, { label: "نصف السنة رسمي", value: grades.midterm ?? 0 },
              { label: "النهائي تجريبي", value: grades.practiceFinal ?? 0 }, { label: "النهائي رسمي", value: grades.final ?? 0 },
              { label: "واجب 1", value: grades.assignment1 ?? 0 }, { label: "واجب 2", value: grades.assignment2 ?? 0 }] },
  ] : [];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">

      {/* ── Top Header ── */}
      <header className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-2xl"
        style={{ background: "hsl(var(--background)/0.9)" }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
              style={{ background: "white", border: "1px solid hsl(var(--border))" }}>
              <img src="/logo.png" alt="عين الإنجاز" className="w-8 h-8 object-contain" />
            </div>
            <div className="leading-none">
              <p className="text-xs font-black text-foreground">مكتبة عين الإنجاز</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">بوابة المشترك</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={toggleTheme} data-testid="button-toggle-theme"
              className="w-8 h-8 rounded-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button onClick={logout} data-testid="button-logout"
              className="flex items-center gap-1.5 px-3 h-8 rounded-xl border border-border/50 text-xs font-bold text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

          {/* ── Profile Hero ── */}
          <div className="rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(135deg, #4C1D95, #5B21B6, #7C3AED, #8B5CF6)" }}>
            {/* Wave decoration */}
            <div className="relative px-5 pt-5 pb-4">
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
              {/* Avatar + Name */}
              <div className="relative flex items-center gap-4">
                <div className="w-18 h-18 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg"
                  style={{ border: "2px solid rgba(255,255,255,0.4)", width: 72, height: 72 }}>
                  <span className="text-3xl font-black text-white">{(student.studentName ?? "").charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${student.isActive ? "bg-green-400/25 text-green-300 border-green-400/40" : "bg-red-400/25 text-red-300 border-red-400/40"}`}>
                      {student.isActive ? "● نشط" : "● موقوف"}
                    </span>
                  </div>
                  <h1 className="text-xl font-black text-white leading-tight truncate">{student.studentName}</h1>
                  <p className="text-white/60 text-xs mt-1 truncate">
                    {[student.institution, student.level, student.teacherName].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="relative grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: "المستحق",  val: fmtC(netPrice),   icon: <Wallet className="w-3.5 h-3.5" />,   c: "rgba(255,255,255,0.15)" },
                  { label: "المدفوع",  val: fmtC(totalPaid),  icon: <CheckCircle2 className="w-3.5 h-3.5" />, c: "rgba(74,222,128,0.2)" },
                  { label: "المتبقي",  val: fmtC(remaining),  icon: <Clock3 className="w-3.5 h-3.5" />,   c: remaining > 0 ? "rgba(248,113,113,0.2)" : "rgba(74,222,128,0.2)" },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl p-2.5 text-center backdrop-blur-sm"
                    style={{ background: s.c, border: "1px solid rgba(255,255,255,0.15)" }}>
                    <div className="flex justify-center text-white/70 mb-1">{s.icon}</div>
                    <p className="text-xs font-black text-white leading-tight">{s.val}</p>
                    <p className="text-[9px] text-white/50 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Payment progress */}
              {netPrice > 0 && (
                <div className="relative mt-3">
                  <div className="flex justify-between text-[10px] text-white/50 mb-1">
                    <span>نسبة السداد</span>
                    <span className="font-black text-white/80">{paidPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${paidPct}%`, background: "linear-gradient(90deg, #4ADE80, #86EFAC)" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Student ID badge */}
            <div className="px-5 py-3 flex items-center gap-2" style={{ background: "rgba(0,0,0,0.25)" }}>
              <BadgeCheck className="w-3.5 h-3.5 text-violet-300" />
              <span className="text-[11px] text-white/50">رقم الطالب:</span>
              <span className="text-[11px] font-black text-white/80 font-mono" dir="ltr">{student.studentId}</span>
              {student.subscriptionType && (
                <span className="mr-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-400/20 text-violet-200 border border-violet-400/30">
                  {student.subscriptionType}
                </span>
              )}
            </div>
          </div>

          {/* ── Tab Content ── */}

          {/* Profile */}
          {activeTab === "profile" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">

              {/* Personal */}
              <div className="rounded-2xl overflow-hidden border border-border/40 bg-card">
                <div className="px-4 py-3 flex items-center gap-2 border-b border-border/30"
                  style={{ background: "hsl(var(--muted)/0.4)" }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#8B5CF620" }}>
                    <User className="w-3.5 h-3.5" style={{ color: "#8B5CF6" }} />
                  </div>
                  <p className="text-sm font-black">البيانات الشخصية</p>
                </div>
                <div className="px-4">
                  <InfoRow icon={<Tag />}        label="رقم الطالب"    value={student.studentId}                         accent="#8B5CF6" />
                  <InfoRow icon={<User />}       label="الاسم الكامل"  value={student.studentName}                       accent="#8B5CF6" />
                  <InfoRow icon={<Phone />}      label="رقم الجوال"    value={student.studentPhone}                      accent="#06B6D4" />
                  <InfoRow icon={<Building2 />}  label="المؤسسة"       value={student.institution}                       accent="#F59E0B" />
                  <InfoRow icon={<GraduationCap />} label="المستوى"   value={student.level}                             accent="#10B981" />
                  <InfoRow icon={<BookOpen />}   label="المدرس"        value={student.teacherName}                       accent="#6366F1" />
                  <InfoRow icon={<Calendar />}   label="تاريخ التسجيل" value={fmtD(student.registrationDate)}            accent="#EC4899" />
                </div>
              </div>

              {/* Subscription */}
              <div className="rounded-2xl overflow-hidden border border-border/40 bg-card">
                <div className="px-4 py-3 flex items-center gap-2 border-b border-border/30"
                  style={{ background: "hsl(var(--muted)/0.4)" }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#10B98120" }}>
                    <CreditCard className="w-3.5 h-3.5" style={{ color: "#10B981" }} />
                  </div>
                  <p className="text-sm font-black">بيانات الاشتراك</p>
                </div>
                <div className="px-4">
                  <InfoRow icon={<Star />}       label="نوع الاشتراك"   value={student.subscriptionType}                 accent="#F59E0B" />
                  <InfoRow icon={<Banknote />}   label="سعر الاشتراك"   value={fmtC(student.subscriptionPrice)}          accent="#10B981" />
                  {(student.discountValue ?? 0) > 0 && (
                    <InfoRow icon={<Tag />}      label="قيمة الخصم"     value={`− ${fmtC(student.discountValue)}`}       accent="#EF4444" />
                  )}
                  <InfoRow icon={<Wallet />}     label="المبلغ المستحق" value={fmtC(netPrice)}                           accent="#8B5CF6" />
                  <InfoRow icon={<Calendar />}   label="تاريخ الاستحقاق" value={fmtD(student.paymentDueDate)}            accent="#EC4899" />
                  <InfoRow icon={student.isActive ? <ShieldCheck /> : <XCircle />} label="الحالة"
                    value={<span className={`font-black ${student.isActive ? "text-emerald-500" : "text-red-500"}`}>
                      {student.isActive ? "نشط ✓" : "موقوف ✗"}
                    </span>}
                    accent={student.isActive ? "#10B981" : "#EF4444"} />
                </div>
              </div>

              {/* Platform credentials */}
              {student.username && (
                <div className="rounded-2xl overflow-hidden border border-border/40 bg-card">
                  <div className="px-4 py-3 flex items-center gap-2 border-b border-border/30"
                    style={{ background: "hsl(var(--muted)/0.4)" }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#3B82F620" }}>
                      <Monitor className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
                    </div>
                    <p className="text-sm font-black">بيانات المنصة الإلكترونية</p>
                  </div>
                  <div className="px-4">
                    <InfoRow icon={<User />}  label="اسم المستخدم" value={<span className="font-mono" dir="ltr">{student.username}</span>} accent="#3B82F6" />
                    <InfoRow icon={<Tag />}   label="كلمة المرور"  value="••••••••"                                                         accent="#6366F1" />
                  </div>
                </div>
              )}

              {student.notes && (
                <div className="rounded-2xl p-4 border border-amber-200/30" style={{ background: "#F59E0B0C" }}>
                  <p className="text-xs font-black text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                    <Star className="w-3 h-3" /> ملاحظات
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{student.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Grades */}
          {activeTab === "grades" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {!grades ? (
                <div className="rounded-3xl p-12 text-center border border-border/40 bg-card">
                  <GraduationCap className="w-14 h-14 mx-auto mb-3 opacity-20 text-foreground" />
                  <p className="font-bold text-foreground">لا توجد درجات مسجّلة</p>
                  <p className="text-xs text-muted-foreground mt-1">ستظهر درجاتك هنا بعد إدخالها من قِبل الإدارة</p>
                </div>
              ) : (
                <>
                  {/* Key scores */}
                  <div className="rounded-2xl p-4 border border-border/40 bg-card">
                    <p className="text-xs font-black text-muted-foreground mb-4 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> الدرجات الرئيسية
                    </p>
                    <div className="flex justify-around">
                      <ScoreRing value={grades.midterm ?? 0}  color="#7C3AED" size={80} label="نصف السنة" />
                      <ScoreRing value={grades.final ?? 0}    color="#DC2626" size={80} label="النهائي" />
                      <ScoreRing value={grades.assignment1 ?? 0} color="#F59E0B" size={80} label="واجب 1" />
                      <ScoreRing value={grades.assignment2 ?? 0} color="#10B981" size={80} label="واجب 2" />
                    </div>
                  </div>
                  {/* Subjects */}
                  <div className="space-y-2.5">
                    {gradesSections.map(s => <SubjectCard key={s.title} {...s} />)}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Payments */}
          {activeTab === "payments" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "المستحق",  val: fmtC(netPrice),  color: "#8B5CF6", icon: <Wallet /> },
                  { label: "المدفوع",  val: fmtC(totalPaid), color: "#10B981", icon: <CheckCircle2 /> },
                  { label: "المتبقي",  val: fmtC(remaining), color: remaining > 0 ? "#EF4444" : "#10B981", icon: <Clock3 /> },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl p-3 text-center border border-border/40 bg-card">
                    <div className="w-7 h-7 rounded-xl mx-auto mb-2 flex items-center justify-center [&>svg]:w-3.5 [&>svg]:h-3.5"
                      style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
                    <p className="text-xs font-black" style={{ color: s.color }}>{s.val}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Progress */}
              {netPrice > 0 && (
                <div className="rounded-2xl p-4 border border-border/40 bg-card">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground font-medium">نسبة السداد</span>
                    <span className="font-black text-foreground">{paidPct}%</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                    <div className="h-full rounded-full transition-all duration-1000 relative"
                      style={{ width: `${paidPct}%`, background: "linear-gradient(90deg, #8B5CF6, #10B981)" }}>
                      {paidPct > 15 && <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.3) 4px, rgba(255,255,255,0.3) 8px)" }} />}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    تم سداد {fmtC(totalPaid)} من أصل {fmtC(netPrice)}
                  </p>
                </div>
              )}

              {/* Payment list */}
              {activePays.length === 0 ? (
                <div className="rounded-3xl p-12 text-center border border-border/40 bg-card">
                  <Receipt className="w-14 h-14 mx-auto mb-3 opacity-20 text-foreground" />
                  <p className="font-bold text-foreground">لا توجد مدفوعات</p>
                  <p className="text-xs text-muted-foreground mt-1">ستظهر دفعاتك هنا بعد تسجيلها من الإدارة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-black text-muted-foreground px-1 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" /> سجل المدفوعات ({activePays.length})
                  </p>
                  {activePays.map((pay, i) => (
                    <div key={pay.id} data-testid={`payment-row-${pay.id}`}
                      className="rounded-2xl overflow-hidden border border-border/40 bg-card flex">
                      {/* Colored left strip */}
                      <div className="w-1.5 shrink-0" style={{ background: i % 2 === 0 ? "linear-gradient(180deg,#8B5CF6,#6D28D9)" : "linear-gradient(180deg,#10B981,#059669)" }} />
                      <div className="flex-1 p-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-sm font-black"
                          style={{ background: i % 2 === 0 ? "linear-gradient(135deg,#8B5CF6,#6D28D9)" : "linear-gradient(135deg,#10B981,#059669)" }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-black text-foreground">{fmtC(pay.amount)}</span>
                            {pay.paymentType && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                {pay.paymentType}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {fmtD(pay.paymentDate)}{pay.receiverName ? ` · ${pay.receiverName}` : ""}
                          </p>
                          {pay.notes && <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{pay.notes}</p>}
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Bottom Navigation Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 backdrop-blur-2xl"
        style={{ background: "hsl(var(--background)/0.95)" }}>
        <div className="max-w-lg mx-auto flex">
          <NavTab id="profile"  label="ملفي"       icon={<User />}         active={activeTab === "profile"}  onClick={() => setActiveTab("profile")} />
          <NavTab id="grades"   label="الدرجات"    icon={<GraduationCap />} active={activeTab === "grades"}   onClick={() => setActiveTab("grades")} />
          <NavTab id="payments" label="الحساب"     icon={<CreditCard />}   active={activeTab === "payments"} onClick={() => setActiveTab("payments")} />
        </div>
      </nav>

    </div>
  );
}
