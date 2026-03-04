import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { useGlobalToast } from "@/App";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  LogOut, Users, GraduationCap, Printer, Eye, EyeOff,
  LayoutDashboard, BookOpen, DollarSign, UserCircle,
  MessageSquare, Settings, Send, Loader2, Save, Upload,
  Image, ChevronDown, ChevronUp, Star, CheckCircle,
  AlertTriangle, Globe, Lock, Phone, Clock,
  Mail, X, Camera, FileSpreadsheet, FileText, Search
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import type { Teacher, Student, TeacherSalary, TeacherMessage, Grade } from "@shared/schema";
import logoImg from "@assets/image_1772507398400.png";
import * as XLSX from "xlsx";

/* ─── Grade Structure (COMPUTER APPS curriculum) ─── */
const GRADE_SECTIONS = [
  {
    key: "module1", label: "MODULE-1", sublabel: "Windows & IT Concepts",
    color: "#8B5CF6", bg: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
    fields: [
      { key: "windowsModel1", label: "Module 1.1 — Computer Concepts" },
      { key: "windowsModel2", label: "Module 1.2 — Windows" },
    ]
  },
  {
    key: "module2", label: "MODULE-2", sublabel: "MS-WORD",
    color: "#3B82F6", bg: "linear-gradient(135deg,#3B82F6,#2563EB)",
    fields: [
      { key: "wordModel1", label: "Module 2.1 — Word" },
      { key: "wordModel2", label: "Module 2.2 — Word" },
      { key: "wordModel3", label: "Module 2.3 — Word" },
      { key: "wordModel4", label: "Module 2.4 — Word" },
    ]
  },
  {
    key: "module3", label: "MODULE-3", sublabel: "MS-EXCEL",
    color: "#10B981", bg: "linear-gradient(135deg,#10B981,#059669)",
    fields: [
      { key: "excelModel1", label: "Module 3.1 — Excel" },
      { key: "excelModel2", label: "Module 3.2 — Excel" },
      { key: "excelModel3", label: "Module 3.3 — Excel" },
      { key: "excelModel4", label: "Module 3.4 — Excel" },
      { key: "excelModel5", label: "Module 3.5 — Excel" },
    ]
  },
  {
    key: "module4", label: "MODULE-4", sublabel: "MS-PowerPoint",
    color: "#F59E0B", bg: "linear-gradient(135deg,#F59E0B,#D97706)",
    fields: [
      { key: "pptModel1", label: "Module 4.1 — PowerPoint" },
      { key: "pptModel2", label: "Module 4.2 — PowerPoint" },
      { key: "pptModel3", label: "Module 4.3 — PowerPoint" },
      { key: "pptModel4", label: "Module 4.4 — PowerPoint" },
    ]
  },
  {
    key: "practice", label: "PRACTICE EXAMS", sublabel: "تمارين وتجارب",
    color: "#F43F5E", bg: "linear-gradient(135deg,#F43F5E,#DB2777)",
    fields: [
      { key: "practiceMidterm", label: "Practice MIDTERM" },
      { key: "practiceQuizWindows", label: "Practice Quiz (Windows)" },
      { key: "practiceQuizExcel", label: "Practice Quiz (Excel)" },
      { key: "practiceQuizPowerpoint", label: "Practice Quiz (PowerPoint)" },
      { key: "practiceQuizWord", label: "Practice Quiz (Word)" },
      { key: "practiceAssignment1", label: "Practice Assignment 1 (Word + Windows)" },
      { key: "practiceAssignment2", label: "Practice Assignment 2 (Excel + PowerPoint)" },
      { key: "practiceFinal", label: "Practice Exam Final (All Modules)" },
    ]
  },
  {
    key: "exams", label: "EXAMS + QUIZZES + ASSIGNMENTS", sublabel: "الامتحانات الرسمية",
    color: "#6366F1", bg: "linear-gradient(135deg,#6366F1,#4F46E5)",
    fields: [
      { key: "quizWindows", label: "Quiz (Windows)" },
      { key: "quizWord", label: "Quiz (Word)" },
      { key: "quizExcel", label: "Quiz (Excel)" },
      { key: "quizPowerpoint", label: "Quiz (PowerPoint)" },
      { key: "midterm", label: "Exam MIDTERM" },
      { key: "assignment1", label: "Exam Assignment 1" },
      { key: "assignment2", label: "Exam Assignment 2" },
      { key: "final", label: "Exam Final" },
    ]
  },
];

const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ARABIC_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const NAV_ITEMS = [
  { key: "dashboard", label: "لوحة التحكم", labelEn: "Dashboard", icon: LayoutDashboard },
  { key: "students", label: "مشتركيني", labelEn: "My Students", icon: Users },
  { key: "grades", label: "رصد الدرجات", labelEn: "Grade Entry", icon: GraduationCap },
  { key: "salary", label: "راتبي", labelEn: "My Salary", icon: DollarSign },
  { key: "profile", label: "ملفي الشخصي", labelEn: "My Profile", icon: UserCircle },
  { key: "messages", label: "التواصل مع الدعم", labelEn: "Support Chat", icon: MessageSquare },
  { key: "settings", label: "الإعدادات", labelEn: "Settings", icon: Settings },
];

type Lang = "ar" | "en";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ─── Live Clock Hook ─── */
function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/* ─── Excel Grades Export ─── */
function exportGradesExcel(student: Student, teacher: Teacher | null | undefined, gradeData: Record<string, number | string>) {
  const wb = XLSX.utils.book_new();
  const rows: any[][] = [];

  rows.push(["مكتبة عين الإنجاز للخدمات الطلابية", "", "", ""]);
  rows.push(["كشف درجات - COMPUTER APPS", "", "", ""]);
  rows.push([]);
  rows.push(["اسم المشترك:", student.studentName, "رقم المشترك:", student.studentId]);
  rows.push(["الجهة التعليمية:", student.institution || "—", "المدرس:", teacher?.name || "—"]);
  rows.push(["تاريخ الطباعة:", new Date().toLocaleDateString("ar-SA"), "", ""]);
  rows.push([]);

  for (const sec of GRADE_SECTIONS) {
    rows.push([sec.label, sec.sublabel, "الدرجة", "/ 100"]);
    let sectionTotal = 0;
    for (const field of sec.fields) {
      const val = Number(gradeData[field.key]) || 0;
      sectionTotal += val;
      rows.push(["", field.label, val, 100]);
    }
    rows.push(["", `إجمالي ${sec.label}`, sectionTotal, sec.fields.length * 100]);
    rows.push([]);
  }

  const allFields = GRADE_SECTIONS.flatMap(s => s.fields);
  const grandTotal = allFields.reduce((sum, f) => sum + (Number(gradeData[f.key]) || 0), 0);
  const grandMax = allFields.length * 100;
  rows.push(["المجموع الكلي", "", grandTotal, grandMax]);
  rows.push(["النسبة المئوية", "", `${((grandTotal / grandMax) * 100).toFixed(1)}%`, ""]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 30 }, { wch: 40 }, { wch: 12 }, { wch: 12 }];
  ws["!dir"] = "RTL";

  XLSX.utils.book_append_sheet(wb, ws, "كشف الدرجات");
  const safeStudentName = student.studentName.replace(/[^\u0600-\u06FF\w]/g, "_");
  const safeTeacherName = (teacher?.name || "المدرس").replace(/[^\u0600-\u06FF\w]/g, "_");
  XLSX.writeFile(wb, `كشف_درجات_${safeStudentName}_${safeTeacherName}_${new Date().toISOString().slice(0,10)}.xlsx`);
}

