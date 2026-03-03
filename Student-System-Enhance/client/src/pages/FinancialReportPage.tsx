import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3, Printer, TrendingUp, TrendingDown, DollarSign, Clock,
  Search, AlertTriangle, CheckCircle, XCircle, Info, BookOpen,
  Scale, Target, Wallet, Users, RefreshCcw, ArrowRight, ChevronDown,
  FileText, Filter
} from "lucide-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { printFinancialReport } from "@/lib/excel";
import type { Student, Payment, TeacherSalary } from "@shared/schema";

type AlertSeverity = "error" | "warning" | "info" | "success";
type Alert = { id: string; severity: AlertSeverity; title: string; detail: string; students?: string[] };

type FinTab = "dashboard" | "ledger" | "receivables" | "monthly" | "allstudents";

const TAB_LABELS: { key: FinTab; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard",   label: "لوحة الرقابة",    icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { key: "ledger",      label: "دفتر الأستاذ",    icon: <BookOpen className="h-3.5 w-3.5" /> },
  { key: "receivables", label: "الذمم المدينة",   icon: <Scale className="h-3.5 w-3.5" /> },
  { key: "monthly",     label: "التسوية الشهرية", icon: <RefreshCcw className="h-3.5 w-3.5" /> },
  { key: "allstudents", label: "كشف المشتركين",   icon: <FileText className="h-3.5 w-3.5" /> },
];

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function AlertIcon({ s }: { s: AlertSeverity }) {
  if (s === "error")   return <XCircle className="h-4 w-4 shrink-0" style={{ color: "#DC2626" }} />;
  if (s === "warning") return <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#D97706" }} />;
  if (s === "success") return <CheckCircle className="h-4 w-4 shrink-0" style={{ color: "#059669" }} />;
  return <Info className="h-4 w-4 shrink-0" style={{ color: "#3B82F6" }} />;
}

