import * as XLSX from "xlsx";

export interface ExcelColumn {
  key: string;
  label: string;
  width?: number;
}

export function downloadExcel(
  data: Record<string, string | number | null | undefined>[],
  filename: string,
  columns?: ExcelColumn[],
  sheetName = "البيانات"
) {
  if (!data.length) return;

  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k, width: 20 }));
  const headers = cols.map(c => c.label);
  const rows = data.map(row => cols.map(c => row[c.key] ?? ""));

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[cellAddr]) continue;
    ws[cellAddr].s = {
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "7C3AED" } },
      alignment: { horizontal: "center", vertical: "center", readingOrder: 2 },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      }
    };
  }

  for (let R = 1; R <= range.e.r; R++) {
    const isEven = R % 2 === 0;
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellAddr]) ws[cellAddr] = { t: "s", v: "" };
      ws[cellAddr].s = {
        fill: { fgColor: { rgb: isEven ? "F3F0FF" : "FFFFFF" } },
        alignment: { horizontal: "right", vertical: "center", readingOrder: 2 },
        border: {
          top: { style: "hair", color: { rgb: "D1D5DB" } },
          bottom: { style: "hair", color: { rgb: "D1D5DB" } },
          left: { style: "hair", color: { rgb: "D1D5DB" } },
          right: { style: "hair", color: { rgb: "D1D5DB" } },
        }
      };
    }
  }

  ws["!cols"] = cols.map(c => ({ wch: c.width || 22 }));
  ws["!rows"] = [{ hpt: 24 }, ...rows.map(() => ({ hpt: 18 }))];
  ws["!dir"] = "RTL";

  const wb = XLSX.utils.book_new();
  wb.Props = { Title: filename, Author: "مكتبة عين انجاز" };
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, `${filename}.xlsx`, { bookType: "xlsx", type: "binary", cellStyles: true });
}

export function downloadCsv(
  data: Record<string, string | number | null | undefined>[],
  filename: string
) {
  downloadExcel(data, filename);
}

/* ──────────────────────────────────────────────────────────────
   SHARED HTML BUILDER – produces a full professional A4 page
   ────────────────────────────────────────────────────────────── */
