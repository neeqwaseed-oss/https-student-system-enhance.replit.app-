import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  DollarSign, Users, Printer, RefreshCcw, X, Save,
  ChevronDown, ChevronUp, Plus, Trash2, BookOpen, ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { useGlobalToast } from "@/App";
import { formatCurrency } from "@/lib/utils";
import { printSalariesReport } from "@/lib/excel";
import type { Teacher, TeacherSalary, Student } from "@shared/schema";

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

function SalaryModal({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const { toast } = useGlobalToast();
  const now = new Date();

  const { data: salaries = [] } = useQuery<TeacherSalary[]>({
    queryKey: ["/api/salaries", teacher.id],
    queryFn: () => fetch(`/api/salaries?teacherId=${teacher.id}`).then(r => r.json()),
  });

  const [form, setForm] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    amount: "",
    paidDate: now.toISOString().slice(0, 10),
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/salaries", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salaries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/salaries", teacher.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "تم تسجيل الراتب" });
      setForm(p => ({ ...p, amount: "", notes: "" }));
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/salaries/${id}`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salaries", teacher.id] });
      toast({ title: "تم حذف الراتب" });
    },
  });

  const total = salaries.reduce((s, r) => s + (r.amount || 0), 0);
  const inputClass = "w-full px-3 py-2 rounded-xl text-sm border outline-none transition-all bg-background text-foreground";
  const inputStyle = { borderColor: "hsl(var(--border))" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)", borderBottom: "1px solid hsl(var(--border))" }}>
          <DollarSign className="h-4 w-4 text-white" />
          <h3 className="font-bold text-white flex-1">رواتب: {teacher.name}</h3>
          <span className="text-white/80 text-sm font-bold">{formatCurrency(total)} إجمالي</span>
          <button onClick={onClose} className="text-white/70 hover:text-white mr-2"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-60px)] space-y-4">
          {/* Add salary form */}
          <form onSubmit={e => {
            e.preventDefault();
            if (!form.amount) return;
            createMutation.mutate({
              teacherId: teacher.id,
              month: form.month,
              year: form.year,
              amount: parseFloat(form.amount),
              paidDate: form.paidDate,
              notes: form.notes,
            });
          }} className="rounded-xl p-4 space-y-3" style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}>
            <p className="text-xs font-black text-primary uppercase tracking-wider">إضافة دفعة راتب</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1 text-foreground">الشهر</label>
                <select className={inputClass} style={inputStyle} value={form.month}
                  onChange={e => setForm(p => ({ ...p, month: Number(e.target.value) }))}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-foreground">السنة</label>
                <input className={inputClass} style={inputStyle} type="number" value={form.year}
                  onChange={e => setForm(p => ({ ...p, year: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-foreground">المبلغ *</label>
                <input className={inputClass} style={inputStyle} type="number" min="0" step="any"
                  value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-foreground">تاريخ الدفع</label>
                <input className={inputClass} style={inputStyle} type="date"
                  value={form.paidDate} onChange={e => setForm(p => ({ ...p, paidDate: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <input className={`${inputClass} flex-1`} style={inputStyle} value={form.notes} placeholder="ملاحظات..."
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              <button type="submit" disabled={createMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                <Plus className="h-4 w-4" />
                {createMutation.isPending ? "..." : "إضافة"}
              </button>
            </div>
          </form>

          {/* Salaries list */}
          {salaries.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد دفعات رواتب مسجلة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {salaries.map(s => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))" }}>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {MONTHS[s.month - 1]} {s.year}
                    </p>
                    {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                    {s.paidDate && <p className="text-xs text-muted-foreground">{s.paidDate}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm" style={{ color: "#10B981" }}>{formatCurrency(s.amount)}</span>
                    <button onClick={() => deleteMutation.mutate(s.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SalariesPage() {
  const [salaryTeacher, setSalaryTeacher] = useState<Teacher | null>(null);

  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: allSalaries = [] } = useQuery<TeacherSalary[]>({
    queryKey: ["/api/salaries"],
    queryFn: () => fetch("/api/salaries").then(r => r.json()),
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const salaryByTeacher = allSalaries.reduce((acc, s) => {
    if (!acc[s.teacherId]) acc[s.teacherId] = { total: 0, count: 0, lastDate: "" };
    acc[s.teacherId].total += s.amount || 0;
    acc[s.teacherId].count++;
    if (!acc[s.teacherId].lastDate || (s.paidDate && s.paidDate > acc[s.teacherId].lastDate)) {
      acc[s.teacherId].lastDate = s.paidDate ?? "";
    }
    return acc;
  }, {} as Record<string, { total: number; count: number; lastDate: string }>);

  const studentsByTeacher = students.reduce((acc, s) => {
    if (s.teacherName) {
      acc[s.teacherName] = (acc[s.teacherName] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const totalPaid = allSalaries.reduce((s, r) => s + (r.amount || 0), 0);
  const totalPayments = allSalaries.length;

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-amber-500" /> إدارة رواتب المدرسين الشاملة
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">متابعة وتسجيل رواتب جميع المدرسين</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => printSalariesReport(teachers.map(t => ({ ...t, teacherName: t.name })), allSalaries)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            data-testid="button-print-salaries-report">
            <Printer className="h-4 w-4" /> طباعة التقرير
          </button>
          <Link href="/teachers">
            <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border transition-all hover:-translate-y-0.5"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
              data-testid="button-back-salaries">
              <ArrowRight className="h-4 w-4" /> رجوع
            </button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "إجمالي المدرسين", value: teachers.length, icon: BookOpen, grad: "linear-gradient(135deg, #F43F5E, #DB2777)" },
          { label: "إجمالي المدفوعات", value: formatCurrency(totalPaid), icon: DollarSign, grad: "linear-gradient(135deg, #10B981, #059669)" },
          { label: "عدد الدفعات الكلي", value: totalPayments, icon: RefreshCcw, grad: "linear-gradient(135deg, #F59E0B, #EA580C)" },
        ].map(({ label, value, icon: Icon, grad }) => (
          <div key={label} className="glass-card rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ background: grad }}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
              {["#", "اسم المدرس", "المادة/التخصص", "عدد الطلاب", "عدد الدفعات", "إجمالي المدفوع", "آخر دفعة", "الإجراءات"].map(h => (
                <th key={h} className="px-4 py-3 text-right text-xs font-black text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">جاري التحميل...</td></tr>
            ) : teachers.length === 0 ? (
              <tr><td colSpan={8} className="p-12 text-center">
                <DollarSign className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="font-bold text-foreground">لا يوجد مدرسون</p>
              </td></tr>
            ) : (
              teachers.map((teacher, i) => {
                const info = salaryByTeacher[teacher.id] || { total: 0, count: 0, lastDate: "" };
                const stuCount = studentsByTeacher[teacher.name] || 0;
                return (
                  <tr key={teacher.id} className="border-b border-border/40 hover:bg-primary/3 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
                          style={{ background: "linear-gradient(135deg, #F43F5E, #DB2777)" }}>
                          {teacher.name.charAt(0)}
                        </div>
                        <p className="font-semibold text-foreground">{teacher.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{teacher.subject || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-1 rounded-full"
                        style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}>
                        {stuCount} طالب
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{info.count} دفعات</td>
                    <td className="px-4 py-3">
                      <span className="font-black text-sm" style={{ color: info.total > 0 ? "#10B981" : "hsl(var(--muted-foreground))" }}>
                        {formatCurrency(info.total)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{info.lastDate || "---"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSalaryTeacher(teacher)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
                        style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)" }}
                        data-testid={`button-manage-salary-${teacher.id}`}>
                        <DollarSign className="h-3 w-3" /> إدارة الرواتب
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {salaryTeacher && <SalaryModal teacher={salaryTeacher} onClose={() => setSalaryTeacher(null)} />}
    </div>
  );
}
