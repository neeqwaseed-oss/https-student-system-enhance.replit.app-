import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useGlobalToast } from "@/App";
import { MessageSquare, Send, Loader2, RefreshCcw, Clock, CheckCircle, AlertTriangle, Trash2, CheckSquare, Square } from "lucide-react";
import { useState, useMemo } from "react";
import type { TeacherMessage } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

export default function TeacherMessagesPage() {
  const { toast } = useGlobalToast();
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: messages = [], isLoading, refetch } = useQuery<TeacherMessage[]>({
    queryKey: ["/api/admin/teacher-messages"],
    queryFn: () => fetch("/api/admin/teacher-messages", { credentials: "include" }).then(r => r.json()),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) =>
      apiRequest("POST", `/api/admin/teacher-messages/${id}/reply`, { reply }),
    onSuccess: (_data, vars) => {
      setReplies(p => ({ ...p, [vars.id]: "" }));
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teacher-messages"] });
      toast({ title: "✅ تم إرسال الرد" });
    },
    onError: () => toast({ title: "❌ فشل إرسال الرد", variant: "destructive" }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => apiRequest("POST", "/api/admin/teacher-messages/bulk-delete", { ids }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teacher-messages"] });
      setSelectedIds(new Set());
      toast({ title: "تم حذف الرسائل المحددة" });
    },
    onError: (e: any) => toast({ title: "خطأ في الحذف", description: e.message, variant: "destructive" }),
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === messages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(messages.map(m => m.id)));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف ${selectedIds.size} رسالة؟`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const unreplied = messages.filter(m => !m.reply).length;
  const replied = messages.filter(m => !!m.reply).length;

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg,#8B5CF6,#7C3AED)" }}>
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">رسائل المدرسين</h1>
            <p className="text-sm text-muted-foreground">تواصل المدرسين مع الإدارة</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #F43F5E, #E11D48)", boxShadow: "0 6px 20px rgba(244,63,94,0.4)" }}
            >
              <Trash2 className="h-4 w-4" />
              حذف المحددين ({selectedIds.size})
            </button>
          )}
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-all"
          >
            {selectedIds.size === messages.length && messages.length > 0 ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            تحديد الكل
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-bold hover:border-purple-500/50 transition-all"
            data-testid="button-refresh-messages"
          >
            <RefreshCcw className="h-4 w-4" /> تحديث
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "إجمالي الرسائل", value: messages.length, icon: MessageSquare, color: "#8B5CF6" },
          { label: "بانتظار الرد", value: unreplied, icon: Clock, color: "#F59E0B" },
          { label: "تم الرد عليها", value: replied, icon: CheckCircle, color: "#10B981" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-black text-foreground">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Messages */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : messages.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <MessageSquare className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
          <p className="font-black text-lg text-foreground">لا توجد رسائل</p>
          <p className="text-sm text-muted-foreground mt-1">لم يرسل أي مدرس رسالة بعد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div key={msg.id}
              className="glass-card rounded-2xl overflow-hidden transition-all"
              data-testid={`admin-msg-${idx}`}
            >
              {/* Message header */}
              <div className="flex items-center">
                <div className="pr-4">
                  <Checkbox 
                    checked={selectedIds.has(msg.id)}
                    onCheckedChange={() => toggleSelect(msg.id)}
                  />
                </div>
                <button
                  onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                  className="flex-1 flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-right"
                  data-testid={`expand-msg-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
                      style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
                      {msg.teacherName?.charAt(0) || "م"}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-foreground">{msg.teacherName}</span>
                        {!msg.reply && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:bg-amber-400 flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" /> بانتظار الرد
                          </span>
                        )}
                        {msg.reply && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="h-2.5 w-2.5" /> تم الرد
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">{msg.message}</p>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-[10px] text-muted-foreground">{new Date(msg.createdAt || "").toLocaleDateString("ar-SA")}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(msg.createdAt || "").toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </button>
              </div>

              {/* Expanded content */}
              {expanded === msg.id && (
                <div className="px-5 pb-5 border-t border-border/50">
                  {/* Teacher message */}
                  <div className="mt-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                      style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
                      {msg.teacherName?.charAt(0) || "م"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-foreground">{msg.teacherName}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(msg.createdAt || "").toLocaleString("ar-SA")}</span>
                      </div>
                      <div className="px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-sm text-foreground leading-relaxed">
                        {msg.message}
                      </div>
                    </div>
                  </div>

                  {/* Existing reply */}
                  {msg.reply && (
                    <div className="mt-3 flex items-start gap-3 mr-11">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                        style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>
                        م
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">المدير</span>
                          <span className="text-[10px] text-muted-foreground">{msg.repliedAt ? new Date(msg.repliedAt).toLocaleString("ar-SA") : ""}</span>
                        </div>
                        <div className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-sm text-foreground leading-relaxed">
                          {msg.reply}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reply input */}
                  <div className="mt-4 mr-11">
                    <p className="text-xs font-bold text-muted-foreground mb-2">
                      {msg.reply ? "تعديل الرد:" : "إرسال رد:"}
                    </p>
                    <div className="flex gap-3">
                      <textarea
                        rows={2}
                        value={replies[msg.id] || ""}
                        onChange={e => setReplies(p => ({ ...p, [msg.id]: e.target.value }))}
                        placeholder={msg.reply ? "اكتب رداً جديداً..." : "اكتب ردك هنا..."}
                        className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                        data-testid={`reply-input-${idx}`}
                      />
                      <button
                        onClick={() => {
                          const reply = replies[msg.id]?.trim();
                          if (reply) replyMutation.mutate({ id: msg.id, reply });
                        }}
                        disabled={replyMutation.isPending || !replies[msg.id]?.trim()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold self-end transition-all disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}
                        data-testid={`button-reply-${idx}`}
                      >
                        {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        رد
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
