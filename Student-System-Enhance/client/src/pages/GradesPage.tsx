import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  GraduationCap, Search, X, Save, Star, Printer,
  ChevronDown, ChevronUp, Table, LayoutGrid, ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { useGlobalToast } from "@/App";
import { printGradesReport } from "@/lib/excel";
import type { Student, Grade } from "@shared/schema";

const GRADE_GROUPS = [
  {
    title: "مادة ويندوز",
    shortTitle: "Win",
    color: "#8B5CF6",
    fields: [
      { key: "windowsModel1", label: "M1" },
      { key: "windowsModel2", label: "M2" },
    ],
  },
  {
    title: "مادة وورد",
    shortTitle: "Word",
    color: "#3B82F6",
    fields: [
      { key: "wordModel1", label: "M1" },
      { key: "wordModel2", label: "M2" },
      { key: "wordModel3", label: "M3" },
      { key: "wordModel4", label: "M4" },
    ],
  },
  {
    title: "مادة إكسل",
    shortTitle: "Excel",
    color: "#10B981",
    fields: [
      { key: "excelModel1", label: "M1" },
      { key: "excelModel2", label: "M2" },
      { key: "excelModel3", label: "M3" },
      { key: "excelModel4", label: "M4" },
      { key: "excelModel5", label: "M5" },
    ],
  },
  {
    title: "مادة باوربوينت",
    shortTitle: "PPT",
    color: "#F59E0B",
    fields: [
      { key: "pptModel1", label: "M1" },
      { key: "pptModel2", label: "M2" },
      { key: "pptModel3", label: "M3" },
      { key: "pptModel4", label: "M4" },
    ],
  },
  {
    title: "الاختبارات التطبيقية",
    shortTitle: "اختبار",
    color: "#F43F5E",
    fields: [
      { key: "practiceQuizWindows", label: "Win" },
      { key: "practiceQuizWord", label: "Word" },
      { key: "practiceQuizExcel", label: "Excel" },
      { key: "practiceQuizPowerpoint", label: "PPT" },
      { key: "practiceMidterm", label: "منتصف" },
      { key: "practiceFinal", label: "نهائي" },
    ],
  },
  {
    title: "الاختبارات النظرية",
    shortTitle: "نظري",
    color: "#06B6D4",
    fields: [
      { key: "quizWindows", label: "Win" },
      { key: "quizWord", label: "Word" },
      { key: "quizExcel", label: "Excel" },
      { key: "quizPowerpoint", label: "PPT" },
    ],
  },
  {
    title: "الرسمية والواجبات",
    shortTitle: "نهائي",
    color: "#EC4899",
    fields: [
      { key: "midterm", label: "نصفي" },
      { key: "final", label: "نهائي" },
      { key: "assignment1", label: "واجب 1" },
      { key: "assignment2", label: "واجب 2" },
    ],
  },
];

const ALL_KEYS = GRADE_GROUPS.flatMap(g => g.fields.map(f => f.key));

