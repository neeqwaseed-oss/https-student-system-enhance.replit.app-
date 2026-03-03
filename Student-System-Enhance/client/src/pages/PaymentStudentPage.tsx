import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Wallet, Search, X, Save, CheckCircle, AlertCircle,
  Phone, GraduationCap, Users
} from "lucide-react";
import { useGlobalToast } from "@/App";
import { formatCurrency } from "@/lib/utils";
import type { Student, Payment } from "@shared/schema";

function PaymentModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const { toast } = useGlobalToast();

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/payments/student", student.internalId],
    queryFn: () => fetch(`/api/payments/student/${student.internalId}`).then(r => r.json()),
  });

  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const remaining = (student.subscriptionPrice || 0) - totalPaid;

  const [form, setForm] = useState({
    amount: String(remaining > 0 ? remaining : student.subscriptionPrice || 0),
    paymentMethod: "نقد",
    paymentDate: new Date().toISOString().slice(0, 10),
    senderName: "",
    receiverName: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/payments", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/student", student.internalId] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/student"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "تم تسجيل الدفعة بنجاح" });
      onClose();
    },
    onError: (e: any) => toast({ title: "خطأ في التسجيل", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      internalId: student.internalId,
      studentId: student.studentId,
      studentName: student.studentName,
      subscriptionType: student.subscriptionType || "",
      paymentId: `PAY-${Date.now()}`,
      amount: parseFloat(form.amount) || 0,
      paymentMethod: form.paymentMethod,
      paymentDate: form.paymentDate,
      senderName: form.senderName,
      receiverName: form.receiverName,
      notes: form.notes,
      isDeleted: false,
    });
  };

  const inputClass = "w-full px-3 py-2 rounded-xl text-sm border outline-none transition-all bg-background text-foreground";
  const inputStyle = { borderColor: "hsl(var(--border))" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)", borderBottom: "1px solid hsl(var(--border))" }}>
          <Wallet className="h-4 w-4 text-white" />
          <h3 className="font-bold text-white flex-1">تسجيل دفعة</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5">
          {/* Student summary */}
          <div className="rounded-xl p-3 mb-4 flex items-center gap-3"
            style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shrink-0"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
              {student.studentName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground truncate">{student.studentName}</p>
              <p className="text-xs text-muted-foreground">{student.studentId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">المتبقي</p>
              <p className="font-black text-sm" style={{ color: remaining > 0 ? "#F43F5E" : "#10B981" }}>
                {formatCurrency(remaining)}
              </p>
            </div>
          </div>

          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "الاشتراك", value: formatCurrency(student.subscriptionPrice || 0), color: "#3B82F6" },
              { label: "المدفوع", value: formatCurrency(totalPaid), color: "#10B981" },
              { label: "المتبقي", value: formatCurrency(remaining), color: remaining > 0 ? "#F43F5E" : "#10B981" },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-2 text-center"
                style={{ background: `${item.color}11`, border: `1px solid ${item.color}22` }}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xs font-black mt-0.5" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">المبلغ (ريال) *</label>
                <input className={inputClass} style={inputStyle} type="number" min="0" step="any"
                  value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">تاريخ الدفع</label>
                <input className={inputClass} style={inputStyle} type="date"
                  value={form.paymentDate} onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">طريقة الدفع</label>
                <select className={inputClass} style={inputStyle} value={form.paymentMethod}
                  onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                  {["نقد", "تحويل بنكي", "بطاقة", "شيك"].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">اسم المُرسِل</label>
                <input className={inputClass} style={inputStyle} value={form.senderName}
                  onChange={e => setForm(p => ({ ...p, senderName: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">ملاحظات</label>
              <textarea className={`${inputClass} resize-none`} style={inputStyle} rows={2}
                value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={createMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)" }}
                data-testid="button-submit-payment">
                <Save className="h-4 w-4" />
                {createMutation.isPending ? "جاري الحفظ..." : "تسجيل الدفعة"}
              </button>
              <button type="button" onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>إلغاء</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function StudentPaymentRow({ student }: { student: Student }) {
  const [showModal, setShowModal] = useState(false);

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/payments/student", student.internalId],
    queryFn: () => fetch(`/api/payments/student/${student.internalId}`).then(r => r.json()),
  });

  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const remaining = (student.subscriptionPrice || 0) - totalPaid;
  const isPaid = remaining <= 0;

  return (
    <>
      <tr className="border-b border-border/40 hover:bg-primary/3 transition-colors" data-testid={`row-payment-student-${student.internalId}`}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
              {student.studentName.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">{student.studentName}</p>
              <p className="text-xs text-muted-foreground">{student.institution || "—"}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{student.studentId}</td>
        <td className="px-4 py-3 text-xs text-muted-foreground" dir="ltr">{student.studentPhone || "—"}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl text-xs font-black"
              style={{
                background: isPaid ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
                color: isPaid ? "#10B981" : "#F43F5E",
                border: `1px solid ${isPaid ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)"}`
              }}>
              {isPaid ? <CheckCircle className="h-3 w-3 inline-block ml-1" /> : <AlertCircle className="h-3 w-3 inline-block ml-1" />}
              {formatCurrency(remaining)} ريال
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)" }}
            data-testid={`button-pay-${student.internalId}`}>
            <Wallet className="h-3 w-3" /> تسجيل دفعة
          </button>
        </td>
      </tr>
      {showModal && <PaymentModal student={student} onClose={() => setShowModal(false)} />}
    </>
  );
}

export default function PaymentStudentPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "partial">("all");

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: allPayments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const paymentsByStudent = allPayments.reduce((acc, p) => {
    if (!acc[p.internalId]) acc[p.internalId] = 0;
    acc[p.internalId] += p.amount || 0;
    return acc;
  }, {} as Record<string, number>);

  const filtered = students.filter(s => {
    const matchSearch = !search ||
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      (s.studentPhone || "").includes(search);

    if (!matchSearch) return false;

    const paid = paymentsByStudent[s.internalId] || 0;
    const remaining = (s.subscriptionPrice || 0) - paid;
    if (filter === "paid") return remaining <= 0;
    if (filter === "partial") return remaining > 0;
    return true;
  });

  const totalCount = students.length;
  const paidCount = students.filter(s => {
    const paid = paymentsByStudent[s.internalId] || 0;
    return (s.subscriptionPrice || 0) - paid <= 0;
  }).length;
  const partialCount = totalCount - paidCount;

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Wallet className="h-6 w-6 text-amber-500" /> سداد مشتركات
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">تسجيل دفعات المشتركين ومتابعة الحالة المالية</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "إجمالي المشتركين", value: totalCount, icon: Users, grad: "linear-gradient(135deg, #8B5CF6, #7C3AED)", action: () => setFilter("all") },
          { label: "سداد كامل", value: paidCount, icon: CheckCircle, grad: "linear-gradient(135deg, #10B981, #059669)", action: () => setFilter("paid") },
          { label: "غير مكتمل", value: partialCount, icon: AlertCircle, grad: "linear-gradient(135deg, #F59E0B, #EA580C)", action: () => setFilter("partial") },
        ].map(({ label, value, icon: Icon, grad, action }) => (
          <button key={label} onClick={action}
            className="glass-card rounded-2xl p-4 flex items-center gap-4 text-right hover:-translate-y-1 transition-all duration-200 cursor-pointer w-full"
            style={filter !== "all" && action.toString().includes(filter) ? { boxShadow: "0 0 0 2px #8B5CF6" } : {}}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ background: grad }}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="glass-card rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث باسم المشترك أو الرقم..."
              className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm border outline-none bg-background text-foreground"
              style={{ borderColor: "hsl(var(--border))" }} data-testid="input-search-payments" />
          </div>
          <div className="flex items-center gap-2">
            {[
              { key: "all", label: `الكل (${totalCount})`, color: "#8B5CF6" },
              { key: "paid", label: `مكتمل (${paidCount})`, color: "#10B981" },
              { key: "partial", label: `جزئي (${partialCount})`, color: "#F59E0B" },
            ].map(({ key, label, color }) => (
              <button key={key} onClick={() => setFilter(key as any)}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={filter === key
                  ? { background: color, color: "white" }
                  : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
              {["اسم المشترك", "الرقم الجامعي", "رقم الهاتف", "المبلغ المتبقي", "الإجراءات"].map(h => (
                <th key={h} className="px-4 py-3 text-right text-xs font-black text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  جاري التحميل...
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-12 text-center">
                <Wallet className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="font-bold text-foreground">لا يوجد مشتركون</p>
              </td></tr>
            ) : (
              filtered.map(student => (
                <StudentPaymentRow key={student.id} student={student} />
              ))
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-4 py-3 text-xs text-muted-foreground"
            style={{ borderTop: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.3)" }}>
            عرض {filtered.length} من {students.length} مشترك
          </div>
        )}
      </div>
    </div>
  );
}
