import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ArrowRight, Phone, Building2, GraduationCap, User, Calendar,
  Wallet, Edit2, KeyRound, Eye, EyeOff, Printer,
  CheckCircle, XCircle, MessageCircle, RefreshCw, Copy,
  FileText, Star, Banknote, Percent, FileCheck, StickyNote,
  Save, X, Send, ClipboardList, ExternalLink
} from "lucide-react";
import { useGlobalToast } from "@/App";
import { formatCurrency } from "@/lib/utils";
import { printStudentStatement, printStudentGradesDoc } from "@/lib/excel";
import type { Student, Payment, Grade } from "@shared/schema";
import { useState } from "react";

type Tab = "info" | "grades" | "finance" | "login" | "whatsapp" | "notes";

const TAB_LIST: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "info", label: "المعلومات الأساسية", icon: User },
  { key: "grades", label: "الدرجات", icon: GraduationCap },
  { key: "finance", label: "الحساب المالي", icon: Banknote },
  { key: "login", label: "بيانات الدخول", icon: KeyRound },
  { key: "whatsapp", label: "سجل الواتساب", icon: MessageCircle },
  { key: "notes", label: "الملاحظات", icon: StickyNote },
];

const GRADE_GROUPS = [
  { label: "ويندوز", icon: "🪟", color: "#0078D4", fields: [
    { key: "windowsModel1", label: "نموذج 1" },
    { key: "windowsModel2", label: "نموذج 2" },
  ]},
  { label: "وورد", icon: "📝", color: "#2B579A", fields: [
    { key: "wordModel1", label: "نموذج 1" },
    { key: "wordModel2", label: "نموذج 2" },
    { key: "wordModel3", label: "نموذج 3" },
    { key: "wordModel4", label: "نموذج 4" },
  ]},
  { label: "إكسل", icon: "📊", color: "#217346", fields: [
    { key: "excelModel1", label: "نموذج 1" },
    { key: "excelModel2", label: "نموذج 2" },
    { key: "excelModel3", label: "نموذج 3" },
    { key: "excelModel4", label: "نموذج 4" },
    { key: "excelModel5", label: "نموذج 5" },
  ]},
  { label: "باوربوينت", icon: "📊", color: "#B7472A", fields: [
    { key: "pptModel1", label: "نموذج 1" },
    { key: "pptModel2", label: "نموذج 2" },
    { key: "pptModel3", label: "نموذج 3" },
    { key: "pptModel4", label: "نموذج 4" },
  ]},
  { label: "الاختبارات التطبيقية", icon: "💻", color: "#6D28D9", fields: [
    { key: "practiceQuizWindows", label: "ويندوز" },
    { key: "practiceQuizWord", label: "وورد" },
    { key: "practiceQuizExcel", label: "إكسل" },
    { key: "practiceQuizPowerpoint", label: "باوربوينت" },
    { key: "practiceMidterm", label: "منتصف" },
    { key: "practiceFinal", label: "نهائي" },
  ]},
  { label: "الاختبارات النظرية", icon: "📋", color: "#DC2626", fields: [
    { key: "quizWindows", label: "ويندوز" },
    { key: "quizWord", label: "وورد" },
    { key: "quizExcel", label: "إكسل" },
    { key: "quizPowerpoint", label: "باوربوينت" },
  ]},
  { label: "الاختبارات الرئيسية", icon: "🎯", color: "#F43F5E", fields: [
    { key: "midterm", label: "النصفي" },
    { key: "final", label: "النهائي" },
  ]},
  { label: "الواجبات", icon: "📚", color: "#06B6D4", fields: [
    { key: "assignment1", label: "واجب 1" },
    { key: "assignment2", label: "واجب 2" },
  ]},
];