function GradeBar({ value }: { value: number }) {
  const pct = Math.min(value, 100);
  const color = pct >= 90 ? "#10B981" : pct >= 70 ? "#3B82F6" : pct >= 50 ? "#F59E0B" : "#F43F5E";
  return (
    <div className="h-0.5 rounded-full bg-muted mt-0.5 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function GradesModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const { toast } = useGlobalToast();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const { data: existing, isLoading: gradeLoading } = useQuery<Grade | null>({
    queryKey: ["/api/grades", student.internalId],
    queryFn: () => fetch(`/api/grades/${student.internalId}`).then(r => r.json()),
  });

  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    ALL_KEYS.forEach(k => { init[k] = "0"; });
    return init;
  });

  useEffect(() => {
    if (existing !== undefined) {
      const init: Record<string, string> = {};
      ALL_KEYS.forEach(k => { init[k] = String((existing as any)?.[k] ?? 0); });
      setForm(init);
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("PUT", `/api/grades/${student.internalId}`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades", student.internalId] });
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      toast({ title: "تم حفظ الدرجات بنجاح" });
      onClose();
    },
    onError: (e: any) => toast({ title: "خطأ في الحفظ", description: e.message, variant: "destructive" }),
  });

  const avgPct = Math.round(ALL_KEYS.reduce((s, k) => s + (parseFloat(form[k] || "0") || 0), 0) / (ALL_KEYS.length * 100) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {};
    ALL_KEYS.forEach(k => { data[k] = parseFloat(form[k] || "0") || 0; });
    saveMutation.mutate(data);
  };

  const setVal = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 px-5 py-4 sticky top-0 z-10"
          style={{ background: "linear-gradient(135deg, #10B981, #059669)", borderBottom: "1px solid hsl(var(--border))" }}>
          <GraduationCap className="h-4 w-4 text-white" />
          <h3 className="font-bold text-white flex-1">درجات: {student.studentName}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-5 py-3 flex items-center justify-between"
            style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "1px solid hsl(var(--border))" }}>
            <p className="text-xs text-muted-foreground">{student.studentId} — {student.institution || "—"}</p>
            <span className="text-lg font-black" style={{ color: avgPct >= 70 ? "#10B981" : avgPct >= 50 ? "#F59E0B" : "#F43F5E" }}>
              {avgPct}%
            </span>
          </div>

          {gradeLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">جاري تحميل الدرجات...</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh] p-5 space-y-3">
              {GRADE_GROUPS.map(group => {
                const isCollapsed = collapsed[group.title];
                const groupAvg = Math.round(group.fields.reduce((s, f) => s + (parseFloat(form[f.key] || "0") || 0), 0) / group.fields.length);
                return (
                  <div key={group.title} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${group.color}22` }}>
                    <button type="button" onClick={() => setCollapsed(p => ({ ...p, [group.title]: !p[group.title] }))}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-white font-black text-xs"
                      style={{ background: group.color }}>
                      <Star className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 text-right">{group.title}</span>
                      <span className="font-bold text-white/80">{groupAvg}%</span>
                      {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                    </button>
                    {!isCollapsed && (
                      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {group.fields.map(field => (
                          <div key={field.key}>
                            <label className="block text-xs font-bold mb-1 text-muted-foreground">{field.label}</label>
                            <input type="number" min="0" max="100" step="any"
                              value={form[field.key] ?? "0"} onChange={e => setVal(field.key, e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl text-sm border outline-none bg-background text-foreground font-bold"
                              style={{ borderColor: "hsl(var(--border))" }} dir="ltr"
                              data-testid={`grade-input-${field.key}`} />
                            <GradeBar value={parseFloat(form[field.key] || "0") || 0} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-5 py-4 flex items-center justify-between gap-3 sticky bottom-0"
            style={{ borderTop: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>إلغاء</button>
            <button type="submit" disabled={saveMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? "جاري الحفظ..." : "حفظ الدرجات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SpreadsheetRow({ student, onEdit }: { student: Student; onEdit: () => void }) {
  const { data: grade } = useQuery<Grade | null>({
    queryKey: ["/api/grades", student.internalId],
    queryFn: () => fetch(`/api/grades/${student.internalId}`).then(r => r.json()),
  });

  const hasGrades = grade && ALL_KEYS.some(k => (grade as any)[k] > 0);
  const avgPct = hasGrades
    ? Math.round(ALL_KEYS.reduce((s, k) => s + ((grade as any)[k] || 0), 0) / (ALL_KEYS.length * 100) * 100)
    : 0;

  const getCellValue = (key: string) => {
    const v = grade ? (grade as any)[key] : 0;
    return v > 0 ? v : "—";
  };

  const getCellStyle = (key: string) => {
    const v = grade ? ((grade as any)[key] || 0) : 0;
    if (v === 0) return { color: "hsl(var(--muted-foreground))" };
    if (v >= 90) return { color: "#10B981", fontWeight: 700 };
    if (v >= 70) return { color: "#3B82F6", fontWeight: 600 };
    if (v >= 50) return { color: "#F59E0B", fontWeight: 600 };
    return { color: "#F43F5E", fontWeight: 600 };
  };

  return (
    <tr className="border-b border-border/30 hover:bg-primary/3 transition-colors">
      <td className="px-2 py-2 sticky right-0 bg-card" style={{ borderLeft: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-1.5 min-w-36">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
            {student.studentName.charAt(0)}
          </div>
          <span className="text-xs font-semibold text-foreground truncate max-w-28">{student.studentName}</span>
        </div>
      </td>
      <td className="px-2 py-2 text-xs text-muted-foreground font-mono">{student.studentId}</td>
      {GRADE_GROUPS.flatMap(g => g.fields).map(f => (
        <td key={f.key} className="px-1.5 py-2 text-center text-xs" style={getCellStyle(f.key)}>
          {getCellValue(f.key)}
        </td>
      ))}
      <td className="px-2 py-2 text-center">
        <span className="text-xs font-black" style={{ color: avgPct >= 70 ? "#10B981" : avgPct >= 50 ? "#F59E0B" : "#F43F5E" }}>
          {hasGrades ? `${avgPct}%` : "—"}
        </span>
      </td>
      <td className="px-2 py-2">
        <button onClick={onEdit}
          className="px-2.5 py-1 rounded-lg text-xs font-bold text-white transition-all hover:-translate-y-0.5 whitespace-nowrap"
          style={{ background: hasGrades ? "linear-gradient(135deg, #3B82F6, #2563EB)" : "linear-gradient(135deg, #10B981, #059669)" }}
          data-testid={`button-grades-${student.internalId}`}>
          {hasGrades ? "تعديل" : "إدخال"}
        </button>
      </td>
    </tr>
  );
}

function CardRow({ student, onEdit }: { student: Student; onEdit: () => void }) {
  const { data: grade } = useQuery<Grade | null>({
    queryKey: ["/api/grades", student.internalId],
    queryFn: () => fetch(`/api/grades/${student.internalId}`).then(r => r.json()),
  });

  const hasGrades = grade && ALL_KEYS.some(k => (grade as any)[k] > 0);
  const avgPct = hasGrades
    ? Math.round(ALL_KEYS.reduce((s, k) => s + ((grade as any)[k] || 0), 0) / (ALL_KEYS.length * 100) * 100)
    : null;

  return (
    <tr className="border-b border-border/40 hover:bg-primary/3 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
            {student.studentName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{student.studentName}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${student.isActive ? "badge-success" : "badge-danger"}`}>
              {student.isActive ? "نشط" : "موقوف"}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{student.studentId}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{student.institution || "—"}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{student.teacherName || "—"}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {avgPct !== null && (
            <span className="text-xs font-black px-2 py-0.5 rounded-full"
              style={{
                color: avgPct >= 70 ? "#10B981" : avgPct >= 50 ? "#F59E0B" : "#F43F5E",
                background: avgPct >= 70 ? "rgba(16,185,129,0.1)" : avgPct >= 50 ? "rgba(245,158,11,0.1)" : "rgba(244,63,94,0.1)"
              }}>{avgPct}%</span>
          )}
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: hasGrades ? "linear-gradient(135deg, #3B82F6, #2563EB)" : "linear-gradient(135deg, #10B981, #059669)" }}
            data-testid={`button-grades-${student.internalId}`}>
            {hasGrades ? "تعديل الدرجات" : "إدخال الدرجات"}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function GradesPage() {
  const [search, setSearch] = useState("");
  const [gradeStudent, setGradeStudent] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "spreadsheet">("card");

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const filtered = students.filter(s =>
    !search ||
    s.studentName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId.toLowerCase().includes(search.toLowerCase()) ||
    (s.institution || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.teacherName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-full" dir="rtl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-emerald-500" /> إدخال وتعديل درجات الطلاب
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} مشترك
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl overflow-hidden border" style={{ borderColor: "hsl(var(--border))" }}>
            <button onClick={() => setViewMode("card")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all"
              style={viewMode === "card"
                ? { background: "linear-gradient(135deg, #10B981, #059669)", color: "white" }
                : { color: "hsl(var(--muted-foreground))" }}>
              <LayoutGrid className="h-3.5 w-3.5" /> قائمة
            </button>
            <button onClick={() => setViewMode("spreadsheet")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all"
              style={viewMode === "spreadsheet"
                ? { background: "linear-gradient(135deg, #10B981, #059669)", color: "white" }
                : { color: "hsl(var(--muted-foreground))" }}>
              <Table className="h-3.5 w-3.5" /> جدول الدرجات
            </button>
          </div>
          <button onClick={() => printGradesReport(filtered)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            data-testid="button-print-grades-report">
            <Printer className="h-4 w-4" /> طباعة الكشف
          </button>
          <Link href="/students">
            <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border transition-all hover:-translate-y-0.5"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
              data-testid="button-back-grades">
              <ArrowRight className="h-4 w-4" /> رجوع
            </button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card rounded-2xl p-4 mb-5">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم، الرقم، الجهة، المدرس..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm border outline-none bg-background text-foreground"
            style={{ borderColor: "hsl(var(--border))" }} data-testid="input-search-grades" />
        </div>
      </div>

      {/* Spreadsheet View */}
      {viewMode === "spreadsheet" ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-xs min-w-max">
              <thead>
                <tr style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                  <th className="px-2 py-2.5 text-right font-black text-muted-foreground sticky right-0 bg-muted/50 min-w-40"
                    style={{ borderLeft: "1px solid hsl(var(--border))" }}>اسم الطالب</th>
                  <th className="px-2 py-2.5 text-center font-black text-muted-foreground min-w-20">الرقم</th>
                  {GRADE_GROUPS.map(g => g.fields.map(f => (
                    <th key={f.key} className="px-1.5 py-2 text-center font-bold min-w-10"
                      style={{ color: g.color }}>
                      <div className="text-[9px] font-black mb-0.5" style={{ color: g.color }}>{g.shortTitle}</div>
                      {f.label}
                    </th>
                  )))}
                  <th className="px-2 py-2.5 text-center font-black text-muted-foreground">متوسط</th>
                  <th className="px-2 py-2.5 text-center font-black text-muted-foreground">تعديل</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={ALL_KEYS.length + 4} className="p-8 text-center text-muted-foreground">جاري التحميل...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={ALL_KEYS.length + 4} className="p-8 text-center text-muted-foreground">لا يوجد مشتركون</td></tr>
                ) : (
                  filtered.map(student => (
                    <SpreadsheetRow key={student.id} student={student} onEdit={() => setGradeStudent(student)} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                {["المشترك", "رقم الطالب", "الجهة التعليمية", "المدرس", "إجراءات"].map(h => (
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
                  <GraduationCap className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-foreground font-bold">لا يوجد مشتركون</p>
                </td></tr>
              ) : (
                filtered.map(student => (
                  <CardRow key={student.id} student={student} onEdit={() => setGradeStudent(student)} />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {gradeStudent && <GradesModal student={gradeStudent} onClose={() => setGradeStudent(null)} />}
    </div>
  );
}
