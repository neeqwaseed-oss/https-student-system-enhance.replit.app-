import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  Plus, Search, Edit2, Trash2, BookOpen, Phone, Save,
  X, DollarSign, Calendar, ChevronDown, ChevronUp, KeyRound, Users,
  CheckSquare, Square
} from "lucide-react";
import { useGlobalToast } from "@/App";
import { formatCurrency } from "@/lib/utils";
import type { Teacher, TeacherSalary } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function Modal({ title, icon, onClose, danger, children }: {
  title: string; icon?: React.ReactNode; onClose: () => void; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: danger ? "linear-gradient(135deg, #F43F5E, #E11D48)" : "linear-gradient(135deg, #F43F5E, #DB2777)", borderBottom: "1px solid hsl(var(--border))" }}>
          {icon}
          <h3 className="font-bold text-white flex-1">{title}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function TeacherCard({
  teacher, onEdit, onDelete, onSalary, isSelected, onToggleSelect
}: { 
  teacher: Teacher; 
  onEdit: () => void; 
  onDelete: () => void; 
  onSalary: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: salaries = [] } = useQuery<TeacherSalary[]>({
    queryKey: ["/api/salaries", teacher.id],
    queryFn: () => fetch(`/api/salaries?teacherId=${teacher.id}`).then(r => r.json()),
    enabled: expanded,
  });

  const totalSalary = salaries.reduce((sum, s) => sum + (s.amount || 0), 0);

  return (
    <div className={`glass-card rounded-2xl overflow-hidden transition-all ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}`} data-testid={`card-teacher-${teacher.id}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="pt-1">
            <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-black shrink-0"
            style={{ background: "linear-gradient(135deg, #F43F5E, #DB2777)" }}>
            {teacher.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground truncate">{teacher.name}</h3>
            {teacher.subject && <p className="text-xs text-primary font-medium truncate">{teacher.subject}</p>}
            {teacher.phone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5" dir="ltr">
                <Phone className="h-3 w-3" /> {teacher.phone}
              </p>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${teacher.isActive ? "badge-success" : "badge-danger"}`}>
            {teacher.isActive ? "نشط" : "موقوف"}
          </span>
        </div>

        {/* Credentials */}
        {(teacher.username) && (
          <div className="mb-3 px-3 py-2 rounded-xl flex items-center gap-2"
            style={{ background: "hsl(262 80% 58% / 0.07)", border: "1px solid hsl(262 80% 58% / 0.12)" }}>
            <KeyRound className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">المستخدم:</span>
            <span className="text-xs font-mono font-bold text-foreground" dir="ltr">{teacher.username}</span>
          </div>
        )}

        {/* Notes */}
        {teacher.notes && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{teacher.notes}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mb-2">
          <button onClick={onSalary}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
            data-testid={`button-salary-${teacher.id}`}>
            <DollarSign className="h-3.5 w-3.5" /> تسجيل راتب
          </button>
          <Link href={`/teachers/${teacher.id}`}>
            <button
              className="px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #3B82F6, #4F46E5)" }}
              data-testid={`button-view-teacher-students-${teacher.id}`}>
              <Users className="h-3.5 w-3.5" />
            </button>
          </Link>
          <button onClick={onEdit}
            className="px-3 py-2 rounded-xl text-xs font-semibold border transition-all hover:-translate-y-0.5"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            data-testid={`button-edit-teacher-${teacher.id}`}>
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete}
            className="px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }}
            data-testid={`button-delete-teacher-${teacher.id}`}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Expand salaries */}
        <button onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-muted-foreground transition-colors hover:bg-muted/50">
          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> سجل الرواتب</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {expanded && (
          <div className="mt-2 space-y-1.5 animate-fade-in">
            {salaries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">لا توجد رواتب مسجلة</p>
            ) : (
              <>
                {salaries.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: "hsl(var(--muted) / 0.5)" }}>
                    <span className="text-xs text-foreground font-medium">
                      {MONTHS[(s.month || 1) - 1]} {s.year}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">{formatCurrency(s.amount || 0)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg font-bold"
                  style={{ background: "hsl(142 71% 40% / 0.1)", border: "1px solid hsl(142 71% 40% / 0.2)" }}>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400">الإجمالي</span>
                  <span className="text-sm text-emerald-700 dark:text-emerald-400">{formatCurrency(totalSalary)}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeachersPage() {
  const { toast } = useGlobalToast();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Teacher | null>(null);
  const [salaryTeacher, setSalaryTeacher] = useState<Teacher | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({ queryKey: ["/api/teachers"] });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/teachers", data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/teachers"] }); setShowAdd(false); toast({ title: "تم إضافة المدرس" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/teachers/${id}`, data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/teachers"] }); setEditTeacher(null); toast({ title: "تم تحديث بيانات المدرس" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/teachers/${id}`).then(r => r.json()),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] }); 
      setDeleteConfirm(null); 
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (deleteConfirm) next.delete(deleteConfirm.id);
        return next;
      });
      toast({ title: "تم حذف المدرس" }); 
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => apiRequest("POST", "/api/teachers/bulk-delete", { ids }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      setSelectedIds(new Set());
      toast({ title: "تم حذف المدرسين المحددين" });
    },
    onError: (e: any) => toast({ title: "خطأ في الحذف الجماعي", description: e.message, variant: "destructive" }),
  });

  const createSalaryMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/salaries", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salaries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setSalaryTeacher(null);
      toast({ title: "تم تسجيل الراتب" });
    },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.subject || "").toLowerCase().includes(search.toLowerCase())
  );

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
      setSelectedIds(new Set(filtered.map(t => t.id)));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف ${selectedIds.size} مدرس؟`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-xl text-sm border outline-none transition-all bg-background text-foreground";
  const inputStyle = { borderColor: "hsl(var(--border))" };

  const TeacherForm = ({ initial, onSave, onClose, isPending }: {
    initial?: Partial<Teacher>; onSave: (d: Record<string, unknown>) => void; onClose: () => void; isPending: boolean;
  }) => {
    const [form, setForm] = useState({
      name: initial?.name || "",
      phone: initial?.phone || "",
      subject: initial?.subject || "",
      username: initial?.username || "",
      password: initial?.password || "",
      notes: initial?.notes || "",
      isActive: initial?.isActive ?? true,
      isDeleted: false,
    });
    const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));
    return (
      <form onSubmit={e => { e.preventDefault(); if (!form.name.trim()) return; onSave(form); }} className="space-y-4">
        <div className="p-4 rounded-xl space-y-3" style={{ background: "hsl(var(--muted) / 0.5)" }}>
          <p className="text-xs font-black text-primary uppercase tracking-wider">بيانات المدرس</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold mb-1.5 text-foreground">الاسم *</label>
              <input className={inputClass} style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div><label className="block text-xs font-bold mb-1.5 text-foreground">رقم الهاتف</label>
              <input className={inputClass} style={inputStyle} value={form.phone} dir="ltr" onChange={e => set("phone", e.target.value)} />
            </div>
            <div className="col-span-2"><label className="block text-xs font-bold mb-1.5 text-foreground">التخصص / المادة</label>
              <input className={inputClass} style={inputStyle} value={form.subject} onChange={e => set("subject", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl space-y-3" style={{ background: "hsl(262 80% 58% / 0.06)", border: "1px solid hsl(262 80% 58% / 0.15)" }}>
          <p className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="h-3.5 w-3.5" /> بيانات الدخول للمنصة
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold mb-1.5 text-foreground">اسم المستخدم</label>
              <input className={inputClass} style={inputStyle} value={form.username} dir="ltr" onChange={e => set("username", e.target.value)} autoComplete="off" />
            </div>
            <div><label className="block text-xs font-bold mb-1.5 text-foreground">كلمة المرور</label>
              <input className={inputClass} style={inputStyle} value={form.password} dir="ltr" type="text" onChange={e => set("password", e.target.value)} autoComplete="off" />
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl space-y-3" style={{ background: "hsl(var(--muted) / 0.5)" }}>
          <label className="block text-xs font-bold mb-1.5 text-foreground">ملاحظات</label>
          <textarea className={`${inputClass} resize-none`} style={inputStyle} rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-sm font-medium text-foreground">مدرس نشط</span>
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #F43F5E, #DB2777)" }}>
            <Save className="h-4 w-4" /> {isPending ? "جاري الحفظ..." : "حفظ"}
          </button>
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>إلغاء</button>
        </div>
      </form>
    );
  };

  const SalaryForm = ({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) => {
    const now = new Date();
    const [form, setForm] = useState({
      teacherId: teacher.id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      amount: "",
      paidDate: now.toISOString().split("T")[0],
      notes: "",
    });
    return (
      <form onSubmit={e => {
        e.preventDefault();
        if (!form.amount) return;
        createSalaryMutation.mutate({ ...form, amount: parseFloat(form.amount), month: Number(form.month), year: Number(form.year) });
      }} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "hsl(var(--muted) / 0.5)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black"
            style={{ background: "linear-gradient(135deg, #F43F5E, #DB2777)" }}>
            {teacher.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">{teacher.name}</p>
            <p className="text-xs text-muted-foreground">{teacher.subject || "—"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">الشهر</label>
            <select className="w-full px-3 py-2 rounded-xl text-sm border outline-none bg-background text-foreground"
              style={{ borderColor: "hsl(var(--border))" }}
              value={form.month} onChange={e => setForm(p => ({ ...p, month: Number(e.target.value) }))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">السنة</label>
            <input className="w-full px-3 py-2 rounded-xl text-sm border outline-none bg-background text-foreground"
              style={{ borderColor: "hsl(var(--border))" }}
              type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">المبلغ *</label>
            <input className="w-full px-3 py-2 rounded-xl text-sm border outline-none bg-background text-foreground"
              style={{ borderColor: "hsl(var(--border))" }}
              type="number" min="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" required />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">تاريخ الدفع</label>
            <input className="w-full px-3 py-2 rounded-xl text-sm border outline-none bg-background text-foreground"
              style={{ borderColor: "hsl(var(--border))" }}
              type="date" value={form.paidDate} onChange={e => setForm(p => ({ ...p, paidDate: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-foreground">ملاحظات</label>
          <textarea className="w-full px-3 py-2 rounded-xl text-sm border outline-none bg-background text-foreground resize-none"
            style={{ borderColor: "hsl(var(--border))" }} rows={2}
            value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={createSalaryMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
            <DollarSign className="h-4 w-4" /> {createSalaryMutation.isPending ? "جاري الحفظ..." : "تسجيل الراتب"}
          </button>
          <button type="button" onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>إلغاء</button>
        </div>
      </form>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-rose-500" /> المدرسون
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{teachers.length} مدرس مسجل</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)", boxShadow: "0 6px 20px rgba(244,63,94,0.4)" }}
              data-testid="button-bulk-delete-teachers"
            >
              <Trash2 className="h-4 w-4" />
              حذف المحددين ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => toggleSelectAll()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-bold transition-all hover:bg-muted"
          >
            {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            تحديد الكل
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #F43F5E, #DB2777)", boxShadow: "0 6px 20px rgba(244,63,94,0.4)" }}
            data-testid="button-add-teacher">
            <Plus className="h-4 w-4" /> إضافة مدرس
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card rounded-2xl p-4 mb-5">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو التخصص..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm border outline-none bg-background text-foreground"
            style={{ borderColor: "hsl(var(--border))" }} data-testid="input-search-teachers" />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-52 rounded-2xl skeleton-wave" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-bold">لا يوجد مدرسون</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <TeacherCard key={t.id} teacher={t}
              onEdit={() => setEditTeacher(t)}
              onDelete={() => setDeleteConfirm(t)}
              onSalary={() => setSalaryTeacher(t)}
              isSelected={selectedIds.has(t.id)}
              onToggleSelect={() => toggleSelect(t.id)}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="إضافة مدرس جديد" icon={<Plus className="h-4 w-4 text-white" />} onClose={() => setShowAdd(false)}>
          <TeacherForm onSave={d => createMutation.mutate(d)} onClose={() => setShowAdd(false)} isPending={createMutation.isPending} />
        </Modal>
      )}
      {editTeacher && (
        <Modal title="تعديل بيانات المدرس" icon={<Edit2 className="h-4 w-4 text-white" />} onClose={() => setEditTeacher(null)}>
          <TeacherForm initial={editTeacher} onSave={d => updateMutation.mutate({ id: editTeacher.id, data: d })} onClose={() => setEditTeacher(null)} isPending={updateMutation.isPending} />
        </Modal>
      )}
      {salaryTeacher && (
        <Modal title="تسجيل راتب" icon={<DollarSign className="h-4 w-4 text-white" />} onClose={() => setSalaryTeacher(null)}>
          <SalaryForm teacher={salaryTeacher} onClose={() => setSalaryTeacher(null)} />
        </Modal>
      )}
      {deleteConfirm && (
        <Modal title="تأكيد الحذف" icon={<Trash2 className="h-4 w-4 text-white" />} onClose={() => setDeleteConfirm(null)} danger>
          <p className="text-foreground mb-1">هل تريد حذف المدرس:</p>
          <p className="font-bold text-foreground text-lg mb-4">{deleteConfirm.name}</p>
          <div className="flex gap-2">
            <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)" }}>
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </button>
            <button onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>إلغاء</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