function buildDocHtml(opts: {
  title: string;
  subtitle?: string;
  docNumber?: string;
  infoCards?: { label: string; value: string }[];
  tableHeaders: string[];
  tableRows: string[][];
  totalsRow?: string[];
  summaryRows?: { label: string; value: string; bold?: boolean; color?: string }[];
  footerNote?: string;
  showSignatures?: boolean;
}) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric", calendar: "gregory" });
  const timeStr = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  const docNo = opts.docNumber || `DOC-${Date.now().toString().slice(-6)}`;

  const infoCardsHtml = opts.infoCards && opts.infoCards.length > 0 ? `
    <div class="info-grid">
      ${opts.infoCards.map(c => `
        <div class="info-card">
          <div class="info-label">${c.label}</div>
          <div class="info-value">${c.value || "—"}</div>
        </div>`).join("")}
    </div>` : "";

  const tbodyRows = opts.tableRows.map((row, ri) =>
    `<tr class="${ri % 2 === 0 ? "row-odd" : "row-even"}">${row.map((cell, ci) =>
      `<td class="${ci === 0 ? "cell-first" : ""}">${cell ?? "—"}</td>`
    ).join("")}</tr>`
  ).join("");

  const totalsHtml = opts.totalsRow ? `
    <tfoot>
      <tr class="totals-row">
        ${opts.totalsRow.map(c => `<td>${c}</td>`).join("")}
      </tr>
    </tfoot>` : "";

  const summaryHtml = opts.summaryRows && opts.summaryRows.length > 0 ? `
    <div class="summary-box">
      ${opts.summaryRows.map(r => `
        <div class="summary-row${r.bold ? " summary-bold" : ""}">
          <span class="summary-label">${r.label}</span>
          <span class="summary-value" style="${r.color ? `color:${r.color}` : ""}">${r.value}</span>
        </div>`).join("")}
    </div>` : "";

  const signaturesHtml = opts.showSignatures !== false ? `
    <div class="signatures">
      <div class="sig-box">
        <div class="sig-title">اعتمد المشترك</div>
        <div class="sig-line"></div>
        <div class="sig-name">الاسم: ________________</div>
        <div class="sig-name">التوقيع: _______________</div>
      </div>
      <div class="sig-box stamp-box">
        <div class="sig-title">الختم الرسمي</div>
        <div class="stamp-circle"></div>
      </div>
      <div class="sig-box">
        <div class="sig-title">اعتمد المدير</div>
        <div class="sig-line"></div>
        <div class="sig-name">الاسم: ________________</div>
        <div class="sig-name">التوقيع: _______________</div>
      </div>
    </div>` : "";

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>${opts.title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
  @page { size: A4; margin: 15mm 12mm 20mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
    font-size: 10px;
    color: #1a1a2e;
    direction: rtl;
    background: #fff;
  }

  /* ── HEADER ── */
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    margin-bottom: 12px;
    border-bottom: 3px solid #7C3AED;
    position: relative;
  }
  .page-header::after {
    content: '';
    position: absolute;
    bottom: -6px;
    right: 0;
    left: 0;
    height: 1.5px;
    background: linear-gradient(to left, #7C3AED33, #7C3AED, #7C3AED33);
  }
  .logo-area {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo-icon {
    width: 46px;
    height: 46px;
    background: linear-gradient(135deg, #7C3AED, #5B21B6);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: white;
    font-weight: 900;
    box-shadow: 0 4px 12px rgba(124,58,237,0.35);
  }
  .logo-text { }
  .logo-name {
    font-size: 14px;
    font-weight: 900;
    color: #4C1D95;
    line-height: 1.2;
  }
  .logo-tagline {
    font-size: 9px;
    color: #7C3AED;
    font-weight: 600;
  }
  .doc-meta {
    text-align: left;
    direction: ltr;
  }
  .doc-number {
    font-size: 11px;
    font-weight: 700;
    color: #7C3AED;
    background: #EDE9FE;
    padding: 3px 10px;
    border-radius: 20px;
    display: inline-block;
    margin-bottom: 3px;
  }
  .doc-date {
    font-size: 9px;
    color: #6B7280;
    text-align: right;
    direction: rtl;
  }

  /* ── DOC TITLE BANNER ── */
  .doc-title-banner {
    text-align: center;
    padding: 8px 0;
    margin-bottom: 14px;
    background: linear-gradient(135deg, #7C3AED15, #7C3AED08);
    border-radius: 8px;
    border: 1px solid #DDD6FE;
  }
  .doc-title {
    font-size: 16px;
    font-weight: 900;
    color: #4C1D95;
  }
  .doc-subtitle {
    font-size: 10px;
    color: #7C3AED;
    margin-top: 2px;
    font-weight: 600;
  }

  /* ── INFO CARDS ── */
  .info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-bottom: 14px;
  }
  .info-card {
    background: #F5F3FF;
    border: 1px solid #DDD6FE;
    border-radius: 7px;
    padding: 7px 9px;
    position: relative;
    overflow: hidden;
  }
  .info-card::before {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 3px;
    height: 100%;
    background: linear-gradient(to bottom, #7C3AED, #6D28D9);
    border-radius: 0 7px 7px 0;
  }
  .info-label {
    font-size: 8px;
    color: #7C3AED;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 2px;
  }
  .info-value {
    font-size: 12px;
    font-weight: 900;
    color: #1a1a2e;
    line-height: 1.2;
  }

  /* ── TABLE ── */
  .table-wrap {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #DDD6FE;
    margin-bottom: 14px;
    box-shadow: 0 2px 8px rgba(124,58,237,0.08);
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  thead tr {
    background: linear-gradient(135deg, #7C3AED, #6D28D9);
  }
  thead th {
    color: white;
    font-weight: 700;
    font-size: 9.5px;
    padding: 9px 8px;
    text-align: right;
    border-left: 1px solid rgba(255,255,255,0.15);
    white-space: nowrap;
  }
  thead th:last-child { border-left: none; }
  .row-odd  { background: #FFFFFF; }
  .row-even { background: #FAF8FF; }
  tbody tr:hover { background: #F3EFFF; }
  tbody td {
    padding: 7px 8px;
    border-bottom: 1px solid #EDE9FE;
    border-left: 1px solid #F3EFFF;
    font-size: 9.5px;
    color: #374151;
    vertical-align: middle;
  }
  tbody td:last-child { border-left: none; }
  .cell-first { font-weight: 700; color: #1a1a2e; }
  .totals-row { background: linear-gradient(to left, #EDE9FE, #F5F3FF); }
  .totals-row td {
    padding: 8px 8px;
    font-weight: 900;
    font-size: 10px;
    color: #4C1D95;
    border: none;
    border-top: 2px solid #7C3AED;
  }

  /* ── SUMMARY BOX ── */
  .summary-box {
    background: #F5F3FF;
    border: 1px solid #DDD6FE;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 14px;
    max-width: 340px;
    margin-right: auto;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    border-bottom: 1px dashed #DDD6FE;
    font-size: 10px;
    color: #374151;
  }
  .summary-row:last-child { border-bottom: none; }
  .summary-bold { font-weight: 900; font-size: 11px; color: #4C1D95 !important; }
  .summary-label { font-weight: 600; }
  .summary-value { font-weight: 700; }

  /* ── SIGNATURES ── */
  .signatures {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 20px;
    padding-top: 14px;
    border-top: 1.5px dashed #DDD6FE;
  }
  .sig-box {
    flex: 1;
    border: 1px solid #DDD6FE;
    border-radius: 8px;
    padding: 10px;
    text-align: center;
    background: #FAFAFA;
  }
  .stamp-box { background: #F5F3FF; }
  .sig-title {
    font-size: 9px;
    font-weight: 700;
    color: #7C3AED;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 22px;
  }
  .sig-line {
    height: 1px;
    background: #9CA3AF;
    margin: 0 8px 6px;
  }
  .sig-name {
    font-size: 8.5px;
    color: #6B7280;
    line-height: 1.8;
    text-align: right;
  }
  .stamp-circle {
    width: 60px;
    height: 60px;
    border: 2px dashed #7C3AED;
    border-radius: 50%;
    margin: 0 auto 4px;
    opacity: 0.4;
  }

  /* ── FOOTER ── */
  .page-footer {
    margin-top: 16px;
    padding-top: 8px;
    border-top: 1px solid #E5E7EB;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-brand {
    font-size: 8.5px;
    color: #9CA3AF;
    font-weight: 600;
  }
  .footer-date {
    font-size: 8px;
    color: #9CA3AF;
    direction: ltr;
  }
  .footer-note {
    font-size: 8px;
    color: #7C3AED;
    text-align: center;
  }

  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .signatures { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- ─── PAGE HEADER ─── -->
<div class="page-header">
  <div class="logo-area">
    <div class="logo-icon">م</div>
    <div class="logo-text">
      <div class="logo-name">مكتبة عين انجاز</div>
      <div class="logo-tagline">للخدمات الطلابية – ينبع الصناعية</div>
    </div>
  </div>
  <div class="doc-meta">
    <div class="doc-number">${docNo}</div>
    <div class="doc-date">${dateStr}  ·  ${timeStr}</div>
  </div>
</div>

<!-- ─── TITLE BANNER ─── -->
<div class="doc-title-banner">
  <div class="doc-title">${opts.title}</div>
  ${opts.subtitle ? `<div class="doc-subtitle">${opts.subtitle}</div>` : ""}
</div>

<!-- ─── INFO CARDS ─── -->
${infoCardsHtml}

<!-- ─── TABLE ─── -->
<div class="table-wrap">
  <table>
    <thead>
      <tr>${opts.tableHeaders.map(h => `<th>${h}</th>`).join("")}</tr>
    </thead>
    <tbody>${tbodyRows || `<tr><td colspan="${opts.tableHeaders.length}" style="text-align:center;padding:20px;color:#9CA3AF;">لا توجد بيانات</td></tr>`}</tbody>
    ${totalsHtml}
  </table>
</div>

<!-- ─── SUMMARY ─── -->
${summaryHtml}

<!-- ─── SIGNATURES ─── -->
${signaturesHtml}

<!-- ─── FOOTER ─── -->
<div class="page-footer">
  <div class="footer-brand">مكتبة عين انجاز للخدمات الطلابية</div>
  ${opts.footerNote ? `<div class="footer-note">${opts.footerNote}</div>` : ""}
  <div class="footer-date">${dateStr}  ${timeStr}</div>
</div>

</body></html>`;
}

function openPrintWindow(html: string) {
  const win = window.open("", "_blank");
  if (!win) { alert("يرجى السماح بالنوافذ المنبثقة لطباعة الكشف"); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

/* ──────────────────────────────────────────────────────────────
   1. GENERAL TABLE PDF (used by PlatformDataPage, TeacherProfile, etc.)
   ────────────────────────────────────────────────────────────── */
export function printTablePdf(
  title: string,
  subtitle: string,
  columns: { label: string; key: string }[],
  rows: Record<string, string | number | null | undefined>[],
  extraInfo?: { label: string; value: string }[]
) {
  const tableRows = rows.map(row => columns.map(c => String(row[c.key] ?? "—")));
  const totalsEntry = extraInfo?.find(e => e.label === "الإجمالي");

  const summaryRows = extraInfo
    ? extraInfo.filter(e => e.label !== "الإجمالي").map(e => ({ label: e.label, value: e.value }))
    : undefined;

  if (totalsEntry) {
    const totalsRow = columns.map((_, i) => i === 0 ? "الإجمالي" : (i === 1 ? totalsEntry.value : ""));
    const html = buildDocHtml({
      title,
      subtitle,
      docNumber: `RPT-${Date.now().toString().slice(-6)}`,
      infoCards: summaryRows?.slice(0, 4),
      tableHeaders: columns.map(c => c.label),
      tableRows,
      totalsRow,
      showSignatures: false,
      footerNote: subtitle,
    });
    openPrintWindow(html);
  } else {
    const html = buildDocHtml({
      title,
      subtitle,
      docNumber: `RPT-${Date.now().toString().slice(-6)}`,
      infoCards: extraInfo?.slice(0, 4),
      tableHeaders: columns.map(c => c.label),
      tableRows,
      showSignatures: false,
      footerNote: subtitle,
    });
    openPrintWindow(html);
  }
}

/* ──────────────────────────────────────────────────────────────
   2. STUDENT ACCOUNT STATEMENT (كشف حساب مشترك)
   ────────────────────────────────────────────────────────────── */
export interface StudentStatementData {
  studentName: string;
  studentId: string;
  studentPhone?: string | null;
  institution?: string | null;
  teacherName?: string | null;
  subscriptionType?: string | null;
  subscriptionPrice?: number | null;
  discountType?: string | null;
  discountValue?: number | null;
  registrationDate?: string | null;
  payments: {
    paymentId?: string | null;
    paymentDate?: string | null;
    amount?: number | null;
    paymentMethod?: string | null;
    receiverName?: string | null;
    notes?: string | null;
  }[];
}

export function printStudentStatement(data: StudentStatementData) {
  const fmt = (n: number | null | undefined) =>
    (n ?? 0).toLocaleString("ar-SA", { style: "currency", currency: "SAR", minimumFractionDigits: 0 });

  const subscriptionPrice = data.subscriptionPrice || 0;
  const discountValue = data.discountValue || 0;
  const finalPrice = subscriptionPrice - discountValue;
  const totalPaid = data.payments.reduce((s, p) => s + (p.amount || 0), 0);
  const remaining = Math.max(finalPrice - totalPaid, 0);
  const paidPct = finalPrice > 0 ? Math.round((totalPaid / finalPrice) * 100) : 0;

  const infoCards = [
    { label: "اسم المشترك", value: data.studentName },
    { label: "رقم القيد", value: data.studentId },
    { label: "رقم الهاتف", value: data.studentPhone || "—" },
    { label: "الجهة التعليمية", value: data.institution || "—" },
    { label: "المدرس المشرف", value: data.teacherName || "—" },
    { label: "نوع الاشتراك", value: data.subscriptionType || "—" },
    { label: "تاريخ التسجيل", value: data.registrationDate || "—" },
    { label: "نسبة السداد", value: `${paidPct}%` },
  ];

  const tableHeaders = ["م", "رقم الدفعة", "تاريخ الدفع", "المبلغ (ر.س)", "طريقة الدفع", "المستلم", "ملاحظات"];
  const tableRows = data.payments.map((p, i) => [
    String(i + 1),
    p.paymentId || `${i + 1}`,
    p.paymentDate || "—",
    fmt(p.amount),
    p.paymentMethod || "—",
    p.receiverName || "—",
    p.notes || "—",
  ]);

  const totalsRow = [
    "",
    `إجمالي الدفعات: ${data.payments.length}`,
    "",
    fmt(totalPaid),
    "", "", ""
  ];

  const summaryRows = [
    { label: "سعر الاشتراك الأصلي", value: fmt(subscriptionPrice) },
    { label: `الخصم (${data.discountType || "—"})`, value: discountValue ? `- ${fmt(discountValue)}` : "لا يوجد", color: "#DC2626" },
    { label: "السعر النهائي بعد الخصم", value: fmt(finalPrice) },
    { label: "إجمالي المدفوع", value: fmt(totalPaid), color: "#059669" },
    { label: "المبلغ المتبقي", value: fmt(remaining), bold: true, color: remaining > 0 ? "#DC2626" : "#059669" },
  ];

  const html = buildDocHtml({
    title: "كشف حساب مشترك",
    subtitle: `${data.studentName} — ${data.institution || ""} — ${data.teacherName || ""}`,
    docNumber: `STMT-${data.studentId}`,
    infoCards,
    tableHeaders,
    tableRows,
    totalsRow,
    summaryRows,
    showSignatures: true,
    footerNote: "هذا الكشف وثيقة رسمية صادرة عن مكتبة عين انجاز للخدمات الطلابية",
  });

  openPrintWindow(html);
}

/* ──────────────────────────────────────────────────────────────
   3. RECEIVER PAYMENT STATEMENT (كشف مدفوعات مستلم)
   ────────────────────────────────────────────────────────────── */
export function printReceiverStatement(
  receiverName: string,
  payments: {
    senderName?: string | null;
    paymentDate?: string | null;
    amount?: number | null;
    paymentMethod?: string | null;
    paymentId?: string | null;
    notes?: string | null;
  }[]
) {
  const fmt = (n: number | null | undefined) =>
    (n ?? 0).toLocaleString("ar-SA", { style: "currency", currency: "SAR", minimumFractionDigits: 0 });

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);

  const infoCards = [
    { label: "اسم المستلم", value: receiverName },
    { label: "عدد الدفعات", value: String(payments.length) },
    { label: "إجمالي المستلم", value: fmt(total) },
    { label: "حالة الكشف", value: "ساري" },
  ];

  const tableHeaders = ["م", "المُرسِل", "رقم الدفعة", "التاريخ", "المبلغ (ر.س)", "طريقة الدفع", "ملاحظات"];
  const tableRows = payments.map((p, i) => [
    String(i + 1),
    p.senderName || "—",
    p.paymentId || `${i + 1}`,
    p.paymentDate || "—",
    fmt(p.amount),
    p.paymentMethod || "—",
    p.notes || "—",
  ]);

  const totalsRow = ["", "", `إجمالي الدفعات: ${payments.length}`, "", fmt(total), "", ""];

  const summaryRows = [
    { label: "إجمالي المبالغ المستلمة", value: fmt(total), bold: true, color: "#059669" },
  ];

  const html = buildDocHtml({
    title: `كشف مدفوعات — ${receiverName}`,
    subtitle: `تقرير مالي شامل لجميع الدفعات المستلمة`,
    docNumber: `RCV-${Date.now().toString().slice(-6)}`,
    infoCards,
    tableHeaders,
    tableRows,
    totalsRow,
    summaryRows,
    showSignatures: true,
    footerNote: "هذا الكشف وثيقة رسمية صادرة عن مكتبة عين انجاز للخدمات الطلابية",
  });

  openPrintWindow(html);
}

/* ──────────────────────────────────────────────────────────────
   4. STUDENT GRADES DOCUMENT (طباعة الدرجات – ملف الطالب)
   ────────────────────────────────────────────────────────────── */
const GRADE_GROUPS_DEF = [
  { title: "مادة ويندوز",          keys: ["windowsModel1", "windowsModel2"] },
  { title: "مادة وورد",            keys: ["wordModel1", "wordModel2", "wordModel3", "wordModel4"] },
  { title: "مادة إكسل",            keys: ["excelModel1", "excelModel2", "excelModel3", "excelModel4", "excelModel5"] },
  { title: "مادة باوربوينت",       keys: ["pptModel1", "pptModel2", "pptModel3", "pptModel4"] },
  { title: "الاختبارات التطبيقية", keys: ["practiceQuizWindows", "practiceQuizWord", "practiceQuizExcel", "practiceQuizPowerpoint", "practiceMidterm", "practiceFinal"] },
  { title: "الاختبارات النظرية",   keys: ["quizWindows", "quizWord", "quizExcel", "quizPowerpoint"] },
  { title: "الرسمية والواجبات",    keys: ["midterm", "final", "assignment1", "assignment2"] },
];

export function printStudentGradesDoc(
  student: { studentName: string; studentId?: string | null; institution?: string | null; teacherName?: string | null },
  grades: Record<string, number> | null
) {
  const g = grades || {};

  const tableHeaders = ["المجموعة", "عدد الحقول", "المجموع", "المتوسط", "التقدير"];
  const tableRows = GRADE_GROUPS_DEF.map(grp => {
    const vals = grp.keys.map(k => Number(g[k] || 0));
    const total = vals.reduce((s, v) => s + v, 0);
    const avg = Math.round(total / vals.length);
    const grade = avg >= 90 ? "ممتاز" : avg >= 75 ? "جيد جداً" : avg >= 60 ? "جيد" : avg >= 50 ? "مقبول" : "ضعيف";
    return [grp.title, String(grp.keys.length), String(total), `${avg}%`, grade];
  });

  const allKeys = GRADE_GROUPS_DEF.flatMap(gr => gr.keys);
  const allVals = allKeys.map(k => Number(g[k] || 0));
  const overallAvg = Math.round(allVals.reduce((s, v) => s + v, 0) / allVals.length);
  const gradeLabel = overallAvg >= 90 ? "ممتاز" : overallAvg >= 75 ? "جيد جداً" : overallAvg >= 60 ? "جيد" : overallAvg >= 50 ? "مقبول" : "ضعيف";
  const totalsRow = ["الإجمالي الكلي", String(allKeys.length), String(allVals.reduce((s, v) => s + v, 0)), `${overallAvg}%`, gradeLabel];

  const infoCards = [
    { label: "اسم الطالب", value: student.studentName },
    { label: "رقم القيد", value: student.studentId || "—" },
    { label: "الجهة التعليمية", value: student.institution || "—" },
    { label: "المدرس المشرف", value: student.teacherName || "—" },
    { label: "المتوسط العام", value: `${overallAvg}%` },
    { label: "التقدير الكلي", value: gradeLabel },
  ];

  const summaryRows = GRADE_GROUPS_DEF.map(grp => {
    const avg = Math.round(grp.keys.map(k => Number(g[k] || 0)).reduce((s, v) => s + v, 0) / grp.keys.length);
    return { label: grp.title, value: `${avg}%`, color: avg >= 75 ? "#059669" : avg >= 50 ? "#D97706" : "#DC2626" };
  });
  summaryRows.push({ label: "المتوسط العام الكلي", value: `${overallAvg}%`, color: overallAvg >= 75 ? "#059669" : "#D97706" });

  const html = buildDocHtml({
    title: `كشف درجات — ${student.studentName}`,
    subtitle: "تقرير درجات تفصيلي حسب كل مادة دراسية",
    docNumber: `GRD-${Date.now().toString().slice(-6)}`,
    infoCards,
    tableHeaders,
    tableRows,
    totalsRow,
    summaryRows,
    showSignatures: true,
    footerNote: "هذا الكشف وثيقة رسمية صادرة عن مكتبة عين انجاز للخدمات الطلابية",
  });

  openPrintWindow(html);
}

/* ──────────────────────────────────────────────────────────────
   5. ALL STUDENTS GRADES REPORT (كشف درجات جميع الطلاب)
   ────────────────────────────────────────────────────────────── */
export async function printGradesReport(
  students: { studentName: string; studentId?: string | null; institution?: string | null; teacherName?: string | null; internalId: string }[]
) {
  let allGrades: Record<string, Record<string, number>> = {};
  try {
    const resp = await fetch("/api/grades");
    if (resp.ok) {
      const data: { internalId: string; [key: string]: unknown }[] = await resp.json();
      data.forEach(g => { allGrades[g.internalId] = g as Record<string, number>; });
    }
  } catch (_) { /* silent */ }

  const tableHeaders = ["م", "اسم الطالب", "الرقم", "الجهة", "Win%", "Word%", "Excel%", "PPT%", "نظري%", "المتوسط", "التقدير"];
  const tableRows = students.map((st, i) => {
    const g = allGrades[st.internalId] || {};
    const groupAvgs = GRADE_GROUPS_DEF.map(grp => {
      const vals = grp.keys.map(k => Number(g[k] || 0));
      return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
    });
    const overall = Math.round(groupAvgs.reduce((s, v) => s + v, 0) / groupAvgs.length);
    const label = overall >= 90 ? "ممتاز" : overall >= 75 ? "جيد جداً" : overall >= 60 ? "جيد" : overall >= 50 ? "مقبول" : "ضعيف";
    return [
      String(i + 1), st.studentName, st.studentId || "—", (st.institution || "—").substring(0, 10),
      `${groupAvgs[0]}%`, `${groupAvgs[1]}%`, `${groupAvgs[2]}%`, `${groupAvgs[3]}%`, `${groupAvgs[5]}%`,
      `${overall}%`, label,
    ];
  });

  const infoCards = [
    { label: "إجمالي الطلاب", value: String(students.length) },
    { label: "لديهم درجات", value: String(Object.keys(allGrades).length) },
    { label: "بدون درجات", value: String(students.length - Object.keys(allGrades).length) },
    { label: "حالة الكشف", value: "مراجعة نهائية" },
  ];

  const html = buildDocHtml({
    title: "كشف درجات جميع الطلاب",
    subtitle: "تقرير شامل للمستوى الأكاديمي لجميع المشتركين",
    docNumber: `GRP-${Date.now().toString().slice(-6)}`,
    infoCards,
    tableHeaders,
    tableRows,
    showSignatures: true,
    footerNote: "هذا الكشف وثيقة رسمية صادرة عن مكتبة عين انجاز للخدمات الطلابية",
  });

  openPrintWindow(html);
}

/* ──────────────────────────────────────────────────────────────
   6. FINANCIAL REPORT (التقرير المالي الشامل)
   ────────────────────────────────────────────────────────────── */
export function printFinancialReport(opts: {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalRemaining: number;
  students: { studentName: string; studentId?: string | null; institution?: string | null; subscriptionPrice?: number | null; internalId: string }[];
  paidByStudent: Record<string, number>;
}) {
  const fmt = (n: number) =>
    n.toLocaleString("ar-SA", { style: "currency", currency: "SAR", minimumFractionDigits: 0 });

  const infoCards = [
    { label: "إجمالي الإيرادات", value: fmt(opts.totalRevenue) },
    { label: "إجمالي المصروفات", value: fmt(opts.totalExpenses) },
    { label: "صافي الربح", value: fmt(Math.max(opts.netProfit, 0)) },
    { label: "المتبقي للتحصيل", value: fmt(opts.totalRemaining) },
    { label: "إجمالي المشتركين", value: String(opts.students.length) },
    { label: "نسبة التحصيل", value: opts.totalRevenue + opts.totalRemaining > 0 ? `${Math.round((opts.totalRevenue / (opts.totalRevenue + opts.totalRemaining)) * 100)}%` : "—" },
  ];

  const tableHeaders = ["م", "اسم الطالب", "الرقم", "الجهة", "سعر الاشتراك", "المدفوع", "المتبقي", "الحالة"];
  const tableRows = opts.students.map((st, i) => {
    const paid = opts.paidByStudent[st.internalId] || 0;
    const price = st.subscriptionPrice || 0;
    const remaining = Math.max(price - paid, 0);
    const status = remaining === 0 ? "مسدد" : paid === 0 ? "لم يدفع" : "جزئي";
    return [String(i + 1), st.studentName, st.studentId || "—", (st.institution || "—").substring(0, 10), fmt(price), fmt(paid), fmt(remaining), status];
  });

  const totalsRow = ["", `إجمالي: ${opts.students.length} مشترك`, "", "", "", fmt(opts.totalRevenue), fmt(opts.totalRemaining), ""];

  const summaryRows = [
    { label: "إجمالي الإيرادات المحصلة", value: fmt(opts.totalRevenue), bold: true, color: "#059669" },
    { label: "إجمالي المصروفات (رواتب)", value: fmt(opts.totalExpenses), bold: true, color: "#DC2626" },
    { label: "صافي الربح", value: fmt(Math.max(opts.netProfit, 0)), bold: true, color: "#3B82F6" },
    { label: "المبالغ المتبقية للتحصيل", value: fmt(opts.totalRemaining), bold: true, color: "#D97706" },
  ];

  const html = buildDocHtml({
    title: "التقرير المالي الشامل",
    subtitle: "تحليل كامل للمركز المالي وتوزيع الإيرادات والمصروفات",
    docNumber: `FIN-${Date.now().toString().slice(-6)}`,
    infoCards,
    tableHeaders,
    tableRows,
    totalsRow,
    summaryRows,
    showSignatures: true,
    footerNote: "هذا التقرير وثيقة رسمية صادرة عن مكتبة عين انجاز للخدمات الطلابية",
  });

  openPrintWindow(html);
}

/* ──────────────────────────────────────────────────────────────
   7. SALARIES REPORT (تقرير رواتب المدرسين)
   ────────────────────────────────────────────────────────────── */
const MONTHS_AR_LIST = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export function printSalariesReport(
  teachers: { id: string | number; teacherName: string; subject?: string | null }[],
  allSalaries: { teacherId?: string | null; month?: number | null; year?: number | null; amount?: number | null; paidDate?: string | null; notes?: string | null }[]
) {
  const fmt = (n: number | null | undefined) =>
    (n ?? 0).toLocaleString("ar-SA", { style: "currency", currency: "SAR", minimumFractionDigits: 0 });

  const totalPaid = allSalaries.reduce((s, r) => s + (r.amount || 0), 0);

  const infoCards = [
    { label: "عدد المدرسين", value: String(teachers.length) },
    { label: "إجمالي الدفعات", value: String(allSalaries.length) },
    { label: "إجمالي المدفوع", value: fmt(totalPaid) },
    { label: "حالة التقرير", value: "نهائي" },
  ];

  const tableHeaders = ["م", "اسم المدرس", "التخصص", "الشهر / السنة", "المبلغ (ر.س)", "تاريخ الصرف", "ملاحظات"];
  const tableRows: string[][] = [];
  let rowIdx = 0;

  teachers.forEach(teacher => {
    const tSalaries = allSalaries.filter(s => String(s.teacherId) === String(teacher.id));
    if (tSalaries.length === 0) {
      rowIdx++;
      tableRows.push([String(rowIdx), teacher.teacherName, teacher.subject || "—", "—", "—", "—", "لا توجد دفعات"]);
    } else {
      tSalaries.forEach(sal => {
        rowIdx++;
        const monthLabel = sal.month ? MONTHS_AR_LIST[(sal.month - 1) % 12] : "—";
        tableRows.push([String(rowIdx), teacher.teacherName, teacher.subject || "—", sal.year ? `${monthLabel} ${sal.year}` : monthLabel, fmt(sal.amount), sal.paidDate || "—", sal.notes || "—"]);
      });
    }
  });

  const totalsRow = ["", `إجمالي: ${teachers.length} مدرس`, "", `${allSalaries.length} دفعة`, fmt(totalPaid), "", ""];

  const summaryRows = [
    { label: "إجمالي الرواتب المصروفة", value: fmt(totalPaid), bold: true, color: "#DC2626" },
    { label: "عدد المدرسين النشطين", value: String(teachers.length) },
    { label: "إجمالي دفعات الرواتب", value: String(allSalaries.length) },
  ];

  const html = buildDocHtml({
    title: "تقرير رواتب المدرسين",
    subtitle: "كشف شامل بجميع مدفوعات رواتب الكادر التدريسي",
    docNumber: `SAL-${Date.now().toString().slice(-6)}`,
    infoCards,
    tableHeaders,
    tableRows,
    totalsRow,
    summaryRows,
    showSignatures: true,
    footerNote: "هذا التقرير وثيقة رسمية صادرة عن مكتبة عين انجاز للخدمات الطلابية",
  });

  openPrintWindow(html);
}
