import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  Plus, Search, Eye, Edit2, Trash2, Users, Filter,
  Phone, Building2, GraduationCap, User,
  KeyRound, X, Save, UserPlus, LayoutGrid, List,
  Calculator, CalendarDays, Tag, RefreshCw, CheckSquare, Square
} from "lucide-react";
import { useGlobalToast } from "@/App";
import { formatCurrency } from "@/lib/utils";
import type { Student, Teacher } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

const SUBSCRIPTION_TYPES = ["كامل", "شامل", "أساسي", "نصف كامل", "شهري", "ربع سنوي"];
const QUICK_PRICES = [100, 150, 200, 250, 300];
const LEVELS = ["تحضيري", "ابتدائي", "متوسط", "ثانوي", "جامعي", "خريج"];
const INSTITUTIONS_FIXED = ["كلية ينبع", "معهد ينبع"];

// Module-level constants — defined OUTSIDE components to prevent remounting on re-render
const INPUT_CLS = "w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all bg-background text-foreground focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30";
const INPUT_ST = { borderColor: "hsl(var(--border))" };

function Field({ label, children, span2 }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <label className="block text-xs font-bold text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title, color = "#8B5CF6" }: { icon: React.ReactNode; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white" style={{ background: color }}>
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-wider" style={{ color }}>{title}</p>
    </div>
  );
}

