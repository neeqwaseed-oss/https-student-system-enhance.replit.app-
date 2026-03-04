import { HelpCircle, BookOpen, Video, Mail, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const FAQ = [
  { q: "كيف أضيف مشتركاً جديداً?", a: "اذهب إلى إدارة المشتركين → إضافة مشترك جديد. أدخل البيانات المطلوبة واحفظ." },
  { q: "كيف أسجل دفعة لمشترك?", a: "اذهب إلى سداد مشتركات، ابحث عن المشترك، واضغط على 'تسجيل دفعة'." },
  { q: "كيف أطبع كشف الدرجات?", a: "اذهب إلى صفحة الدرجات واضغط على 'طباعة الكشف' في أعلى الصفحة." },
  { q: "كيف أنشئ نسخة احتياطية?", a: "اذهب إلى البيانات والنسخ الاحتياطي → اضغط 'إنشاء نسخة جديدة'. سيتم تنزيل الملف تلقائياً." },
  { q: "كيف أضيف مدرساً جديداً?", a: "اذهب إلى إدارة المدرسين → اضغط 'إضافة مدرس جديد' وأدخل البيانات." },
  { q: "كيف أصدر بيانات Excel?", a: "اذهب إلى البيانات والنسخ الاحتياطي → اختر البيانات التي تريد تصديرها → اضغط تصدير CSV." },
  { q: "كيف أرى التقرير المالي?", a: "اذهب إلى النظام المالي → التقرير المالي. ستجد ملخصاً شاملاً مع رسوم بيانية." },
  { q: "كيف أعدل درجات الطلاب?", a: "اذهب إلى الدرجات، ستجد جدولاً بجميع الطلاب. عدّل الدرجات مباشرةً واضغط 'حفظ التعديلات'." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-right hover:bg-primary/3 transition-colors">
        <p className="text-sm font-bold text-foreground">{q}</p>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-3" style={{ borderTop: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.3)" }}>
          <p className="text-sm text-muted-foreground pt-2">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-slate-500" /> المساعدة والدعم
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">دليل الاستخدام والأسئلة الشائعة</p>
      </div>

      {/* Quick Guide Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: BookOpen, label: "دليل المستخدم", desc: "تعلم كيفية استخدام جميع ميزات النظام", color: "#3B82F6" },
          { icon: Video, label: "الفيديوهات التعليمية", desc: "مقاطع فيديو تشرح طريقة العمل", color: "#8B5CF6" },
          { icon: Mail, label: "تواصل معنا", desc: "أرسل سؤالك عبر نظام الدعم الفني", color: "#EC4899" },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="glass-card rounded-2xl p-4 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: `${color}22` }}>
              <Icon className="h-6 w-6" style={{ color }} />
            </div>
            <p className="font-bold text-foreground text-sm">{label}</p>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="glass-card rounded-2xl p-5 mb-5">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary" /> الأسئلة الشائعة
        </h3>
        <div className="space-y-2">
          {FAQ.map((item, i) => <FAQItem key={i} {...item} />)}
        </div>
      </div>

      {/* Contact */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold text-foreground mb-4">تواصل معنا</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}>
            <Mail className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
              <p className="text-sm font-bold text-foreground">support@ain-injaz.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}>
            <Phone className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">رقم الهاتف</p>
              <p className="text-sm font-bold text-foreground" dir="ltr">+966 5x xxx xxxx</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          ساعات العمل: الأحد - الخميس، 8 صباحاً - 6 مساءً
        </p>
      </div>
    </div>
  );
}