function alertBg(s: AlertSeverity) {
  if (s === "error")   return { background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B" };
  if (s === "warning") return { background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" };
  if (s === "success") return { background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#14532D" };
  return { background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E3A5F" };
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return (
    <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">لا بيانات كافية</div>
  );
  let cumulative = 0;
  const polarToCartesian = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) };
  };
  const describeArc = (startAngle: number, endAngle: number) => {
    const outer = 40, inner = 24;
    const s1 = polarToCartesian(startAngle, outer), e1 = polarToCartesian(endAngle, outer);
    const s2 = polarToCartesian(endAngle, inner), e2 = polarToCartesian(startAngle, inner);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${s1.x} ${s1.y} A ${outer} ${outer} 0 ${largeArc} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${inner} ${inner} 0 ${largeArc} 0 ${e2.x} ${e2.y} Z`;
  };
  const segments = data.map(d => {
    const pct = d.value / total;
    const start = cumulative * 360;
    const end = (cumulative + pct) * 360;
    cumulative += pct;
    return { ...d, pct, start, end };
  });
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0">
        {segments.map((seg, i) => (
          <path key={i} d={describeArc(seg.start, seg.end)} fill={seg.color} />
        ))}
        <text x="50" y="49" textAnchor="middle" fontSize="7" fill="currentColor" className="text-muted-foreground">الإجمالي</text>
        <text x="50" y="57" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="currentColor">{total.toLocaleString("ar")}</text>
      </svg>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.color }} />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-bold text-foreground mr-auto">{formatCurrency(d.value)}</span>
            <span className="text-muted-foreground text-[10px]">({Math.round((d.value/total)*100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyBar({ data }: { data: { month: string; income: number; expense: number }[] }) {
  const max = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  if (data.length === 0) return <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">لا بيانات</div>;
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-2 h-36 pb-2 min-w-max">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1 min-w-14">
            <div className="flex items-end gap-0.5 h-28">
              <div className="w-5 rounded-t-md transition-all duration-500"
                style={{ height: `${(d.income / max) * 100}%`, background: "linear-gradient(to top,#10B981,#059669)", minHeight: "2px" }}
                title={`إيرادات: ${formatCurrency(d.income)}`} />
              <div className="w-5 rounded-t-md transition-all duration-500"
                style={{ height: `${(d.expense / max) * 100}%`, background: "linear-gradient(to top,#F43F5E,#E11D48)", minHeight: "2px" }}
                title={`مصروفات: ${formatCurrency(d.expense)}`} />
            </div>
            <p className="text-[9px] text-muted-foreground text-center leading-tight">{d.month}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm inline-block" style={{ background: "#10B981" }} />إيرادات</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm inline-block" style={{ background: "#F43F5E" }} />مصروفات</span>
      </div>
    </div>
  );
}

export default function FinancialReportPage() {
  const [activeTab, setActiveTab] = useState<FinTab>("dashboard");
  const [search, setSearch] = useState("");
  const [receivablesSort, setReceivablesSort] = useState<"name" | "amount" | "pct">("amount");
  const [showAlertDetail, setShowAlertDetail] = useState<string | null>(null);
  const [allStudentsSearch, setAllStudentsSearch] = useState("");
  const [allStudentsStatus, setAllStudentsStatus] = useState("");
  const [allStudentsInstitution, setAllStudentsInstitution] = useState("");

  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: payments = [] } = useQuery<Payment[]>({ queryKey: ["/api/payments"] });
  const { data: salaries = [] } = useQuery<TeacherSalary[]>({
    queryKey: ["/api/salaries"],
    queryFn: () => fetch("/api/salaries").then(r => r.json()),
  });
  const { data: studentCounts = [] } = useQuery<{ internalId: string; studentName: string; studentId: string; institution: string; teacherName: string; paymentCount: number; totalPaid: number; subscriptionPrice: number; discountValue: number; remainingAmount: number; isFullyPaid: boolean }[]>({
    queryKey: ["/api/payments/stats/student-counts"],
  });

  const paidByStudent = useMemo(() =>
    payments.reduce((acc, p) => {
      acc[p.internalId] = (acc[p.internalId] || 0) + (p.amount || 0);
      return acc;
    }, {} as Record<string, number>),
    [payments]);

  const totalSubscriptionValue = students.reduce((s, st) => s + (st.subscriptionPrice || 0), 0);
  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalExpenses = salaries.reduce((s, r) => s + (r.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const totalRemaining = students.reduce((s, st) => {
    const paid = paidByStudent[st.internalId] || 0;
    const rem = (st.subscriptionPrice || 0) - paid;
    return s + (rem > 0 ? rem : 0);
  }, 0);
  const collectionRate = totalSubscriptionValue > 0
    ? Math.round((totalRevenue / totalSubscriptionValue) * 100)
    : 0;

  const overpaidStudents = students.filter(st =>
    (paidByStudent[st.internalId] || 0) > (st.subscriptionPrice || 0) && (st.subscriptionPrice || 0) > 0
  );
  const zeroPriceStudents = students.filter(st => !(st.subscriptionPrice || 0) || (st.subscriptionPrice || 0) === 0);
  const studentMap = Object.fromEntries(students.map(s => [s.internalId, s]));
  const orphanPayments = payments.filter(p => p.internalId && !studentMap[p.internalId]);

  const dupMap: Record<string, Payment[]> = {};
  payments.forEach(p => {
    const key = `${p.internalId}|${p.paymentDate}|${p.amount}`;
    if (!dupMap[key]) dupMap[key] = [];
    dupMap[key].push(p);
  });
  const duplicateGroups = Object.values(dupMap).filter(g => g.length > 1);

  const alerts: Alert[] = useMemo(() => {
    const list: Alert[] = [];

    if (overpaidStudents.length > 0) {
      list.push({
        id: "overpaid",
        severity: "error",
        title: `${overpaidStudents.length} طالب دفع أكثر من قيمة اشتراكه`,
        detail: "يوجد طلاب لديهم مدفوعات تتجاوز سعر اشتراكهم المحدد. يجب مراجعة هذه الحالات وإما تعديل سعر الاشتراك أو استرداد المبلغ الزائد.",
        students: overpaidStudents.map(s => `${s.studentName} — دفع ${formatCurrency(paidByStudent[s.internalId] || 0)} من أصل ${formatCurrency(s.subscriptionPrice || 0)}`),
      });
    }

    if (duplicateGroups.length > 0) {
      list.push({
        id: "duplicates",
        severity: "error",
        title: `${duplicateGroups.length} مجموعة دفعات مكررة محتملة`,
        detail: "وُجد دفعات بنفس الطالب ونفس التاريخ ونفس المبلغ. قد تكون هذه إدخالات مكررة بالخطأ.",
        students: duplicateGroups.map(g => `${g[0].studentName} — ${g[0].paymentDate} — ${formatCurrency(g[0].amount || 0)} (${g.length} مرات)`),
      });
    }

    if (orphanPayments.length > 0) {
      list.push({
        id: "orphans",
        severity: "warning",
        title: `${orphanPayments.length} دفعة غير مرتبطة بطالب`,
        detail: "توجد دفعات مسجلة لا يمكن ربطها بأي طالب في النظام. قد يعني هذا أن الطالب تم حذفه أو تغيير رقمه.",
        students: orphanPayments.map(p => `${p.paymentId} — ${p.studentName || "بدون اسم"} — ${formatCurrency(p.amount || 0)}`),
      });
    }

    if (netProfit < 0) {
      list.push({
        id: "negprofit",
        severity: "error",
        title: "صافي الربح سالب! المصاريف تتجاوز الإيرادات",
        detail: `إجمالي المصاريف (${formatCurrency(totalExpenses)}) يتجاوز إجمالي الإيرادات (${formatCurrency(totalRevenue)}) بفارق ${formatCurrency(Math.abs(netProfit))}. يجب مراجعة الرواتب والمصاريف.`,
      });
    }

    if (zeroPriceStudents.length > 0) {
      list.push({
        id: "zeroprice",
        severity: "warning",
        title: `${zeroPriceStudents.length} طالب بدون سعر اشتراك محدد`,
        detail: "هؤلاء الطلاب لا يوجد لهم سعر اشتراك في النظام، مما يجعل متابعة السداد غير ممكنة.",
        students: zeroPriceStudents.slice(0, 10).map(s => s.studentName),
      });
    }

    if (collectionRate < 60 && totalSubscriptionValue > 0) {
      list.push({
        id: "lowcollection",
        severity: "warning",
        title: `معدل التحصيل منخفض (${collectionRate}%)`,
        detail: `تم تحصيل ${formatCurrency(totalRevenue)} من إجمالي قيمة الاشتراكات ${formatCurrency(totalSubscriptionValue)}. المتبقي للتحصيل ${formatCurrency(totalRemaining)}.`,
      });
    }

    if (list.length === 0 && students.length > 0) {
      list.push({
        id: "ok",
        severity: "success",
        title: "حسابات سليمة — لا توجد أخطاء محاسبية",
        detail: "مرّت جميع فحوصات المدقق المحاسبي بنجاح. لا توجد دفعات مكررة أو تجاوزات أو تناقضات.",
      });
    }

    return list;
  }, [overpaidStudents, duplicateGroups, orphanPayments, netProfit, zeroPriceStudents, collectionRate, students.length]);

  const monthlyData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    payments.forEach(p => {
      if (!p.paymentDate) return;
      const d = new Date(p.paymentDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      map[key].income += p.amount || 0;
    });
    salaries.forEach(s => {
      if (!s.paidDate) return;
      const d = new Date(s.paidDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      map[key].expense += s.amount || 0;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([key, v]) => {
        const [yr, mo] = key.split("-");
        return { month: `${MONTHS_AR[parseInt(mo) - 1]} ${yr}`, ...v };
      });
  }, [payments, salaries]);

  const ledgerEntries = useMemo(() => {
    const income = payments.map(p => ({
      id: p.id, date: p.paymentDate || "", type: "قبض" as const,
      ref: p.paymentId || "", party: p.studentName || "—",
      description: `دفعة ${(p as any).paymentType || ""} — ${p.paymentMethod || "—"}`,
      debit: p.amount || 0, credit: 0,
      receiverName: p.receiverName || "—",
    }));
    const expense = salaries.map((s, i) => ({
      id: `sal-${i}`, date: s.paidDate || "", type: "صرف" as const,
      ref: `SAL-${i + 1}`, party: "رواتب المدرسين",
      description: `راتب ${MONTHS_AR[(s.month || 1) - 1]} ${s.year || ""}`,
      debit: 0, credit: s.amount || 0,
      receiverName: "—",
    }));
    return [...income, ...expense]
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [payments, salaries]);

  const receivablesList = useMemo(() => {
    return students
      .map(st => {
        const paid = paidByStudent[st.internalId] || 0;
        const price = st.subscriptionPrice || 0;
        const remaining = Math.max(price - paid, 0);
        const overpaid = Math.max(paid - price, 0);
        const pct = price > 0 ? Math.round((paid / price) * 100) : 0;
        const daysSince = st.registrationDate
          ? Math.floor((Date.now() - new Date(st.registrationDate).getTime()) / 86400000)
          : 999;
        return { ...st, paid, price, remaining, overpaid, pct, daysSince };
      })
      .filter(s => s.remaining > 0 || s.overpaid > 0)
      .sort((a, b) => {
        if (receivablesSort === "amount") return b.remaining - a.remaining;
        if (receivablesSort === "pct")    return a.pct - b.pct;
        return (a.studentName || "").localeCompare(b.studentName || "", "ar");
      });
  }, [students, paidByStudent, receivablesSort]);

  const filtered = receivablesList.filter(s =>
    !search || s.studentName.includes(search) || (s.studentId || "").includes(search)
  );

  const ledgerFiltered = ledgerEntries.filter(e =>
    !search || e.party.includes(search) || e.ref.includes(search)
  );

  const totalDebit  = ledgerEntries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = ledgerEntries.reduce((s, e) => s + e.credit, 0);

  const aging30  = receivablesList.filter(s => s.daysSince <= 30);
  const aging60  = receivablesList.filter(s => s.daysSince > 30 && s.daysSince <= 60);
  const aging90  = receivablesList.filter(s => s.daysSince > 60 && s.daysSince <= 90);
  const aging90p = receivablesList.filter(s => s.daysSince > 90);

  const kpis = [
    { label: "إجمالي الإيرادات",     value: formatCurrency(totalRevenue),            icon: TrendingUp,  grad: "linear-gradient(135deg,#10B981,#059669)", sub: `${payments.length} دفعة` },
    { label: "إجمالي المصروفات",     value: formatCurrency(totalExpenses),           icon: TrendingDown, grad: "linear-gradient(135deg,#F43F5E,#E11D48)", sub: `${salaries.length} راتب` },
    { label: "صافي الربح",           value: formatCurrency(netProfit),               icon: DollarSign,  grad: netProfit >= 0 ? "linear-gradient(135deg,#3B82F6,#4F46E5)" : "linear-gradient(135deg,#F43F5E,#E11D48)", sub: netProfit >= 0 ? "مربح ✓" : "خسارة ✗" },
    { label: "الذمم المدينة",        value: formatCurrency(totalRemaining),           icon: Clock,        grad: "linear-gradient(135deg,#F59E0B,#EA580C)", sub: `${receivablesList.length} طالب` },
    { label: "معدل التحصيل",         value: `${collectionRate}%`,                    icon: Target,      grad: collectionRate >= 80 ? "linear-gradient(135deg,#10B981,#059669)" : collectionRate >= 60 ? "linear-gradient(135deg,#F59E0B,#D97706)" : "linear-gradient(135deg,#F43F5E,#E11D48)", sub: `من أصل ${formatCurrency(totalSubscriptionValue)}` },
    { label: "إجمالي المشتركين",     value: String(students.length),                 icon: Users,       grad: "linear-gradient(135deg,#8B5CF6,#7C3AED)", sub: `${students.filter(s => s.isActive).length} نشط` },
  ];

  const errCount   = alerts.filter(a => a.severity === "error").length;
  const warnCount  = alerts.filter(a => a.severity === "warning").length;

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-amber-500" /> لوحة القيادة المالية
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            نظام محاسبي ذكي — تدقيق شامل للمركز المالي
          </p>
        </div>
        <div className="flex items-center gap-2">
          {errCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg,#DC2626,#B91C1C)" }}>
              <XCircle className="h-3.5 w-3.5" /> {errCount} خطأ محاسبي
            </span>
          )}
          {warnCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg,#D97706,#B45309)" }}>
              <AlertTriangle className="h-3.5 w-3.5" /> {warnCount} تنبيه
            </span>
          )}
          <button onClick={() => printFinancialReport({ totalRevenue, totalExpenses, netProfit, totalRemaining, students, paidByStudent })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}
            data-testid="button-print-financial-report">
            <Printer className="h-4 w-4" /> طباعة التقرير
          </button>
          <Link href="/">
            <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>
              <ArrowRight className="h-4 w-4" /> رجوع
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        {kpis.map(({ label, value, icon: Icon, grad, sub }) => (
          <div key={label} className="glass-card rounded-2xl p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white mb-2 shrink-0"
              style={{ background: grad }}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xl font-black text-foreground leading-none">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Accounting Alerts */}
      <div className="glass-card rounded-2xl overflow-hidden mb-5">
        <div className="px-4 py-3 flex items-center gap-2"
          style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--muted)/0.3)" }}>
          <Scale className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-black text-foreground">المدقق المحاسبي الذكي</h3>
          <span className="text-xs text-muted-foreground mr-auto">{alerts.length} تنبيه</span>
        </div>
        <div className="p-4 space-y-2">
          {alerts.map(alert => (
            <div key={alert.id}>
              <button
                onClick={() => setShowAlertDetail(showAlertDetail === alert.id ? null : alert.id)}
                className="w-full flex items-start gap-3 p-3 rounded-xl text-right transition-all"
                style={alertBg(alert.severity)}>
                <AlertIcon s={alert.severity} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{alert.title}</p>
                  <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{alert.detail}</p>
                </div>
                {alert.students && alert.students.length > 0 && (
                  <ChevronDown className="h-4 w-4 shrink-0 mt-0.5 transition-transform"
                    style={{ transform: showAlertDetail === alert.id ? "rotate(180deg)" : "none" }} />
                )}
              </button>
              {showAlertDetail === alert.id && alert.students && alert.students.length > 0 && (
                <div className="mx-1 px-4 py-3 rounded-b-xl space-y-1.5"
                  style={{ background: "hsl(var(--muted)/0.4)", borderTop: "1px dashed hsl(var(--border))" }}>
                  {alert.students.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: alertBg(alert.severity).color }} />
                      <span className="text-muted-foreground">{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-2xl p-1.5 mb-5 flex gap-1 flex-wrap">
        {TAB_LABELS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="flex-1 min-w-max flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all"
            style={{
              background: activeTab === t.key ? "linear-gradient(135deg,#8B5CF6,#7C3AED)" : "transparent",
              color: activeTab === t.key ? "white" : "hsl(var(--muted-foreground))",
            }}
            data-testid={`tab-fin-${t.key}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: DASHBOARD ── */}
      {activeTab === "dashboard" && (() => {
        const catGroups = [
          { n: 0,  label: "لم يدفع",       color: "#DC2626", students: studentCounts.filter(s => s.paymentCount === 0) },
          { n: 1,  label: "دفعة واحدة",    color: "#D97706", students: studentCounts.filter(s => s.paymentCount === 1) },
          { n: 2,  label: "دفعتان",         color: "#2563EB", students: studentCounts.filter(s => s.paymentCount === 2) },
          { n: 3,  label: "3+ دفعات",       color: "#059669", students: studentCounts.filter(s => s.paymentCount >= 3) },
          { n: 99, label: "سداد كامل",      color: "#7C3AED", students: studentCounts.filter(s => s.isFullyPaid) },
          { n: -1, label: "متبقي عليهم",   color: "#BE185D", students: studentCounts.filter(s => !s.isFullyPaid && s.paymentCount > 0) },
        ].map(g => ({
          ...g,
          count: g.students.length,
          totalPaid: g.students.reduce((s, st) => s + st.totalPaid, 0),
          totalRemaining: g.students.reduce((s, st) => s + Math.max(st.remainingAmount, 0), 0),
          totalSubscription: g.students.reduce((s, st) => s + Math.max(st.subscriptionPrice - st.discountValue, 0), 0),
        }));

        return (
          <div className="space-y-5">
            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" /> توزيع المركز المالي
                </h3>
                <DonutChart data={[
                  { label: "الإيرادات المحصلة", value: totalRevenue, color: "#10B981" },
                  { label: "مصروفات الرواتب",   value: totalExpenses, color: "#F43F5E" },
                  { label: "الذمم المدينة",      value: totalRemaining, color: "#F59E0B" },
                ].filter(d => d.value > 0)} />
              </div>
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4 text-primary" /> الإيرادات والمصروفات الشهرية
                </h3>
                <MonthlyBar data={monthlyData} />
              </div>
            </div>

            {/* Income Statement */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 flex items-center gap-2"
                style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--muted)/0.3)" }}>
                <Scale className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-black text-foreground">قائمة الدخل والمركز المالي</h3>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income side */}
                <div>
                  <h4 className="text-xs font-black mb-3 pb-2" style={{ borderBottom: "2px solid #10B981", color: "#059669" }}>
                    ← الإيرادات
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: "قيمة الاشتراكات الكلية", value: totalSubscriptionValue, bold: false },
                      { label: "المحصل (إيرادات فعلية)", value: totalRevenue, bold: true, color: "#059669" },
                      { label: "الذمم المدينة (مستحقة)", value: totalRemaining, bold: false, color: "#D97706" },
                    ].map(r => (
                      <div key={r.label} className="flex items-center justify-between py-1.5 text-xs"
                        style={{ borderBottom: "1px solid hsl(var(--border)/0.4)" }}>
                        <span className="text-muted-foreground">{r.label}</span>
                        <span className={`font-${r.bold ? "black" : "semibold"} text-sm`}
                          style={{ color: r.color || "hsl(var(--foreground))" }}>
                          {formatCurrency(r.value)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2 mt-1 text-sm font-black"
                      style={{ borderTop: "2px solid #10B981" }}>
                      <span style={{ color: "#059669" }}>نسبة التحصيل</span>
                      <span style={{ color: "#059669" }}>
                        {totalSubscriptionValue > 0 ? `${Math.round((totalRevenue / totalSubscriptionValue) * 100)}%` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Expenses + Net */}
                <div>
                  <h4 className="text-xs font-black mb-3 pb-2" style={{ borderBottom: "2px solid #F43F5E", color: "#DC2626" }}>
                    ← المصروفات والنتيجة
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: "رواتب المدرسين", value: totalExpenses, bold: false, color: "#DC2626" },
                      { label: "صافي الربح", value: Math.max(netProfit, 0), bold: true, color: "#059669" },
                      { label: "الخسارة (إن وجدت)", value: Math.max(-netProfit, 0), bold: false, color: "#DC2626" },
                    ].filter(r => r.value > 0 || r.label === "رواتب المدرسين").map(r => (
                      <div key={r.label} className="flex items-center justify-between py-1.5 text-xs"
                        style={{ borderBottom: "1px solid hsl(var(--border)/0.4)" }}>
                        <span className="text-muted-foreground">{r.label}</span>
                        <span className={`font-${r.bold ? "black" : "semibold"} text-sm`} style={{ color: r.color }}>
                          {formatCurrency(r.value)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-2 mt-1 text-sm font-black"
                      style={{ borderTop: "2px solid #F43F5E" }}>
                      <span className="text-foreground">هامش الربح</span>
                      <span style={{ color: netProfit >= 0 ? "#059669" : "#DC2626" }}>
                        {totalRevenue > 0 ? `${Math.round((netProfit / totalRevenue) * 100)}%` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Category Breakdown Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3 flex items-center gap-2"
                style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--muted)/0.3)" }}>
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-black text-foreground">توزيع المشتركين حسب حالة السداد</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "hsl(var(--muted)/0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                      {["فئة السداد","عدد الطلاب","قيمة الاشتراكات","إجمالي المدفوع","إجمالي المتبقي","نسبة التحصيل"].map(h => (
                        <th key={h} className="px-4 py-3 text-right font-black text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {catGroups.map(g => {
                      const pct = g.totalSubscription > 0 ? Math.round((g.totalPaid / g.totalSubscription) * 100) : 0;
                      return (
                        <tr key={g.n} className="border-b border-border/30 hover:bg-primary/3">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: g.color }} />
                              <span className="font-bold text-foreground">{g.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full font-bold text-white text-[11px]"
                              style={{ background: g.color }}>
                              {g.count} طالب
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(g.totalSubscription)}</td>
                          <td className="px-4 py-3 font-black" style={{ color: "#059669" }}>{formatCurrency(g.totalPaid)}</td>
                          <td className="px-4 py-3 font-black" style={{ color: g.totalRemaining > 0 ? "#DC2626" : "#059669" }}>
                            {g.totalRemaining > 0 ? formatCurrency(g.totalRemaining) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden min-w-12" style={{ background: "hsl(var(--muted))" }}>
                                <div className="h-full rounded-full"
                                  style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? "#059669" : pct >= 50 ? "#D97706" : "#DC2626" }} />
                              </div>
                              <span className="font-bold text-foreground w-8 text-right shrink-0">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "hsl(var(--muted)/0.5)", borderTop: "2px solid hsl(var(--border))" }}>
                      <td className="px-4 py-3 font-black text-foreground">الإجمالي الكلي</td>
                      <td className="px-4 py-3 font-black text-foreground">{studentCounts.length} طالب</td>
                      <td className="px-4 py-3 font-black text-foreground">{formatCurrency(totalSubscriptionValue)}</td>
                      <td className="px-4 py-3 font-black" style={{ color: "#059669" }}>{formatCurrency(totalRevenue)}</td>
                      <td className="px-4 py-3 font-black" style={{ color: "#DC2626" }}>{formatCurrency(totalRemaining)}</td>
                      <td className="px-4 py-3 font-black" style={{ color: totalSubscriptionValue > 0 && (totalRevenue / totalSubscriptionValue) >= 0.8 ? "#059669" : "#D97706" }}>
                        {totalSubscriptionValue > 0 ? `${Math.round((totalRevenue / totalSubscriptionValue) * 100)}%` : "—"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Aging Analysis */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> تحليل عمر الذمم المدينة
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "0 – 30 يوم",        value: aging30.reduce((s, r) => s + r.remaining, 0),  count: aging30.length,  color: "#10B981" },
                  { label: "31 – 60 يوم",        value: aging60.reduce((s, r) => s + r.remaining, 0),  count: aging60.length,  color: "#F59E0B" },
                  { label: "61 – 90 يوم",        value: aging90.reduce((s, r) => s + r.remaining, 0),  count: aging90.length,  color: "#F97316" },
                  { label: "أكثر من 90 يوم",     value: aging90p.reduce((s, r) => s + r.remaining, 0), count: aging90p.length, color: "#DC2626" },
                ].map(a => (
                  <div key={a.label} className="rounded-xl p-3 text-center"
                    style={{ background: `${a.color}12`, border: `1px solid ${a.color}30` }}>
                    <p className="text-[11px] font-bold mb-1" style={{ color: a.color }}>{a.label}</p>
                    <p className="text-lg font-black text-foreground">{formatCurrency(a.value)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.count} طالب</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── TAB: LEDGER (دفتر الأستاذ) ── */}
      {activeTab === "ledger" && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-3 flex-wrap"
            style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--muted)/0.3)" }}>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-black text-foreground">دفتر الأستاذ العام</h3>
            <div className="relative mr-auto">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="بحث في القيود..." data-testid="input-search-ledger"
                className="pr-9 pl-4 py-2 rounded-xl text-xs border outline-none bg-background text-foreground"
                style={{ borderColor: "hsl(var(--border))", minWidth: "180px" }} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "hsl(var(--muted)/0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                  {["التاريخ","المرجع","النوع","الطرف","البيان","مدين (قبض)","دائن (صرف)","الرصيد"].map(h => (
                    <th key={h} className="px-3 py-3 text-right font-black text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let runningBalance = 0;
                  return ledgerFiltered.slice(0, 100).map((e, i) => {
                    runningBalance += e.debit - e.credit;
                    return (
                      <tr key={e.id} className="border-b border-border/30 hover:bg-primary/3 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">{e.date || "—"}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: "#8B5CF6" }}>{e.ref}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px]"
                            style={e.type === "قبض"
                              ? { background: "#D1FAE5", color: "#059669" }
                              : { background: "#FEE2E2", color: "#DC2626" }}>
                            {e.type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-foreground max-w-28 truncate">{e.party}</td>
                        <td className="px-3 py-2.5 text-muted-foreground max-w-40 truncate">{e.description}</td>
                        <td className="px-3 py-2.5 font-black" style={{ color: e.debit > 0 ? "#059669" : "#9CA3AF" }}>
                          {e.debit > 0 ? formatCurrency(e.debit) : "—"}
                        </td>
                        <td className="px-3 py-2.5 font-black" style={{ color: e.credit > 0 ? "#DC2626" : "#9CA3AF" }}>
                          {e.credit > 0 ? formatCurrency(e.credit) : "—"}
                        </td>
                        <td className="px-3 py-2.5 font-black"
                          style={{ color: runningBalance >= 0 ? "#059669" : "#DC2626" }}>
                          {formatCurrency(runningBalance)}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
              <tfoot>
                <tr style={{ background: "hsl(var(--muted)/0.5)", borderTop: "2px solid hsl(var(--border))" }}>
                  <td colSpan={5} className="px-3 py-3 font-black text-foreground text-xs">المجموع الكلي</td>
                  <td className="px-3 py-3 font-black text-xs" style={{ color: "#059669" }}>{formatCurrency(totalDebit)}</td>
                  <td className="px-3 py-3 font-black text-xs" style={{ color: "#DC2626" }}>{formatCurrency(totalCredit)}</td>
                  <td className="px-3 py-3 font-black text-xs"
                    style={{ color: netProfit >= 0 ? "#059669" : "#DC2626" }}>
                    {formatCurrency(netProfit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {ledgerEntries.length > 100 && (
            <div className="px-4 py-2 text-xs text-muted-foreground text-center"
              style={{ borderTop: "1px solid hsl(var(--border))" }}>
              عرض أحدث 100 قيد من {ledgerEntries.length}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: RECEIVABLES (الذمم المدينة) ── */}
      {activeTab === "receivables" && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="بحث بالاسم أو الرقم..."
                  className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm border outline-none bg-background text-foreground"
                  style={{ borderColor: "hsl(var(--border))" }} data-testid="input-search-receivables" />
              </div>
              <div className="flex gap-1">
                {[{ key: "amount", label: "حسب المبلغ" }, { key: "pct", label: "حسب النسبة" }, { key: "name", label: "حسب الاسم" }].map(o => (
                  <button key={o.key} onClick={() => setReceivablesSort(o.key as typeof receivablesSort)}
                    className="px-3 py-2 rounded-xl text-xs font-bold border transition-all"
                    style={{
                      borderColor: receivablesSort === o.key ? "#8B5CF6" : "hsl(var(--border))",
                      background: receivablesSort === o.key ? "#8B5CF620" : "transparent",
                      color: receivablesSort === o.key ? "#8B5CF6" : "hsl(var(--muted-foreground))",
                    }}>
                    {o.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{filtered.length} طالب — متبقي {formatCurrency(filtered.reduce((s, r) => s + r.remaining, 0))}</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "hsl(var(--muted)/0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                  {["#","الطالب","الرقم","الجهة","قيمة الاشتراك","المدفوع","المتبقي","نسبة السداد","تنبيه"].map(h => (
                    <th key={h} className="px-3 py-3 text-right font-black text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                    لا توجد ذمم مدينة — جميع الطلاب سددوا!
                  </td></tr>
                ) : filtered.map((st, i) => (
                  <tr key={st.id}
                    className="border-b border-border/30 hover:bg-primary/3 transition-colors"
                    style={{ background: st.overpaid > 0 ? "#FEF2F2" : undefined }}
                    data-testid={`row-receivable-${st.internalId}`}>
                    <td className="px-3 py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2.5 font-semibold text-foreground">{st.studentName}</td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{st.studentId || "—"}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{st.institution || "—"}</td>
                    <td className="px-3 py-2.5 font-bold text-foreground">{formatCurrency(st.price)}</td>
                    <td className="px-3 py-2.5 font-bold" style={{ color: "#059669" }}>{formatCurrency(st.paid)}</td>
                    <td className="px-3 py-2.5">
                      {st.overpaid > 0 ? (
                        <span className="font-black text-xs" style={{ color: "#DC2626" }}>
                          زيادة {formatCurrency(st.overpaid)}
                        </span>
                      ) : (
                        <span className="font-black text-xs" style={{ color: st.remaining > 0 ? "#F59E0B" : "#059669" }}>
                          {st.remaining > 0 ? formatCurrency(st.remaining) : "مكتمل"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))", minWidth: "48px" }}>
                          <div className="h-full rounded-full transition-all" style={{
                            width: `${Math.min(st.pct, 100)}%`,
                            background: st.pct >= 100 ? "#059669" : st.pct >= 50 ? "#F59E0B" : "#DC2626"
                          }} />
                        </div>
                        <span className="font-bold text-foreground w-8 shrink-0">{st.pct}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {st.overpaid > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                          دفع زيادة
                        </span>
                      )}
                      {st.daysSince > 90 && st.remaining > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                          90+ يوم
                        </span>
                      )}
                      {st.daysSince > 60 && st.daysSince <= 90 && st.remaining > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: "#FEF3C7", color: "#D97706" }}>
                          60+ يوم
                        </span>
                      )}
                      {st.paid === 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                          لم يدفع
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: MONTHLY (التسوية الشهرية) ── */}
      {activeTab === "monthly" && (
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 text-primary" /> التدفق النقدي الشهري
            </h3>
            <MonthlyBar data={monthlyData} />
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3" style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--muted)/0.3)" }}>
              <h3 className="text-sm font-black text-foreground">تفاصيل التسوية الشهرية</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: "hsl(var(--muted)/0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                  {["الشهر","الإيرادات","المصروفات","صافي الشهر","الرصيد التراكمي"].map(h => (
                    <th key={h} className="px-4 py-3 text-right font-black text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let cumulative = 0;
                  return monthlyData.map((row, i) => {
                    const net = row.income - row.expense;
                    cumulative += net;
                    return (
                      <tr key={i} className="border-b border-border/30 hover:bg-primary/3">
                        <td className="px-4 py-3 font-semibold text-foreground">{row.month}</td>
                        <td className="px-4 py-3 font-black" style={{ color: "#059669" }}>{formatCurrency(row.income)}</td>
                        <td className="px-4 py-3 font-black" style={{ color: "#DC2626" }}>{formatCurrency(row.expense)}</td>
                        <td className="px-4 py-3">
                          <span className="font-black" style={{ color: net >= 0 ? "#059669" : "#DC2626" }}>
                            {net >= 0 ? "+" : ""}{formatCurrency(net)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-black"
                          style={{ color: cumulative >= 0 ? "#059669" : "#DC2626" }}>
                          {formatCurrency(cumulative)}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
              <tfoot>
                <tr style={{ background: "hsl(var(--muted)/0.5)", borderTop: "2px solid hsl(var(--border))" }}>
                  <td className="px-4 py-3 font-black text-foreground">الإجمالي</td>
                  <td className="px-4 py-3 font-black" style={{ color: "#059669" }}>{formatCurrency(totalRevenue)}</td>
                  <td className="px-4 py-3 font-black" style={{ color: "#DC2626" }}>{formatCurrency(totalExpenses)}</td>
                  <td className="px-4 py-3 font-black" style={{ color: netProfit >= 0 ? "#059669" : "#DC2626" }}>
                    {netProfit >= 0 ? "+" : ""}{formatCurrency(netProfit)}
                  </td>
                  <td className="px-4 py-3 font-black" style={{ color: netProfit >= 0 ? "#059669" : "#DC2626" }}>
                    {formatCurrency(netProfit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Balance Sheet Summary */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-3" style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--muted)/0.3)" }}>
              <h3 className="text-sm font-black text-foreground">ملخص المركز المالي (ميزانية مختصرة)</h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-black text-foreground mb-3 pb-2 border-b border-dashed" style={{ borderColor: "hsl(var(--border))", color: "#059669" }}>
                  المدين (الأصول والإيرادات)
                </h4>
                {[
                  { label: "الإيرادات المحصلة (نقد)", value: totalRevenue },
                  { label: "الذمم المدينة (مستحقة)", value: totalRemaining },
                  { label: "إجمالي قيمة الاشتراكات", value: totalSubscriptionValue },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center py-2 text-xs border-b border-border/30">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-bold text-foreground">{formatCurrency(r.value)}</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground mb-3 pb-2 border-b border-dashed" style={{ borderColor: "hsl(var(--border))", color: "#DC2626" }}>
                  الدائن (الالتزامات والمصروفات)
                </h4>
                {[
                  { label: "رواتب المدرسين المصروفة", value: totalExpenses },
                  { label: "صافي الربح (الفائض)", value: Math.max(netProfit, 0) },
                  { label: "الخسارة (إن وجدت)", value: Math.max(-netProfit, 0) },
                ].filter(r => r.value > 0).map(r => (
                  <div key={r.label} className="flex justify-between items-center py-2 text-xs border-b border-border/30">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-bold text-foreground">{formatCurrency(r.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 text-xs font-black mt-1"
                  style={{ borderTop: "2px solid hsl(var(--border))" }}>
                  <span className="text-foreground">الإجمالي</span>
                  <span className="text-foreground">{formatCurrency(totalRevenue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ALL STUDENTS (كشف المشتركين) ── */}
      {activeTab === "allstudents" && (() => {
        const institutions = [...new Set(students.map(s => s.institution).filter(Boolean))];
        const allStudentsFiltered = students
          .map(st => {
            const paid = paidByStudent[st.internalId] || 0;
            const price = st.subscriptionPrice || 0;
            const remaining = Math.max(price - paid, 0);
            const overpaid = Math.max(paid - price, 0);
            const pct = price > 0 ? Math.round((paid / price) * 100) : 0;
            const status: "paid" | "partial" | "unpaid" = remaining <= 0 && price > 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
            return { ...st, paid, price, remaining, overpaid, pct, status };
          })
          .filter(st => {
            const matchSearch = !allStudentsSearch ||
              (st.studentName || "").includes(allStudentsSearch) ||
              (st.studentId || "").includes(allStudentsSearch);
            const matchStatus = !allStudentsStatus || st.status === allStudentsStatus;
            const matchInst = !allStudentsInstitution || st.institution === allStudentsInstitution;
            return matchSearch && matchStatus && matchInst;
          });

        const filteredTotalPaid = allStudentsFiltered.reduce((s, st) => s + st.paid, 0);
        const filteredTotalRemaining = allStudentsFiltered.reduce((s, st) => s + st.remaining, 0);
        const filteredTotalPrice = allStudentsFiltered.reduce((s, st) => s + st.price, 0);
        const paidCount = allStudentsFiltered.filter(s => s.status === "paid").length;
        const partialCount = allStudentsFiltered.filter(s => s.status === "partial").length;
        const unpaidCount = allStudentsFiltered.filter(s => s.status === "unpaid").length;

        return (
          <div className="space-y-4">
            {/* Summary mini-cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "مسدد بالكامل", value: paidCount, color: "#059669", bg: "#D1FAE5" },
                { label: "سداد جزئي", value: partialCount, color: "#D97706", bg: "#FEF3C7" },
                { label: "لم يدفع", value: unpaidCount, color: "#DC2626", bg: "#FEE2E2" },
                { label: "إجمالي النتائج", value: allStudentsFiltered.length, color: "#7C3AED", bg: "#EDE9FE" },
              ].map(c => (
                <div key={c.label} className="rounded-xl p-3 text-center"
                  style={{ background: c.bg + "33", border: `1px solid ${c.color}30` }}>
                  <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
                  <p className="text-xs font-semibold mt-0.5 text-muted-foreground">{c.label}</p>
                </div>
              ))}
            </div>

            {/* Filters + Print */}
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-44">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input value={allStudentsSearch} onChange={e => setAllStudentsSearch(e.target.value)}
                    placeholder="بحث بالاسم أو الرقم..."
                    className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm border outline-none bg-background text-foreground"
                    style={{ borderColor: "hsl(var(--border))" }}
                    data-testid="input-search-all-students" />
                </div>
                <select value={allStudentsStatus} onChange={e => setAllStudentsStatus(e.target.value)}
                  className="px-3 py-2.5 rounded-xl text-sm border outline-none bg-background text-foreground"
                  style={{ borderColor: "hsl(var(--border))" }}>
                  <option value="">جميع الحالات</option>
                  <option value="paid">مسدد بالكامل</option>
                  <option value="partial">سداد جزئي</option>
                  <option value="unpaid">لم يدفع</option>
                </select>
                <select value={allStudentsInstitution} onChange={e => setAllStudentsInstitution(e.target.value)}
                  className="px-3 py-2.5 rounded-xl text-sm border outline-none bg-background text-foreground"
                  style={{ borderColor: "hsl(var(--border))" }}>
                  <option value="">جميع الجهات</option>
                  {institutions.map(i => <option key={i} value={i!}>{i}</option>)}
                </select>
                <button
                  onClick={() => printFinancialReport({ totalRevenue, totalExpenses, netProfit, totalRemaining, students: allStudentsFiltered, paidByStudent })}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}
                  data-testid="button-print-all-students">
                  <Printer className="h-4 w-4" /> طباعة الكشف
                </button>
                {(allStudentsSearch || allStudentsStatus || allStudentsInstitution) && (
                  <button onClick={() => { setAllStudentsSearch(""); setAllStudentsStatus(""); setAllStudentsInstitution(""); }}
                    className="text-xs text-muted-foreground underline">
                    مسح الفلتر
                  </button>
                )}
              </div>
            </div>

            {/* Full Students Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--muted)/0.3)" }}>
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-black text-foreground">كشف المشتركين الشامل</h3>
                <span className="text-xs text-muted-foreground mr-auto">{allStudentsFiltered.length} مشترك</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "hsl(var(--muted)/0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                      {["م","الاسم","الرقم","الجهة","سعر الاشتراك","المدفوع","المتبقي","نسبة السداد","الحالة"].map(h => (
                        <th key={h} className="px-3 py-3 text-right font-black text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allStudentsFiltered.length === 0 ? (
                      <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">لا توجد نتائج</td></tr>
                    ) : allStudentsFiltered.map((st, i) => (
                      <tr key={st.id}
                        className="border-b border-border/30 hover:bg-primary/3 transition-colors"
                        style={st.overpaid > 0 ? { background: "#FEF2F240" } : undefined}
                        data-testid={`row-all-student-${st.internalId}`}>
                        <td className="px-3 py-2.5 text-muted-foreground font-mono">{i + 1}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
                              style={{ background: st.status === "paid" ? "linear-gradient(135deg,#10B981,#059669)" : st.status === "partial" ? "linear-gradient(135deg,#F59E0B,#D97706)" : "linear-gradient(135deg,#DC2626,#B91C1C)" }}>
                              {(st.studentName || "؟").charAt(0)}
                            </div>
                            <span className="font-semibold text-foreground">{st.studentName}</span>
                            {st.overpaid > 0 && <span className="px-1 py-0.5 rounded text-[9px] font-bold" style={{ background: "#FEE2E2", color: "#DC2626" }}>دفع زيادة</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-muted-foreground">{st.studentId || "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{st.institution || "—"}</td>
                        <td className="px-3 py-2.5 font-bold text-foreground">{formatCurrency(st.price)}</td>
                        <td className="px-3 py-2.5 font-black" style={{ color: "#059669" }}>{formatCurrency(st.paid)}</td>
                        <td className="px-3 py-2.5 font-black" style={{ color: st.remaining > 0 ? "#DC2626" : st.overpaid > 0 ? "#F59E0B" : "#059669" }}>
                          {st.remaining > 0 ? formatCurrency(st.remaining) : st.overpaid > 0 ? `+${formatCurrency(st.overpaid)}` : "مكتمل ✓"}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden min-w-12" style={{ background: "hsl(var(--muted))" }}>
                              <div className="h-full rounded-full" style={{
                                width: `${Math.min(st.pct, 100)}%`,
                                background: st.pct >= 100 ? "#059669" : st.pct >= 50 ? "#F59E0B" : "#DC2626"
                              }} />
                            </div>
                            <span className="font-bold text-foreground w-8 shrink-0 text-right">{st.pct}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded-full font-bold text-[10px]"
                            style={st.status === "paid"
                              ? { background: "#D1FAE5", color: "#059669" }
                              : st.status === "partial"
                                ? { background: "#FEF3C7", color: "#D97706" }
                                : { background: "#FEE2E2", color: "#DC2626" }}>
                            {st.status === "paid" ? "مسدد" : st.status === "partial" ? "جزئي" : "لم يدفع"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "hsl(var(--muted)/0.5)", borderTop: "2px solid hsl(var(--border))" }}>
                      <td colSpan={4} className="px-3 py-3 font-black text-foreground">إجمالي: {allStudentsFiltered.length} مشترك</td>
                      <td className="px-3 py-3 font-black text-foreground">{formatCurrency(filteredTotalPrice)}</td>
                      <td className="px-3 py-3 font-black" style={{ color: "#059669" }}>{formatCurrency(filteredTotalPaid)}</td>
                      <td className="px-3 py-3 font-black" style={{ color: "#DC2626" }}>{formatCurrency(filteredTotalRemaining)}</td>
                      <td colSpan={2} className="px-3 py-3 font-black text-foreground">
                        {filteredTotalPrice > 0 ? `${Math.round((filteredTotalPaid / filteredTotalPrice) * 100)}%` : "—"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