/* ─── PDF Grades Print ─── */
function printGradesPDF(student: Student, teacher: Teacher | null | undefined, gradeData: Record<string, number | string>) {
  const allFields = GRADE_SECTIONS.flatMap(s => s.fields);
  const grandTotal = allFields.reduce((sum, f) => sum + (Number(gradeData[f.key]) || 0), 0);
  const grandMax = allFields.length * 100;
  const pct = ((grandTotal / grandMax) * 100).toFixed(1);

  const sectionRows = GRADE_SECTIONS.map(sec => {
    const total = sec.fields.reduce((sum, f) => sum + (Number(gradeData[f.key]) || 0), 0);
    const max = sec.fields.length * 100;
    const sectionPct = ((total / max) * 100).toFixed(0);
    const color = sec.color;
    const fieldRows = sec.fields.map(f => {
      const val = Number(gradeData[f.key]) || 0;
      const barColor = val >= 80 ? "#10B981" : val >= 60 ? "#F59E0B" : val >= 40 ? "#F97316" : "#EF4444";
      return `
        <tr>
          <td style="padding:7px 12px;font-size:12px;">${f.label}</td>
          <td style="padding:7px 12px;text-align:center;font-weight:900;font-size:14px;color:${barColor};">${val}</td>
          <td style="padding:7px 12px;text-align:center;color:#9ca3af;font-size:11px;">/ 100</td>
          <td style="padding:7px 12px;">
            <div style="height:6px;border-radius:4px;background:#f3f4f6;overflow:hidden;">
              <div style="height:100%;width:${val}%;background:${barColor};border-radius:4px;"></div>
            </div>
          </td>
        </tr>`;
    }).join("");
    return `
      <div style="margin-bottom:16px;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
        <div style="background:${color};padding:10px 16px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="color:white;font-weight:900;font-size:14px;">${sec.label}</span>
            <span style="color:rgba(255,255,255,.8);font-size:11px;margin-right:8px;">${sec.sublabel}</span>
          </div>
          <span style="color:white;font-weight:900;font-size:12px;">${total} / ${max} (${sectionPct}%)</span>
        </div>
        <table style="width:100%;border-collapse:collapse;background:white;">
          ${fieldRows}
          <tr style="background:#f9fafb;border-top:2px solid #e5e7eb;">
            <td style="padding:7px 12px;font-weight:900;font-size:12px;color:${color};">الإجمالي</td>
            <td style="padding:7px 12px;text-align:center;font-weight:900;font-size:14px;color:${color};">${total}</td>
            <td style="padding:7px 12px;text-align:center;color:#9ca3af;font-size:11px;">/ ${max}</td>
            <td></td>
          </tr>
        </table>
      </div>`;
  }).join("");

  const overallColor = Number(pct) >= 80 ? "#10B981" : Number(pct) >= 60 ? "#F59E0B" : "#EF4444";
  const today = new Date();
  const dateStr = `${today.getDate()} ${ARABIC_MONTHS[today.getMonth()]} ${today.getFullYear()}`;
  const safeStudentName = student.studentName.replace(/[^\u0600-\u06FF\w]/g, "_");
  const safeTeacherName = (teacher?.name || "المدرس").replace(/[^\u0600-\u06FF\w]/g, "_");
  const fileName = `كشف_درجات_${safeStudentName}_${safeTeacherName}_${today.toISOString().slice(0,10)}`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${fileName}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; padding: 24px; background: #f8fafc; color: #111; direction: rtl; }
        @media print {
          body { padding: 12px; background: white; }
          .no-print { display: none; }
          @page { margin: 1cm; size: A4 portrait; }
        }
        .page-header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%); color: white; padding: 20px 24px; border-radius: 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 16px; }
        .page-header h1 { margin: 0 0 4px; font-size: 18px; font-weight: 900; }
        .page-header p { margin: 0; opacity: .8; font-size: 12px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .info-card { background: white; border-radius: 10px; padding: 12px 16px; border: 1px solid #e5e7eb; }
        .info-card label { display: block; font-size: 10px; color: #6b7280; margin-bottom: 3px; }
        .info-card span { font-weight: 700; font-size: 14px; }
        .grand-total { background: linear-gradient(135deg, ${overallColor}, ${overallColor}cc); color: white; padding: 16px 24px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .grand-total .val { font-size: 28px; font-weight: 900; }
        .grand-total .pct { font-size: 18px; opacity: .9; }
        .footer { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .sig-box { border-top: 2px solid #e5e7eb; padding-top: 8px; text-align: center; font-size: 12px; color: #6b7280; }
        .print-btn { position: fixed; top: 16px; left: 16px; padding: 10px 20px; background: #312e81; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
      </style>
    </head>
    <body>
      <button class="print-btn no-print" onclick="window.print()">🖨️ طباعة PDF</button>

      <div class="page-header">
        <div>
          <h1>مكتبة عين الإنجاز للخدمات الطلابية</h1>
          <p>كشف درجات — COMPUTER APPS CURRICULUM</p>
        </div>
        <div style="margin-right:auto;text-align:left;">
          <p style="font-size:11px;opacity:.7;">تاريخ الطباعة</p>
          <p style="font-size:13px;font-weight:700;">${dateStr}</p>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <label>اسم المشترك</label>
          <span>${student.studentName}</span>
        </div>
        <div class="info-card">
          <label>رقم المشترك</label>
          <span dir="ltr">${student.studentId}</span>
        </div>
        <div class="info-card">
          <label>الجهة التعليمية</label>
          <span>${student.institution || "—"}</span>
        </div>
        <div class="info-card">
          <label>المدرس / المدربة</label>
          <span>${teacher?.name || "—"}</span>
        </div>
      </div>

      <div class="grand-total">
        <div>
          <p style="margin:0 0 4px;opacity:.85;font-size:13px;">المجموع الكلي لجميع المقررات</p>
          <p style="margin:0;font-size:11px;opacity:.7;">${allFields.length} درجة × 100</p>
        </div>
        <div style="text-align:left;">
          <span class="val">${grandTotal}</span>
          <span style="opacity:.7;"> / ${grandMax}</span>
          <span class="pct" style="display:block;font-size:14px;margin-top:2px;">${pct}%</span>
        </div>
      </div>

      ${sectionRows}

      <div class="footer">
        <div class="sig-box">توقيع المدرس / المدربة<br><br><br>${teacher?.name || "___________"}</div>
        <div class="sig-box">ختم المكتبة<br><br><br>مكتبة عين الإنجاز</div>
      </div>

      <p style="text-align:center;color:#9ca3af;font-size:10px;margin-top:16px;">
        © ${new Date().getFullYear()} مكتبة عين الإنجاز للخدمات الطلابية — جميع الحقوق محفوظة
      </p>
    </body>
    </html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

/* ─── Print Student Cards ─── */
function printStudentCards(teacherName: string, students: Student[], lang: Lang) {
  const isAr = lang === "ar";
  const safeTeacherName = teacherName.replace(/[^\u0600-\u06FF\w\s]/g, "");
  const rows = students.map((s, i) => `
    <tr>
      <td style="padding:10px 14px;text-align:center;color:#6b7280;">${i + 1}</td>
      <td style="padding:10px 14px;font-weight:700;">${s.studentName}</td>
      <td style="padding:10px 14px;font-family:monospace;color:#2563eb;" dir="ltr">${s.username || "—"}</td>
      <td style="padding:10px 14px;font-family:monospace;color:#059669;" dir="ltr">${s.password || "—"}</td>
      <td style="padding:10px 14px;color:#6b7280;">${s.institution || "—"}</td>
    </tr>`).join("");
  const win = window.open("", "_blank");
  if (!win) return;
  const fileName = `قائمة_طلاب_${safeTeacherName}_${new Date().toISOString().slice(0,10)}`;
  win.document.write(`
    <!DOCTYPE html><html lang="${isAr ? "ar" : "en"}" dir="${isAr ? "rtl" : "ltr"}">
    <head><meta charset="UTF-8"><title>${fileName}</title>
    <style>
      body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:20px;background:#fff;color:#111;}
      .header{background:linear-gradient(135deg,#312e81,#4c1d95);color:white;padding:20px 24px;border-radius:12px;margin-bottom:20px;}
      .header h1{margin:0 0 4px;font-size:20px;}
      .header p{margin:0;opacity:.85;font-size:13px;}
      table{width:100%;border-collapse:collapse;background:white;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);}
      thead tr{background:#f9fafb;}
      th{padding:11px 14px;text-align:right;font-size:12px;color:#6b7280;font-weight:700;border-bottom:2px solid #e5e7eb;}
      tr:nth-child(even){background:#f9fafb;}
      .footer{margin-top:20px;text-align:center;color:#9ca3af;font-size:11px;}
    </style></head>
    <body>
      <div class="header">
        <h1>${isAr ? "مكتبة عين الإنجاز للخدمات الطلابية" : "Ain Enjaz Library"}</h1>
        <p>${isAr ? "قائمة طلاب" : "Student List"}: ${teacherName} — ${students.length} ${isAr ? "مشترك" : "students"}</p>
      </div>
      <table>
        <thead><tr>
          <th style="width:40px">#</th>
          <th>${isAr ? "الاسم" : "Name"}</th>
          <th>${isAr ? "اسم المستخدم" : "Username"}</th>
          <th>${isAr ? "كلمة المرور" : "Password"}</th>
          <th>${isAr ? "الجهة" : "Institution"}</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">${isAr ? "طُبع بتاريخ" : "Printed"} ${new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US")} — ${isAr ? "مكتبة عين الإنجاز" : "Ain Enjaz Library"}</div>
    </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

/* ─── Section Header ─── */
function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: any }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
        style={{ background: "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <h2 className="text-xl font-black text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

/* ─── Grade Field Entry Component ─── */
function GradeFieldEntry({
  fieldKey, label, value, imageData, accentColor, lang,
  onChange, onImageUpload, onImageRemove
}: {
  fieldKey: string; label: string; value: number; imageData: string | null;
  accentColor: string; lang: Lang;
  onChange: (v: number) => void;
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showImg, setShowImg] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onImageUpload(file);
  }, [onImageUpload]);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) { onImageUpload(file); break; }
      }
    }
  }, [onImageUpload]);

  const progress = Math.min(100, Math.max(0, value));
  const getColor = (v: number) => v >= 80 ? "#10B981" : v >= 60 ? "#F59E0B" : v >= 40 ? "#F97316" : "#EF4444";

  return (
    <div className="p-3.5 rounded-xl border border-border bg-background/60 hover:border-purple-500/30 transition-all">
      <p className="text-xs font-bold text-muted-foreground mb-2 truncate" title={label}>{label}</p>
      <div className="flex items-center gap-2 mb-2">
        <input
          type="number" min={0} max={100} value={value}
          onChange={e => onChange(Math.max(0, Math.min(100, Number(e.target.value))))}
          className="w-16 px-2 py-1.5 rounded-lg border border-border bg-background text-sm font-black text-center focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          data-testid={`grade-input-${fieldKey}`}
        />
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: getColor(progress) }} />
        </div>
        <span className="text-xs font-black w-8 text-right" style={{ color: getColor(progress) }}>{value}</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
          style={{ borderColor: imageData ? accentColor : "hsl(var(--border))", color: imageData ? accentColor : "hsl(var(--muted-foreground))" }}
          title={lang === "ar" ? "رفع صورة" : "Upload image"}
          data-testid={`grade-img-upload-${fieldKey}`}
        >
          <Image className="h-3 w-3" />
          {imageData ? (lang === "ar" ? "صورة ✓" : "Img ✓") : (lang === "ar" ? "صورة" : "Img")}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onImageUpload(f); e.target.value = ""; }} />
      </div>

      {/* Drop + Paste zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
        className="rounded-lg border-2 border-dashed text-center text-[10px] py-2 transition-all cursor-pointer outline-none focus:ring-2"
        style={{
          borderColor: dragOver ? accentColor : "hsl(var(--border))",
          color: dragOver ? accentColor : "hsl(var(--muted-foreground))",
          background: dragOver ? `${accentColor}08` : "transparent"
        }}
        onClick={() => fileInputRef.current?.click()}
        data-testid={`grade-dropzone-${fieldKey}`}
      >
        <Upload className="h-3 w-3 mx-auto mb-0.5" />
        <span>{lang === "ar" ? "اسحب / الصق (Ctrl+V) / انقر" : "Drag / Paste (Ctrl+V) / Click"}</span>
      </div>

      {imageData && (
        <div className="mt-2 relative">
          <img src={imageData} alt="grade" className="w-full h-16 object-cover rounded-lg cursor-pointer" onClick={() => setShowImg(true)} />
          <button onClick={onImageRemove}
            className="absolute top-1 left-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all"
            data-testid={`grade-img-remove-${fieldKey}`}>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {showImg && imageData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setShowImg(false)}>
          <div className="relative max-w-2xl max-h-screen p-4">
            <img src={imageData} alt="grade" className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain" />
            <button onClick={() => setShowImg(false)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30">
              <X className="h-4 w-4" />
            </button>
            <p className="text-white text-center text-sm mt-2 opacity-60">{label}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Clock Display Component ─── */
function ClockWidget({ lang }: { lang: Lang }) {
  const now = useLiveClock();
  const isAr = lang === "ar";
  const day = isAr ? ARABIC_DAYS[now.getDay()] : EN_DAYS[now.getDay()];
  const dateStr = isAr
    ? `${now.getDate()} ${ARABIC_MONTHS[now.getMonth()]} ${now.getFullYear()}`
    : now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-2">
        <span className="text-white/60 text-xs font-semibold">{day}</span>
        <Clock className="h-3.5 w-3.5 text-white/40" />
      </div>
      <span className="text-white font-black text-xl tracking-wider" dir="ltr">{timeStr}</span>
      <span className="text-white/70 text-xs">{dateStr}</span>
    </div>
  );
}

/* ─── Main Dashboard Component ─── */
export default function TeacherDashboard() {
  const { toast } = useGlobalToast();
  const [section, setSection] = useState("dashboard");
  const [lang, setLang] = useState<Lang>("ar");
  const [showPasswords, setShowPasswords] = useState(false);
  const [search, setSearch] = useState("");
  const [gradeSearch, setGradeSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [gradeForm, setGradeForm] = useState<Record<string, number | string>>({});
  const [gradeImages, setGradeImages] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    module1: true, module2: true, module3: true, module4: true, practice: true, exams: true
  });
  const [msgText, setMsgText] = useState("");
  const [profileForm, setProfileForm] = useState<Partial<Teacher>>({});
  const [credForm, setCredForm] = useState({ username: "", password: "", confirm: "" });
  const [credError, setCredError] = useState("");
  const bgInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const now = useLiveClock();

  const t = (ar: string, en: string) => lang === "ar" ? ar : en;

  const { data: teacher, isLoading: teacherLoading } = useQuery<Teacher | null>({
    queryKey: ["/api/teacher/me"],
    queryFn: () => fetch("/api/teacher/me", { credentials: "include" }).then(r => r.ok ? r.json() : null),
  });

  const { data: myStudents = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/teacher/my-students-full"],
    queryFn: () => fetch("/api/teacher/my-students-full", { credentials: "include" }).then(r => r.json()),
  });

  const { data: salaries = [] } = useQuery<TeacherSalary[]>({
    queryKey: ["/api/teacher/salary"],
    queryFn: () => fetch(`/api/salaries?teacherId=${teacher?.id}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!teacher?.id,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery<TeacherMessage[]>({
    queryKey: ["/api/teacher/messages"],
    queryFn: () => fetch("/api/teacher/messages", { credentials: "include" }).then(r => r.json()),
  });

  const { data: selectedGrade, isLoading: gradeLoading } = useQuery<Grade | null>({
    queryKey: ["/api/teacher/grades", selectedStudent?.internalId],
    queryFn: () => fetch(`/api/teacher/grades/${selectedStudent?.internalId}`, { credentials: "include" }).then(r => r.ok ? r.json() : null),
    enabled: !!selectedStudent?.internalId,
  });

  useEffect(() => {
    if (teacher) setProfileForm({ bio: teacher.bio || "", phone: teacher.phone || "", email: teacher.email || "", subject: teacher.subject || "" });
  }, [teacher]);

  useEffect(() => {
    if (selectedGrade) {
      const f: Record<string, number | string> = {};
      for (const sec of GRADE_SECTIONS) for (const field of sec.fields) f[field.key] = (selectedGrade as any)[field.key] ?? 0;
      setGradeForm(f);
      if (selectedGrade.gradeImages) { try { setGradeImages(JSON.parse(selectedGrade.gradeImages)); } catch {} }
      else setGradeImages({});
    } else if (selectedStudent) {
      const f: Record<string, number | string> = {};
      for (const sec of GRADE_SECTIONS) for (const field of sec.fields) f[field.key] = 0;
      setGradeForm(f);
      setGradeImages({});
    }
  }, [selectedGrade, selectedStudent]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    queryClient.clear();
    window.location.href = "/login";
  };

  const saveGradesMutation = useMutation({
    mutationFn: (data: object) => apiRequest("POST", `/api/teacher/grades/${selectedStudent!.internalId}`, { ...data, gradeImages: JSON.stringify(gradeImages) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/grades", selectedStudent?.internalId] });
      toast({ title: "✅ " + t("تم حفظ الدرجات", "Grades Saved") });
    },
    onError: () => toast({ title: "❌ " + t("فشل الحفظ", "Save Failed"), variant: "destructive" }),
  });

  const sendMessageMutation = useMutation({
    mutationFn: (msg: string) => apiRequest("POST", "/api/teacher/messages", { message: msg }),
    onSuccess: () => { setMsgText(""); refetchMessages(); toast({ title: "✅ " + t("تم إرسال الرسالة", "Message Sent") }); },
    onError: () => toast({ title: "❌ " + t("فشل الإرسال", "Send Failed"), variant: "destructive" }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: object) => apiRequest("PATCH", "/api/teacher/profile", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/teacher/me"] }); toast({ title: "✅ " + t("تم تحديث الملف الشخصي", "Profile Updated") }); },
    onError: () => toast({ title: "❌ " + t("فشل التحديث", "Update Failed"), variant: "destructive" }),
  });

  const changeCredsMutation = useMutation({
    mutationFn: (data: object) => apiRequest("PATCH", "/api/teacher/credentials", data),
    onSuccess: () => { setCredForm({ username: "", password: "", confirm: "" }); toast({ title: "✅ " + t("تم تغيير بيانات الدخول", "Credentials Updated") }); },
    onError: () => toast({ title: "❌ " + t("فشل التغيير", "Change Failed"), variant: "destructive" }),
  });

  const filtered = myStudents.filter(s =>
    !search || s.studentName.includes(search) || (s.username || "").toLowerCase().includes(search.toLowerCase())
  );

  const gradeFiltered = myStudents.filter(s =>
    !gradeSearch || s.studentName.includes(gradeSearch) || (s.studentId || "").includes(gradeSearch)
  );

  async function handleImageUpload(fieldKey: string, file: File) {
    try {
      const b64 = await fileToBase64(file);
      setGradeImages(prev => ({ ...prev, [fieldKey]: b64 }));
      toast({ title: t("✅ تم رفع الصورة", "✅ Image uploaded") });
    } catch { toast({ title: t("❌ فشل رفع الصورة", "❌ Upload failed"), variant: "destructive" }); }
  }

  async function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    await updateProfileMutation.mutateAsync({ ...profileForm, backgroundImage: b64 });
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    await updateProfileMutation.mutateAsync({ ...profileForm, avatar: b64 });
  }

  function handleChangeCreds() {
    setCredError("");
    if (!credForm.username.trim() || !credForm.password.trim()) { setCredError(t("أدخل اسم المستخدم وكلمة المرور", "Enter username and password")); return; }
    if (credForm.password !== credForm.confirm) { setCredError(t("كلمة المرور غير متطابقة", "Passwords don't match")); return; }
    changeCredsMutation.mutate({ username: credForm.username, password: credForm.password });
  }

  const totalSalary = salaries.reduce((s, r) => s + (r.amount || 0), 0);
  const unreadMessages = messages.filter(m => m.reply && !m.isRead).length;

  const isAr = lang === "ar";
  const dayLabel = isAr ? ARABIC_DAYS[now.getDay()] : EN_DAYS[now.getDay()];
  const dateLabel = isAr
    ? `${now.getDate()} ${ARABIC_MONTHS[now.getMonth()]} ${now.getFullYear()}`
    : now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeLabel = now.toLocaleTimeString(isAr ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (teacherLoading || studentsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-background overflow-hidden ${lang === "ar" ? "rtl" : "ltr"}`} dir={lang === "ar" ? "rtl" : "ltr"}>

      {/* ─── Sidebar ─── */}
      <aside className="w-64 shrink-0 flex flex-col h-full shadow-2xl"
        style={{ background: "linear-gradient(180deg,#0f0c29 0%,#302b63 50%,#24243e 100%)", zIndex: 40 }}>

        {/* Logo */}
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-white/90 flex items-center justify-center shadow-lg">
              <img src={logoImg} alt="عين الإنجاز" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <p className="text-white text-sm font-black leading-tight">{t("عين الإنجاز", "Ain Enjaz")}</p>
              <p className="text-purple-300/70 text-[10px]">{t("لوحة المدرس", "Teacher Portal")}</p>
            </div>
          </div>
        </div>

        {/* Teacher info */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 border-purple-400/50 shadow-lg">
              {teacher?.avatar
                ? <img src={teacher.avatar} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-black text-sm">{teacher?.name?.charAt(0) || "م"}</div>
              }
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-bold truncate">{teacher?.name || t("المدرس", "Teacher")}</p>
              <p className="text-purple-300/60 text-[10px] truncate">{teacher?.subject || t("مدرس", "Teacher")}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = section === item.key;
            return (
              <button key={item.key} onClick={() => setSection(item.key)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative"
                style={active
                  ? { background: "linear-gradient(135deg,rgba(139,92,246,0.5),rgba(109,40,217,0.4))", color: "white", boxShadow: "0 0 24px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.1)" }
                  : { color: "rgba(255,255,255,0.55)", background: "transparent" }
                }
                data-testid={`nav-teacher-${item.key}`}
              >
                {active && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50" />}
                <item.icon className="h-4 w-4 shrink-0" style={{ color: active ? "#C4B5FD" : "inherit" }} />
                <span>{lang === "ar" ? item.label : item.labelEn}</span>
                {item.key === "messages" && unreadMessages > 0 && (
                  <span className="mr-auto text-[10px] font-black bg-red-500 text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-lg">{unreadMessages}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 space-y-2">
          <button onClick={() => setLang(l => l === "ar" ? "en" : "ar")}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white hover:bg-white/8 transition-all"
            data-testid="button-toggle-lang">
            <Globe className="h-3.5 w-3.5" />
            <span>{lang === "ar" ? "Switch to English" : "التبديل للعربية"}</span>
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-all"
            data-testid="button-logout">
            <LogOut className="h-3.5 w-3.5" />
            <span>{t("تسجيل الخروج", "Sign Out")}</span>
          </button>
          <p className="text-[9px] text-white/20 text-center">© {new Date().getFullYear()} {t("مكتبة عين الإنجاز", "Ain Enjaz Library")}</p>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 min-w-0 overflow-y-auto relative">
        {/* Decorative background */}
        <div className="fixed inset-0 pointer-events-none z-0" style={{ left: "256px" }}>
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 15% 15%, rgba(139,92,246,0.06) 0%, transparent 50%), radial-gradient(ellipse at 85% 85%, rgba(59,130,246,0.05) 0%, transparent 50%)" }} />
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.045]">
            <img src={logoImg} alt="" className="w-72 h-72 object-contain" />
          </div>
        </div>

        <div className="relative z-10">

          {/* ─── DASHBOARD ─── */}
          {section === "dashboard" && (
            <div className="p-6">
              {/* Hero */}
              <div className="relative rounded-3xl overflow-hidden mb-6"
                style={{ background: "linear-gradient(135deg,#0f0c29 0%,#302b63 45%,#24243e 75%,#4c1d95 100%)", minHeight: 190 }}>
                {/* Decorative orbs */}
                <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full opacity-15"
                  style={{ background: "radial-gradient(circle, #a78bfa, transparent)", filter: "blur(20px)" }} />
                <div className="absolute -bottom-6 right-8 w-36 h-36 rounded-full opacity-10"
                  style={{ background: "radial-gradient(circle, #60a5fa, transparent)", filter: "blur(16px)" }} />
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full h-px opacity-10"
                  style={{ background: "linear-gradient(90deg, transparent, white, transparent)" }} />

                <div className="relative z-10 p-6 flex items-start justify-between">
                  {/* Teacher info */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0">
                      {teacher?.avatar
                        ? <img src={teacher.avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/50 to-indigo-600/50 text-white font-black text-2xl backdrop-blur">{teacher?.name?.charAt(0) || "م"}</div>
                      }
                    </div>
                    <div>
                      <p className="text-purple-200/80 text-sm">{t("مرحباً بك،", "Welcome back,")}</p>
                      <h1 className="text-white font-black text-2xl leading-tight" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>{teacher?.name || t("المدرس", "Teacher")}</h1>
                      <p className="text-purple-300/70 text-sm mt-1">{teacher?.subject || ""} · <span className="text-purple-200/90">{myStudents.length} {t("مشترك", "students")}</span></p>
                    </div>
                  </div>

                  {/* Clock widget */}
                  <div className="text-left p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-3.5 w-3.5 text-purple-300/60" />
                      <span className="text-purple-300/70 text-xs font-semibold">{dayLabel}</span>
                    </div>
                    <p className="text-white font-black text-2xl tracking-wider mb-1" dir="ltr" data-testid="clock-display">{timeLabel}</p>
                    <p className="text-purple-200/70 text-xs">{dateLabel}</p>
                  </div>
                </div>

                {/* Quick print */}
                <button onClick={() => printStudentCards(teacher?.name || "المدرس", myStudents, lang)}
                  className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-all"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
                  data-testid="button-print-students">
                  <Printer className="h-3.5 w-3.5" /> {t("طباعة القائمة", "Print List")}
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: t("إجمالي المشتركين", "Total Students"), value: myStudents.length, icon: Users, color: "#8B5CF6", bg: "linear-gradient(135deg,#8B5CF6,#7C3AED)" },
                  { label: t("لديهم بيانات دخول", "With Login"), value: myStudents.filter(s => s.username).length, icon: CheckCircle, color: "#10B981", bg: "linear-gradient(135deg,#10B981,#059669)" },
                  { label: t("نشطون", "Active"), value: myStudents.filter(s => s.isActive).length, icon: Star, color: "#F59E0B", bg: "linear-gradient(135deg,#F59E0B,#D97706)" },
                  { label: t("إجمالي الراتب", "Salary Total"), value: `${totalSalary.toLocaleString()} ${t("ر", "SAR")}`, icon: DollarSign, color: "#F43F5E", bg: "linear-gradient(135deg,#F43F5E,#DB2777)" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="glass-card rounded-2xl p-4 flex items-center gap-3 group hover:scale-[1.02] transition-all cursor-default">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg" style={{ background: bg }}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-foreground">{value}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: t("رصد الدرجات", "Enter Grades"), sec: "grades", icon: GraduationCap, color: "#8B5CF6", bg: "linear-gradient(135deg,#8B5CF6,#7C3AED)" },
                  { label: t("مشتركيني", "My Students"), sec: "students", icon: Users, color: "#3B82F6", bg: "linear-gradient(135deg,#3B82F6,#2563EB)" },
                  { label: t("إرسال رسالة", "Send Message"), sec: "messages", icon: MessageSquare, color: "#10B981", bg: "linear-gradient(135deg,#10B981,#059669)" },
                  { label: t("ملفي الشخصي", "My Profile"), sec: "profile", icon: UserCircle, color: "#F59E0B", bg: "linear-gradient(135deg,#F59E0B,#D97706)" },
                  { label: t("راتبي", "My Salary"), sec: "salary", icon: DollarSign, color: "#F43F5E", bg: "linear-gradient(135deg,#F43F5E,#DB2777)" },
                  { label: t("الإعدادات", "Settings"), sec: "settings", icon: Settings, color: "#6366F1", bg: "linear-gradient(135deg,#6366F1,#4F46E5)" },
                ].map(({ label, sec, icon: Icon, bg }) => (
                  <button key={sec} onClick={() => setSection(sec)}
                    className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-all text-right group"
                    data-testid={`quick-action-${sec}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform" style={{ background: bg }}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-bold text-foreground">{label}</span>
                  </button>
                ))}
              </div>

              <p className="text-center text-xs text-muted-foreground mt-8 opacity-40">
                © {now.getFullYear()} {t("مكتبة عين الإنجاز للخدمات الطلابية — جميع الحقوق محفوظة", "Ain Enjaz Library — All Rights Reserved")}
              </p>
            </div>
          )}

          {/* ─── MY STUDENTS ─── */}
          {section === "students" && (
            <div className="p-6">
              <SectionHeader title={t("مشتركيني", "My Students")} subtitle={`${myStudents.length} ${t("مشترك مرتبط بحسابي", "students assigned to me")}`} icon={Users} />
              <div className="glass-card rounded-2xl p-4 mb-4 flex items-center gap-3">
                <input
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm border border-border bg-background outline-none focus:ring-2 focus:ring-purple-500/30"
                  placeholder={t("ابحث عن مشترك...", "Search students...")}
                  value={search} onChange={e => setSearch(e.target.value)}
                  data-testid="input-search-students"
                />
                <button onClick={() => setShowPasswords(p => !p)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-border hover:border-purple-500/50 transition-all"
                  data-testid="button-toggle-passwords">
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPasswords ? t("إخفاء", "Hide") : t("إظهار كلمات المرور", "Show Passwords")}
                </button>
                <button onClick={() => printStudentCards(teacher?.name || "المدرس", filtered, lang)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}
                  data-testid="button-print-filtered">
                  <Printer className="h-4 w-4" /> {t("طباعة", "Print")}
                </button>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden">
                {filtered.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="font-bold">{t("لا يوجد مشتركون", "No students found")}</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "hsl(var(--muted)/0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                        <th className="px-4 py-3 text-right text-xs font-black text-muted-foreground w-10">#</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-muted-foreground">{t("الاسم", "Name")}</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-muted-foreground">{t("اسم المستخدم", "Username")}</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-muted-foreground">{t("كلمة المرور", "Password")}</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-muted-foreground">{t("الجهة", "Institution")}</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-muted-foreground">{t("درجات", "Grades")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((s, idx) => (
                        <tr key={s.internalId} className="border-b border-border/40 hover:bg-muted/30 transition-colors" data-testid={`row-student-${idx}`}>
                          <td className="px-4 py-3 text-center text-xs text-muted-foreground">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                                style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
                                {s.studentName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold">{s.studentName}</p>
                                <p className="text-[10px] text-muted-foreground">{s.studentId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30" dir="ltr">{s.username || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            {s.password
                              ? <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30" dir="ltr">{showPasswords ? s.password : "••••••••"}</span>
                              : <span className="text-muted-foreground text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{s.institution || "—"}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => { setSelectedStudent(s); setSection("grades"); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 transition-all"
                              data-testid={`button-grade-${idx}`}>
                              <GraduationCap className="h-3.5 w-3.5" />{t("رصد", "Enter")}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ─── GRADE ENTRY ─── */}
          {section === "grades" && (
            <div className="p-6">
              <SectionHeader title={t("رصد الدرجات", "Grade Entry")} subtitle={t("COMPUTER APPS — الدرجات من 100", "COMPUTER APPS — Grades out of 100")} icon={GraduationCap} />

              {/* Student selector with search */}
              <div className="glass-card rounded-2xl p-4 mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-bold text-muted-foreground flex-1">{t("اختر مشتركاً لرصد درجاته:", "Select a student to enter grades:")}</p>
                  <div className="relative">
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      className="pl-3 pr-8 py-1.5 rounded-xl text-xs border border-border bg-background outline-none focus:ring-2 focus:ring-purple-500/30 w-48"
                      placeholder={t("بحث بالاسم أو الرقم...", "Search by name or ID...")}
                      value={gradeSearch}
                      onChange={e => setGradeSearch(e.target.value)}
                      data-testid="input-grade-search"
                    />
                  </div>
                </div>

                {/* Scrollable student list */}
                <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5" style={{ scrollbarWidth: "thin" }}>
                  {gradeFiltered.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">{t("لا يوجد مشتركون", "No students found")}</p>
                  )}
                  {gradeFiltered.map((s, idx) => {
                    const isSelected = selectedStudent?.internalId === s.internalId;
                    return (
                      <button key={s.internalId} onClick={() => setSelectedStudent(s)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border text-right"
                        style={isSelected
                          ? { background: "linear-gradient(135deg,#8B5CF6,#7C3AED)", color: "white", borderColor: "transparent", boxShadow: "0 4px 14px rgba(139,92,246,0.3)" }
                          : { borderColor: "hsl(var(--border))", background: "hsl(var(--muted)/0.3)", color: "hsl(var(--foreground))" }
                        }
                        data-testid={`btn-select-student-${s.internalId}`}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                          style={{ background: isSelected ? "rgba(255,255,255,0.25)" : "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
                          {s.studentName.charAt(0)}
                        </div>
                        <div className="text-right flex-1 min-w-0">
                          <p className="font-semibold truncate">{s.studentName}</p>
                          <p className="text-[10px] opacity-70 truncate">{s.studentId} · {s.institution || "—"}</p>
                        </div>
                        <span className="text-[10px] opacity-60 shrink-0">#{idx + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedStudent ? (
                gradeLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Student header with print buttons */}
                    <div className="glass-card rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg"
                          style={{ background: "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}>
                          {selectedStudent.studentName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-foreground">{selectedStudent.studentName}</p>
                          <p className="text-xs text-muted-foreground">{selectedStudent.studentId} · {selectedStudent.institution}</p>
                        </div>
                        <button
                          onClick={() => saveGradesMutation.mutate(gradeForm)}
                          disabled={saveGradesMutation.isPending}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg transition-all disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}
                          data-testid="button-save-grades"
                        >
                          {saveGradesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          {t("حفظ", "Save")}
                        </button>
                      </div>
                      {/* Print buttons */}
                      <div className="flex gap-2 pt-3 border-t border-border/40">
                        <button
                          onClick={() => exportGradesExcel(selectedStudent, teacher, gradeForm)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border"
                          style={{ borderColor: "#10B981", color: "#10B981" }}
                          data-testid="button-export-excel"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          {t("تصدير Excel", "Export Excel")}
                        </button>
                        <button
                          onClick={() => printGradesPDF(selectedStudent, teacher, gradeForm)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border"
                          style={{ borderColor: "#8B5CF6", color: "#8B5CF6" }}
                          data-testid="button-print-pdf"
                        >
                          <FileText className="h-4 w-4" />
                          {t("طباعة PDF", "Print PDF")}
                        </button>
                        <div className="flex-1" />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>{t("الإجمالي:", "Total:")} </span>
                          <span className="font-black text-foreground">
                            {GRADE_SECTIONS.flatMap(s => s.fields).reduce((sum, f) => sum + (Number(gradeForm[f.key]) || 0), 0)}
                          </span>
                          <span> / {GRADE_SECTIONS.flatMap(s => s.fields).length * 100}</span>
                        </div>
                      </div>
                    </div>

                    {/* Grade sections */}
                    {GRADE_SECTIONS.map(sec => (
                      <div key={sec.key} className="glass-card rounded-2xl overflow-hidden">
                        <button
                          onClick={() => setExpandedSections(prev => ({ ...prev, [sec.key]: !prev[sec.key] }))}
                          className="w-full flex items-center justify-between px-5 py-3.5"
                          style={{ background: sec.bg }}
                          data-testid={`toggle-section-${sec.key}`}
                        >
                          <div>
                            <p className="font-black text-sm text-white">{sec.label}</p>
                            <p className="text-white/70 text-xs">{sec.sublabel}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.2)" }}>
                              {sec.fields.reduce((sum, f) => sum + (Number(gradeForm[f.key]) || 0), 0)} / {sec.fields.length * 100}
                            </span>
                            {expandedSections[sec.key] ? <ChevronUp className="h-4 w-4 text-white/70" /> : <ChevronDown className="h-4 w-4 text-white/70" />}
                          </div>
                        </button>

                        {expandedSections[sec.key] && (
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {sec.fields.map(field => (
                              <GradeFieldEntry
                                key={field.key}
                                fieldKey={field.key}
                                label={field.label}
                                value={Number(gradeForm[field.key]) || 0}
                                imageData={gradeImages[field.key] || null}
                                accentColor={sec.color}
                                lang={lang}
                                onChange={(val) => setGradeForm(prev => ({ ...prev, [field.key]: val }))}
                                onImageUpload={(file) => handleImageUpload(field.key, file)}
                                onImageRemove={() => setGradeImages(prev => { const next = { ...prev }; delete next[field.key]; return next; })}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Save bottom */}
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => saveGradesMutation.mutate(gradeForm)}
                        disabled={saveGradesMutation.isPending}
                        className="flex items-center gap-3 px-8 py-3 rounded-2xl text-white font-black text-base shadow-xl transition-all disabled:opacity-50 hover:scale-[1.02]"
                        style={{ background: "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}
                      >
                        {saveGradesMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {t("حفظ جميع الدرجات", "Save All Grades")}
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <GraduationCap className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="font-black text-lg text-foreground">{t("اختر مشتركاً أولاً", "Select a student first")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("اضغط على اسم المشترك من القائمة أعلاه", "Click a student name from the list above")}</p>
                </div>
              )}
            </div>
          )}

          {/* ─── SALARY ─── */}
          {section === "salary" && (
            <div className="p-6">
              <SectionHeader title={t("راتبي", "My Salary")} subtitle={t("سجلات الراتب والمدفوعات", "Salary records and payments")} icon={DollarSign} />
              <div className="glass-card rounded-2xl p-5 mb-5 flex items-center gap-4" style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>
                <DollarSign className="h-10 w-10 text-white/80" />
                <div>
                  <p className="text-white/80 text-sm">{t("الإجمالي المحسوب", "Total Calculated")}</p>
                  <p className="text-white font-black text-3xl">{totalSalary.toLocaleString()} <span className="text-lg">{t("ريال", "SAR")}</span></p>
                </div>
              </div>
              {salaries.length === 0 ? (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="font-bold text-foreground">{t("لا توجد سجلات راتب", "No salary records")}</p>
                </div>
              ) : (
                <div className="glass-card rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "hsl(var(--muted)/0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                        <th className="px-4 py-3 text-right text-xs font-black text-muted-foreground">{t("الشهر", "Month")}</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-muted-foreground">{t("السنة", "Year")}</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-muted-foreground">{t("المبلغ", "Amount")}</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-muted-foreground">{t("تاريخ الصرف", "Paid Date")}</th>
                        <th className="px-4 py-3 text-right text-xs font-black text-muted-foreground">{t("ملاحظات", "Notes")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaries.map((s, idx) => (
                        <tr key={s.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors" data-testid={`row-salary-${idx}`}>
                          <td className="px-4 py-3 font-semibold">{s.month}</td>
                          <td className="px-4 py-3">{s.year}</td>
                          <td className="px-4 py-3"><span className="font-black text-emerald-600 dark:text-emerald-400">{s.amount.toLocaleString()} {t("ريال", "SAR")}</span></td>
                          <td className="px-4 py-3 text-muted-foreground">{s.paidDate || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{s.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ─── PROFILE ─── */}
          {section === "profile" && (
            <div className="p-6">
              <SectionHeader title={t("ملفي الشخصي", "My Profile")} subtitle={t("تعديل وإدارة بياناتك الشخصية", "Edit and manage your personal information")} icon={UserCircle} />
              <div className="relative glass-card rounded-3xl overflow-hidden mb-6">
                <div className="h-32 relative"
                  style={{ background: teacher?.backgroundImage ? `url(${teacher.backgroundImage}) center/cover` : "linear-gradient(135deg,#0f0c29,#302b63,#24243e)" }}>
                  <button onClick={() => bgInputRef.current?.click()}
                    className="absolute bottom-2 left-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 text-white text-xs font-bold hover:bg-black/60 transition-all"
                    data-testid="button-upload-bg">
                    <Camera className="h-3.5 w-3.5" /> {t("تغيير الخلفية", "Change Background")}
                  </button>
                  <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
                </div>
                <div className="px-6 pb-5">
                  <div className="relative w-20 h-20 -mt-10 mb-3">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-background shadow-xl">
                      {teacher?.avatar
                        ? <img src={teacher.avatar} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-white font-black text-3xl" style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>{teacher?.name?.charAt(0) || "م"}</div>
                      }
                    </div>
                    <button onClick={() => avatarInputRef.current?.click()}
                      className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg hover:bg-purple-700 transition-all"
                      data-testid="button-upload-avatar">
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>
                  <p className="font-black text-xl text-foreground">{teacher?.name}</p>
                  <p className="text-muted-foreground text-sm">{teacher?.subject} · {teacher?.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="glass-card rounded-2xl p-5">
                  <h3 className="font-black text-sm text-foreground mb-4">{t("المعلومات الشخصية", "Personal Information")}</h3>
                  <div className="space-y-3">
                    {[
                      { key: "phone", label: t("رقم الهاتف", "Phone"), icon: Phone, type: "text" },
                      { key: "email", label: t("البريد الإلكتروني", "Email"), icon: Mail, type: "email" },
                      { key: "subject", label: t("التخصص", "Subject"), icon: BookOpen, type: "text" },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                          <f.icon className="h-3.5 w-3.5" />{f.label}
                        </label>
                        <input type={f.type} value={(profileForm as any)[f.key] || ""}
                          onChange={e => setProfileForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                          data-testid={`input-profile-${f.key}`} />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">{t("نبذة شخصية", "Bio")}</label>
                      <textarea rows={3} value={profileForm.bio || ""}
                        onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        placeholder={t("اكتب نبذة عن نفسك...", "Write something about yourself...")}
                        data-testid="input-profile-bio" />
                    </div>
                    <button onClick={() => updateProfileMutation.mutate(profileForm)}
                      disabled={updateProfileMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}
                      data-testid="button-save-profile">
                      {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {t("حفظ الملف الشخصي", "Save Profile")}
                    </button>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-5">
                  <h3 className="font-black text-sm text-foreground mb-1">{t("تغيير بيانات الدخول", "Change Login Credentials")}</h3>
                  <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    {t("سيتم إشعار المدير عند تغيير بيانات الدخول", "Admin will be notified when you change credentials")}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                        <UserCircle className="h-3.5 w-3.5" />{t("اسم المستخدم الجديد", "New Username")}
                      </label>
                      <input type="text" value={credForm.username} dir="ltr"
                        onChange={e => { setCredForm(p => ({ ...p, username: e.target.value })); setCredError(""); }}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        data-testid="input-new-username" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                        <Lock className="h-3.5 w-3.5" />{t("كلمة المرور الجديدة", "New Password")}
                      </label>
                      <input type="password" value={credForm.password} dir="ltr"
                        onChange={e => { setCredForm(p => ({ ...p, password: e.target.value })); setCredError(""); }}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        data-testid="input-new-password" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1">
                        <Lock className="h-3.5 w-3.5" />{t("تأكيد كلمة المرور", "Confirm Password")}
                      </label>
                      <input type="password" value={credForm.confirm} dir="ltr"
                        onChange={e => { setCredForm(p => ({ ...p, confirm: e.target.value })); setCredError(""); }}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        data-testid="input-confirm-password" />
                    </div>
                    {credError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />{credError}</p>}
                    <button onClick={handleChangeCreds} disabled={changeCredsMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all disabled:opacity-50"
                      style={{ borderColor: "#F59E0B", color: "#F59E0B" }}
                      data-testid="button-change-credentials">
                      {changeCredsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      {t("تغيير بيانات الدخول", "Change Credentials")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── MESSAGES ─── */}
          {section === "messages" && (
            <div className="p-6">
              <SectionHeader title={t("التواصل مع الدعم", "Support Chat")} subtitle={t("إرسال رسائل للمدير والرد عليها", "Send messages to admin and receive replies")} icon={MessageSquare} />
              <div className="glass-card rounded-2xl p-5 mb-5">
                <p className="text-sm font-bold text-foreground mb-3">{t("إرسال رسالة جديدة للمدير:", "Send a new message to admin:")}</p>
                <textarea rows={3} value={msgText} onChange={e => setMsgText(e.target.value)}
                  placeholder={t("اكتب رسالتك هنا...", "Write your message here...")}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30 mb-3"
                  data-testid="input-message" />
                <button onClick={() => msgText.trim() && sendMessageMutation.mutate(msgText)}
                  disabled={sendMessageMutation.isPending || !msgText.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}
                  data-testid="button-send-message">
                  {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t("إرسال الرسالة", "Send Message")}
                </button>
              </div>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="glass-card rounded-2xl p-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="font-bold">{t("لا توجد رسائل بعد", "No messages yet")}</p>
                  </div>
                ) : messages.map((msg, idx) => (
                  <div key={msg.id} className="glass-card rounded-2xl p-4 space-y-3" data-testid={`msg-${idx}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                        style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
                        {teacher?.name?.charAt(0) || "م"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-foreground">{teacher?.name}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(msg.createdAt || "").toLocaleString("ar-SA")}</span>
                        </div>
                        <p className="text-sm text-foreground bg-purple-50 dark:bg-purple-950/30 rounded-xl px-3 py-2">{msg.message}</p>
                      </div>
                    </div>
                    {msg.reply && (
                      <div className="flex items-start gap-3 mr-8">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                          style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>م</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{t("المدير", "Admin")}</span>
                            <span className="text-[10px] text-muted-foreground">{msg.repliedAt ? new Date(msg.repliedAt).toLocaleString("ar-SA") : ""}</span>
                          </div>
                          <p className="text-sm text-foreground bg-emerald-50 dark:bg-emerald-950/30 rounded-xl px-3 py-2">{msg.reply}</p>
                        </div>
                      </div>
                    )}
                    {!msg.reply && (
                      <p className="text-[11px] text-muted-foreground mr-11 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> {t("في انتظار رد المدير...", "Waiting for admin reply...")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── SETTINGS ─── */}
          {section === "settings" && (
            <div className="p-6">
              <SectionHeader title={t("الإعدادات", "Settings")} subtitle={t("تفضيلات النظام الخاصة بك", "Your personal system preferences")} icon={Settings} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {/* Clock & Date widget */}
                <div className="glass-card rounded-2xl p-5"
                  style={{ background: "linear-gradient(135deg,rgba(30,27,75,0.8),rgba(49,46,129,0.8))" }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.3)" }}>
                      <Clock className="h-4 w-4 text-purple-300" />
                    </div>
                    <h3 className="font-black text-sm text-white">{t("الوقت والتاريخ", "Time & Date")}</h3>
                  </div>
                  <div className="text-center py-4">
                    <p className="text-purple-300/80 text-sm font-semibold mb-1">{dayLabel}</p>
                    <p className="text-white font-black text-4xl tracking-wider mb-2" dir="ltr" data-testid="settings-clock">{timeLabel}</p>
                    <p className="text-purple-200/70 text-base">{dateLabel}</p>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        { label: t("الساعة", "Hour"), val: String(now.getHours()).padStart(2,"0") },
                        { label: t("الدقيقة", "Min"), val: String(now.getMinutes()).padStart(2,"0") },
                        { label: t("الثانية", "Sec"), val: String(now.getSeconds()).padStart(2,"0") },
                      ].map(({ label, val }) => (
                        <div key={label} className="rounded-xl py-2 px-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <p className="text-white font-black text-xl">{val}</p>
                          <p className="text-purple-300/70 text-[10px]">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Language */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#8B5CF622" }}>
                      <Globe className="h-4 w-4" style={{ color: "#8B5CF6" }} />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-foreground">{t("لغة النظام", "System Language")}</h3>
                      <p className="text-xs text-muted-foreground">{t("تغيير لغة عرض واجهة النظام", "Change the display language")}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setLang("ar")}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all"
                      style={lang === "ar"
                        ? { background: "#8B5CF6", color: "white", borderColor: "#8B5CF6" }
                        : { borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }
                      }
                      data-testid="button-lang-ar">
                      🇸🇦 العربية
                    </button>
                    <button onClick={() => setLang("en")}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all"
                      style={lang === "en"
                        ? { background: "#8B5CF6", color: "white", borderColor: "#8B5CF6" }
                        : { borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }
                      }
                      data-testid="button-lang-en">
                      🇺🇸 English
                    </button>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="glass-card rounded-2xl p-5 mb-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#10B98122" }}>
                    <CheckCircle className="h-4 w-4" style={{ color: "#10B981" }} />
                  </div>
                  <h3 className="font-black text-sm text-foreground">{t("معلومات النظام", "System Info")}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: t("اسم المستخدم", "Username"), value: teacher?.username || "—" },
                    { label: t("الدور", "Role"), value: t("مدرس", "Teacher") },
                    { label: t("التخصص", "Subject"), value: teacher?.subject || "—" },
                    { label: t("عدد المشتركين", "Students"), value: String(myStudents.length) },
                    { label: t("تاريخ اليوم", "Today"), value: dateLabel },
                    { label: t("الوقت الحالي", "Current Time"), value: timeLabel },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2 border-b border-border/40">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-xs font-semibold text-foreground" dir={label.includes("Time") || label.includes("الوقت") ? "ltr" : "rtl"}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Copyright */}
              <div className="glass-card rounded-2xl p-5 text-center">
                <img src={logoImg} alt="" className="w-12 h-12 object-contain mx-auto mb-2 opacity-60" />
                <p className="font-black text-sm text-foreground">{t("مكتبة عين الإنجاز للخدمات الطلابية", "Ain Enjaz Library for Student Services")}</p>
                <p className="text-xs text-muted-foreground mt-1">© {new Date().getFullYear()} {t("جميع الحقوق محفوظة", "All Rights Reserved")}</p>
                <p className="text-xs text-muted-foreground">v2.0.0 · {t("نظام إدارة المدرسين", "Teacher Management System")}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