const WA_TEMPLATES = [
  {
    label: "رسالة الترحيب",
    icon: "👋",
    color: "#25D366",
    getText: (name: string) =>
      `السلام عليكم ${name}،\nأهلاً بك في مكتبة عين انجاز للخدمات الطلابية.\nنسعد بخدمتك ونتمنى لك رحلة تعليمية موفقة! 🎓`,
  },
  {
    label: "تذكير بالدفعة",
    icon: "💳",
    color: "#F59E0B",
    getText: (name: string) =>
      `السلام عليكم ${name}،\nنود تذكيركم بأن موعد دفعة الاشتراك قد اقترب.\nيرجى التواصل معنا لإتمام عملية السداد في أقرب وقت.\nشكراً لتعاونكم 🙏`,
  },
  {
    label: "طلب متابعة",
    icon: "📋",
    color: "#3B82F6",
    getText: (name: string) =>
      `السلام عليكم ${name}،\nنتواصل معكم من مكتبة عين انجاز للمتابعة معكم بخصوص اشتراككم.\nهل تحتاجون أي مساعدة أو معلومات إضافية؟\nنحن هنا لخدمتكم 💪`,
  },
  {
    label: "تهنئة بالنجاح",
    icon: "🎉",
    color: "#8B5CF6",
    getText: (name: string) =>
      `ألف مبروك ${name}! 🎉\nيسعدنا في مكتبة عين انجاز أن نشاركك فرحة نجاحك وتفوقك.\nنتمنى لك مستقبلاً زاهراً مليئاً بالنجاحات والتوفيق ⭐`,
  },
  {
    label: "تنبيه غياب",
    icon: "⚠️",
    color: "#EF4444",
    getText: (name: string) =>
      `السلام عليكم ${name}،\nلاحظنا غيابك عن الحصص مؤخراً.\nنأمل أن تكون بخير، ونشجعك على المواظبة على الحضور لضمان استفادتك الكاملة.\nبالتوفيق 🌟`,
  },
];

