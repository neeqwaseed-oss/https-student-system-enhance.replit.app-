import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/App";
import {
  UserCog, Plus, Edit2, Trash2, Shield, User, KeyRound,
  X, Save, Lock, CheckCircle, XCircle
} from "lucide-react";
import { useGlobalToast } from "@/App";
import type { User as UserType } from "@shared/schema";

const ROLES = [
  { value: "admin", label: "مدير النظام", color: "#8B5CF6", grad: "linear-gradient(135deg, #8B5CF6, #7C3AED)" },
  { value: "moderator", label: "مشرف", color: "#3B82F6", grad: "linear-gradient(135deg, #3B82F6, #4F46E5)" },
  { value: "staff", label: "موظف", color: "#10B981", grad: "linear-gradient(135deg, #10B981, #059669)" },
  { value: "teacher", label: "مدرس", color: "#F59E0B", grad: "linear-gradient(135deg, #F59E0B, #EA580C)" },
  { value: "student", label: "طالب", color: "#F43F5E", grad: "linear-gradient(135deg, #F43F5E, #DB2777)" },
];

function getRoleInfo(role: string) {
  return ROLES.find(r => r.value === role) || ROLES[2];
}

function Modal({ title, icon, onClose, danger, children, grad }: {
  title: string; icon?: React.ReactNode; onClose: () => void; danger?: boolean; children: React.ReactNode; grad?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: grad || (danger ? "linear-gradient(135deg, #F43F5E, #E11D48)" : "linear-gradient(135deg, #06B6D4, #0284C7)"), borderBottom: "1px solid hsl(var(--border))" }}>
          {icon}
          <h3 className="font-bold text-white flex-1">{title}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useGlobalToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<UserType | null>(null);
  const [changePassUser, setChangePassUser] = useState<UserType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserType | null>(null);

  const { data: users = [], isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/users", data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); setShowAdd(false); toast({ title: "تم إنشاء الحساب" }); },
    onError: (e: any) => toast({ title: "خطأ في الإنشاء", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/users/${id}`, data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); setEditUser(null); setChangePassUser(null); toast({ title: "تم تحديث الحساب" }); },
    onError: (e: any) => toast({ title: "خطأ", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); setDeleteConfirm(null); toast({ title: "تم حذف الحساب" }); },
  });

  const inputClass = "w-full px-3 py-2 rounded-xl text-sm border outline-none transition-all bg-background text-foreground";
  const inputStyle = { borderColor: "hsl(var(--border))" };

  const UserForm = ({ initial, onSave, isPending }: {
    initial?: Partial<UserType>; onSave: (d: Record<string, unknown>) => void; isPending: boolean;
  }) => {
    const [form, setForm] = useState({
      name: initial?.name || "",
      username: initial?.username || "",
      password: initial ? "" : "",
      role: initial?.role || "staff",
      isActive: initial?.isActive ?? true,
    });
    const isEdit = !!initial;
    return (
      <form onSubmit={e => {
        e.preventDefault();
        if (!form.name || !form.username) return;
        if (!isEdit && !form.password) {
          toast({ title: "يرجى إدخال كلمة المرور", variant: "destructive" });
          return;
        }
        const data: Record<string, unknown> = { name: form.name, username: form.username, role: form.role, isActive: form.isActive };
        if (form.password) data.password = form.password;
        onSave(data);
      }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-bold mb-1.5 text-foreground">الاسم الكامل *</label>
            <input className={inputClass} style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div><label className="block text-xs font-bold mb-1.5 text-foreground">اسم المستخدم *</label>
            <input className={inputClass} style={inputStyle} value={form.username} dir="ltr" onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required autoComplete="off" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5 text-foreground">
            {isEdit ? "كلمة مرور جديدة (اتركه فارغاً للإبقاء)" : "كلمة المرور *"}
          </label>
          <input className={inputClass} style={inputStyle} type="password" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} dir="ltr"
            placeholder={isEdit ? "••••••••" : "أدخل كلمة المرور"} autoComplete="new-password" />
        </div>
        <div>
          <label className="block text-xs font-bold mb-2 text-foreground">نوع الحساب</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map(r => (
              <button key={r.value} type="button" onClick={() => setForm(p => ({ ...p, role: r.value }))}
                className="py-2 px-3 rounded-xl text-xs font-bold transition-all border"
                style={form.role === r.value
                  ? { background: r.grad, color: "white", borderColor: "transparent", boxShadow: `0 4px 12px ${r.color}40` }
                  : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                }>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-primary" />
          <span className="text-sm font-medium text-foreground">حساب نشط</span>
        </label>
        <button type="submit" disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #06B6D4, #0284C7)" }}>
          <Save className="h-4 w-4" /> {isPending ? "جاري الحفظ..." : "حفظ"}
        </button>
      </form>
    );
  };

  const ChangePasswordForm = ({ user, onSave, isPending }: { user: UserType; onSave: (d: Record<string, unknown>) => void; isPending: boolean }) => {
    const [newPass, setNewPass] = useState("");
    const [confirm, setConfirm] = useState("");
    return (
      <form onSubmit={e => {
        e.preventDefault();
        if (newPass.length < 4) { toast({ title: "كلمة المرور قصيرة جداً", variant: "destructive" }); return; }
        if (newPass !== confirm) { toast({ title: "كلمتا المرور غير متطابقتان", variant: "destructive" }); return; }
        onSave({ password: newPass });
      }} className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: "hsl(var(--muted) / 0.5)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
            style={{ background: getRoleInfo(user.role).grad }}>
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.username}</p>
          </div>
        </div>
        <div><label className="block text-xs font-bold mb-1.5 text-foreground">كلمة المرور الجديدة</label>
          <input className={inputClass} style={inputStyle} type="password" value={newPass}
            onChange={e => setNewPass(e.target.value)} placeholder="••••••••" dir="ltr" autoComplete="new-password" required />
        </div>
        <div><label className="block text-xs font-bold mb-1.5 text-foreground">تأكيد كلمة المرور</label>
          <input className={inputClass} style={inputStyle} type="password" value={confirm}
            onChange={e => setConfirm(e.target.value)} placeholder="••••••••" dir="ltr" autoComplete="new-password" required />
        </div>
        <button type="submit" disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #F59E0B, #EA580C)" }}>
          <Lock className="h-4 w-4" /> {isPending ? "جاري التغيير..." : "تغيير كلمة المرور"}
        </button>
      </form>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <UserCog className="h-6 w-6 text-cyan-500" /> الحسابات
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">إدارة حسابات مستخدمي النظام</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #06B6D4, #0284C7)", boxShadow: "0 6px 20px rgba(6,182,212,0.4)" }}
          data-testid="button-add-user">
          <Plus className="h-4 w-4" /> إضافة حساب
        </button>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {ROLES.map(r => {
          const count = users.filter(u => u.role === r.value).length;
          return (
            <div key={r.value} className="rounded-xl p-3 text-center"
              style={{ background: r.grad, boxShadow: `0 4px 16px ${r.color}30` }}>
              <p className="text-2xl font-black text-white">{count}</p>
              <p className="text-xs font-semibold text-white/80 mt-0.5">{r.label}</p>
            </div>
          );
        })}
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl skeleton-wave" />)}
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
                {["المستخدم", "اسم الدخول", "نوع الحساب", "الحالة", "إجراءات"].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-black text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center">
                  <UserCog className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-foreground font-bold">لا توجد حسابات</p>
                </td></tr>
              ) : (
                users.map(user => {
                  const roleInfo = getRoleInfo(user.role);
                  const isCurrent = currentUser?.id === user.id;
                  return (
                    <tr key={user.id} className="border-b border-border/40 hover:bg-primary/3 transition-colors" data-testid={`row-user-${user.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black"
                            style={{ background: roleInfo.grad }}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm">{user.name}</p>
                            {isCurrent && <span className="text-xs badge-success px-1.5 py-0.5 rounded-full">أنت</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-foreground" dir="ltr">
                          {user.username}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                          style={{ background: roleInfo.grad }}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs font-semibold w-fit ${user.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                          {user.isActive ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {user.isActive ? "نشط" : "موقوف"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setEditUser(user)}
                            className="p-1.5 rounded-lg border text-foreground transition-all hover:bg-muted"
                            style={{ borderColor: "hsl(var(--border))" }}
                            data-testid={`button-edit-user-${user.id}`}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setChangePassUser(user)}
                            className="p-1.5 rounded-lg transition-all hover:bg-amber-50 dark:hover:bg-amber-500/10"
                            style={{ color: "#F59E0B" }}
                            data-testid={`button-pass-user-${user.id}`}>
                            <Lock className="h-3.5 w-3.5" />
                          </button>
                          {!isCurrent && (
                            <button onClick={() => setDeleteConfirm(user)}
                              className="p-1.5 rounded-lg transition-all"
                              style={{ background: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }}
                              data-testid={`button-delete-user-${user.id}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="إضافة حساب جديد" icon={<Plus className="h-4 w-4 text-white" />} onClose={() => setShowAdd(false)}>
          <UserForm onSave={d => createMutation.mutate(d)} isPending={createMutation.isPending} />
        </Modal>
      )}
      {editUser && (
        <Modal title="تعديل الحساب" icon={<Edit2 className="h-4 w-4 text-white" />} onClose={() => setEditUser(null)}>
          <UserForm initial={editUser} onSave={d => updateMutation.mutate({ id: editUser.id, data: d })} isPending={updateMutation.isPending} />
        </Modal>
      )}
      {changePassUser && (
        <Modal title="تغيير كلمة المرور" icon={<Lock className="h-4 w-4 text-white" />} onClose={() => setChangePassUser(null)}
          grad="linear-gradient(135deg, #F59E0B, #EA580C)">
          <ChangePasswordForm user={changePassUser} onSave={d => updateMutation.mutate({ id: changePassUser.id, data: d })} isPending={updateMutation.isPending} />
        </Modal>
      )}
      {deleteConfirm && (
        <Modal title="تأكيد حذف الحساب" icon={<Trash2 className="h-4 w-4 text-white" />} onClose={() => setDeleteConfirm(null)} danger>
          <p className="text-foreground mb-1">هل تريد حذف حساب:</p>
          <p className="font-bold text-foreground text-lg mb-4">{deleteConfirm.name}</p>
          <div className="flex gap-2">
            <button onClick={() => deleteMutation.mutate(deleteConfirm.id)} disabled={deleteMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)" }}>
              {deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
            </button>
            <button onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>إلغاء</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
