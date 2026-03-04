import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Plus, Search, Trash2, Wallet, TrendingUp, TrendingDown, DollarSign,
  X, Save, Pencil, Printer, Calendar, ArrowRight, Users, CheckCircle,
  Landmark, CreditCard, LayoutList, BarChart3, ChevronDown,
  AlertTriangle, XCircle, ShieldCheck, ShieldAlert, Zap, Target,
  CheckSquare, Square
} from "lucide-react";
import { Link } from "wouter";
import { useGlobalToast } from "@/App";
import { formatCurrency } from "@/lib/utils";
import { printReceiverStatement } from "@/lib/excel";
import type { Payment, Student } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

const PAYMENT_METHODS = ["نقد", "تحويل بنكي", "بطاقة ائتمان", "شيك", "أخرى"];

const RECEIVERS = [
  { key: "alhali", name: "محمد بن عشق", bank: "الأهلي", color: "#10B981", grad: "linear-gradient(135deg,#10B981,#059669)", glow: "rgba(16,185,129,0.35)" },
  { key: "d360", name: "أحمد عبدالعزيز", bank: "D360", color: "#3B82F6", grad: "linear-gradient(135deg,#3B82F6,#2563EB)", glow: "rgba(59,130,246,0.35)" },
  { key: "other", name: "أخرى", bank: "", color: "#8B5CF6", grad: "linear-gradient(135deg,#8B5CF6,#7C3AED)", glow: "rgba(139,92,246,0.35)" },
];

type StatsMode = "all" | "alhali" | "d360" | "other" | "installments";

const PAYMENT_TYPES = [
  { key: "الأولى", label: "الدفعة الأولى", icon: "1️⃣", color: "#3B82F6" },
  { key: "الثانية", label: "الدفعة الثانية", icon: "2️⃣", color: "#8B5CF6" },
  { key: "الثالثة", label: "الدفعة الثالثة", icon: "3️⃣", color: "#F59E0B" },
  { key: "سداد كامل", label: "سداد كامل", icon: "✅", color: "#10B981" },
];

const FORM_INPUT_CLS = "w-full px-3 py-2 rounded-xl text-sm border outline-none transition-all bg-background text-foreground";
const FORM_INPUT_ST = { borderColor: "hsl(var(--border))" };

type StudentStat = {
  internalId: string; paymentCount: number; totalPaid: number;
  subscriptionPrice: number; discountValue: number; remainingAmount: number; isFullyPaid: boolean;
};