function WhatsAppTab({ student, openWhatsApp }: { student: Student; openWhatsApp: (msg?: string) => void }) {
  const [customMsg, setCustomMsg] = useState("");
  const [sentLog, setSentLog] = useState<{ msg: string; time: string; template: string }[]>([]);

  const handleSend = (text: string, label: string) => {
    openWhatsApp(text);
    const time = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    setSentLog(prev => [{ msg: text, time, template: label }, ...prev]);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}>
              <MessageCircle className="h-3 w-3 text-white" />
            </div>
            مراسلة عبر الواتساب
          </h3>
          {student.studentPhone ? (
            <button onClick={() => openWhatsApp()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
              data-testid="button-open-whatsapp">
              <ExternalLink className="h-3 w-3" /> فتح الواتساب مباشرة
            </button>
          ) : (
            <span className="text-xs text-rose-500 font-bold">لا يوجد رقم هاتف مسجل</span>
          )}
        </div>
        {student.studentPhone && (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "hsl(var(--muted)/0.5)" }}>
            <Phone className="h-4 w-4 text-emerald-500" />
            <span className="font-mono font-bold text-foreground" dir="ltr">{student.studentPhone}</span>
            <span className="text-xs text-muted-foreground">— انقر على أي قالب لفتح الواتساب مع الرسالة مكتوبة تلقائياً</span>
          </div>
        )}
      </div>

      {/* Templates */}
      <div className="glass-card rounded-2xl p-5">
        <h4 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          قوالب الرسائل الجاهزة
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WA_TEMPLATES.map(t => (
            <button key={t.label}
              onClick={() => student.studentPhone && handleSend(t.getText(student.studentName), t.label)}
              disabled={!student.studentPhone}
              className="text-right p-4 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ border: `1px solid ${t.color}22`, background: `${t.color}08` }}
              data-testid={`button-wa-template-${t.label}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{t.icon}</span>
                <span className="font-bold text-sm" style={{ color: t.color }}>{t.label}</span>
                <Send className="h-3 w-3 mr-auto" style={{ color: t.color }} />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {t.getText(student.studentName).split("\n")[0]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Message */}
      <div className="glass-card rounded-2xl p-5">
        <h4 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          رسالة مخصصة
        </h4>
        <textarea
          value={customMsg}
          onChange={e => setCustomMsg(e.target.value)}
          placeholder={`اكتب رسالتك هنا إلى ${student.studentName}...`}
          rows={4}
          className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2"
          style={{
            background: "hsl(var(--muted)/0.5)",
            border: "1px solid hsl(var(--border))",
            color: "hsl(var(--foreground))",
            fontFamily: "inherit",
          }}
          data-testid="input-custom-whatsapp-message"
        />
        <div className="flex justify-between items-center mt-3">
          <span className="text-xs text-muted-foreground">{customMsg.length} حرف</span>
          <button
            onClick={() => { if (customMsg.trim()) handleSend(customMsg, "رسالة مخصصة"); }}
            disabled={!customMsg.trim() || !student.studentPhone}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
            data-testid="button-send-custom-whatsapp">
            <Send className="h-3.5 w-3.5" /> إرسال عبر الواتساب
          </button>
        </div>
      </div>

      {/* Sent Log */}
      {sentLog.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h4 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-emerald-500" />
            سجل الرسائل المرسلة (هذه الجلسة)
          </h4>
          <div className="space-y-2">
            {sentLog.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "hsl(var(--muted)/0.5)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-xs"
                  style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}>
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-emerald-600">{item.template}</span>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.msg.split("\n")[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EditStudentModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const { toast } = useGlobalToast();
  const [form, setForm] = useState({
    studentName: student.studentName || "",
    studentPhone: student.studentPhone || "",
    institution: student.institution || "",
    level: student.level || "تحضيري",
    teacherName: student.teacherName || "",
    subscriptionType: student.subscriptionType || "",
    subscriptionPrice: String(student.subscriptionPrice || ""),
    discountType: student.discountType || "None",
    discountValue: String(student.discountValue || ""),
    referredBy: student.referredBy || "",
    paymentDueDate: student.paymentDueDate || "",
    notes: student.notes || "",
    username: student.username || "",
    password: student.password || "",
    isActive: student.isActive ?? true,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("PATCH", `/api/students/${student.id}`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", student.internalId] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "تم تحديث بيانات المشترك" });
      onClose();
    },
    onError: () => toast({ title: "خطأ في التحديث", variant: "destructive" }),
  });

  const ic = "w-full px-3 py-2 rounded-xl text-sm border outline-none bg-background text-foreground";
  const is = { borderColor: "hsl(var(--border))" };
  const lc = "block text-xs font-bold mb-1 text-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)", borderBottom: "1px solid hsl(var(--border))" }}>
          <Edit2 className="h-4 w-4 text-white" />
          <h3 className="font-bold text-white flex-1">تعديل بيانات المشترك: {student.studentName}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          <form onSubmit={e => {
            e.preventDefault();
            updateMutation.mutate({
              ...form,
              subscriptionPrice: parseFloat(form.subscriptionPrice) || 0,
              discountValue: parseFloat(form.discountValue) || 0,
            });
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lc}>اسم الطالب *</label>
                <input className={ic} style={is} value={form.studentName} onChange={e => setForm(p => ({ ...p, studentName: e.target.value }))} required /></div>
              <div><label className={lc}>رقم الهاتف</label>
                <input className={ic} style={is} dir="ltr" value={form.studentPhone} onChange={e => setForm(p => ({ ...p, studentPhone: e.target.value }))} /></div>
              <div><label className={lc}>الجهة التعليمية</label>
                <input className={ic} style={is} value={form.institution} onChange={e => setForm(p => ({ ...p, institution: e.target.value }))} /></div>
              <div><label className={lc}>المستوى</label>
                <select className={ic} style={is} value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}>
                  {["تحضيري","ابتدائي","متوسط","ثانوي","جامعي","خريج"].map(l => <option key={l} value={l}>{l}</option>)}
                </select></div>
              <div><label className={lc}>اسم المدرس</label>
                <input className={ic} style={is} value={form.teacherName} onChange={e => setForm(p => ({ ...p, teacherName: e.target.value }))} /></div>
              <div><label className={lc}>نوع الاشتراك</label>
                <input className={ic} style={is} value={form.subscriptionType} onChange={e => setForm(p => ({ ...p, subscriptionType: e.target.value }))} /></div>
              <div><label className={lc}>سعر الاشتراك</label>
                <input className={ic} style={is} type="number" min="0" value={form.subscriptionPrice} onChange={e => setForm(p => ({ ...p, subscriptionPrice: e.target.value }))} /></div>
              <div><label className={lc}>نوع الخصم</label>
                <select className={ic} style={is} value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}>
                  {["None","Fixed","Percentage","referral"].map(d => <option key={d} value={d}>{d}</option>)}
                </select></div>
              <div><label className={lc}>قيمة الخصم</label>
                <input className={ic} style={is} type="number" min="0" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} /></div>
              <div><label className={lc}>موعد الدفع</label>
                <input className={ic} style={is} value={form.paymentDueDate} onChange={e => setForm(p => ({ ...p, paymentDueDate: e.target.value }))} /></div>
              <div><label className={lc}>محال من</label>
                <input className={ic} style={is} value={form.referredBy} onChange={e => setForm(p => ({ ...p, referredBy: e.target.value }))} /></div>
            </div>
            <div className="p-3 rounded-xl space-y-3"
              style={{ background: "hsl(262 80% 58% / 0.06)", border: "1px solid hsl(262 80% 58% / 0.15)" }}>
              <p className="text-xs font-black text-primary flex items-center gap-2"><KeyRound className="h-3.5 w-3.5" /> بيانات الدخول للمنصة</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lc}>اسم المستخدم</label>
                  <input className={ic} style={is} dir="ltr" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} /></div>
                <div><label className={lc}>كلمة المرور</label>
                  <input className={ic} style={is} dir="ltr" type="text" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
              </div>
            </div>
            <div><label className={lc}>ملاحظات</label>
              <textarea className={`${ic} resize-none`} style={is} rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-primary" />
              <span className="text-sm font-medium text-foreground">مشترك نشط</span>
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={updateMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
                <Save className="h-4 w-4" /> {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
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

const ADD_PAYMENT_TYPES = [
  { key: "الأولى", label: "الدفعة الأولى", icon: "1️⃣", color: "#3B82F6" },
  { key: "الثانية", label: "الدفعة الثانية", icon: "2️⃣", color: "#8B5CF6" },
  { key: "الثالثة", label: "الدفعة الثالثة", icon: "3️⃣", color: "#F59E0B" },
  { key: "سداد كامل", label: "سداد كامل", icon: "✅", color: "#10B981" },
];

function AddPaymentModal({ student, existingPayments, onClose }: {
  student: Student;
  existingPayments: Payment[];
  onClose: () => void;
}) {
  const { toast } = useGlobalToast();

  const existingCount = existingPayments.length;
  const totalPaid = existingPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const subscriptionPrice = student.subscriptionPrice || 0;
  const discountValue = student.discountValue || 0;
  const finalPrice = subscriptionPrice - discountValue;
  const remaining = Math.max(finalPrice - totalPaid, 0);
  const isFullyPaid = remaining <= 0 && totalPaid > 0;

  const suggestedType = existingCount === 0 ? "الأولى"
    : existingCount === 1 ? "الثانية"
    : existingCount === 2 ? "الثالثة"
    : "سداد كامل";

  const [form, setForm] = useState({
    amount: "",
    paymentMethod: "نقدي",
    receiverName: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
    paymentType: suggestedType,
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/payments", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments/student", student.internalId] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/stats/student-counts"] });
      toast({ title: "تم تسجيل الدفعة" });
      onClose();
    },
    onError: () => toast({ title: "خطأ في التسجيل", variant: "destructive" }),
  });
  const ic = "w-full px-3 py-2 rounded-xl text-sm border outline-none bg-background text-foreground";
  const is = { borderColor: "hsl(var(--border))" };
  const fmt = (n: number) => n.toLocaleString("ar-SA");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: "linear-gradient(135deg, #10B981, #059669)", borderBottom: "1px solid hsl(var(--border))" }}>
          <Wallet className="h-4 w-4 text-white" />
          <h3 className="font-bold text-white flex-1">إضافة دفعة جديدة</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <form className="p-5 space-y-3" onSubmit={e => {
          e.preventDefault();
          if (!form.amount) return;
          createPaymentMutation.mutate({
            internalId: student.internalId, studentId: student.studentId, studentName: student.studentName,
            amount: parseFloat(form.amount), paymentMethod: form.paymentMethod,
            receiverName: form.receiverName, paymentDate: form.paymentDate, notes: form.notes,
            paymentType: form.paymentType,
            paymentId: `PAY-${Date.now()}`, isDeleted: false,
          });
        }}>

          {/* Existing payment summary */}
          {existingCount > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isFullyPaid ? "#10B98140" : "#F59E0B40"}` }}>
              <div className="flex items-center gap-2 px-3 py-2"
                style={{ background: isFullyPaid ? "#10B98115" : "#F59E0B15" }}>
                <span className="text-sm">{isFullyPaid ? "✅" : "⚠️"}</span>
                <p className="text-xs font-bold" style={{ color: isFullyPaid ? "#059669" : "#D97706" }}>
                  {isFullyPaid
                    ? "هذا المشترك مسدد بالكامل"
                    : `تنبيه: يوجد ${existingCount} دفعة مسجلة مسبقاً لهذا المشترك`}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-0 text-center divide-x divide-x-reverse"
                style={{ borderTop: "1px solid hsl(var(--border))", background: "hsl(var(--muted)/0.3)" }}>
                <div className="px-3 py-2">
                  <p className="text-xs text-muted-foreground">دفعات مسجلة</p>
                  <p className="text-sm font-black text-foreground">{existingCount}</p>
                </div>
                <div className="px-3 py-2" style={{ borderRight: "1px solid hsl(var(--border))" }}>
                  <p className="text-xs text-muted-foreground">المدفوع</p>
                  <p className="text-sm font-black" style={{ color: "#10B981" }}>{fmt(totalPaid)}</p>
                </div>
                <div className="px-3 py-2" style={{ borderRight: "1px solid hsl(var(--border))" }}>
                  <p className="text-xs text-muted-foreground">المتبقي</p>
                  <p className="text-sm font-black" style={{ color: remaining > 0 ? "#EF4444" : "#10B981" }}>{fmt(remaining)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Type */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">نوع الدفعة *</label>
            <div className="grid grid-cols-2 gap-2">
              {ADD_PAYMENT_TYPES.map(pt => (
                <button key={pt.key} type="button"
                  onClick={() => setForm(p => ({ ...p, paymentType: pt.key }))}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all"
                  style={{
                    borderColor: form.paymentType === pt.key ? pt.color : "hsl(var(--border))",
                    background: form.paymentType === pt.key ? `${pt.color}18` : "transparent",
                    color: form.paymentType === pt.key ? pt.color : "hsl(var(--muted-foreground))",
                  }}
                  data-testid={`profile-payment-type-${pt.key}`}>
                  <span>{pt.icon}</span> {pt.label}
                  {form.paymentType === pt.key && <span className="mr-auto text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold mb-1 text-foreground">المبلغ *</label>
              <input className={ic} style={is} type="number" min="0" step="0.01" value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required placeholder="0.00"
                data-testid="input-payment-amount" /></div>
            <div><label className="block text-xs font-bold mb-1 text-foreground">طريقة الدفع</label>
              <select className={ic} style={is} value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                {["نقدي","تحويل","شيك","بطاقة"].map(m => <option key={m} value={m}>{m}</option>)}
              </select></div>
            <div><label className="block text-xs font-bold mb-1 text-foreground">المستلم</label>
              <input className={ic} style={is} value={form.receiverName} onChange={e => setForm(p => ({ ...p, receiverName: e.target.value }))} /></div>
            <div><label className="block text-xs font-bold mb-1 text-foreground">التاريخ</label>
              <input className={ic} style={is} type="date" value={form.paymentDate} onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} /></div>
          </div>
          <div><label className="block text-xs font-bold mb-1 text-foreground">ملاحظات</label>
            <textarea className={`${ic} resize-none`} style={is} rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <div className="flex gap-2">
            <button type="submit" disabled={createPaymentMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
              {createPaymentMutation.isPending ? "جاري التسجيل..." : "تسجيل الدفعة"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentProfile() {
  const { internalId } = useParams<{ internalId: string }>();
  const { toast } = useGlobalToast();
  const [showPass, setShowPass] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [showEdit, setShowEdit] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);

  const { data: student, isLoading } = useQuery<Student>({
    queryKey: ["/api/students", internalId],
    queryFn: () => fetch(`/api/students/${internalId}`).then(r => r.json()),
    enabled: !!internalId,
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/payments/student", internalId],
    queryFn: () => fetch(`/api/payments/student/${internalId}`).then(r => r.json()),
    enabled: !!internalId,
  });

  const { data: grade } = useQuery<Grade | null>({
    queryKey: ["/api/grades", internalId],
    queryFn: () => fetch(`/api/grades/${internalId}`).then(r => r.json()),
    enabled: !!internalId,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (data: { isActive: boolean }) =>
      apiRequest("PATCH", `/api/students/${student?.id}`, data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", internalId] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "تم تحديث حالة المشترك" });
    },
  });

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const discountValue = student?.discountValue || 0;
  const finalPrice = (student?.subscriptionPrice || 0) - discountValue;
  const remaining = Math.max(finalPrice - totalPaid, 0);

  const openWhatsApp = (msg?: string) => {
    if (!student?.studentPhone) return;
    let phone = student.studentPhone.replace(/\D/g, "");
    if (phone.startsWith("05") || phone.startsWith("5")) {
      phone = "966" + phone.replace(/^0/, "");
    }
    const url = msg
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/${phone}`;
    window.open(url, "_blank");
  };

  const printStatement = () => {
    if (!student) return;
    printStudentStatement({
      studentName: student.studentName,
      studentId: student.studentId || "",
      studentPhone: student.studentPhone,
      institution: student.institution,
      teacherName: student.teacherName,
      subscriptionType: student.subscriptionType,
      subscriptionPrice: student.subscriptionPrice,
      discountType: student.discountType,
      discountValue: student.discountValue,
      registrationDate: student.registrationDate,
      payments: payments.map(p => ({
        paymentId: p.paymentId,
        paymentDate: p.paymentDate,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        receiverName: p.receiverName,
        notes: p.notes,
      })),
    });
  };

  const copyCredentials = () => {
    if (!student) return;
    const text = `اسم المستخدم: ${student.username || "—"}\nكلمة المرور: ${student.password || "—"}`;
    navigator.clipboard.writeText(text).then(() => toast({ title: "تم النسخ" }));
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto" dir="rtl">
        <div className="h-48 rounded-2xl skeleton-wave mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl skeleton-wave" />)}
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6 flex items-center justify-center h-full" dir="rtl">
        <div className="text-center">
          <p className="text-4xl font-black text-gradient mb-2">404</p>
          <p className="text-muted-foreground">المشترك غير موجود</p>
          <Link href="/students">
            <button className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
              العودة للقائمة
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto" dir="rtl">
      {/* ─── Action Bar ─── */}
      <div className="glass-card rounded-2xl p-3 mb-4">
        {/* Info Row */}
        <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1 font-mono font-bold text-foreground">
            <FileCheck className="h-3.5 w-3.5 text-primary" /> {student.studentId}
          </span>
          {student.institution && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-primary" /> {student.institution}
            </span>
          )}
          {student.studentPhone && (
            <span className="flex items-center gap-1" dir="ltr">
              <Phone className="h-3.5 w-3.5 text-primary" /> {student.studentPhone}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold mr-auto ${student.isActive ? "badge-success" : "badge-danger"}`}>
            {student.isActive ? "نشط" : "موقوف"}
          </span>
        </div>
        {/* Buttons Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #3B82F6, #4F46E5)" }}
            data-testid="button-edit-student-profile">
            <Edit2 className="h-3.5 w-3.5" /> تعديل البيانات
          </button>
          {student.studentPhone && (
            <button onClick={() => openWhatsApp()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
              data-testid="button-whatsapp-student">
              <MessageCircle className="h-3.5 w-3.5" /> واتساب
            </button>
          )}
          <button onClick={printStatement}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
            data-testid="button-print-statement">
            <ClipboardList className="h-3.5 w-3.5" /> كشف الحساب
          </button>
          <button onClick={() => student && printStudentGradesDoc(student, grade as Record<string, number> | null)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:-translate-y-0.5"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            data-testid="button-print-student-grades">
            <GraduationCap className="h-3.5 w-3.5" /> طباعة الدرجات
          </button>
          <button onClick={printStatement}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:-translate-y-0.5"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            data-testid="button-print-full-page">
            <Printer className="h-3.5 w-3.5" /> طباعة الصفحة
          </button>
          <button onClick={() => toggleActiveMutation.mutate({ isActive: !student.isActive })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:-translate-y-0.5"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>
            {student.isActive ? <XCircle className="h-3.5 w-3.5 text-rose-500" /> : <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
            {student.isActive ? "إيقاف" : "تفعيل"}
          </button>
          <button onClick={() => { queryClient.invalidateQueries({ queryKey: ["/api/students", internalId] }); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:-translate-y-0.5"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>
            <RefreshCw className="h-3.5 w-3.5" /> تحديث
          </button>
          <Link href="/students">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:-translate-y-0.5 mr-auto"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>
              <ArrowRight className="h-3.5 w-3.5" /> العودة
            </button>
          </Link>
        </div>
      </div>

      {/* ─── Student Name Header ─── */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl shrink-0"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
          {student.studentName.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-foreground">{student.studentName}</h1>
          {student.teacherName && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" /> المدرس: {student.teacherName}
            </p>
          )}
        </div>
      </div>

      {/* ─── Stats Bar ─── */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "إجمالي المدفوع", value: formatCurrency(totalPaid), color: "#10B981", icon: Wallet, bg: "hsl(142 71% 40% / 0.08)" },
          { label: "المبلغ المتبقي", value: formatCurrency(remaining), color: remaining > 0 ? "#F43F5E" : "#10B981", icon: Banknote, bg: "hsl(var(--muted) / 0.5)" },
          { label: "إجمالي الخصم", value: formatCurrency(discountValue), color: "#F59E0B", icon: Percent, bg: "hsl(38 92% 48% / 0.08)" },
        ].map(({ label, value, color, icon: Icon, bg }) => (
          <div key={label} className="glass-card rounded-2xl p-4 text-center" style={{ background: bg }}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Icon className="h-4 w-4" style={{ color }} />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className="text-xl font-black" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
        {TAB_LIST.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
            style={activeTab === key
              ? { background: "linear-gradient(135deg, #8B5CF6, #7C3AED)", color: "white" }
              : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
            }
            data-testid={`tab-${key}`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ─── Tab: المعلومات الأساسية ─── */}
      {activeTab === "info" && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
              <User className="h-3 w-3 text-white" />
            </div>
            البيانات الشخصية والأكاديمية
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "اسم الطالب", value: student.studentName, icon: User },
              { label: "رقم الهاتف", value: student.studentPhone, icon: Phone, dir: "ltr" },
              { label: "نوع الاشتراك", value: student.subscriptionType, icon: FileText },
              { label: "نوع الخصم", value: student.discountType !== "None" ? student.discountType : null, icon: Percent },
              { label: "المستوى", value: student.level, icon: GraduationCap },
              { label: "قيمة الخصم", value: student.discountValue ? formatCurrency(student.discountValue) : null, icon: Percent },
              { label: "أحاله المشترك", value: student.referredBy, icon: User },
              { label: "السعر المتفق عليه", value: student.subscriptionPrice ? formatCurrency(student.subscriptionPrice) : null, icon: Wallet },
              { label: "تاريخ التسجيل", value: student.registrationDate, icon: Calendar },
              { label: "موعد الدفع", value: student.paymentDueDate, icon: Calendar },
              { label: "عدد الإحالات", value: student.referralCount != null ? String(student.referralCount) : null, icon: User },
              { label: "آخر تحديث", value: student.lastUpdated, icon: Calendar },
            ].map(({ label, value, icon: Icon, dir }) => value ? (
              <div key={label} className="p-3 rounded-xl" style={{ background: "hsl(var(--muted) / 0.5)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3 w-3 text-primary" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <p className="text-sm font-bold text-foreground" dir={dir as any}>{value}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* ─── Tab: الدرجات ─── */}
      {activeTab === "grades" && (
        <div className="space-y-4">
          {!grade ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Star className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-bold text-foreground">لا توجد درجات مسجلة</p>
              <Link href="/grades">
                <button className="mt-3 px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                  إدخال الدرجات
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {GRADE_GROUPS.map(group => (
                <div key={group.label} className="glass-card rounded-2xl p-4">
                  <h4 className="font-bold text-foreground mb-3 flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-black"
                      style={{ background: group.color }}>
                      {group.icon}
                    </div>
                    {group.label}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {group.fields.map(f => {
                      const val = (grade as any)[f.key] ?? 0;
                      return (
                        <div key={f.key} className="flex items-center justify-between px-2 py-1.5 rounded-lg"
                          style={{ background: "hsl(var(--muted) / 0.5)" }}>
                          <span className="text-xs text-muted-foreground">{f.label}:</span>
                          <span className="text-sm font-black" style={{ color: val >= 70 ? "#10B981" : val >= 50 ? "#F59E0B" : "#F43F5E" }}>
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: الحساب المالي ─── */}
      {activeTab === "finance" && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
              <Wallet className="h-3 w-3 text-white" />
            </div>
            ملخص الحساب المالي
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: "السعر المتفق عليه", value: formatCurrency(student.subscriptionPrice || 0), color: "#6B7280" },
              { label: `الخصم المطبق (${student.discountType || "None"})`, value: discountValue ? `- ${formatCurrency(discountValue)}` : "—", color: "#F43F5E" },
              { label: "السعر النهائي", value: formatCurrency(finalPrice), color: "#3B82F6" },
              { label: "إجمالي المدفوع", value: formatCurrency(totalPaid), color: "#10B981" },
              { label: "المبلغ المتبقي", value: formatCurrency(remaining), color: remaining > 0 ? "#F43F5E" : "#10B981" },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 rounded-xl" style={{ background: "hsl(var(--muted) / 0.5)" }}>
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="text-lg font-black" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <button onClick={() => setShowAddPayment(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
              data-testid="button-add-payment-from-profile">
              <Wallet className="h-4 w-4" /> إضافة دفعة جديدة
            </button>
          </div>
          {/* Payment history */}
          {payments.length > 0 && (
            <div className="overflow-hidden rounded-xl" style={{ border: "1px solid hsl(var(--border))" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "1px solid hsl(var(--border))" }}>
                    {["رقم الدفعة", "نوع الدفعة", "المبلغ", "الطريقة", "المستلم", "التاريخ"].map(h => (
                      <th key={h} className="px-3 py-2.5 text-right text-xs font-black text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="border-b border-border/40">
                      <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{p.paymentId}</td>
                      <td className="px-3 py-2 text-xs">
                        {p.paymentType ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{
                              background: p.paymentType === "سداد كامل" ? "#10B98120"
                                : p.paymentType === "الأولى" ? "#3B82F620"
                                : p.paymentType === "الثانية" ? "#8B5CF620"
                                : "#F59E0B20",
                              color: p.paymentType === "سداد كامل" ? "#059669"
                                : p.paymentType === "الأولى" ? "#2563EB"
                                : p.paymentType === "الثانية" ? "#7C3AED"
                                : "#D97706",
                            }}>
                            {p.paymentType}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2 font-black text-emerald-600">{formatCurrency(p.amount || 0)}</td>
                      <td className="px-3 py-2 text-xs">{p.paymentMethod || "—"}</td>
                      <td className="px-3 py-2 text-xs">{p.receiverName || "—"}</td>
                      <td className="px-3 py-2 text-xs">{p.paymentDate || "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: "hsl(var(--muted) / 0.5)", borderTop: "1px solid hsl(var(--border))" }}>
                    <td colSpan={2} className="px-3 py-2 text-xs font-black text-foreground">الإجمالي</td>
                    <td className="px-3 py-2 text-sm font-black text-emerald-600">{formatCurrency(totalPaid)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: بيانات الدخول ─── */}
      {activeTab === "login" && (
        <div className="space-y-3">
          {/* Notice banner */}
          <div className="rounded-2xl px-4 py-3 flex items-start gap-3" style={{ background: "linear-gradient(135deg, #7C3AED18, #5B21B618)", border: "1px solid #8B5CF640" }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
              <KeyRound className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground">بيانات دخول النظام</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                هذه البيانات هي <span className="text-primary font-bold">نفس بيانات تسجيل الدخول</span> التي يستخدمها الطالب للدخول لبوابته الشخصية في النظام. يمكن للطالب رؤية درجاته وكشف حسابه المالي وبياناته بعد تسجيل الدخول.
              </p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
                  <KeyRound className="h-3 w-3 text-white" />
                </div>
                بيانات الدخول للمنصة
              </h3>
              <button onClick={copyCredentials}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>
                <Copy className="h-3.5 w-3.5" /> نسخ البيانات
              </button>
            </div>
            {(student.username || student.password) ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl text-center" style={{ background: "hsl(var(--muted) / 0.5)" }}>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                      <User className="h-3 w-3" /> اسم المستخدم
                    </p>
                    <p className="font-mono font-black text-foreground text-lg" dir="ltr">{student.username || "—"}</p>
                  </div>
                  <div className="p-4 rounded-xl text-center" style={{ background: "hsl(var(--muted) / 0.5)" }}>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                      <KeyRound className="h-3 w-3" /> كلمة المرور
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="font-mono font-black text-foreground text-lg" dir="ltr">
                        {showPass ? (student.password || "—") : (student.password ? "••••••••" : "—")}
                      </p>
                      {student.password && (
                        <button onClick={() => setShowPass(!showPass)} className="text-muted-foreground hover:text-foreground">
                          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {/* System login note */}
                <div className="mt-4 rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: "hsl(var(--muted)/0.5)", border: "1px dashed hsl(var(--border))" }}>
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 animate-pulse" />
                  <p className="text-xs text-muted-foreground">
                    يمكن للطالب تسجيل الدخول بـ <span className="font-mono font-bold text-foreground" dir="ltr">{student.username}</span> وكلمة مروره للوصول لبوابته الشخصية
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <KeyRound className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="font-bold text-foreground">لا توجد بيانات دخول</p>
                <p className="text-sm text-muted-foreground mt-1">لم يتم إضافة بيانات تسجيل الدخول لهذا المشترك</p>
                <button onClick={() => setShowEdit(true)}
                  className="mt-3 px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
                  إضافة بيانات الدخول
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab: سجل الواتساب ─── */}
      {activeTab === "whatsapp" && (
        <WhatsAppTab student={student} openWhatsApp={openWhatsApp} />
      )}

      {/* ─── Tab: الملاحظات ─── */}
      {activeTab === "notes" && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)" }}>
              <StickyNote className="h-3 w-3 text-white" />
            </div>
            الملاحظات
          </h3>
          {student.notes ? (
            <div className="p-4 rounded-xl whitespace-pre-wrap text-sm text-foreground"
              style={{ background: "hsl(var(--muted) / 0.5)", minHeight: "120px" }}>
              {student.notes}
            </div>
          ) : (
            <div className="text-center py-10">
              <StickyNote className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-bold text-foreground">لا توجد ملاحظات</p>
              <button onClick={() => setShowEdit(true)}
                className="mt-3 px-4 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)" }}>
                إضافة ملاحظة
              </button>
            </div>
          )}
        </div>
      )}

      {showEdit && student && <EditStudentModal student={student} onClose={() => setShowEdit(false)} />}
      {showAddPayment && student && <AddPaymentModal student={student} existingPayments={payments} onClose={() => setShowAddPayment(false)} />}
    </div>
  );
}
