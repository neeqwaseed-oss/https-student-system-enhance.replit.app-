import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Printer, KeyRound, Eye, EyeOff, Users, Download } from "lucide-react";
import type { Student } from "@shared/schema";
import { downloadExcel, printTablePdf } from "@/lib/excel";

export default function PlatformDataPage() {
  const [search, setSearch] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    queryFn: () => fetch("/api/students").then(r => r.json()),
  });

  const withCredentials = students.filter(s => s.username || s.password);
  const filtered = withCredentials.filter(s =>
    s.studentName.includes(search) ||
    (s.username || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.institution || "").includes(search) ||
    (s.teacherName || "").includes(search)
  );

  const EXPORT_COLS = [
    { key: "#", label: "#", width: 5 },
    { key: "اسم الطالب", label: "اسم الطالب", width: 28 },
    { key: "اسم المستخدم", label: "اسم المستخدم", width: 22 },
    { key: "كلمة المرور", label: "كلمة المرور", width: 22 },
    { key: "الجهة التعليمية", label: "الجهة التعليمية", width: 22 },
    { key: "اسم المدرس", label: "اسم المدرس", width: 22 },
  ];

  const handleExport = () => {
    const rows = filtered.map((s, idx) => ({
      "#": idx + 1,
      "اسم الطالب": s.studentName,
      "اسم المستخدم": s.username || "",
      "كلمة المرور": s.password || "",
      "الجهة التعليمية": s.institution || "",
      "اسم المدرس": s.teacherName || "",
    }));
    downloadExcel(rows, "بيانات_دخول_المنصة", EXPORT_COLS, "بيانات دخول المشتركين");
  };

  const handlePrint = () => {
    const rows = filtered.map((s, idx) => ({
      "#": idx + 1,
      "اسم الطالب": s.studentName,
      "اسم المستخدم": s.username || "—",
      "كلمة المرور": showPasswords ? (s.password || "—") : "••••••",
      "الجهة التعليمية": s.institution || "—",
      "اسم المدرس": s.teacherName || "—",
    }));
    printTablePdf(
      "بيانات دخول المشتركين للمنصة",
      `إجمالي: ${filtered.length} مشترك`,
      EXPORT_COLS.map(c => ({ label: c.label, key: c.label })),
      rows.map(r => Object.fromEntries(EXPORT_COLS.map(c => [c.label, r[c.key as keyof typeof r]]))),
      [{ label: "إجمالي المشتركين", value: String(filtered.length) }]
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3 print-hidden">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-primary" /> بيانات دخول المشتركين
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {withCredentials.length} مشترك لديه بيانات دخول للمنصة
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:-translate-y-0.5"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            data-testid="button-toggle-passwords">
            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPasswords ? "إخفاء كلمات المرور" : "إظهار كلمات المرور"}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 shadow-md"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
            data-testid="button-export-platform-data">
            <Download className="h-4 w-4" /> تصدير Excel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 shadow-md"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
            data-testid="button-print-platform-data">
            <Printer className="h-4 w-4" /> طباعة PDF
          </button>
        </div>
      </div>

      {/* Print Header (only shows in print) */}
      <div className="print-only hidden mb-6">
        <div className="text-center border-b-2 pb-4 mb-4" style={{ borderColor: "#8B5CF6" }}>
          <h1 className="text-2xl font-black">مكتبة عين انجاز للخدمات الطلابية</h1>
          <h2 className="text-lg font-bold mt-1">بيانات دخول المشتركين</h2>
          <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card rounded-2xl p-4 mb-5 print-hidden">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو اسم المستخدم أو الجهة أو المدرس..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm border outline-none bg-background text-foreground"
            style={{ borderColor: "hsl(var(--border))" }}
            data-testid="input-search-platform-data" />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="font-bold text-foreground">
              {students.length === 0 ? "لا يوجد مشتركون" : "لا توجد نتائج بحث"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {withCredentials.length === 0 ? "لم يتم إضافة بيانات دخول لأي مشترك بعد" : ""}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                {["#", "اسم الطالب", "اسم المستخدم", "كلمة المرور", "الجهة التعليمية", "اسم المدرس"].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-black text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => (
                <tr key={s.id} className="border-b border-border/40 hover:bg-primary/3 transition-colors"
                  data-testid={`row-platform-data-${s.internalId}`}>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                        style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
                        {s.studentName.charAt(0)}
                      </div>
                      <p className="font-semibold text-foreground">{s.studentName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {s.username ? (
                      <span className="font-mono text-xs px-2.5 py-1.5 rounded-lg font-bold"
                        style={{ background: "hsl(142 71% 40% / 0.1)", color: "hsl(142 71% 40%)" }}>
                        {s.username}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {s.password ? (
                      <span className="font-mono text-xs px-2.5 py-1.5 rounded-lg font-bold"
                        style={{ background: "hsl(38 92% 48% / 0.1)", color: "hsl(38 92% 48%)" }}>
                        {showPasswords ? s.password : "••••••••"}
                      </span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.institution || "—"}</td>
                  <td className="px-4 py-3 text-xs font-bold text-foreground">{s.teacherName || "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "hsl(var(--muted) / 0.5)", borderTop: "2px solid hsl(var(--border))" }}>
                <td colSpan={6} className="px-4 py-3 text-xs text-muted-foreground font-semibold">
                  إجمالي: {filtered.length} مشترك
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Print Footer */}
      <div className="print-only hidden mt-6 text-center text-xs text-gray-400 border-t pt-3">
        مكتبة عين انجاز للخدمات الطلابية — {new Date().toLocaleDateString("ar-SA")}
      </div>
    </div>
  );
}
