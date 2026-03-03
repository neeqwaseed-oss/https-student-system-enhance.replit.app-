import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Trash2, RotateCcw, Flame, Users, BookOpen, AlertTriangle, ArrowRight, CreditCard
} from "lucide-react";
import { Link } from "wouter";
import { useGlobalToast } from "@/App";
import { formatCurrency } from "@/lib/utils";
import type { Student, Teacher, Payment } from "@shared/schema";
import { useState } from "react";

function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)", borderBottom: "1px solid hsl(var(--border))" }}>
          <Flame className="h-4 w-4 text-white" />
          <h3 className="font-bold text-white flex-1">{title}</h3>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function TrashPage() {
  const { toast } = useGlobalToast();
  const [activeTab, setActiveTab] = useState<"students" | "teachers" | "payments">("students");
  const [permDeleteStudent, setPermDeleteStudent] = useState<Student | null>(null);
  const [permDeleteTeacher, setPermDeleteTeacher] = useState<Teacher | null>(null);
  const [permDeletePayment, setPermDeletePayment] = useState<Payment | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/students/deleted"] });
    queryClient.invalidateQueries({ queryKey: ["/api/teachers/deleted"] });
    queryClient.invalidateQueries({ queryKey: ["/api/payments/deleted"] });
    queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
    queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
  };

  const emptyTrashMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/trash/empty").then(r => r.json()),
    onSuccess: () => {
      invalidateAll();
      setShowEmptyConfirm(false);
      toast({ title: "تم إفراغ السلة نهائياً" });
    },
    onError: () => toast({ title: "خطأ في الإفراغ", variant: "destructive" }),
  });

  const { data: deletedStudents = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students/deleted"],
    queryFn: () => fetch("/api/students/deleted").then(r => r.json()),
  });

  const { data: deletedTeachers = [], isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers/deleted"],
    queryFn: () => fetch("/api/teachers/deleted").then(r => r.json()),
  });

  const { data: deletedPayments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments/deleted"],
    queryFn: () => fetch("/api/payments/deleted").then(r => r.json()),
  });

  const restoreStudentMutation = useMutation({
    mutationFn: (internalId: string) => apiRequest("POST", `/api/students/${internalId}/restore`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students/deleted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "تم استعادة المشترك" });
    },
    onError: () => toast({ title: "خطأ في الاستعادة", variant: "destructive" }),
  });

  const permDeleteStudentMutation = useMutation({
    mutationFn: (internalId: string) => apiRequest("DELETE", `/api/students/${internalId}/permanent`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students/deleted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setPermDeleteStudent(null);
      toast({ title: "تم الحذف النهائي للمشترك" });
    },
    onError: () => toast({ title: "خطأ في الحذف", variant: "destructive" }),
  });

  const restoreTeacherMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/teachers/${id}/restore`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers/deleted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({ title: "تم استعادة المدرس" });
    },
    onError: () => toast({ title: "خطأ في الاستعادة", variant: "destructive" }),
  });

  const permDeleteTeacherMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/teachers/${id}/permanent`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers/deleted"] });
      setPermDeleteTeacher(null);
      toast({ title: "تم الحذف النهائي للمدرس" });
    },
    onError: () => toast({ title: "خطأ في الحذف النهائي", variant: "destructive" }),
  });

  const restorePaymentMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/payments/${id}/restore`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments/deleted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "تم استعادة الدفعة" });
    },
    onError: () => toast({ title: "خطأ في الاستعادة", variant: "destructive" }),
  });

  const permDeletePaymentMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/payments/${id}/permanent`).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments/deleted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setPermDeletePayment(null);
      toast({ title: "تم الحذف النهائي للدفعة" });
    },
    onError: () => toast({ title: "خطأ في الحذف", variant: "destructive" }),
  });

  const totalInTrash = deletedStudents.length + deletedTeachers.length + deletedPayments.length;

  const tabs = [
    { key: "students", label: "المشتركون", icon: Users, count: deletedStudents.length, grad: "linear-gradient(135deg, #8B5CF6, #7C3AED)" },
    { key: "teachers", label: "المدرسون", icon: BookOpen, count: deletedTeachers.length, grad: "linear-gradient(135deg, #F43F5E, #DB2777)" },
    { key: "payments", label: "الدفعات", icon: CreditCard, count: deletedPayments.length, grad: "linear-gradient(135deg, #F59E0B, #EA580C)" },
  ] as const;

  const EmptyState = ({ label }: { label: string }) => (
    <div className="p-12 text-center">
      <Trash2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
      <p className="font-bold text-foreground">سلة المهملات فارغة</p>
      <p className="text-sm text-muted-foreground mt-1">لا يوجد {label} محذوف{label === "مشتركون" ? "ون" : label === "مدرسون" ? "ون" : "ة"}</p>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-gray-500" /> سلة المهملات
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">العناصر المحذوفة يمكن استعادتها أو حذفها نهائياً</p>
        </div>
        <div className="flex items-center gap-2">
          {totalInTrash > 0 && (
            <button onClick={() => setShowEmptyConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 shadow-md"
              style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)" }}
              data-testid="button-empty-trash">
              <Flame className="h-4 w-4" /> إفراغ السلة
            </button>
          )}
          <Link href="/">
            <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border transition-all hover:-translate-y-0.5"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
              data-testid="button-back-trash">
              <ArrowRight className="h-4 w-4" /> رجوع
            </button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl p-4 mb-5 flex items-center gap-3"
        style={{ background: "hsl(38 92% 48% / 0.1)", border: "1px solid hsl(38 92% 48% / 0.2)" }}>
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          الحذف النهائي لا يمكن التراجع عنه. تأكد قبل الحذف الكامل.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {tabs.map(({ key, label, icon: Icon, count, grad }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={activeTab === key
              ? { background: grad, color: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }
              : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
            }
            data-testid={`tab-trash-${key}`}>
            <Icon className="h-4 w-4" />
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${activeTab === key ? "bg-white/25 text-white" : "bg-background text-foreground"}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Students Tab */}
      {activeTab === "students" && (
        <div className="glass-card rounded-2xl overflow-hidden">
          {studentsLoading ? (
            <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
          ) : deletedStudents.length === 0 ? (
            <EmptyState label="مشتركون" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                  {["المشترك", "رقم الطالب", "الجهة", "تاريخ الحذف", "إجراءات"].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-black text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deletedStudents.map(s => (
                  <tr key={s.id} className="border-b border-border/40 hover:bg-primary/3 transition-colors" data-testid={`row-trash-student-${s.internalId}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
                          style={{ background: "linear-gradient(135deg, #6B7280, #4B5563)" }}>
                          {s.studentName.charAt(0)}
                        </div>
                        <p className="font-semibold text-foreground">{s.studentName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{s.studentId}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.institution || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {s.deletedAt ? new Date(s.deletedAt).toLocaleDateString("ar-SA") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => restoreStudentMutation.mutate(s.internalId)}
                          disabled={restoreStudentMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-60 transition-all"
                          style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
                          data-testid={`button-restore-student-${s.internalId}`}>
                          <RotateCcw className="h-3 w-3" /> استعادة
                        </button>
                        <button onClick={() => setPermDeleteStudent(s)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
                          style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)" }}
                          data-testid={`button-perm-delete-student-${s.internalId}`}>
                          <Flame className="h-3 w-3" /> حذف نهائي
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Teachers Tab */}
      {activeTab === "teachers" && (
        <div className="glass-card rounded-2xl overflow-hidden">
          {teachersLoading ? (
            <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
          ) : deletedTeachers.length === 0 ? (
            <EmptyState label="مدرسون" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                  {["المدرس", "التخصص", "رقم الهاتف", "تاريخ الحذف", "إجراءات"].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-black text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deletedTeachers.map(t => (
                  <tr key={t.id} className="border-b border-border/40 hover:bg-primary/3 transition-colors" data-testid={`row-trash-teacher-${t.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
                          style={{ background: "linear-gradient(135deg, #6B7280, #4B5563)" }}>
                          {t.name.charAt(0)}
                        </div>
                        <p className="font-semibold text-foreground">{t.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.subject || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground" dir="ltr">{t.phone || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {t.deletedAt ? new Date(t.deletedAt).toLocaleDateString("ar-SA") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => restoreTeacherMutation.mutate(t.id)}
                          disabled={restoreTeacherMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-60"
                          style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
                          data-testid={`button-restore-teacher-${t.id}`}>
                          <RotateCcw className="h-3 w-3" /> استعادة
                        </button>
                        <button onClick={() => setPermDeleteTeacher(t)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
                          style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)" }}
                          data-testid={`button-perm-delete-teacher-${t.id}`}>
                          <Flame className="h-3 w-3" /> حذف نهائي
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <div className="glass-card rounded-2xl overflow-hidden">
          {paymentsLoading ? (
            <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
          ) : deletedPayments.length === 0 ? (
            <EmptyState label="دفعات" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                  {["المشترك", "المبلغ", "المستلم", "تاريخ الدفع", "تاريخ الحذف", "إجراءات"].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-black text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deletedPayments.map(p => (
                  <tr key={p.id} className="border-b border-border/40 hover:bg-primary/3 transition-colors" data-testid={`row-trash-payment-${p.id}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
                          style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)" }}>
                          <CreditCard className="h-3.5 w-3.5" />
                        </div>
                        <p className="font-semibold text-foreground">{p.studentName || "—"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amount || 0)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.receiverName || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("ar-SA") : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.deletedAt ? new Date(p.deletedAt).toLocaleDateString("ar-SA") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => restorePaymentMutation.mutate(p.id)}
                          disabled={restorePaymentMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-60 transition-all"
                          style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
                          data-testid={`button-restore-payment-${p.id}`}>
                          <RotateCcw className="h-3 w-3" /> استعادة
                        </button>
                        <button onClick={() => setPermDeletePayment(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
                          style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)" }}
                          data-testid={`button-perm-delete-payment-${p.id}`}>
                          <Flame className="h-3 w-3" /> حذف نهائي
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Perm Delete Student Confirmation */}
      {permDeleteStudent && (
        <Modal title="تحذير: حذف نهائي للمشترك" onClose={() => setPermDeleteStudent(null)}>
          <div className="text-center mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "hsl(var(--destructive) / 0.1)" }}>
              <Flame className="h-8 w-8 text-rose-500" />
            </div>
            <p className="font-bold text-foreground text-lg">{permDeleteStudent.studentName}</p>
            <p className="text-sm text-muted-foreground mt-2">
              سيتم حذف هذا المشترك وجميع بياناته (الدرجات والمدفوعات) نهائياً بدون إمكانية الاسترجاع!
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => permDeleteStudentMutation.mutate(permDeleteStudent.internalId)}
              disabled={permDeleteStudentMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)" }}
              data-testid="button-confirm-perm-delete-student">
              {permDeleteStudentMutation.isPending ? "جاري الحذف..." : "حذف نهائي"}
            </button>
            <button onClick={() => setPermDeleteStudent(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>إلغاء</button>
          </div>
        </Modal>
      )}

      {/* Perm Delete Teacher Confirmation */}
      {permDeleteTeacher && (
        <Modal title="تحذير: حذف نهائي للمدرس" onClose={() => setPermDeleteTeacher(null)}>
          <div className="text-center mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "hsl(var(--destructive) / 0.1)" }}>
              <Flame className="h-8 w-8 text-rose-500" />
            </div>
            <p className="font-bold text-foreground text-lg">{permDeleteTeacher.name}</p>
            <p className="text-sm text-muted-foreground mt-2">
              سيتم حذف هذا المدرس وجميع بيانات رواتبه نهائياً بدون إمكانية الاسترجاع!
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => permDeleteTeacherMutation.mutate(permDeleteTeacher.id)}
              disabled={permDeleteTeacherMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)" }}
              data-testid="button-confirm-perm-delete-teacher">
              {permDeleteTeacherMutation.isPending ? "جاري الحذف..." : "حذف نهائي"}
            </button>
            <button onClick={() => setPermDeleteTeacher(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>إلغاء</button>
          </div>
        </Modal>
      )}

      {/* Perm Delete Payment Confirmation */}
      {permDeletePayment && (
        <Modal title="تحذير: حذف نهائي للدفعة" onClose={() => setPermDeletePayment(null)}>
          <div className="text-center mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "hsl(var(--destructive) / 0.1)" }}>
              <Flame className="h-8 w-8 text-rose-500" />
            </div>
            <p className="font-bold text-foreground text-lg">{permDeletePayment.studentName || "دفعة"}</p>
            <p className="text-sm font-black text-emerald-600 mt-1">{formatCurrency(permDeletePayment.amount || 0)}</p>
            <p className="text-sm text-muted-foreground mt-2">
              سيتم حذف هذه الدفعة نهائياً بدون إمكانية الاسترجاع!
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => permDeletePaymentMutation.mutate(permDeletePayment.id)}
              disabled={permDeletePaymentMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)" }}
              data-testid="button-confirm-perm-delete-payment">
              {permDeletePaymentMutation.isPending ? "جاري الحذف..." : "حذف نهائي"}
            </button>
            <button onClick={() => setPermDeletePayment(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>إلغاء</button>
          </div>
        </Modal>
      )}

      {/* Empty Trash Confirmation */}
      {showEmptyConfirm && (
        <Modal title="تحذير: إفراغ السلة بالكامل" onClose={() => setShowEmptyConfirm(false)}>
          <div className="text-center mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "hsl(var(--destructive) / 0.1)" }}>
              <Flame className="h-8 w-8 text-rose-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              سيتم حذف جميع العناصر في سلة المهملات نهائياً وبصورة دائمة.
            </p>
            <div className="flex items-center justify-center gap-3 text-sm font-bold flex-wrap">
              {deletedStudents.length > 0 && <span className="text-rose-500">{deletedStudents.length} مشترك</span>}
              {deletedTeachers.length > 0 && <span className="text-rose-500">{deletedTeachers.length} مدرس</span>}
              {deletedPayments.length > 0 && <span className="text-rose-500">{deletedPayments.length} دفعة</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => emptyTrashMutation.mutate()}
              disabled={emptyTrashMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)" }}
              data-testid="button-confirm-empty-trash">
              {emptyTrashMutation.isPending ? "جاري الإفراغ..." : "إفراغ السلة نهائياً"}
            </button>
            <button onClick={() => setShowEmptyConfirm(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>إلغاء</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
