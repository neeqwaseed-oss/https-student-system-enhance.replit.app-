import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useGlobalToast } from "@/App";
import {
  Settings, Building2, Palette, Wrench, Save, RefreshCcw,
  Phone, Mail, MapPin, BookOpen, Calendar, DollarSign,
  Moon, Sun, Eye, EyeOff, Shield, Database, Users,
  GraduationCap, CreditCard, Info, CheckCircle, AlertTriangle,
  Loader2, Globe, FileText, Hash, Layers
} from "lucide-react";
import logoImg from "@assets/image_1772507398400.png";

const TABS = [
  { key: "general", label: "الإعدادات العامة", icon: Building2, color: "#8B5CF6" },
  { key: "appearance", label: "المظهر والعرض", icon: Palette, color: "#10B981" },
  { key: "maintenance", label: "صيانة النظام", icon: Wrench, color: "#F59E0B" },
];

const DEFAULTS: Record<string, string> = {
  libraryName: "مكتبة عين الإنجاز",
  libraryTagline: "للخدمات الطلابية",
  address: "",
  phone: "",
  email: "",
  academicYear: "2025-2026",
  currency: "ريال",
  directorName: "",
  watermarkOpacity: "6",
  watermarkEnabled: "true",
  primaryColor: "#8B5CF6",
  dateFormat: "ar-SA",
  maintenanceMode: "false",
  maintenanceMessage: "النظام في وضع الصيانة، يرجى المحاولة لاحقاً",
  systemVersion: "1.0.0",
  sessionTimeout: "60",
};