function StudentCard({ student, onEdit, onDelete }: { student: Student; onEdit: () => void; onDelete: () => void }) {
  const gradients = [
    "linear-gradient(135deg, #8B5CF6, #7C3AED)",
    "linear-gradient(135deg, #3B82F6, #4F46E5)",
    "linear-gradient(135deg, #10B981, #059669)",
    "linear-gradient(135deg, #F43F5E, #DB2777)",
    "linear-gradient(135deg, #F59E0B, #EA580C)",
    "linear-gradient(135deg, #06B6D4, #0284C7)",
  ];
  const grad = gradients[student.studentName.charCodeAt(0) % gradients.length];

  return (
    <div className="glass-card rounded-2xl overflow-hidden" data-testid={`card-student-${student.internalId}`}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-base font-black shrink-0 shadow-md"
            style={{ background: grad }}>
            {student.studentName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-sm leading-tight truncate">{student.studentName}</h3>
            <p className="text-xs text-muted-foreground truncate">{student.studentId}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${student.isActive ? "badge-success" : "badge-danger"}`}>
            {student.isActive ? "نشط" : "موقوف"}
          </span>
        </div>

        <div className="space-y-1.5 mb-3">
          {student.institution && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0 text-primary/60" />
              <span className="truncate">{student.institution}</span>
            </div>
          )}
          {student.studentPhone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0 text-primary/60" />
              <span dir="ltr">{student.studentPhone}</span>
            </div>
          )}
          {student.teacherName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GraduationCap className="h-3 w-3 shrink-0 text-primary/60" />
              <span className="truncate">{student.teacherName}</span>
            </div>
          )}
        </div>

        {student.subscriptionType && (
          <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl"
            style={{ background: "hsl(var(--muted))" }}>
            <span className="text-xs text-muted-foreground">{student.subscriptionType}</span>
            <span className="text-xs font-bold text-primary">{formatCurrency(student.subscriptionPrice || 0)}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Link href={`/students/${student.internalId}`} className="flex-1">
            <button
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
              data-testid={`button-view-student-${student.internalId}`}
            >
              <Eye className="h-3.5 w-3.5" /> عرض
            </button>
          </Link>
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5 border"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            data-testid={`button-edit-student-${student.internalId}`}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }}
            data-testid={`button-delete-student-${student.internalId}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentForm({
  initial,
  onSave,
  onClose,
  isPending,
}: {
  initial?: Partial<Student>;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const isNew = !initial?.studentId;
  const { data: teachers = [] } = useQuery<Teacher[]>({ queryKey: ["/api/teachers"] });

  const institutionIsFixed = INSTITUTIONS_FIXED.includes(initial?.institution || "");
  const [institutionMode, setInstitutionMode] = useState<"fixed" | "other">(
    initial?.institution && !institutionIsFixed ? "other" : "fixed"
  );
  const [customInstitution, setCustomInstitution] = useState(
    initial?.institution && !institutionIsFixed ? initial.institution : ""
  );

  const todayISO = new Date().toISOString().split("T")[0];

  const parseInitialDate = (d?: string | null) => {
    if (!d) return todayISO;
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    try {
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
    } catch {}
    return todayISO;
  };

  const [form, setForm] = useState({
    studentId: initial?.studentId || "",
    studentName: initial?.studentName || "",
    studentPhone: initial?.studentPhone || "",
    username: initial?.username || "",
    password: initial?.password || "",
    institution: initial?.institution || "كلية ينبع",
    level: initial?.level || "تحضيري",
    teacherName: initial?.teacherName || "",
    subscriptionType: initial?.subscriptionType || "",
    subscriptionPrice: String(initial?.subscriptionPrice || ""),
    discountType: initial?.discountType || "None",
    discountValue: String(initial?.discountValue || ""),
    referredBy: initial?.referredBy || "",
    paymentDueDate: initial?.paymentDueDate || "",
    notes: initial?.notes || "",
    registrationDate: parseInitialDate(initial?.registrationDate),
    internalId: initial?.internalId || `ST-${Date.now()}`,
    isActive: initial?.isActive ?? true,
    isDeleted: initial?.isDeleted ?? false,
  });

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (isNew) {
      fetch("/api/students/next-id").then(r => r.json()).then(d => {
        if (d.nextId) setForm(p => ({ ...p, studentId: d.nextId }));
      }).catch(() => {});
    }
  }, [isNew]);

  const netPrice = useMemo(() => {
    const price = parseFloat(form.subscriptionPrice) || 0;
    const discount = parseFloat(form.discountValue) || 0;
    if (form.discountType === "Fixed") return Math.max(0, price - discount);
    if (form.discountType === "Percentage") return Math.max(0, price - (price * discount / 100));
    return price;
  }, [form.subscriptionPrice, form.discountType, form.discountValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName.trim()) return;
    const institution = institutionMode === "other" ? customInstitution : form.institution;
    onSave({
      ...form,
      institution,
      subscriptionPrice: parseFloat(form.subscriptionPrice) || 0,
      discountValue: parseFloat(form.discountValue) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1 pb-2">

      {/* ── Section 1: Basic Info ── */}
      <div className="p-4 rounded-2xl space-y-3" style={{ background: "hsl(var(--muted) / 0.4)", border: "1px solid hsl(var(--border) / 0.5)" }}>
        <SectionTitle icon={<User className="h-3.5 w-3.5" />} title="البيانات الأساسية" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="رقم الطالب *">
            <input className={INPUT_CLS} style={INPUT_ST} value={form.studentId}
              onChange={e => set("studentId", e.target.value)} placeholder="20260001" required
              data-testid="input-student-id" />
          </Field>

          <Field label="الاسم الكامل *">
            <input className={INPUT_CLS} style={INPUT_ST} value={form.studentName}
              onChange={e => set("studentName", e.target.value)} placeholder="الاسم الرباعي" required
              data-testid="input-student-name" />
          </Field>

          <Field label="رقم الهاتف">
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input className={`${INPUT_CLS} pr-9`} style={INPUT_ST} value={form.studentPhone} dir="ltr"
                onChange={e => set("studentPhone", e.target.value)} placeholder="+966 5x xxx xxxx"
                data-testid="input-student-phone" />
            </div>
          </Field>

          <Field label="تاريخ التسجيل">
            <div className="relative">
              <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input type="date" className={`${INPUT_CLS} pr-9`} style={INPUT_ST}
                value={form.registrationDate} onChange={e => set("registrationDate", e.target.value)}
                data-testid="input-registration-date" />
            </div>
          </Field>

          <Field label="الجهة التعليمية" span2>
            <div className="flex gap-2 flex-wrap">
              {[...INSTITUTIONS_FIXED, "أخرى"].map(inst => (
                <button key={inst} type="button"
                  onClick={() => {
                    if (inst === "أخرى") setInstitutionMode("other");
                    else { setInstitutionMode("fixed"); set("institution", inst); }
                  }}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all"
                  style={{
                    borderColor: (institutionMode === "fixed" && form.institution === inst) || (institutionMode === "other" && inst === "أخرى") ? "#8B5CF6" : "hsl(var(--border))",
                    background: (institutionMode === "fixed" && form.institution === inst) || (institutionMode === "other" && inst === "أخرى") ? "rgba(139,92,246,0.12)" : "transparent",
                    color: (institutionMode === "fixed" && form.institution === inst) || (institutionMode === "other" && inst === "أخرى") ? "#8B5CF6" : "hsl(var(--muted-foreground))"
                  }}
                  data-testid={`button-institution-${inst}`}>
                  {inst}
                </button>
              ))}
            </div>
            {institutionMode === "other" && (
              <input className={`${INPUT_CLS} mt-2`} style={INPUT_ST}
                value={customInstitution} onChange={e => setCustomInstitution(e.target.value)}
                placeholder="اسم الجهة التعليمية" required />
            )}
          </Field>

          <Field label="المستوى الدراسي">
            <select className={INPUT_CLS} style={INPUT_ST} value={form.level}
              onChange={e => set("level", e.target.value)} data-testid="select-level">
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>

          <Field label="المدرس / المشرف">
            <select className={INPUT_CLS} style={INPUT_ST} value={form.teacherName}
              onChange={e => set("teacherName", e.target.value)} data-testid="select-teacher">
              <option value="">— اختر المدرس —</option>
              {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              <option value="__other">أخرى...</option>
            </select>
            {form.teacherName === "__other" && (
              <input className={`${INPUT_CLS} mt-2`} style={INPUT_ST}
                onChange={e => set("teacherName", e.target.value)} placeholder="اسم المدرس" />
            )}
          </Field>
        </div>
      </div>

      {/* ── Section 2: Platform Credentials ── */}
      <div className="p-4 rounded-2xl space-y-3" style={{ background: "hsl(262 80% 58% / 0.05)", border: "1px solid hsl(262 80% 58% / 0.2)" }}>
        <SectionTitle icon={<KeyRound className="h-3.5 w-3.5" />} title="بيانات المنصة الإلكترونية" color="#7C3AED" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="اسم المستخدم">
            <input className={INPUT_CLS} style={INPUT_ST} value={form.username} dir="ltr"
              onChange={e => set("username", e.target.value)} placeholder="platform_username"
              autoComplete="off" data-testid="input-username" />
          </Field>
          <Field label="كلمة المرور">
            <input className={INPUT_CLS} style={INPUT_ST} value={form.password} dir="ltr" type="text"
              onChange={e => set("password", e.target.value)} placeholder="platform_password"
              autoComplete="off" data-testid="input-password" />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground opacity-70">بيانات دخول الطالب إلى المنصة التعليمية</p>
      </div>

      {/* ── Section 3: Subscription ── */}
      <div className="p-4 rounded-2xl space-y-3" style={{ background: "hsl(142 70% 45% / 0.05)", border: "1px solid hsl(142 70% 45% / 0.2)" }}>
        <SectionTitle icon={<Tag className="h-3.5 w-3.5" />} title="بيانات الاشتراك" color="#059669" />

        {/* Subscription type quick-select */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">نوع الاشتراك</label>
          <div className="flex gap-2 flex-wrap">
            {SUBSCRIPTION_TYPES.map(t => (
              <button key={t} type="button"
                onClick={() => set("subscriptionType", t)}
                className="flex-1 min-w-fit py-2 px-3 rounded-xl text-xs font-bold border transition-all"
                style={{
                  borderColor: form.subscriptionType === t ? "#059669" : "hsl(var(--border))",
                  background: form.subscriptionType === t ? "rgba(5,150,105,0.12)" : "transparent",
                  color: form.subscriptionType === t ? "#059669" : "hsl(var(--muted-foreground))"
                }}
                data-testid={`button-sub-type-${t}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Price with quick buttons */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">سعر الاشتراك (ر.س)</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {QUICK_PRICES.map(p => (
              <button key={p} type="button"
                onClick={() => set("subscriptionPrice", String(p))}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                style={{
                  borderColor: form.subscriptionPrice === String(p) ? "#059669" : "hsl(var(--border))",
                  background: form.subscriptionPrice === String(p) ? "rgba(5,150,105,0.12)" : "transparent",
                  color: form.subscriptionPrice === String(p) ? "#059669" : "hsl(var(--muted-foreground))"
                }}
                data-testid={`button-price-${p}`}>
                {p}
              </button>
            ))}
          </div>
          <input className={INPUT_CLS} style={INPUT_ST} type="number" min="0" step="0.01"
            value={form.subscriptionPrice} onChange={e => set("subscriptionPrice", e.target.value)}
            placeholder="0.00" data-testid="input-subscription-price" />
        </div>

        {/* Discount */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="نوع الخصم">
            <select className={INPUT_CLS} style={INPUT_ST} value={form.discountType}
              onChange={e => set("discountType", e.target.value)} data-testid="select-discount-type">
              <option value="None">لا يوجد خصم</option>
              <option value="Fixed">خصم بمبلغ ثابت (ر.س)</option>
              <option value="Percentage">خصم بنسبة مئوية (%)</option>
              <option value="referral">إحالة</option>
            </select>
          </Field>
          <Field label={`قيمة الخصم ${form.discountType === "Percentage" ? "(%)" : form.discountType === "Fixed" ? "(ر.س)" : ""}`}>
            <input className={INPUT_CLS} style={INPUT_ST} type="number" min="0"
              value={form.discountValue} onChange={e => set("discountValue", e.target.value)}
              placeholder="0" disabled={form.discountType === "None"}
              data-testid="input-discount-value" />
          </Field>
        </div>

        {/* Live price preview */}
        {(parseFloat(form.subscriptionPrice) > 0) && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: "hsl(142 70% 45% / 0.08)", border: "1px solid hsl(142 70% 45% / 0.2)" }}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calculator className="h-3.5 w-3.5" />
              <span>المبلغ المستحق بعد الخصم</span>
            </div>
            <span className="text-base font-black" style={{ color: "#059669" }}>
              {formatCurrency(netPrice)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="محال من">
            <input className={INPUT_CLS} style={INPUT_ST} value={form.referredBy}
              onChange={e => set("referredBy", e.target.value)} placeholder="اسم من أحال الطالب"
              data-testid="input-referred-by" />
          </Field>
          <Field label="تاريخ استحقاق الدفع">
            <input type="date" className={INPUT_CLS} style={INPUT_ST}
              value={form.paymentDueDate} onChange={e => set("paymentDueDate", e.target.value)}
              data-testid="input-payment-due-date" />
          </Field>
        </div>
      </div>

      {/* ── Section 4: Notes & Status ── */}
      <div className="p-4 rounded-2xl space-y-3" style={{ background: "hsl(var(--muted) / 0.4)", border: "1px solid hsl(var(--border) / 0.5)" }}>
        <Field label="ملاحظات">
          <textarea className={`${INPUT_CLS} resize-none`} style={INPUT_ST} rows={2}
            value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="أي ملاحظات إضافية..." data-testid="textarea-notes" />
        </Field>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <div
            onClick={() => set("isActive", !form.isActive)}
            className="w-11 h-6 rounded-full relative transition-all cursor-pointer shrink-0"
            style={{ background: form.isActive ? "#8B5CF6" : "hsl(var(--border))" }}>
            <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
              style={{ right: form.isActive ? "2px" : "calc(100% - 22px)" }} />
          </div>
          <span className="text-sm font-semibold text-foreground">
            {form.isActive ? "مشترك نشط ✓" : "مشترك موقوف"}
          </span>
        </label>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-2 pt-1 sticky bottom-0 bg-transparent">
        <button type="submit" disabled={isPending}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all shadow-lg hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)", boxShadow: "0 6px 20px rgba(139,92,246,0.35)" }}
          data-testid="button-save-student">
          <Save className="h-4 w-4" />
          {isPending ? "جاري الحفظ..." : isNew ? "إضافة مشترك" : "حفظ التعديلات"}
        </button>
        <button type="button" onClick={onClose}
          className="px-5 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-muted/50"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
          data-testid="button-cancel-student">
          إلغاء
        </button>
      </div>
    </form>
  );
}

function Modal({ title, icon, onClose, children, danger }: {
  title: string; icon?: React.ReactNode; onClose: () => void;
  children: React.ReactNode; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="glass-card rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ background: danger ? "linear-gradient(135deg, #F43F5E, #E11D48)" : "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
          <div className="flex items-center gap-2.5">
            {icon}
            <h3 className="text-sm font-black text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors" data-testid="button-close-modal">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const { toast } = useGlobalToast();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Student | null>(null);
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [filterInstitution, setFilterInstitution] = useState("");
  const [filterSubscription, setFilterSubscription] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: teachers = [] } = useQuery<Teacher[]>({ queryKey: ["/api/teachers"] });

  const { data: students = [], isLoading, refetch } = useQuery<Student[]>({
    queryKey: ["/api/students", search],
    queryFn: async () => {
      const url = search ? `/api/students?search=${encodeURIComponent(search)}` : "/api/students";
      const res = await fetch(url);
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/students", data).then(r => r.json()),
    onSuccess: () => {
      invalidateAll();
      setShowAdd(false);
      toast({ title: "✓ تم إضافة المشترك بنجاح" });
    },
    onError: (e: any) => toast({ title: "خطأ في الإضافة", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/students/${id}`, data).then(r => r.json()),
    onSuccess: () => {
      invalidateAll();
      setEditStudent(null);
      toast({ title: "✓ تم تحديث بيانات المشترك" });
    },
    onError: (e: any) => toast({ title: "خطأ في التحديث", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (internalId: string) => apiRequest("DELETE", `/api/students/${internalId}`).then(r => r.json()),
    onSuccess: () => {
      invalidateAll();
      setDeleteConfirm(null);
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (deleteConfirm) next.delete(deleteConfirm.internalId);
        return next;
      });
      toast({ title: "نُقل المشترك إلى سلة المهملات" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (internalIds: string[]) => apiRequest("POST", "/api/students/bulk-delete", { internalIds }).then(r => r.json()),
    onSuccess: () => {
      invalidateAll();
      setSelectedIds(new Set());
      toast({ title: "تم حذف المشتركين المحددين" });
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
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(s => s.internalId)));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف ${selectedIds.size} مشترك؟`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const activeFiltersCount = [filterTeacher, filterInstitution, filterSubscription].filter(Boolean).length + (filterActive !== "all" ? 1 : 0);

  const filtered = students.filter(s => {
    if (filterActive !== "all" && (filterActive === "active" ? !s.isActive : s.isActive)) return false;
    if (filterTeacher && s.teacherName !== filterTeacher) return false;
    if (filterInstitution && s.institution !== filterInstitution) return false;
    if (filterSubscription && s.subscriptionType !== filterSubscription) return false;
    return true;
  });

  const uniqueInstitutions = [...new Set(students.map(s => s.institution).filter(Boolean))];
  const uniqueSubscriptions = [...new Set(students.map(s => s.subscriptionType).filter(Boolean))];

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> المشتركون
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{students.length} مشترك مسجل</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)", boxShadow: "0 6px 20px rgba(244,63,94,0.4)" }}
              data-testid="button-bulk-delete"
            >
              <Trash2 className="h-4 w-4" />
              حذف المحددين ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all hover:bg-muted/50"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
            title="تحديث البيانات"
            data-testid="button-refresh-students"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)", boxShadow: "0 6px 20px rgba(139,92,246,0.4)" }}
            data-testid="button-add-student"
          >
            <UserPlus className="h-4 w-4" /> إضافة مشترك
          </button>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="glass-card rounded-2xl p-4 mb-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالاسم، الرقم، الجهة..."
              className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm border outline-none transition-all bg-background text-foreground"
              style={{ borderColor: "hsl(var(--border))" }}
              data-testid="input-search-students"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all"
            style={{
              borderColor: activeFiltersCount > 0 ? "#8B5CF6" : "hsl(var(--border))",
              background: activeFiltersCount > 0 ? "#8B5CF620" : "transparent",
              color: activeFiltersCount > 0 ? "#8B5CF6" : "hsl(var(--muted-foreground))"
            }}
            data-testid="button-toggle-filters"
          >
            <Filter className="h-3.5 w-3.5" />
            فلترة {activeFiltersCount > 0 && <span className="bg-violet-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">{activeFiltersCount}</span>}
          </button>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {filtered.length} نتيجة
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl mr-auto" style={{ background: "hsl(var(--muted))" }}>
            <button onClick={() => setViewMode("card")} className="p-1.5 rounded-lg transition-all"
              style={viewMode === "card" ? { background: "white", color: "#8B5CF6", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" } : { color: "hsl(var(--muted-foreground))" }}
              data-testid="button-view-card" title="عرض بطاقات"><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setViewMode("table")} className="p-1.5 rounded-lg transition-all"
              style={viewMode === "table" ? { background: "white", color: "#8B5CF6", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" } : { color: "hsl(var(--muted-foreground))" }}
              data-testid="button-view-table" title="عرض جدول"><List className="h-4 w-4" /></button>
          </div>
        </div>

        {showFilters && (
          <div className="border-t pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ borderColor: "hsl(var(--border))" }}>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">الحالة</label>
              <select className="w-full px-3 py-2 rounded-xl text-xs border outline-none bg-background text-foreground"
                style={{ borderColor: "hsl(var(--border))" }}
                value={filterActive} onChange={e => setFilterActive(e.target.value as any)}
                data-testid="filter-active">
                <option value="all">الكل</option>
                <option value="active">نشط</option>
                <option value="inactive">موقوف</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">المدرس</label>
              <select className="w-full px-3 py-2 rounded-xl text-xs border outline-none bg-background text-foreground"
                style={{ borderColor: "hsl(var(--border))" }}
                value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
                data-testid="filter-teacher">
                <option value="">الكل</option>
                {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">الجهة التعليمية</label>
              <select className="w-full px-3 py-2 rounded-xl text-xs border outline-none bg-background text-foreground"
                style={{ borderColor: "hsl(var(--border))" }}
                value={filterInstitution} onChange={e => setFilterInstitution(e.target.value)}
                data-testid="filter-institution">
                <option value="">الكل</option>
                {uniqueInstitutions.map(i => <option key={i} value={i!}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">نوع الاشتراك</label>
              <select className="w-full px-3 py-2 rounded-xl text-xs border outline-none bg-background text-foreground"
                style={{ borderColor: "hsl(var(--border))" }}
                value={filterSubscription} onChange={e => setFilterSubscription(e.target.value)}
                data-testid="filter-subscription">
                <option value="">الكل</option>
                {uniqueSubscriptions.map(s => <option key={s} value={s!}>{s}</option>)}
              </select>
            </div>
            {activeFiltersCount > 0 && (
              <div className="col-span-full flex justify-end">
                <button
                  onClick={() => { setFilterActive("all"); setFilterTeacher(""); setFilterInstitution(""); setFilterSubscription(""); }}
                  className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
                  data-testid="button-clear-filters">
                  <X className="h-3 w-3" /> مسح الفلاتر
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Students View */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-52 rounded-2xl skeleton-wave" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-bold">لا يوجد مشتركون</p>
          <p className="text-muted-foreground text-sm mt-1">ابدأ بإضافة أول مشترك</p>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              onEdit={() => setEditStudent(student)}
              onDelete={() => setDeleteConfirm(student)}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-students">
              <thead>
                <tr style={{ background: "hsl(var(--muted))", borderBottom: "2px solid hsl(var(--border))" }}>
                  <th className="px-3 py-3 text-right">
                    <Checkbox 
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  {["#", "اسم المشترك", "الرقم", "الجهة التعليمية", "الهاتف", "المدرس", "نوع الاشتراك", "السعر", "الحالة", "الإجراءات"].map(h => (
                    <th key={h} className="px-3 py-3 text-right text-xs font-black text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, idx) => (
                  <tr key={student.id}
                    className={`border-b transition-colors hover:bg-primary/5 ${selectedIds.has(student.internalId) ? "bg-primary/5" : ""}`}
                    style={{ borderColor: "hsl(var(--border) / 0.5)" }}
                    data-testid={`row-student-${student.internalId}`}>
                    <td className="px-3 py-2.5">
                      <Checkbox 
                        checked={selectedIds.has(student.internalId)}
                        onCheckedChange={() => toggleSelect(student.internalId)}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground font-bold">{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                          style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
                          {student.studentName?.charAt(0)}
                        </div>
                        <span className="font-bold text-foreground">{student.studentName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{student.studentId}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{student.institution || "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground" dir="ltr">{student.studentPhone || "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{student.teacherName || "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{student.subscriptionType || "—"}</td>
                    <td className="px-3 py-2.5 text-xs font-bold text-primary">{student.subscriptionPrice ? formatCurrency(student.subscriptionPrice) : "—"}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${student.isActive ? "badge-success" : "badge-danger"}`}>
                        {student.isActive ? "نشط" : "موقوف"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/students/${student.internalId}`}>
                          <button className="p-1.5 rounded-lg text-white text-xs"
                            style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
                            data-testid={`button-view-table-student-${student.internalId}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        <button onClick={() => setEditStudent(student)}
                          className="p-1.5 rounded-lg border"
                          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                          data-testid={`button-edit-table-student-${student.internalId}`}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm(student)}
                          className="p-1.5 rounded-lg"
                          style={{ background: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }}
                          data-testid={`button-delete-table-student-${student.internalId}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Dialog */}
      {showAdd && (
        <Modal title="إضافة مشترك جديد" icon={<UserPlus className="h-4 w-4 text-white" />} onClose={() => setShowAdd(false)}>
          <StudentForm
            onSave={data => createMutation.mutate(data)}
            onClose={() => setShowAdd(false)}
            isPending={createMutation.isPending}
          />
        </Modal>
      )}

      {/* Edit Dialog */}
      {editStudent && (
        <Modal title="تعديل بيانات المشترك" icon={<Edit2 className="h-4 w-4 text-white" />} onClose={() => setEditStudent(null)}>
          <StudentForm
            initial={editStudent}
            onSave={data => updateMutation.mutate({ id: editStudent.id, data })}
            onClose={() => setEditStudent(null)}
            isPending={updateMutation.isPending}
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Modal title="تأكيد الحذف" icon={<Trash2 className="h-4 w-4 text-white" />} onClose={() => setDeleteConfirm(null)} danger>
          <p className="text-foreground mb-1">هل تريد حذف المشترك:</p>
          <p className="font-bold text-foreground text-lg mb-1">{deleteConfirm.studentName}</p>
          <p className="text-sm text-muted-foreground mb-5">سيتم نقله إلى سلة المهملات ويمكن استعادته لاحقاً.</p>
          <div className="flex gap-2">
            <button
              onClick={() => deleteMutation.mutate(deleteConfirm.internalId)}
              disabled={deleteMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all"
              style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)" }}
              data-testid="button-confirm-delete">
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </button>
            <button onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
              data-testid="button-cancel-delete">
              إلغاء
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
