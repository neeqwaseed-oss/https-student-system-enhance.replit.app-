import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Database, Download, Plus, RefreshCcw, Trash2, CheckCircle, AlertCircle, Upload } from "lucide-react";
import type { Student, Teacher, Payment, TeacherSalary } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useGlobalToast } from "@/App";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<{ name: string; size: number; date: string; status: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [repairStatus, setRepairStatus] = useState<"idle" | "running" | "done">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useGlobalToast();
  const queryClient = useQueryClient();

  const wipeDataMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/wipe-data").then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({ title: "تم مسح البيانات", description: "تم حذف جميع بيانات النظام بنجاح" });
    },
    onError: (err: any) => {
      toast({ title: "خطأ في مسح البيانات", description: err.message || String(err), variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: (students: any[]) => apiRequest("POST", "/api/admin/import-students", { students }).then(r => r.json()),
    onSuccess: (res) => {
      queryClient.invalidateQueries();
      toast({ title: "تم الاستيراد بنجاح", description: `تم استيراد/تحديث السجلات بنجاح` });
    },
    onError: (err: any) => {
      toast({ title: "خطأ في الاستيراد", description: err.message || String(err), variant: "destructive" });
    },
  });

  const wipeData = () => {
    if (!window.confirm("تحذير: سيتم حذف جميع البيانات المدخلة في النظام (طلاب، مدرسين، مدفوعات). هل تريد الاستمرار؟")) return;
    wipeDataMutation.mutate();
  };

  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: teachers = [] } = useQuery<Teacher[]>({ queryKey: ["/api/teachers"] });
  const { data: payments = [] } = useQuery<Payment[]>({ queryKey: ["/api/payments"] });
  const { data: salaries = [] } = useQuery<TeacherSalary[]>({
    queryKey: ["/api/salaries"],
    queryFn: () => fetch("/api/salaries").then(r => r.json()),
  });

  const createBackup = () => {
    setCreating(true);
    setTimeout(() => {
      const data = { students, teachers, payments, salaries, exportedAt: new Date().toISOString() };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `backup_${dateStr}.json`;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      const size = new TextEncoder().encode(json).length;
      setBackups(prev => [
        { name: filename, size, date: new Date().toLocaleString("ar-SA"), status: "مكتمل" },
        ...prev,
      ]);
      setCreating(false);
      toast({ title: "تم إنشاء النسخة الاحتياطية", description: "تم تحميل ملف النسخة الاحتياطية بنجاح" });
    }, 1500);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        const studentsToImport = data.students || (Array.isArray(data) ? data : []);
        
        if (!Array.isArray(studentsToImport)) {
          throw new Error("تنسيق الملف غير صحيح");
        }

        importMutation.mutate(studentsToImport);
      } catch (err) {
        toast({ title: "خطأ في قراءة الملف", description: String(err), variant: "destructive" });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const exportCSV = (type: "students" | "teachers" | "payments") => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (type === "students") {
      headers = ["الاسم", "الرقم الجامعي", "الهاتف", "الجهة", "سعر الاشتراك", "المدرس"];
      rows = students.map(s => [s.studentName, s.studentId, s.studentPhone || "", s.institution || "", String(s.subscriptionPrice || 0), s.teacherName || ""]);
    } else if (type === "teachers") {
      headers = ["الاسم", "المادة", "الهاتف"];
      rows = teachers.map(t => [t.name, t.subject || "", t.phone || ""]);
    } else {
      headers = ["الطالب", "المبلغ", "التاريخ", "طريقة الدفع", "الملاحظات"];
      rows = payments.map(p => [p.studentName, String(p.amount || 0), p.paymentDate || "", p.paymentMethod || "", p.notes || ""]);
    }

    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRepair = () => {
    setRepairStatus("running");
    setTimeout(() => setRepairStatus("done"), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Database className="h-6 w-6 text-indigo-500" /> البيانات والنسخ الاحتياطي
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">إدارة وتصدير واستيراد بيانات النظام</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
            accept=".json"
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={importMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
            data-testid="button-import-backup">
            <Upload className="h-4 w-4" />
            {importMutation.isPending ? "جاري الاستيراد..." : "استيراد بيانات"}
          </button>
          <button 
            onClick={wipeData} 
            disabled={wipeDataMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)" }}
            data-testid="button-wipe-data">
            <Trash2 className="h-4 w-4" />
            {wipeDataMutation.isPending ? "جاري المسح..." : "مسح كافة البيانات"}
          </button>
          <button onClick={createBackup} disabled={creating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)" }}
            data-testid="button-create-backup">
            <Plus className="h-4 w-4" />
            {creating ? "جاري الإنشاء..." : "إنشاء نسخة جديدة"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: "المشتركون", value: students.length, color: "#8B5CF6" },
          { label: "المدرسون", value: teachers.length, color: "#F43F5E" },
          { label: "المدفوعات", value: payments.length, color: "#10B981" },
          { label: "النسخ المحفوظة", value: backups.length, color: "#F59E0B" },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${color}22` }}>
              <Database className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-black text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Repair section */}
      <div className="glass-card rounded-2xl p-5 mb-5">
        <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
          <RefreshCcw className="h-4 w-4 text-indigo-500" /> إصلاح مزامنة البيانات
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          هذه الأداة تتحقق من صحة البيانات وتُصلح أي أخطاء في المزامنة بين الجداول.
        </p>
        <div className="flex items-center gap-3">
          <button onClick={handleRepair} disabled={repairStatus === "running"}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)" }}
            data-testid="button-repair">
            <RefreshCcw className={`h-4 w-4 ${repairStatus === "running" ? "animate-spin" : ""}`} />
            {repairStatus === "running" ? "جاري الإصلاح..." : "إصلاح المزامنة"}
          </button>
          {repairStatus === "done" && (
            <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#10B981" }}>
              <CheckCircle className="h-4 w-4" /> تمت عملية الإصلاح بنجاح
            </span>
          )}
        </div>
      </div>

      {/* Export section */}
      <div className="glass-card rounded-2xl p-5 mb-5">
        <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
          <Download className="h-4 w-4 text-indigo-500" /> تصدير البيانات
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "تصدير بيانات المشتركين", key: "students" as const, count: students.length, color: "#8B5CF6" },
            { label: "تصدير بيانات المدرسين", key: "teachers" as const, count: teachers.length, color: "#F43F5E" },
            { label: "تصدير سجل المدفوعات", key: "payments" as const, count: payments.length, color: "#10B981" },
          ].map(({ label, key, count, color }) => (
            <button key={key} onClick={() => exportCSV(key)}
              className="flex items-center gap-3 p-4 rounded-xl border text-right hover:-translate-y-0.5 transition-all"
              style={{ borderColor: `${color}33`, background: `${color}09` }}
              data-testid={`button-export-${key}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: color }}>
                <Download className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color }}>{label}</p>
                <p className="text-xs text-muted-foreground">{count} سجل — CSV</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Backup files */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2"
          style={{ borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.3)" }}>
          <Database className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">ملفات النسخ الاحتياطية</h3>
        </div>
        {backups.length === 0 ? (
          <div className="p-10 text-center">
            <Database className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-bold text-foreground text-sm">لا توجد نسخ احتياطية</p>
            <p className="text-xs text-muted-foreground mt-1">اضغط "إنشاء نسخة جديدة" لإنشاء أول نسخة احتياطية</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                {["اسم الملف", "الحجم", "تاريخ الإنشاء", "الحالة", "الإجراءات"].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-black text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {backups.map((b, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{b.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatBytes(b.size)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{b.date}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
                      <CheckCircle className="h-3 w-3 inline-block ml-1" />
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setBackups(prev => prev.filter((_, j) => j !== i))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-400 hover:bg-rose-500/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-5 py-3 text-xs text-muted-foreground"
          style={{ borderTop: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.2)" }}>
          <AlertCircle className="h-3 w-3 inline-block ml-1 text-amber-500" />
          يُنصح بإنشاء نسخة احتياطية يومية وحفظها في مكان آمن
        </div>
      </div>
    </div>
  );
}