export default function SettingsPage() {
  const { toast } = useGlobalToast();
  const [activeTab, setActiveTab] = useState("general");
  const [form, setForm] = useState<Record<string, string>>(DEFAULTS);
  const [dirty, setDirty] = useState(false);

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings"],
    queryFn: () => fetch("/api/settings", { credentials: "include" }).then(r => r.json()),
  });

  const { data: stats } = useQuery<{
    totalStudents: number; activeStudents: number; totalPayments: number;
    totalRevenue: number; totalTeachers: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  useEffect(() => {
    if (settings) {
      setForm({ ...DEFAULTS, ...settings });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      apiRequest("POST", "/api/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setDirty(false);
      toast({ title: "✅ تم الحفظ", description: "تم حفظ الإعدادات بنجاح" });
    },
    onError: () => {
      toast({ title: "❌ خطأ", description: "فشل حفظ الإعدادات", variant: "destructive" });
    },
  });

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function handleSave() {
    saveMutation.mutate(form);
  }

  function handleReset() {
    setForm({ ...DEFAULTS, ...(settings ?? {}) });
    setDirty(false);
  }

  const opacity = Math.max(1, Math.min(30, Number(form.watermarkOpacity) || 6));

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
            <Settings className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">إعدادات النظام</h1>
            <p className="text-sm text-muted-foreground mt-0.5">إدارة وتخصيص الإعدادات العامة للنظام الكامل</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-reset-settings"
            >
              <RefreshCcw className="h-4 w-4" />
              إلغاء التغييرات
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || !dirty}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}
            data-testid="button-save-settings"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ الإعدادات
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-1.5 rounded-2xl w-fit" style={{ background: "hsl(var(--muted))" }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
            style={activeTab === tab.key
              ? { background: "white", color: tab.color, boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }
              : { color: "hsl(var(--muted-foreground))", background: "transparent" }
            }
            data-testid={`tab-settings-${tab.key}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* ─── General Settings Tab ─── */}
          {activeTab === "general" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Library Identity */}
              <div className="glass-card rounded-2xl p-6 col-span-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#8B5CF622" }}>
                    <Building2 className="h-4.5 w-4.5" style={{ color: "#8B5CF6" }} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground">هوية المكتبة</h2>
                    <p className="text-xs text-muted-foreground">المعلومات الأساسية التي تظهر في جميع أقسام النظام</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldGroup label="اسم المكتبة" icon={<BookOpen className="h-4 w-4" />}>
                    <input
                      type="text"
                      value={form.libraryName}
                      onChange={e => set("libraryName", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      placeholder="مكتبة عين الإنجاز"
                      data-testid="input-library-name"
                    />
                  </FieldGroup>
                  <FieldGroup label="الشعار / التوصيف" icon={<Layers className="h-4 w-4" />}>
                    <input
                      type="text"
                      value={form.libraryTagline}
                      onChange={e => set("libraryTagline", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      placeholder="للخدمات الطلابية"
                      data-testid="input-library-tagline"
                    />
                  </FieldGroup>
                  <FieldGroup label="اسم المدير" icon={<Shield className="h-4 w-4" />}>
                    <input
                      type="text"
                      value={form.directorName}
                      onChange={e => set("directorName", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      placeholder="اسم مدير المكتبة"
                      data-testid="input-director-name"
                    />
                  </FieldGroup>
                  <FieldGroup label="العام الدراسي" icon={<Calendar className="h-4 w-4" />}>
                    <input
                      type="text"
                      value={form.academicYear}
                      onChange={e => set("academicYear", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                      placeholder="2025-2026"
                      data-testid="input-academic-year"
                    />
                  </FieldGroup>
                </div>
              </div>

              {/* Contact Info */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#10B98122" }}>
                    <Phone className="h-4 w-4" style={{ color: "#10B981" }} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground">معلومات الاتصال</h2>
                    <p className="text-xs text-muted-foreground">تظهر في التقارير المطبوعة</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <FieldGroup label="رقم الهاتف" icon={<Phone className="h-4 w-4" />}>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={e => set("phone", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                      placeholder="+966 5x xxx xxxx"
                      dir="ltr"
                      data-testid="input-phone"
                    />
                  </FieldGroup>
                  <FieldGroup label="البريد الإلكتروني" icon={<Mail className="h-4 w-4" />}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => set("email", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                      placeholder="info@library.com"
                      dir="ltr"
                      data-testid="input-email"
                    />
                  </FieldGroup>
                  <FieldGroup label="العنوان" icon={<MapPin className="h-4 w-4" />}>
                    <input
                      type="text"
                      value={form.address}
                      onChange={e => set("address", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
                      placeholder="المدينة، الحي، الشارع"
                      data-testid="input-address"
                    />
                  </FieldGroup>
                </div>
              </div>

              {/* Financial & Regional */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#F59E0B22" }}>
                    <DollarSign className="h-4 w-4" style={{ color: "#F59E0B" }} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground">الإعدادات المالية والإقليمية</h2>
                    <p className="text-xs text-muted-foreground">العملة وتنسيقات العرض</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <FieldGroup label="العملة" icon={<DollarSign className="h-4 w-4" />}>
                    <select
                      value={form.currency}
                      onChange={e => set("currency", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
                      data-testid="select-currency"
                    >
                      <option value="ريال">ريال سعودي (SAR)</option>
                      <option value="درهم">درهم إماراتي (AED)</option>
                      <option value="دينار">دينار كويتي (KWD)</option>
                      <option value="دولار">دولار أمريكي (USD)</option>
                    </select>
                  </FieldGroup>
                  <FieldGroup label="تنسيق التاريخ" icon={<Calendar className="h-4 w-4" />}>
                    <select
                      value={form.dateFormat}
                      onChange={e => set("dateFormat", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
                      data-testid="select-date-format"
                    >
                      <option value="ar-SA">عربي — هجري (ar-SA)</option>
                      <option value="ar-EG">عربي — ميلادي (ar-EG)</option>
                      <option value="en-US">إنجليزي (en-US)</option>
                    </select>
                  </FieldGroup>
                  <FieldGroup label="مهلة انتهاء الجلسة (دقيقة)" icon={<Shield className="h-4 w-4" />}>
                    <input
                      type="number"
                      min={5}
                      max={480}
                      value={form.sessionTimeout}
                      onChange={e => set("sessionTimeout", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
                      data-testid="input-session-timeout"
                    />
                  </FieldGroup>
                </div>
              </div>
            </div>
          )}

          {/* ─── Appearance Tab ─── */}
          {activeTab === "appearance" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Watermark Settings */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#10B98122" }}>
                    <Eye className="h-4 w-4" style={{ color: "#10B981" }} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground">العلامة المائية</h2>
                    <p className="text-xs text-muted-foreground">تُعرض في وسط جميع صفحات النظام</p>
                  </div>
                </div>
                <div className="space-y-5">
                  {/* Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-semibold text-foreground">تفعيل العلامة المائية</p>
                      <p className="text-xs text-muted-foreground mt-0.5">إظهار شعار المكتبة في خلفية الصفحات</p>
                    </div>
                    <button
                      onClick={() => set("watermarkEnabled", form.watermarkEnabled === "true" ? "false" : "true")}
                      className="relative w-12 h-6 rounded-full transition-colors duration-200"
                      style={{ background: form.watermarkEnabled === "true" ? "#10B981" : "hsl(var(--muted))" }}
                      data-testid="toggle-watermark"
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.watermarkEnabled === "true" ? "translate-x-6" : "translate-x-0.5"}`} />
                    </button>
                  </div>

                  {/* Opacity */}
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 flex justify-between">
                      <span>شدة الظهور</span>
                      <span className="text-muted-foreground font-normal">{opacity}%</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={25}
                      value={opacity}
                      onChange={e => set("watermarkOpacity", e.target.value)}
                      className="w-full accent-purple-500"
                      data-testid="range-watermark-opacity"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>شفاف جداً</span>
                      <span>واضح</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Watermark Live Preview */}
              <div className="glass-card rounded-2xl p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#8B5CF622" }}>
                    <FileText className="h-4 w-4" style={{ color: "#8B5CF6" }} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground">معاينة العلامة المائية</h2>
                    <p className="text-xs text-muted-foreground">هكذا ستبدو في خلفية الصفحات</p>
                  </div>
                </div>
                <div className="flex-1 relative rounded-xl border border-border bg-background min-h-40 flex items-center justify-center overflow-hidden">
                  {/* Fake page content lines */}
                  <div className="absolute inset-0 p-4 space-y-2">
                    {[70, 55, 85, 60, 40].map((w, i) => (
                      <div key={i} className="h-2.5 rounded-full bg-muted" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  {/* Watermark preview */}
                  {form.watermarkEnabled === "true" && (
                    <div className="relative z-10 flex flex-col items-center gap-1.5 pointer-events-none select-none"
                      style={{ opacity: opacity / 100 }}>
                      <img src={logoImg} alt="" className="w-20 h-20 object-contain" />
                      <p className="text-xs font-black text-foreground text-center leading-tight">
                        {form.libraryName}<br />{form.libraryTagline}
                      </p>
                    </div>
                  )}
                  {form.watermarkEnabled !== "true" && (
                    <div className="relative z-10 flex flex-col items-center gap-1 text-muted-foreground">
                      <EyeOff className="h-8 w-8" />
                      <p className="text-xs">العلامة المائية معطلة</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Color Themes */}
              <div className="glass-card rounded-2xl p-6 col-span-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#F43F5E22" }}>
                    <Palette className="h-4 w-4" style={{ color: "#F43F5E" }} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground">لون النظام</h2>
                    <p className="text-xs text-muted-foreground">اختر اللون الرئيسي لواجهة النظام</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {[
                    { color: "#8B5CF6", name: "بنفسجي (افتراضي)" },
                    { color: "#3B82F6", name: "أزرق" },
                    { color: "#10B981", name: "أخضر" },
                    { color: "#F59E0B", name: "ذهبي" },
                    { color: "#F43F5E", name: "وردي" },
                    { color: "#6366F1", name: "نيلي" },
                    { color: "#EC4899", name: "زهري" },
                    { color: "#14B8A6", name: "فيروزي" },
                  ].map(({ color, name }) => (
                    <button
                      key={color}
                      onClick={() => set("primaryColor", color)}
                      title={name}
                      className="relative w-10 h-10 rounded-xl transition-transform hover:scale-110"
                      style={{ background: color, boxShadow: form.primaryColor === color ? `0 0 0 3px white, 0 0 0 5px ${color}` : "none" }}
                      data-testid={`color-${color.replace("#", "")}`}
                    >
                      {form.primaryColor === color && (
                        <CheckCircle className="absolute inset-0 m-auto h-5 w-5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Maintenance Tab ─── */}
          {activeTab === "maintenance" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Stats */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#6366F122" }}>
                    <Database className="h-4 w-4" style={{ color: "#6366F1" }} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground">إحصائيات النظام</h2>
                    <p className="text-xs text-muted-foreground">نظرة عامة على بيانات النظام</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "إجمالي المشتركين", value: stats?.totalStudents ?? "—", icon: Users, color: "#8B5CF6" },
                    { label: "المشتركون النشطون", value: stats?.activeStudents ?? "—", icon: CheckCircle, color: "#10B981" },
                    { label: "عدد المدفوعات", value: stats?.totalPayments ?? "—", icon: CreditCard, color: "#F59E0B" },
                    { label: "إجمالي الإيرادات", value: stats?.totalRevenue ? `${stats.totalRevenue.toLocaleString("ar")} ${form.currency}` : "—", icon: DollarSign, color: "#F43F5E" },
                    { label: "عدد المدرسين", value: stats?.totalTeachers ?? "—", icon: GraduationCap, color: "#6366F1" },
                    { label: "إصدار النظام", value: form.systemVersion || "1.0.0", icon: Hash, color: "#64748B" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                        <Icon className="h-4 w-4" style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{label}</p>
                        <p className="text-sm font-black text-foreground truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#F59E0B22" }}>
                    <Wrench className="h-4 w-4" style={{ color: "#F59E0B" }} />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground">وضع الصيانة</h2>
                    <p className="text-xs text-muted-foreground">تعطيل الوصول للمستخدمين مؤقتاً</p>
                  </div>
                </div>

                {/* Maintenance toggle */}
                <div className="p-4 rounded-xl border-2 transition-colors mb-4"
                  style={{ borderColor: form.maintenanceMode === "true" ? "#F59E0B" : "hsl(var(--border))", background: form.maintenanceMode === "true" ? "#F59E0B08" : "transparent" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {form.maintenanceMode === "true"
                        ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                        : <CheckCircle className="h-4 w-4 text-green-500" />}
                      <p className="text-sm font-bold text-foreground">
                        {form.maintenanceMode === "true" ? "وضع الصيانة مفعّل" : "النظام يعمل بشكل طبيعي"}
                      </p>
                    </div>
                    <button
                      onClick={() => set("maintenanceMode", form.maintenanceMode === "true" ? "false" : "true")}
                      className="relative w-12 h-6 rounded-full transition-colors duration-200"
                      style={{ background: form.maintenanceMode === "true" ? "#F59E0B" : "hsl(var(--muted))" }}
                      data-testid="toggle-maintenance"
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.maintenanceMode === "true" ? "translate-x-6" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  <textarea
                    value={form.maintenanceMessage}
                    onChange={e => set("maintenanceMessage", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="رسالة الصيانة للمستخدمين..."
                    data-testid="input-maintenance-message"
                  />
                </div>

                {/* Version Info */}
                <FieldGroup label="إصدار النظام" icon={<Info className="h-4 w-4" />}>
                  <input
                    type="text"
                    value={form.systemVersion}
                    onChange={e => set("systemVersion", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
                    placeholder="1.0.0"
                    data-testid="input-system-version"
                  />
                </FieldGroup>
              </div>

              {/* System Info Card */}
              <div className="glass-card rounded-2xl p-6 col-span-full">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#64748B22" }}>
                    <Info className="h-4 w-4" style={{ color: "#64748B" }} />
                  </div>
                  <h2 className="text-base font-black text-foreground">معلومات النظام</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "اسم النظام", value: "مكتبة عين الإنجاز ERP" },
                    { label: "إصدار النظام", value: form.systemVersion || "1.0.0" },
                    { label: "العام الدراسي", value: form.academicYear || "—" },
                    { label: "تاريخ اليوم", value: new Date().toLocaleDateString("ar-SA") },
                    { label: "قاعدة البيانات", value: "PostgreSQL" },
                    { label: "الإطار الأمامي", value: "React + TypeScript" },
                    { label: "الإطار الخلفي", value: "Express.js" },
                    { label: "الاتجاه", value: "RTL (عربي)" },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-bold text-foreground mt-0.5 truncate">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dirty indicator */}
          {dirty && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
              <AlertTriangle className="h-4 w-4" />
              <span>لديك تغييرات غير محفوظة</span>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-xs font-black"
                data-testid="button-save-floating"
              >
                {saveMutation.isPending ? "جاري الحفظ..." : "حفظ الآن"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldGroup({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
        {icon}
        <span>{label}</span>
      </label>
      {children}
    </div>
  );
}
