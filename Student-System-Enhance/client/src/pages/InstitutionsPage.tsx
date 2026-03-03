import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Search, Users, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import type { Student, Payment } from "@shared/schema";

export default function InstitutionsPage() {
  const [search, setSearch] = useState("");
  const [expandedInst, setExpandedInst] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "paid" | "partial">("all");

  const { data: students = [], isLoading } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { data: payments = [] } = useQuery<Payment[]>({ queryKey: ["/api/payments"] });

  const paidByStudent = payments.reduce((acc, p) => {
    acc[p.internalId] = (acc[p.internalId] || 0) + (p.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const grouped = students.reduce((acc, s) => {
    const inst = s.institution || "غير محدد";
    if (!acc[inst]) acc[inst] = [];
    acc[inst].push(s);
    return acc;
  }, {} as Record<string, Student[]>);

  const filteredGroups = Object.entries(grouped).filter(([inst]) =>
    !search || inst.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-emerald-500" /> الجهة التعليمية
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {Object.keys(grouped).length} جهة تعليمية — {students.length} مشترك
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "إجمالي الجهات", value: Object.keys(grouped).length, color: "#10B981" },
          { label: "إجمالي المشتركين", value: students.length, color: "#3B82F6" },
          { label: "متوسط المشتركين للجهة", value: Math.round(students.length / Math.max(Object.keys(grouped).length, 1)), color: "#F59E0B" },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ background: `${color}22` }}>
              <Building2 className="h-6 w-6" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="glass-card rounded-2xl p-4 mb-5">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث بالجهة التعليمية..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl text-sm border outline-none bg-background text-foreground"
            style={{ borderColor: "hsl(var(--border))" }} />
        </div>
      </div>

      {/* Institution Cards */}
      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-12 text-center glass-card rounded-2xl">
          <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-bold text-foreground">لا توجد نتائج</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map(([inst, instStudents]) => {
            const isExpanded = expandedInst === inst;
            const totalRevenue = instStudents.reduce((s, st) => s + (paidByStudent[st.internalId] || 0), 0);
            const totalPrice = instStudents.reduce((s, st) => s + (st.subscriptionPrice || 0), 0);
            const totalRemaining = totalPrice - totalRevenue;
            const paidCount = instStudents.filter(s => {
              const paid = paidByStudent[s.internalId] || 0;
              return (s.subscriptionPrice || 0) - paid <= 0;
            }).length;

            return (
              <div key={inst} className="glass-card rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedInst(isExpanded ? null : inst)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-primary/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shrink-0"
                    style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                    {inst.charAt(0)}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-bold text-foreground">{inst}</p>
                    <p className="text-xs text-muted-foreground">{instStudents.length} مشترك</p>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">المحصل</p>
                      <p className="text-sm font-black" style={{ color: "#10B981" }}>{formatCurrency(totalRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">المتبقي</p>
                      <p className="text-sm font-black" style={{ color: totalRemaining > 0 ? "#F43F5E" : "#10B981" }}>{formatCurrency(totalRemaining)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">نسبة السداد</p>
                      <p className="text-sm font-black text-foreground">{instStudents.length > 0 ? Math.round((paidCount / instStudents.length) * 100) : 0}%</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid hsl(var(--border))" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "hsl(var(--muted) / 0.4)" }}>
                          {["اسم المشترك", "الرقم الجامعي", "المدرس", "الحالة المالية", "إجراءات"].map(h => (
                            <th key={h} className="px-4 py-2.5 text-right text-xs font-black text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {instStudents.map(s => {
                          const paid = paidByStudent[s.internalId] || 0;
                          const remaining = (s.subscriptionPrice || 0) - paid;
                          const isPaid = remaining <= 0;
                          return (
                            <tr key={s.id} className="border-t border-border/30 hover:bg-primary/3">
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black"
                                    style={{ background: "linear-gradient(135deg, #8B5CF6, #7C3AED)" }}>
                                    {s.studentName.charAt(0)}
                                  </div>
                                  <span className="font-semibold text-foreground text-sm">{s.studentName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{s.studentId}</td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.teacherName || "—"}</td>
                              <td className="px-4 py-2.5">
                                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                  style={isPaid
                                    ? { background: "rgba(16,185,129,0.1)", color: "#10B981" }
                                    : { background: "rgba(244,63,94,0.1)", color: "#F43F5E" }
                                  }>
                                  {isPaid ? "مكتمل" : `متبقي ${formatCurrency(remaining)}`}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <Link href={`/students/${s.internalId}`}>
                                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white"
                                    style={{ background: "linear-gradient(135deg, #3B82F6, #4F46E5)" }}>
                                    <Eye className="h-3 w-3" /> عرض
                                  </button>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