function PaymentForm({
  students, studentCounts, payments: allPayments, onSubmit, isPending, onClose,
}: {
  students: Student[];
  studentCounts: StudentStat[];
  payments: Payment[];
  onSubmit: (data: Record<string, unknown>) => void;
  isPending: boolean;
  onClose: () => void;
}) {
  const { toast } = useGlobalToast();
  const [form, setForm] = useState({
    internalId: "", studentId: "", studentName: "",
    paymentDate: new Date().toISOString().split("T")[0],
    amount: "", paymentMethod: "تحويل بنكي",
    senderName: "", receiverName: "محمد بن عشق",
    accountType: "الأهلي", customReceiverName: "",
    subscriptionType: "", discountAmount: "", notes: "",
    paymentType: "",
    paymentId: `PAY-${Date.now()}`, isDeleted: false,
  });
  const [receiverMode, setReceiverMode] = useState<"alhali" | "d360" | "other">("alhali");
  const [studentSearch, setStudentSearch] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setShowStudentDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedStudentStats = form.internalId
    ? studentCounts.find(sc => sc.internalId === form.internalId)
    : null;

  const enteredAmount = parseFloat(form.amount) || 0;
  const remaining = selectedStudentStats?.remainingAmount ?? 0;
  const isOverpayment = enteredAmount > 0 && remaining > 0 && enteredAmount > remaining;
  const isOverpaymentOnPaid = enteredAmount > 0 && selectedStudentStats?.isFullyPaid;
  const overpaymentAmount = isOverpayment ? enteredAmount - remaining : 0;

  const duplicatePayments = form.internalId && form.paymentDate && enteredAmount > 0
    ? allPayments.filter(p =>
        p.internalId === form.internalId &&
        p.paymentDate === form.paymentDate &&
        Math.abs((p.amount || 0) - enteredAmount) < 0.01
      )
    : [];

  const onReceiverChange = (mode: "alhali" | "d360" | "other") => {
    setReceiverMode(mode);
    if (mode === "alhali") setForm(p => ({ ...p, receiverName: "محمد بن عشق", accountType: "الأهلي" }));
    else if (mode === "d360") setForm(p => ({ ...p, receiverName: "أحمد عبدالعزيز", accountType: "D360" }));
    else setForm(p => ({ ...p, receiverName: "", accountType: "" }));
  };

  const filteredStudentsForCombo = [...students]
    .sort((a, b) => (a.studentName || "").localeCompare(b.studentName || "", "ar"))
    .filter(s => !studentSearch ||
      (s.studentName || "").includes(studentSearch) ||
      (s.studentId || "").includes(studentSearch)
    );

  const onStudentSelect = (internalId: string) => {
    const s = students.find(st => st.internalId === internalId);
    if (!s) return;
    const sc = studentCounts.find(c => c.internalId === internalId);
    const existingCount = sc?.paymentCount || 0;
    const suggestedType = existingCount === 0 ? "الأولى"
      : existingCount === 1 ? "الثانية"
      : existingCount === 2 ? "الثالثة"
      : "سداد كامل";
    setForm(p => ({
      ...p,
      internalId: s.internalId, studentId: s.studentId, studentName: s.studentName,
      senderName: s.studentName, subscriptionType: s.subscriptionType || "",
      amount: String(s.subscriptionPrice || ""), paymentType: suggestedType,
    }));
    setStudentSearch(s.studentName || "");
    setShowStudentDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const receiverName = receiverMode === "other" ? form.customReceiverName : form.receiverName;
    if (!form.internalId || !form.amount) { toast({ title: "يرجى اختيار المشترك وإدخال المبلغ", variant: "destructive" }); return; }
    onSubmit({ ...form, receiverName, amount: parseFloat(form.amount) || 0, discountAmount: parseFloat(form.discountAmount) || 0 });
  };

  const fmt = (n: number) => n.toLocaleString("ar-SA");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold mb-1.5">المشترك *</label>
        <div ref={comboRef} className="relative">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              value={studentSearch}
              onChange={e => {
                setStudentSearch(e.target.value);
                setShowStudentDropdown(true);
                if (form.internalId) {
                  setForm(p => ({ ...p, internalId: "", studentId: "", studentName: "", senderName: "", amount: "", paymentType: "", subscriptionType: "" }));
                }
              }}
              onFocus={() => setShowStudentDropdown(true)}
              placeholder="ابحث عن المشترك بالاسم أو رقم القيد..."
              className={FORM_INPUT_CLS}
              style={{
                ...FORM_INPUT_ST,
                paddingRight: "2.5rem",
                ...(form.internalId ? { borderColor: "#10B981", background: "#F0FDF420" } : {}),
              }}
              autoComplete="off"
              data-testid="input-student-search"
            />
            {form.internalId && (
              <button type="button"
                onClick={() => {
                  setStudentSearch("");
                  setForm(p => ({ ...p, internalId: "", studentId: "", studentName: "", senderName: "", amount: "", paymentType: "" }));
                  setShowStudentDropdown(true);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title="مسح الاختيار">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {showStudentDropdown && !form.internalId && (
            <div className="absolute top-full right-0 left-0 z-50 max-h-56 overflow-y-auto rounded-xl shadow-2xl mt-1"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              {filteredStudentsForCombo.length === 0 ? (
                <div className="px-4 py-3 text-xs text-muted-foreground text-center">لا توجد نتائج للبحث عن "{studentSearch}"</div>
              ) : (
                <>
                  {filteredStudentsForCombo.slice(0, 25).map(s => {
                    const sc = studentCounts.find(c => c.internalId === s.internalId);
                    return (
                      <button key={s.internalId} type="button"
                        onMouseDown={e => { e.preventDefault(); onStudentSelect(s.internalId); }}
                        className="w-full text-right px-4 py-2.5 hover:bg-primary/10 transition-colors flex items-center justify-between gap-3"
                        style={{ borderBottom: "1px solid hsl(var(--border)/0.4)" }}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: sc?.isFullyPaid ? "linear-gradient(135deg,#10B981,#059669)" : sc && sc.paymentCount > 0 ? "linear-gradient(135deg,#F59E0B,#D97706)" : "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}>
                            {(s.studentName || "؟").charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground text-xs truncate">{s.studentName}</p>
                            <p className="text-[10px] text-muted-foreground">{s.studentId} {s.institution ? `— ${s.institution}` : ""}</p>
                          </div>
                        </div>
                        {sc && (
                          <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={sc.isFullyPaid
                              ? { background: "#D1FAE5", color: "#059669" }
                              : sc.remainingAmount > 0
                                ? { background: "#FEF3C7", color: "#D97706" }
                                : { background: "#E5E7EB", color: "#6B7280" }}>
                            {sc.isFullyPaid ? "✓ مسدد" : `متبقي ${sc.remainingAmount.toLocaleString("ar")} ر.س`}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {filteredStudentsForCombo.length > 25 && (
                    <div className="px-4 py-2 text-xs text-center text-muted-foreground"
                      style={{ borderTop: "1px solid hsl(var(--border)/0.4)" }}>
                      تظهر 25 من {filteredStudentsForCombo.length} نتيجة — اكتب أكثر للتصفية
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Student Summary Card */}
      {form.studentName && selectedStudentStats && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-3 px-4 py-3"
            style={{ background: "linear-gradient(135deg, #8B5CF620, #7C3AED10)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0"
              style={{ background: "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}>
              {form.studentName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{form.studentName}</p>
              <p className="text-xs text-muted-foreground">{form.subscriptionType} — {form.studentId}</p>
            </div>
            {selectedStudentStats.isFullyPaid ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white shrink-0"
                style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>✓ مسدد بالكامل</span>
            ) : selectedStudentStats.paymentCount > 0 ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white shrink-0"
                style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>
                {selectedStudentStats.paymentCount} دفعة مسجلة
              </span>
            ) : (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white shrink-0"
                style={{ background: "linear-gradient(135deg,#6B7280,#4B5563)" }}>لم يدفع بعد</span>
            )}
          </div>

          {selectedStudentStats.paymentCount > 0 && (
            <div className="px-4 py-3" style={{ background: "hsl(var(--muted)/0.3)", borderTop: "1px dashed hsl(var(--border))" }}>
              {!selectedStudentStats.isFullyPaid && (
                <div className="flex items-center gap-1.5 mb-2 p-2 rounded-lg"
                  style={{ background: "#FEF3C720", border: "1px solid #F59E0B40" }}>
                  <span className="text-xs">⚠️</span>
                  <p className="text-xs font-bold" style={{ color: "#D97706" }}>
                    تنبيه: هذا المشترك لديه {selectedStudentStats.paymentCount} دفعة مسجلة مسبقاً
                  </p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg p-2" style={{ background: "hsl(var(--muted)/0.5)" }}>
                  <p className="text-xs text-muted-foreground">المدفوع</p>
                  <p className="text-sm font-black" style={{ color: "#10B981" }}>{fmt(selectedStudentStats.totalPaid)} ر.س</p>
                </div>
                <div className="rounded-lg p-2" style={{ background: "hsl(var(--muted)/0.5)" }}>
                  <p className="text-xs text-muted-foreground">المتبقي</p>
                  <p className="text-sm font-black" style={{ color: selectedStudentStats.remainingAmount > 0 ? "#EF4444" : "#10B981" }}>
                    {fmt(selectedStudentStats.remainingAmount)} ر.س
                  </p>
                </div>
                <div className="rounded-lg p-2" style={{ background: "hsl(var(--muted)/0.5)" }}>
                  <p className="text-xs text-muted-foreground">عدد الدفعات</p>
                  <p className="text-sm font-black text-foreground">{selectedStudentStats.paymentCount}</p>
                </div>
              </div>
              {selectedStudentStats.subscriptionPrice > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>نسبة السداد</span>
                    <span>{Math.round((selectedStudentStats.totalPaid / selectedStudentStats.subscriptionPrice) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((selectedStudentStats.totalPaid / selectedStudentStats.subscriptionPrice) * 100))}%`,
                        background: "linear-gradient(to left,#10B981,#059669)"
                      }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Payment Type Selector */}
      {form.studentName && (
        <div>
          <label className="block text-xs font-bold mb-1.5">نوع الدفعة *</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_TYPES.map(pt => (
              <button key={pt.key} type="button"
                onClick={() => setForm(p => ({ ...p, paymentType: pt.key }))}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all"
                style={{
                  borderColor: form.paymentType === pt.key ? pt.color : "hsl(var(--border))",
                  background: form.paymentType === pt.key ? `${pt.color}18` : "transparent",
                  color: form.paymentType === pt.key ? pt.color : "hsl(var(--muted-foreground))",
                }}
                data-testid={`payment-type-${pt.key}`}>
                <span>{pt.icon}</span> {pt.label}
                {form.paymentType === pt.key && <span className="mr-auto">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold mb-1.5">المُستلِم *</label>
        <div className="flex gap-2">
          {RECEIVERS.map(r => (
            <button key={r.key} type="button"
              onClick={() => onReceiverChange(r.key as "alhali" | "d360" | "other")}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all"
              style={{
                borderColor: receiverMode === r.key ? r.color : "hsl(var(--border))",
                background: receiverMode === r.key ? `${r.color}20` : "transparent",
                color: receiverMode === r.key ? r.color : "hsl(var(--muted-foreground))"
              }}>
              {r.bank || "أخرى"}<br />
              <span className="font-normal text-[10px]">{r.name}</span>
            </button>
          ))}
        </div>
        {receiverMode === "other" && (
          <input className={`${FORM_INPUT_CLS} mt-2`} style={FORM_INPUT_ST} value={form.customReceiverName}
            onChange={e => setForm(p => ({ ...p, customReceiverName: e.target.value }))}
            placeholder="اسم المستلم" required />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold">المبلغ (ريال) *</label>
            {selectedStudentStats && !selectedStudentStats.isFullyPaid && remaining > 0 && (
              <button type="button"
                onClick={() => setForm(p => ({ ...p, amount: String(remaining) }))}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: "#DBEAFE", color: "#1D4ED8" }}
                data-testid="button-suggest-amount">
                <Zap className="h-2.5 w-2.5" />
                اقتراح: {remaining.toLocaleString("ar")} ر.س
              </button>
            )}
          </div>
          <input className={FORM_INPUT_CLS} style={{
            ...FORM_INPUT_ST,
            ...(isOverpayment || isOverpaymentOnPaid ? { borderColor: "#DC2626", background: "#FEF2F2" } : {})
          }} type="number" min="0" value={form.amount}
            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" required
            data-testid="input-payment-amount" />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5">تاريخ الدفع</label>
          <input className={FORM_INPUT_CLS} style={FORM_INPUT_ST} type="date" value={form.paymentDate}
            onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} />
        </div>
      </div>

      {/* Smart Accounting Alerts */}
      {isOverpaymentOnPaid && (
        <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <XCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
          <div className="text-xs" style={{ color: "#991B1B" }}>
            <p className="font-black">🚨 خطأ محاسبي: هذا الطالب سدّد بالكامل!</p>
            <p className="mt-0.5 opacity-80">تسجيل هذه الدفعة سيجعل إجمالي المدفوعات يتجاوز قيمة الاشتراك. تحقق من البيانات قبل المتابعة.</p>
          </div>
        </div>
      )}

      {isOverpayment && !isOverpaymentOnPaid && (
        <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#D97706" }} />
          <div className="text-xs" style={{ color: "#92400E" }}>
            <p className="font-black">⚠️ تنبيه: المبلغ يتجاوز المتبقي للطالب</p>
            <div className="mt-1 space-y-0.5 opacity-90">
              <p>المتبقي للطالب: <strong>{remaining.toLocaleString("ar")} ر.س</strong></p>
              <p>المبلغ المدخل: <strong>{enteredAmount.toLocaleString("ar")} ر.س</strong></p>
              <p>الزيادة: <strong style={{ color: "#DC2626" }}>{overpaymentAmount.toLocaleString("ar")} ر.س</strong></p>
            </div>
          </div>
        </div>
      )}

      {duplicatePayments.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <XCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
          <div className="text-xs" style={{ color: "#991B1B" }}>
            <p className="font-black">🚨 دفعة مكررة محتملة!</p>
            <p className="mt-0.5 opacity-80">
              يوجد {duplicatePayments.length} دفعة بنفس الطالب والتاريخ والمبلغ مسجلة مسبقاً (رقم: {duplicatePayments.map(p => p.paymentId).join("، ")}).
              تأكد أنك لا تسجل نفس الدفعة مرتين.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold mb-1.5">طريقة الدفع</label>
          <select className={FORM_INPUT_CLS} style={FORM_INPUT_ST} value={form.paymentMethod}
            onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5">الخصم</label>
          <input className={FORM_INPUT_CLS} style={FORM_INPUT_ST} type="number" min="0" value={form.discountAmount}
            onChange={e => setForm(p => ({ ...p, discountAmount: e.target.value }))} placeholder="0.00" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-bold mb-1.5">اسم المُرسِل</label>
          <input className={FORM_INPUT_CLS} style={FORM_INPUT_ST} value={form.senderName}
            onChange={e => setForm(p => ({ ...p, senderName: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold mb-1.5">ملاحظات</label>
        <textarea className={`${FORM_INPUT_CLS} resize-none`} style={FORM_INPUT_ST} rows={2} value={form.notes}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#F59E0B,#EA580C)" }}>
          <Save className="h-4 w-4" /> {isPending ? "جاري الحفظ..." : "تسجيل الدفعة"}
        </button>
        <button type="button" onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
          style={{ borderColor: "hsl(var(--border))" }}>إلغاء</button>
      </div>
    </form>
  );
}

function Modal({ title, icon, onClose, danger, children }: {
  title: string; icon?: React.ReactNode; onClose: () => void; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: danger ? "linear-gradient(135deg,#F43F5E,#E11D48)" : "linear-gradient(135deg,#F59E0B,#EA580C)", borderBottom: "1px solid hsl(var(--border))" }}>
          {icon}
          <h3 className="font-bold text-white flex-1">{title}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

const EDIT_PAYMENT_TYPES = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "سداد كامل", "دفعة جزئية"];
const PAYMENT_METHODS_OPTS = ["تحويل بنكي", "نقد", "شيك", "بطاقة ائتمان"];
const RECEIVER_OPTS = [
  { name: "محمد بن عشق", account: "الأهلي" },
  { name: "أحمد عبدالعزيز", account: "D360" },
];

function EditPaymentForm({ payment, onSubmit, isPending, onClose }: {
  payment: Payment;
  onSubmit: (data: Record<string, unknown>) => void;
  isPending: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    amount: String(payment.amount || ""),
    paymentDate: payment.paymentDate || new Date().toISOString().split("T")[0],
    paymentType: (payment as any).paymentType || "",
    paymentMethod: payment.paymentMethod || "تحويل بنكي",
    receiverName: payment.receiverName || "محمد بن عشق",
    accountType: (payment as any).accountType || "الأهلي",
    senderName: payment.senderName || "",
    notes: payment.notes || "",
    discountAmount: String(payment.discountAmount || ""),
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return;
    onSubmit({
      amount,
      paymentDate: form.paymentDate,
      paymentType: form.paymentType,
      paymentMethod: form.paymentMethod,
      receiverName: form.receiverName,
      accountType: form.accountType,
      senderName: form.senderName,
      notes: form.notes,
      discountAmount: form.discountAmount ? parseFloat(form.discountAmount) : 0,
    });
  };

  const INP = "w-full px-3 py-2.5 rounded-xl text-sm border outline-none bg-background text-foreground";
  const INP_ST = { borderColor: "hsl(var(--border))" };
  const LBL = "block text-xs font-bold mb-1.5 text-foreground";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Student info (read-only) */}
      <div className="rounded-xl p-3 flex items-center gap-3"
        style={{ background: "hsl(var(--muted)/0.5)", border: "1px solid hsl(var(--border))" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ background: "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}>
          {(payment.studentName || "؟").charAt(0)}
        </div>
        <div>
          <p className="font-bold text-foreground text-sm">{payment.studentName || "—"}</p>
          <p className="text-xs text-muted-foreground">{payment.studentId} — رقم الدفعة: {payment.paymentId}</p>
        </div>
        <span className="mr-auto text-[10px] px-2 py-0.5 rounded-full font-bold text-muted-foreground"
          style={{ background: "hsl(var(--muted))" }}>لا يمكن التعديل</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LBL}>المبلغ (ر.س) *</label>
          <input type="number" min="1" step="0.01" required
            value={form.amount} onChange={e => set("amount", e.target.value)}
            className={INP} style={INP_ST} data-testid="input-edit-amount" />
        </div>
        <div>
          <label className={LBL}>تاريخ الدفعة *</label>
          <input type="date" required
            value={form.paymentDate} onChange={e => set("paymentDate", e.target.value)}
            className={INP} style={INP_ST} data-testid="input-edit-date" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LBL}>نوع الدفعة</label>
          <select value={form.paymentType} onChange={e => set("paymentType", e.target.value)}
            className={INP} style={INP_ST} data-testid="select-edit-payment-type">
            <option value="">— اختر —</option>
            {EDIT_PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={LBL}>طريقة الدفع</label>
          <select value={form.paymentMethod} onChange={e => set("paymentMethod", e.target.value)}
            className={INP} style={INP_ST} data-testid="select-edit-payment-method">
            {PAYMENT_METHODS_OPTS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={LBL}>المستلم</label>
        <div className="flex gap-2">
          {RECEIVER_OPTS.map(r => (
            <button key={r.name} type="button"
              onClick={() => { set("receiverName", r.name); set("accountType", r.account); }}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all"
              style={{
                borderColor: form.receiverName === r.name ? "#2563EB" : "hsl(var(--border))",
                background: form.receiverName === r.name ? "#EFF6FF" : "transparent",
                color: form.receiverName === r.name ? "#2563EB" : "hsl(var(--muted-foreground))",
              }}>
              {r.name}
              <span className="block text-[10px] font-normal opacity-70">{r.account}</span>
            </button>
          ))}
          <button type="button"
            onClick={() => { set("receiverName", ""); set("accountType", ""); }}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all"
            style={{
              borderColor: !RECEIVER_OPTS.find(r => r.name === form.receiverName) ? "#2563EB" : "hsl(var(--border))",
              background: !RECEIVER_OPTS.find(r => r.name === form.receiverName) ? "#EFF6FF" : "transparent",
              color: !RECEIVER_OPTS.find(r => r.name === form.receiverName) ? "#2563EB" : "hsl(var(--muted-foreground))",
            }}>
            أخرى
          </button>
        </div>
        {!RECEIVER_OPTS.find(r => r.name === form.receiverName) && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <input placeholder="اسم المستلم"
              value={form.receiverName} onChange={e => set("receiverName", e.target.value)}
              className={INP} style={INP_ST} />
            <input placeholder="نوع الحساب"
              value={form.accountType} onChange={e => set("accountType", e.target.value)}
              className={INP} style={INP_ST} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LBL}>اسم المُحوِّل / المُرسِل</label>
          <input value={form.senderName} onChange={e => set("senderName", e.target.value)}
            placeholder="اسم المرسل"
            className={INP} style={INP_ST} />
        </div>
        <div>
          <label className={LBL}>قيمة الخصم (ر.س)</label>
          <input type="number" min="0" step="0.01"
            value={form.discountAmount} onChange={e => set("discountAmount", e.target.value)}
            placeholder="0"
            className={INP} style={INP_ST} />
        </div>
      </div>

      <div>
        <label className={LBL}>ملاحظات</label>
        <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
          placeholder="أي ملاحظات إضافية..."
          className={`${INP} resize-none`} style={INP_ST} />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)" }}
          data-testid="button-save-edit-payment">
          {isPending ? "جاري الحفظ..." : <><Save className="h-4 w-4" /> حفظ التعديلات</>}
        </button>
        <button type="button" onClick={onClose}
          className="px-4 py-3 rounded-xl text-sm font-semibold border"
          style={{ borderColor: "hsl(var(--border))" }}>إلغاء</button>
      </div>
    </form>
  );
}

export default function PaymentsPage() {
  const { toast } = useGlobalToast();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Payment | null>(null);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [activeTab, setActiveTab] = useState<StatsMode>("all");
  const [installmentFilter, setInstallmentFilter] = useState<number | null>(null);
  const [printReceiver, setPrintReceiver] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments", search],
    queryFn: async () => {
      const url = search ? `/api/payments?search=${encodeURIComponent(search)}` : "/api/payments";
      return fetch(url).then(r => r.json());
    },
  });

  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });

  const { data: receiverStats = [] } = useQuery<{ receiverName: string; accountType: string; count: number; total: number }[]>({
    queryKey: ["/api/payments/stats/by-receiver"],
  });

  const { data: studentCounts = [] } = useQuery<{ internalId: string; studentName: string; studentId: string; institution: string; teacherName: string; paymentCount: number; totalPaid: number; subscriptionPrice: number; discountValue: number; remainingAmount: number; isFullyPaid: boolean }[]>({
    queryKey: ["/api/payments/stats/student-counts"],
  });

  const invalidatePayments = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    queryClient.invalidateQueries({ queryKey: ["/api/payments/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/payments", data).then(r => r.json()),
    onSuccess: () => { invalidatePayments(); setShowAdd(false); toast({ title: "تم تسجيل الدفعة بنجاح" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/payments/${id}`).then(r => r.json()),
    onSuccess: () => { 
      invalidatePayments(); 
      setDeleteConfirm(null); 
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (deleteConfirm) next.delete(deleteConfirm.id);
        return next;
      });
      toast({ title: "تم نقل الدفعة إلى سلة المهملات" }); 
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => apiRequest("POST", "/api/payments/bulk-delete", { ids }).then(r => r.json()),
    onSuccess: () => {
      invalidatePayments();
      setSelectedIds(new Set());
      toast({ title: "تم حذف الدفعات المحددة بنجاح" });
    },
    onError: (e: any) => toast({ title: "خطأ في الحذف الجماعي", description: e.message, variant: "destructive" }),
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === displayPayments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayPayments.map(p => p.id)));
    }
  };

  const handleBulkDelete = () => {
     if (window.confirm(`هل أنت متأكد من حذف ${selectedIds.size} دفعة؟`)) {
       bulkDeleteMutation.mutate(Array.from(selectedIds));
     }
   };

   const updateMutation = useMutation({
     mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
       apiRequest("PATCH", `/api/payments/${id}`, data).then(r => r.json()),
     onSuccess: () => { invalidatePayments(); setEditPayment(null); toast({ title: "تم تحديث الدفعة بنجاح ✓" }); },
     onError: (e: any) => toast({ title: "خطأ في التحديث", description: e.message, variant: "destructive" }),
   });

   const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const studentMap = Object.fromEntries(students.map(s => [s.internalId, s]));
  const paidByStudentMap = payments.reduce((acc, p) => {
    acc[p.internalId] = (acc[p.internalId] || 0) + (p.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const auditOverpaid = students.filter(s =>
    (paidByStudentMap[s.internalId] || 0) > (s.subscriptionPrice || 0) && (s.subscriptionPrice || 0) > 0
  );
  const auditOrphan = payments.filter(p => p.internalId && !studentMap[p.internalId]);
  const dupMap: Record<string, number> = {};
  payments.forEach(p => {
    const k = `${p.internalId}|${p.paymentDate}|${p.amount}`;
    dupMap[k] = (dupMap[k] || 0) + 1;
  });
  const auditDuplicates = Object.values(dupMap).filter(n => n > 1).length;
  const auditIssues = auditOverpaid.length + auditOrphan.length + auditDuplicates;

  const getReceiverKey = (p: Payment) => {
    const name = (p.receiverName || "").trim();
    if (name === "محمد بن عشق") return "alhali";
    if (name === "أحمد عبدالعزيز") return "d360";
    if (!name) return "other";
    return "other";
  };

  const filteredByTab = activeTab === "all"
    ? payments
    : payments.filter(p => getReceiverKey(p) === activeTab);

  const displayPayments = filteredByTab.filter(p =>
    !search || (p.studentName || "").includes(search) || (p.paymentId || "").includes(search)
  );

  const tabRevenue = displayPayments.reduce((s, p) => s + (p.amount || 0), 0);

  const mkGroup = (students: typeof studentCounts) => ({
    students,
    totalPaid: students.reduce((s, st) => s + st.totalPaid, 0),
    totalRemaining: students.reduce((s, st) => s + Math.max(st.remainingAmount, 0), 0),
    totalSubscription: students.reduce((s, st) => s + Math.max(st.subscriptionPrice - st.discountValue, 0), 0),
  });
  const installmentGroups = [
    { n: 0, label: "لم يدفع", color: "#DC2626", bg: "#FEE2E2", ...mkGroup(studentCounts.filter(s => s.paymentCount === 0)) },
    { n: 1, label: "دفعة واحدة", color: "#D97706", bg: "#FEF3C7", ...mkGroup(studentCounts.filter(s => s.paymentCount === 1)) },
    { n: 2, label: "دفعتان", color: "#2563EB", bg: "#DBEAFE", ...mkGroup(studentCounts.filter(s => s.paymentCount === 2)) },
    { n: 3, label: "3+ دفعات", color: "#059669", bg: "#D1FAE5", ...mkGroup(studentCounts.filter(s => s.paymentCount >= 3)) },
    { n: 99, label: "سداد كامل", color: "#7C3AED", bg: "#EDE9FE", ...mkGroup(studentCounts.filter(s => s.isFullyPaid)) },
    { n: -1, label: "متبقي عليهم", color: "#BE185D", bg: "#FCE7F3", ...mkGroup(studentCounts.filter(s => !s.isFullyPaid && s.paymentCount > 0)) },
  ];

  const filteredInstallment = installmentFilter !== null
    ? (() => {
        const group = installmentGroups.find(g => g.n === installmentFilter);
        return group ? group.students : studentCounts;
      })()
    : studentCounts;

  const alHaliStats = receiverStats.find(r => r.receiverName === "محمد بن عشق");
  const d360Stats = receiverStats.find(r => r.receiverName === "أحمد عبدالعزيز");
  const otherStats = receiverStats.filter(r => r.receiverName !== "محمد بن عشق" && r.receiverName !== "أحمد عبدالعزيز");
  const otherTotal = otherStats.reduce((s, r) => s + r.total, 0);
  const otherCount = otherStats.reduce((s, r) => s + r.count, 0);

  const printStatement = (receiverName: string) => {
    const items = payments.filter(p => p.receiverName === receiverName);
    printReceiverStatement(receiverName, items.map(p => ({
      senderName: p.studentName,
      paymentDate: p.paymentDate,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      paymentId: p.paymentId,
      notes: p.notes,
    })));
  };

  const tabs = [
    { key: "all", label: "جميع الدفعات", icon: <LayoutList className="h-4 w-4" /> },
    { key: "alhali", label: "الأهلي (محمد بن عشق)", icon: <Landmark className="h-4 w-4" /> },
    { key: "d360", label: "D360 (أحمد عبدالعزيز)", icon: <CreditCard className="h-4 w-4" /> },
    { key: "other", label: "أخرى", icon: <Wallet className="h-4 w-4" /> },
    { key: "installments", label: "سجل التقسيط", icon: <BarChart3 className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Wallet className="h-6 w-6 text-amber-500" /> المدفوعات
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{payments.length} دفعة مسجلة</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab !== "installments" && activeTab !== "all" && (
            <button onClick={() => printStatement(RECEIVERS.find(r => r.key === activeTab)?.name || "")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:-translate-y-0.5"
              style={{ borderColor: "hsl(var(--border))" }}
              data-testid="button-print-receiver">
              <Printer className="h-4 w-4" /> طباعة كشف الحساب
            </button>
          )}
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:-translate-y-0.5"
            style={{ borderColor: "hsl(var(--border))" }}>
            <Printer className="h-4 w-4" /> طباعة
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg,#F59E0B,#EA580C)", boxShadow: "0 6px 20px rgba(245,158,11,0.4)" }}
            data-testid="button-add-payment">
            <Plus className="h-4 w-4" /> تسجيل دفعة
          </button>
          <Link href="/">
            <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border transition-all hover:-translate-y-0.5"
              style={{ borderColor: "hsl(var(--border))" }} data-testid="button-back-payments">
              <ArrowRight className="h-4 w-4" /> رجوع
            </button>
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#F59E0B,#EA580C)", boxShadow: "0 6px 24px rgba(245,158,11,0.35)" }}>
          <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <TrendingUp className="h-5 w-5 text-white/80 mb-2" />
          <p className="text-xl font-black text-white">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs font-semibold text-white/75 mt-0.5">إجمالي الإيرادات</p>
        </div>
        <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: RECEIVERS[0].grad, boxShadow: `0 6px 24px ${RECEIVERS[0].glow}` }}>
          <Landmark className="h-5 w-5 text-white/80 mb-2" />
          <p className="text-xl font-black text-white">{formatCurrency(alHaliStats?.total || 0)}</p>
          <p className="text-xs font-semibold text-white/75 mt-0.5">الأهلي — {alHaliStats?.count || 0} دفعة</p>
        </div>
        <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: RECEIVERS[1].grad, boxShadow: `0 6px 24px ${RECEIVERS[1].glow}` }}>
          <CreditCard className="h-5 w-5 text-white/80 mb-2" />
          <p className="text-xl font-black text-white">{formatCurrency(d360Stats?.total || 0)}</p>
          <p className="text-xs font-semibold text-white/75 mt-0.5">D360 — {d360Stats?.count || 0} دفعة</p>
        </div>
        <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: RECEIVERS[2].grad, boxShadow: `0 6px 24px ${RECEIVERS[2].glow}` }}>
          <Wallet className="h-5 w-5 text-white/80 mb-2" />
          <p className="text-xl font-black text-white">{formatCurrency(otherTotal)}</p>
          <p className="text-xs font-semibold text-white/75 mt-0.5">أخرى — {otherCount} دفعة</p>
        </div>
      </div>

      {/* Accounting Audit Banner */}
      <div className="glass-card rounded-2xl p-4 mb-5 flex items-center gap-4 flex-wrap"
        style={{ border: `1px solid ${auditIssues > 0 ? "#FECACA" : "#BBF7D0"}`, background: auditIssues > 0 ? "#FEF2F205" : "#F0FDF405" }}>
        {auditIssues > 0 ? (
          <ShieldAlert className="h-5 w-5 shrink-0" style={{ color: "#DC2626" }} />
        ) : (
          <ShieldCheck className="h-5 w-5 shrink-0" style={{ color: "#059669" }} />
        )}
        <div className="flex-1">
          <p className="text-sm font-black" style={{ color: auditIssues > 0 ? "#DC2626" : "#059669" }}>
            {auditIssues > 0 ? `تدقيق الحسابات: ${auditIssues} مشكلة محاسبية` : "تدقيق الحسابات: جميع السجلات سليمة ✓"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {auditIssues > 0 ? (
              [
                auditOverpaid.length > 0 && `${auditOverpaid.length} طالب دفع زيادة`,
                auditOrphan.length > 0 && `${auditOrphan.length} دفعة بدون طالب`,
                auditDuplicates > 0 && `${auditDuplicates} مجموعة مكررة`,
              ].filter(Boolean).join(" — ")
            ) : "لا توجد دفعات مكررة أو تجاوزات أو دفعات بدون طلاب. انتقل إلى التقرير المالي للتفاصيل."}
          </p>
        </div>
        {auditIssues > 0 && (
          <Link href="/financial">
            <button className="text-xs font-bold px-3 py-2 rounded-xl text-white"
              style={{ background: "linear-gradient(135deg,#DC2626,#B91C1C)" }}>
              عرض التقرير المالي
            </button>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-2xl p-1.5 mb-5 flex gap-1 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="flex-1 min-w-max flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all"
            style={{
              background: activeTab === t.key ? "linear-gradient(135deg,#F59E0B,#EA580C)" : "transparent",
              color: activeTab === t.key ? "white" : "hsl(var(--muted-foreground))",
            }}
            data-testid={`tab-${t.key}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Installments Tab */}
      {activeTab === "installments" && (
        <div className="space-y-5">
          {/* Category Filter Cards with full financial breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {installmentGroups.map(g => (
              <button key={g.n} onClick={() => setInstallmentFilter(installmentFilter === g.n ? null : g.n)}
                className="glass-card rounded-2xl p-4 text-right transition-all hover:-translate-y-0.5 relative overflow-hidden"
                style={{ border: `2px solid ${installmentFilter === g.n ? g.color : "hsl(var(--border))"}`,
                  boxShadow: installmentFilter === g.n ? `0 4px 16px ${g.color}30` : undefined }}
                data-testid={`filter-installment-${g.n}`}>
                {/* Background tint */}
                <div className="absolute inset-0 opacity-5 rounded-2xl" style={{ background: g.color }} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} />
                      <span className="text-xs font-bold" style={{ color: g.color }}>{g.label}</span>
                    </div>
                    {installmentFilter === g.n && <CheckCircle className="h-3.5 w-3.5" style={{ color: g.color }} />}
                  </div>
                  {/* Student count */}
                  <p className="text-2xl font-black text-foreground mb-2">{g.students.length}
                    <span className="text-xs font-normal text-muted-foreground mr-1">طالب</span>
                  </p>
                  {/* Divider */}
                  <div style={{ borderTop: `1px dashed ${g.color}40`, marginBottom: "8px" }} />
                  {/* Amounts */}
                  <div className="space-y-1">
                    {g.n !== 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">المدفوع</span>
                        <span className="text-[11px] font-black" style={{ color: "#059669" }}>
                          {formatCurrency(g.totalPaid)}
                        </span>
                      </div>
                    )}
                    {g.totalRemaining > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">المتبقي</span>
                        <span className="text-[11px] font-black" style={{ color: "#DC2626" }}>
                          {formatCurrency(g.totalRemaining)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">قيمة الاشتراكات</span>
                      <span className="text-[11px] font-semibold text-foreground">
                        {formatCurrency(g.totalSubscription)}
                      </span>
                    </div>
                  </div>
                  {/* Collection progress bar */}
                  {g.totalSubscription > 0 && (
                    <div className="mt-2">
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.round((g.totalPaid / g.totalSubscription) * 100))}%`, background: g.color }} />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5 text-left">
                        {Math.round((g.totalPaid / g.totalSubscription) * 100)}% محصل
                      </p>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Grand Summary Bar */}
          {(() => {
            const allTotal = studentCounts;
            const grandPaid = allTotal.reduce((s, st) => s + st.totalPaid, 0);
            const grandRemaining = allTotal.reduce((s, st) => s + Math.max(st.remainingAmount, 0), 0);
            const grandSubscription = allTotal.reduce((s, st) => s + Math.max(st.subscriptionPrice - st.discountValue, 0), 0);
            const grandPct = grandSubscription > 0 ? Math.round((grandPaid / grandSubscription) * 100) : 0;
            return (
              <div className="glass-card rounded-2xl p-4"
                style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--muted)/0.2)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-black text-foreground">الإجمالي الكلي للمشتركين</h3>
                  <span className="text-xs text-muted-foreground">({allTotal.length} مشترك)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "قيمة الاشتراكات", value: grandSubscription, color: "hsl(var(--foreground))", icon: <Target className="h-3.5 w-3.5" /> },
                    { label: "إجمالي المحصل", value: grandPaid, color: "#059669", icon: <TrendingUp className="h-3.5 w-3.5" /> },
                    { label: "إجمالي المتبقي", value: grandRemaining, color: "#DC2626", icon: <TrendingDown className="h-3.5 w-3.5" /> },
                    { label: "نسبة التحصيل", value: null, color: grandPct >= 80 ? "#059669" : grandPct >= 50 ? "#D97706" : "#DC2626", icon: <BarChart3 className="h-3.5 w-3.5" />, text: `${grandPct}%` },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl p-3"
                      style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}>
                      <div className="flex items-center gap-1.5 mb-1" style={{ color: item.color }}>
                        {item.icon}
                        <span className="text-[10px] font-bold">{item.label}</span>
                      </div>
                      <p className="text-base font-black" style={{ color: item.color }}>
                        {item.text || formatCurrency(item.value!)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>نسبة التحصيل الكلية</span>
                    <span>{grandPct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${grandPct}%`, background: grandPct >= 80 ? "#059669" : grandPct >= 50 ? "#D97706" : "#DC2626" }} />
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
              <h3 className="font-bold text-foreground text-sm">
                {installmentFilter !== null ? installmentGroups.find(g => g.n === installmentFilter)?.label : "جميع الطلاب"}
                <span className="text-muted-foreground text-xs font-normal mr-2">({filteredInstallment.length} طالب)</span>
              </h3>
              {installmentFilter !== null && (
                <button onClick={() => setInstallmentFilter(null)} className="text-xs text-muted-foreground hover:text-foreground">إلغاء التصفية</button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                    {["الطالب", "رقم القيد", "الجهة", "المدرس", "عدد الدفعات", "المدفوع", "المتبقي", "الحالة"].map(h => (
                      <th key={h} className="px-3 py-3 text-right text-xs font-black text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredInstallment.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">لا يوجد طلاب</td></tr>
                  ) : filteredInstallment.map(s => {
                    const totalDue = s.subscriptionPrice - s.discountValue;
                    const pct = totalDue > 0 ? Math.min(100, Math.round((s.totalPaid / totalDue) * 100)) : 0;
                    return (
                    <tr key={s.internalId} className="border-b border-border/40 hover:bg-primary/3 transition-colors"
                      data-testid={`row-installment-${s.internalId}`}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}>
                            {s.studentName.charAt(0)}
                          </div>
                          <span className="font-semibold text-foreground text-xs">{s.studentName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground font-mono">{s.studentId}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{s.institution || "—"}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{s.teacherName || "—"}</td>
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            background: s.paymentCount === 0 ? "#FEE2E2" : s.paymentCount >= 3 ? "#D1FAE5" : "#FEF3C7",
                            color: s.paymentCount === 0 ? "#DC2626" : s.paymentCount >= 3 ? "#059669" : "#D97706"
                          }}>
                          {s.paymentCount} {s.paymentCount === 1 ? "دفعة" : "دفعات"}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-black text-emerald-600 dark:text-emerald-400 text-xs">{formatCurrency(s.totalPaid)}</td>
                      <td className="px-3 py-3">
                        <div>
                          <span className={`text-xs font-bold ${s.remainingAmount > 0 ? "text-rose-500" : "text-emerald-600"}`}>
                            {s.remainingAmount > 0 ? formatCurrency(s.remainingAmount) : "مكتمل"}
                          </span>
                          {totalDue > 0 && (
                            <div className="w-16 h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: "#E5E7EB" }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? "#059669" : pct >= 50 ? "#D97706" : "#DC2626" }} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: s.isFullyPaid ? "#D1FAE5" : s.paymentCount === 0 ? "#FEE2E2" : "#FEF3C7", color: s.isFullyPaid ? "#059669" : s.paymentCount === 0 ? "#DC2626" : "#D97706" }}>
                          {s.isFullyPaid ? "مكتمل" : s.paymentCount === 0 ? "لم يدفع" : "جزئي"}
                        </span>
                      </td>
                    </tr>
                  )})}
                </tbody>
                <tfoot>
                  <tr style={{ background: "hsl(var(--muted)/0.6)", borderTop: "2px solid hsl(var(--border))" }}>
                    <td colSpan={4} className="px-3 py-3 text-xs font-black text-foreground">
                      الإجمالي ({filteredInstallment.length} طالب)
                    </td>
                    <td className="px-3 py-3 text-xs font-black text-foreground">
                      {filteredInstallment.reduce((s, st) => s + st.paymentCount, 0)} دفعة
                    </td>
                    <td className="px-3 py-3 text-xs font-black" style={{ color: "#059669" }}>
                      {formatCurrency(filteredInstallment.reduce((s, st) => s + st.totalPaid, 0))}
                    </td>
                    <td className="px-3 py-3 text-xs font-black" style={{ color: "#DC2626" }}>
                      {formatCurrency(filteredInstallment.reduce((s, st) => s + Math.max(st.remainingAmount, 0), 0))}
                    </td>
                    <td className="px-3 py-3 text-xs font-black text-foreground">
                      {(() => {
                        const totalSub = filteredInstallment.reduce((s, st) => s + Math.max(st.subscriptionPrice - st.discountValue, 0), 0);
                        const totalPaid = filteredInstallment.reduce((s, st) => s + st.totalPaid, 0);
                        return totalSub > 0 ? `${Math.round((totalPaid / totalSub) * 100)}%` : "—";
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payments Table */}
      {activeTab !== "installments" && (
        <>
          <div className="glass-card rounded-2xl p-4 mb-4 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="بحث بالاسم، رقم الدفعة..."
                className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm border outline-none bg-background text-foreground"
                style={{ borderColor: "hsl(var(--border))" }} data-testid="input-search-payments" />
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)", boxShadow: "0 6px 20px rgba(244,63,94,0.4)" }}
                data-testid="button-bulk-delete-payments"
              >
                <Trash2 className="h-4 w-4" />
                حذف المحددين ({selectedIds.size})
              </button>
            )}
          </div>

          {activeTab !== "all" && (
            <div className="glass-card rounded-2xl p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">
                  {RECEIVERS.find(r => r.key === activeTab)?.name}
                  <span className="text-muted-foreground font-normal mr-2 text-xs">({displayPayments.length} دفعة)</span>
                </p>
                <p className="text-xl font-black mt-1" style={{ color: RECEIVERS.find(r => r.key === activeTab)?.color }}>
                  {formatCurrency(tabRevenue)}
                </p>
              </div>
              <button onClick={() => printStatement(RECEIVERS.find(r => r.key === activeTab)?.name || "")}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:-translate-y-0.5"
                style={{ borderColor: "hsl(var(--border))" }}>
                <Printer className="h-3.5 w-3.5" /> طباعة الكشف
              </button>
            </div>
          )}

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                    <th className="px-3 py-3 text-right">
                      <Checkbox 
                        checked={selectedIds.size === displayPayments.length && displayPayments.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    {["رقم الدفعة", "اسم المشترك", "نوع الدفعة", "المبلغ", "الطريقة", "المستلم", "الحساب", "التاريخ", "إجراءات"].map(h => (
                      <th key={h} className="px-3 py-3 text-right text-xs font-black text-muted-foreground uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">جاري التحميل...</td></tr>
                  ) : displayPayments.length === 0 ? (
                    <tr><td colSpan={10} className="p-12 text-center">
                      <Wallet className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-foreground font-bold">لا توجد مدفوعات</p>
                    </td></tr>
                  ) : displayPayments.map(p => {
                    const isStudentOverpaid = auditOverpaid.some(s => s.internalId === p.internalId);
                    const isOrphan = !studentMap[p.internalId];
                    const dupKey = `${p.internalId}|${p.paymentDate}|${p.amount}`;
                    const isDuplicate = (dupMap[dupKey] || 0) > 1;
                    const hasIssue = isStudentOverpaid || isOrphan || isDuplicate;
                    return (
                    <tr key={p.id}
                      className={`border-b border-border/40 hover:bg-primary/3 transition-colors ${selectedIds.has(p.id) ? "bg-primary/5" : ""}`}
                      style={hasIssue ? { background: "#FEF2F240" } : undefined}
                      data-testid={`row-payment-${p.id}`}>
                      <td className="px-3 py-3">
                        <Checkbox 
                          checked={selectedIds.has(p.id)}
                          onCheckedChange={() => toggleSelect(p.id)}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono badge-info px-2 py-0.5 rounded-full">{p.paymentId}</span>
                          {isDuplicate && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: "#FEE2E2", color: "#DC2626" }}>مكرر</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: isOrphan ? "linear-gradient(135deg,#6B7280,#4B5563)" : "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}>
                            {(p.studentName || "؟").charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-foreground text-xs">{p.studentName || "—"}</p>
                              {isStudentOverpaid && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: "#FEE2E2", color: "#DC2626" }}>دفع زيادة</span>}
                              {isOrphan && <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: "#FEF3C7", color: "#D97706" }}>بدون طالب</span>}
                            </div>
                            <p className="text-xs text-muted-foreground">{p.studentId || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {(p as any).paymentType ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{
                              background: (p as any).paymentType === "سداد كامل" ? "#10B98120"
                                : (p as any).paymentType === "الأولى" ? "#3B82F620"
                                : (p as any).paymentType === "الثانية" ? "#8B5CF620"
                                : "#F59E0B20",
                              color: (p as any).paymentType === "سداد كامل" ? "#059669"
                                : (p as any).paymentType === "الأولى" ? "#2563EB"
                                : (p as any).paymentType === "الثانية" ? "#7C3AED"
                                : "#D97706",
                            }}>
                            {(p as any).paymentType}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">{formatCurrency(p.amount || 0)}</span>
                        {(p.discountAmount || 0) > 0 && (
                          <p className="text-xs text-rose-500">خصم: {formatCurrency(p.discountAmount || 0)}</p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs badge-info px-2 py-0.5 rounded-full">{p.paymentMethod || "—"}</span>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{p.receiverName || "—"}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{(p as any).accountType || "—"}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{p.paymentDate || "—"}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setEditPayment(p)}
                            className="p-1.5 rounded-lg transition-all hover:scale-110"
                            style={{ background: "#EFF6FF", color: "#2563EB" }}
                            title="تعديل الدفعة"
                            data-testid={`button-edit-payment-${p.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteConfirm(p)}
                            className="p-1.5 rounded-lg transition-all hover:scale-110"
                            style={{ background: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }}
                            title="حذف الدفعة"
                            data-testid={`button-delete-payment-${p.id}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
                {displayPayments.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "hsl(var(--muted) / 0.5)", borderTop: "2px solid hsl(var(--border))" }}>
                      <td colSpan={4} className="px-3 py-3 font-black text-sm text-right">الإجمالي</td>
                      <td className="px-3 py-3 font-black text-sm text-emerald-600 dark:text-emerald-400 text-right">{formatCurrency(tabRevenue)}</td>
                      <td colSpan={5} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {showAdd && (
        <Modal title="تسجيل دفعة جديدة" icon={<Plus className="h-4 w-4 text-white" />} onClose={() => setShowAdd(false)}>
          <PaymentForm
            students={students}
            studentCounts={studentCounts}
            payments={payments}
            onSubmit={data => createMutation.mutate(data)}
            isPending={createMutation.isPending}
            onClose={() => setShowAdd(false)}
          />
        </Modal>
      )}

      {editPayment && (
        <Modal title="تعديل بيانات الدفعة" icon={<Pencil className="h-4 w-4 text-white" />} onClose={() => setEditPayment(null)}>
          <EditPaymentForm
            payment={editPayment}
            onSubmit={data => updateMutation.mutate({ id: editPayment.id, data })}
            isPending={updateMutation.isPending}
            onClose={() => setEditPayment(null)}
          />
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="تأكيد حذف الدفعة" icon={<Trash2 className="h-4 w-4 text-white" />} onClose={() => setDeleteConfirm(null)} danger>
          <p className="text-foreground mb-1">هل تريد حذف الدفعة؟</p>
          <p className="font-bold text-foreground text-lg mb-1">{formatCurrency(deleteConfirm.amount || 0)}</p>
          <p className="text-sm text-muted-foreground mb-5">{deleteConfirm.studentName} — {deleteConfirm.paymentDate}</p>
          <div className="flex gap-2">
            <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#F43F5E,#E11D48)" }}>
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </button>
            <button onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "hsl(var(--border))" }}>إلغاء</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
