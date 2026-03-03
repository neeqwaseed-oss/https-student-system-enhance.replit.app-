import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ArrowRight, Users, Plus, Trash2, Eye, Search,
  RefreshCcw, Printer, Phone, X, Download
} from "lucide-react";
import { useGlobalToast } from "@/App";
import type { Teacher, Student } from "@shared/schema";
import { downloadExcel, printTablePdf } from "@/lib/excel";

function AddStudentsModal({
  teacher, onClose
}: { teacher: Teacher; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { toast } = useGlobalToast();

  const { data: unassigned = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students/unassigned"],
    queryFn: () => fetch("/api/students/unassigned").then(r => r.json()),
  });

  const assignMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id =>
        apiRequest("PATCH", `/api/students/${id}`, { teacherName: teacher.name }).then(r => r.json())
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students/by-teacher"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students/unassigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: `تم إضافة ${selected.size} طالب للمدرس` });
      onClose();
    },
    onError: () => toast({ title: "خطأ في الإضافة", variant: "destructive" }),
  });

  const filtered = unassigned.filter(s =>
    s.studentName.includes(search) || (s.institution || "").includes(search)
  );

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: "linear-gradient(135deg, #3B82F6, #4F46E5)", borderBottom: "1px solid hsl(var(--border))" }}>
          <Plus className="h-4 w-4 text-white" />
          <div className="flex-1">
            <h3 className="font-bold text-white">إضافة طلاب للمدرس: {teacher.name}</h3>
            <p className="text-xs text-white/70 mt-0.5">اختر المشتركين الذين ليس لديهم مدرس حالياً</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الجهة..."
              className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm border outline-none bg-background text-foreground"
              style={{ borderColor: "hsl(var(--border))" }}
              data-testid="input-search-unassigned" />
          </div>

          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "hsl(var(--border))" }}>
            <div className="max-h-72 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">جاري التحميل...</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  {unassigned.length === 0 ? "جميع المشتركين مرتبطون بمدرسين" : "لا توجد نتائج"}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "hsl(var(--muted) / 0.6)" }}>
                      <th className="px-3 py-2.5 text-right w-8">
                        <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                          onChange={toggleAll} className="w-3.5 h-3.5 accent-primary" />
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-black text-muted-foreground">اسم المشترك</th>
                      <th className="px-3 py-2.5 text-right text-xs font-black text-muted-foreground">الجهة التعليمية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => (
                      <tr key={s.id} className="border-t border-border/30 hover:bg-primary/3 cursor-pointer transition-colors"
                        onClick={() => {
                          const next = new Set(selected);
                          if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                          setSelected(next);
                        }}>
                        <td className="px-3 py-2.5">
                          <input type="checkbox" checked={selected.has(s.id)} onChange={() => {}}
                            className="w-3.5 h-3.5 accent-primary" />
                        </td>
                        <td className="px-3 py-2.5 font-medium text-foreground">{s.studentName}</td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">{s.institution || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={() => { if (selected.size > 0) assignMutation.mutate([...selected]); }}
            disabled={selected.size === 0 || assignMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
            style={{ background: selected.size > 0 ? "linear-gradient(135deg, #3B82F6, #4F46E5)" : "hsl(var(--muted))", color: selected.size > 0 ? "white" : "hsl(var(--muted-foreground))" }}
            data-testid="button-assign-students">
            <Plus className="h-4 w-4" />
            {assignMutation.isPending ? "جاري الإضافة..." : `إضافة الطلاب المحددين (${selected.size})`}
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherProfile() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useGlobalToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removeConfirm, setRemoveConfirm] = useState<Student | null>(null);

  const { data: teacher, isLoading: teacherLoading } = useQuery<Teacher>({
    queryKey: ["/api/teachers", id],
    queryFn: () => fetch(`/api/teachers/${id}`).then(r => r.json()),
    enabled: !!id,
  });

  const { data: teacherStudents = [], isLoading: studentsLoading, refetch } = useQuery<Student[]>({
    queryKey: ["/api/students/by-teacher", teacher?.name],
    queryFn: () => fetch(`/api/students/by-teacher/${encodeURIComponent(teacher!.name)}`).then(r => r.json()),
    enabled: !!teacher?.name,
  });

  const removeFromTeacherMutation = useMutation({
    mutationFn: (studentId: string) => apiRequest("PATCH", `/api/students/${studentId}`, { teacherName: null }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students/by-teacher"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students/unassigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setRemoveConfirm(null);
      toast({ title: "تم إزالة الطالب من المدرس" });
    },
    onError: () => toast({ title: "خطأ في الإزالة", variant: "destructive" }),
  });

  const bulkRemoveMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => apiRequest("PATCH", `/api/students/${id}`, { teacherName: null }).then(r => r.json())));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students/by-teacher"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students/unassigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setSelected(new Set());
      toast({ title: `تم إزالة ${selected.size} طالب من المدرس` });
    },
  });

  const printPage = () => window.print();

  const TEACHER_EXPORT_COLS = [
    { key: "#", label: "#", width: 5 },
    { key: "اسم المشترك", label: "اسم المشترك", width: 28 },
    { key: "الرقم التعريفي", label: "الرقم التعريفي", width: 16 },
    { key: "الجهة التعليمية", label: "الجهة التعليمية", width: 22 },
    { key: "الهاتف", label: "الهاتف", width: 18 },
    { key: "اسم المستخدم", label: "اسم المستخدم", width: 22 },
    { key: "كلمة المرور", label: "كلمة المرور", width: 18 },
    { key: "نوع الاشتراك", label: "نوع الاشتراك", width: 16 },
    { key: "السعر", label: "السعر (ريال)", width: 14 },
    { key: "الحالة", label: "الحالة", width: 10 },
  ];

  const handleExport = () => {
    const rows = teacherStudents.map((s, idx) => ({
      "#": idx + 1,
      "اسم المشترك": s.studentName,
      "الرقم التعريفي": s.studentId || s.internalId,
      "الجهة التعليمية": s.institution || "",
      "الهاتف": s.studentPhone || "",
      "اسم المستخدم": s.username || "",
      "كلمة المرور": s.password || "",
      "نوع الاشتراك": s.subscriptionType || "",
      "السعر": s.subscriptionPrice ? Number(s.subscriptionPrice) : 0,
      "الحالة": s.isActive ? "نشط" : "موقوف",
    }));
    downloadExcel(rows, `مشتركو_المدرس_${teacher?.name || ""}`, TEACHER_EXPORT_COLS, `مشتركو ${teacher?.name || ""}`);
  };

  const handlePrint = () => {
    const rows = teacherStudents.map((s, idx) => ({
      "#": idx + 1,
      "اسم المشترك": s.studentName,
      "الرقم التعريفي": s.studentId || s.internalId,
      "الجهة التعليمية": s.institution || "—",
      "الهاتف": s.studentPhone || "—",
      "نوع الاشتراك": s.subscriptionType || "—",
      "السعر": s.subscriptionPrice ? `${s.subscriptionPrice} ريال` : "—",
      "الحالة": s.isActive ? "نشط" : "موقوف",
    }));
    const printCols = TEACHER_EXPORT_COLS.filter(c => !["اسم المستخدم", "كلمة المرور"].includes(c.key));
    printTablePdf(
      `مشتركو الأستاذ ${teacher?.name || ""}`,
      `إجمالي: ${teacherStudents.length} مشترك`,
      printCols.map(c => ({ label: c.label, key: c.key })),
      rows,
      [
        { label: "اسم المدرس", value: teacher?.name || "" },
        { label: "عدد المشتركين", value: String(teacherStudents.length) },
      ]
    );
  };

  if (teacherLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto" dir="rtl">
        <div className="h-32 rounded-2xl skeleton-wave mb-4" />
        <div className="h-64 rounded-2xl skeleton-wave" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="p-6 flex items-center justify-center h-full" dir="rtl">
        <div className="text-center">
          <p className="text-4xl font-black text-gradient mb-2">404</p>
          <p className="text-muted-foreground">المدرس غير موجود</p>
          <Link href="/teachers">
            <button className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #F43F5E, #DB2777)" }}>
              العودة للمدرسين
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const toggleStudentSelect = (studentId: string) => {
    const next = new Set(selected);
    if (next.has(studentId)) next.delete(studentId); else next.add(studentId);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === teacherStudents.length) setSelected(new Set());
    else setSelected(new Set(teacherStudents.map(s => s.id)));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="glass-card rounded-2xl overflow-hidden mb-5 print-visible">
        <div className="p-5" style={{ background: "linear-gradient(135deg, #F43F5E 0%, #DB2777 50%, #9333EA 100%)" }}>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl shrink-0"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
              {teacher.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 font-medium mb-0.5">مشتركو المدرس</p>
              <h1 className="text-2xl font-black text-white">{teacher.name}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {teacher.subject && <span className="text-sm text-white/75">{teacher.subject}</span>}
                {teacher.phone && (
                  <span className="text-xs text-white/60 flex items-center gap-1" dir="ltr">
                    <Phone className="h-3 w-3" /> {teacher.phone}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${teacher.isActive ? "bg-emerald-500/30 text-white" : "bg-red-500/30 text-white"}`}>
                  {teacher.isActive ? "نشط" : "موقوف"}
                </span>
              </div>
            </div>
            <div className="text-center shrink-0">
              <p className="text-3xl font-black text-white">{teacherStudents.length}</p>
              <p className="text-xs text-white/60">مشترك</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-5 flex-wrap print-hidden">
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:-translate-y-0.5"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
          data-testid="button-refresh-teacher-students">
          <RefreshCcw className="h-3.5 w-3.5" /> تحديث الصفحة
        </button>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5 shadow-md"
          style={{ background: "linear-gradient(135deg, #3B82F6, #4F46E5)" }}
          data-testid="button-add-students-to-teacher">
          <Plus className="h-3.5 w-3.5" /> إضافة مشتركين للمدرس
        </button>
        <button onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
          data-testid="button-export-teacher-students">
          <Download className="h-3.5 w-3.5" /> تصدير Excel
        </button>
        <button onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
          <Printer className="h-3.5 w-3.5" /> طباعة PDF
        </button>
        <Link href="/teachers">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:-translate-y-0.5"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>
            <ArrowRight className="h-3.5 w-3.5" /> العودة للمدرسين
          </button>
        </Link>
        {selected.size > 0 && (
          <button onClick={() => bulkRemoveMutation.mutate([...selected])}
            disabled={bulkRemoveMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5 mr-auto"
            style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)" }}
            data-testid="button-bulk-remove">
            <Trash2 className="h-3.5 w-3.5" /> حذف المحدد ({selected.size})
          </button>
        )}
      </div>

      {/* Students Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {studentsLoading ? (
          <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
        ) : teacherStudents.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="font-bold text-foreground text-lg">لا يوجد مشتركون</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">لم يتم إضافة أي مشترك لهذا المدرس بعد</p>
            <button onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #3B82F6, #4F46E5)" }}>
              <Plus className="h-4 w-4 inline ml-1.5" /> إضافة مشتركين
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                <th className="px-4 py-3 text-right w-8 print-hidden">
                  <input type="checkbox"
                    checked={selected.size === teacherStudents.length && teacherStudents.length > 0}
                    onChange={toggleAll} className="w-3.5 h-3.5 accent-primary" />
                </th>
                {["#", "اسم المشترك", "اسم المستخدم", "كلمة المرور", "الإجراءات"].map(h => (
                  <th key={h} className={`px-4 py-3 text-right text-xs font-black text-muted-foreground ${h === "الإجراءات" ? "print-hidden" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teacherStudents.map((s, idx) => (
                <tr key={s.id}
                  className={`border-b border-border/40 hover:bg-primary/3 transition-colors ${selected.has(s.id) ? "bg-primary/5" : ""}`}
                  data-testid={`row-teacher-student-${s.internalId}`}>
                  <td className="px-4 py-3 print-hidden">
                    <input type="checkbox" checked={selected.has(s.id)}
                      onChange={() => toggleStudentSelect(s.id)} className="w-3.5 h-3.5 accent-primary" />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                        style={{ background: "linear-gradient(135deg, #F43F5E, #DB2777)" }}>
                        {s.studentName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{s.studentName}</p>
                        <p className="text-xs text-muted-foreground">{s.institution || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {s.username ? (
                      <span className="font-mono text-xs px-2 py-1 rounded-lg font-bold"
                        style={{ background: "hsl(142 71% 40% / 0.1)", color: "hsl(142 71% 40%)" }}>
                        {s.username}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {s.password ? (
                      <span className="font-mono text-xs px-2 py-1 rounded-lg font-bold"
                        style={{ background: "hsl(38 92% 48% / 0.1)", color: "hsl(38 92% 48%)" }}>
                        {s.password}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 print-hidden">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/students/${s.internalId}`}>
                        <button className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                          title="عرض الملف الشخصي"
                          data-testid={`button-view-teacher-student-${s.internalId}`}>
                          <Eye className="h-3.5 w-3.5 text-primary" />
                        </button>
                      </Link>
                      <button onClick={() => setRemoveConfirm(s)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                        title="إزالة من المدرس"
                        data-testid={`button-remove-from-teacher-${s.internalId}`}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Remove Confirmation Modal */}
      {removeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRemoveConfirm(null)} />
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <div className="px-5 py-4 flex items-center gap-3"
              style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)", borderBottom: "1px solid hsl(var(--border))" }}>
              <Trash2 className="h-4 w-4 text-white" />
              <h3 className="font-bold text-white">إزالة من المدرس</h3>
            </div>
            <div className="p-5">
              <p className="text-foreground text-sm mb-1">هل تريد إزالة المشترك:</p>
              <p className="font-bold text-foreground text-lg mb-3">{removeConfirm.studentName}</p>
              <p className="text-xs text-muted-foreground mb-4">سيتم إزالته من قائمة مشتركي هذا المدرس دون حذف بياناته.</p>
              <div className="flex gap-2">
                <button onClick={() => removeFromTeacherMutation.mutate(removeConfirm.id)}
                  disabled={removeFromTeacherMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)" }}
                  data-testid="button-confirm-remove">
                  {removeFromTeacherMutation.isPending ? "جاري الإزالة..." : "إزالة"}
                </button>
                <button onClick={() => setRemoveConfirm(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
                  style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && teacher && (
        <AddStudentsModal teacher={teacher} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
