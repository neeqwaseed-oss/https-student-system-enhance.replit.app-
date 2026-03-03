import { useState } from "react";
import { MessageSquare, Send, X, CheckCircle, Clock, AlertCircle, Plus } from "lucide-react";
import { useAuth } from "@/App";

interface Ticket {
  id: string;
  sender: string;
  subject: string;
  message: string;
  status: "open" | "replied" | "closed";
  date: string;
  replies: { sender: string; message: string; date: string }[];
}

const DEFAULT_TICKETS: Ticket[] = [
  {
    id: "T001",
    sender: "أحمد محمد",
    subject: "مشكلة في تسجيل الدفعة",
    message: "لا أستطيع تسجيل دفعة للطالب رقم 12345، يظهر خطأ عند الحفظ.",
    status: "open",
    date: "2026-02-27",
    replies: [],
  },
  {
    id: "T002",
    sender: "سارة علي",
    subject: "طلب تصدير بيانات",
    message: "أرجو المساعدة في تصدير بيانات المشتركين لهذا الشهر.",
    status: "replied",
    date: "2026-02-25",
    replies: [{ sender: "الدعم الفني", message: "يمكنك تصدير البيانات من صفحة النسخ الاحتياطي.", date: "2026-02-25" }],
  },
];

function TicketModal({ ticket, onClose, onReply }: { ticket: Ticket; onClose: () => void; onReply: (id: string, msg: string) => void }) {
  const [reply, setReply] = useState("");
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: "linear-gradient(135deg, #EC4899, #DB2777)", borderBottom: "1px solid hsl(var(--border))" }}>
          <MessageSquare className="h-4 w-4 text-white" />
          <h3 className="font-bold text-white flex-1">{ticket.subject}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[calc(80vh-130px)] space-y-3">
          <div className="rounded-xl p-3" style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-foreground">{ticket.sender}</p>
              <p className="text-xs text-muted-foreground">{ticket.date}</p>
            </div>
            <p className="text-sm text-foreground">{ticket.message}</p>
          </div>
          {ticket.replies.map((r, i) => (
            <div key={i} className="rounded-xl p-3 mr-6"
              style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-primary">{r.sender}</p>
                <p className="text-xs text-muted-foreground">{r.date}</p>
              </div>
              <p className="text-sm text-foreground">{r.message}</p>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 pt-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
          <div className="flex gap-2">
            <input value={reply} onChange={e => setReply(e.target.value)}
              placeholder="اكتب ردك هنا..."
              className="flex-1 px-3 py-2 rounded-xl text-sm border outline-none bg-background text-foreground"
              style={{ borderColor: "hsl(var(--border))" }} />
            <button onClick={() => { if (reply.trim()) { onReply(ticket.id, reply); setReply(""); onClose(); } }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #EC4899, #DB2777)" }}>
              <Send className="h-4 w-4" /> إرسال
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewTicketModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (subject: string, msg: string) => void }) {
  const [form, setForm] = useState({ subject: "", message: "" });
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: "linear-gradient(135deg, #EC4899, #DB2777)" }}>
          <Plus className="h-4 w-4 text-white" />
          <h3 className="font-bold text-white flex-1">تذكرة دعم جديدة</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">الموضوع *</label>
            <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none bg-background text-foreground"
              style={{ borderColor: "hsl(var(--border))" }} placeholder="موضوع المشكلة..." />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">تفاصيل المشكلة *</label>
            <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none bg-background text-foreground resize-none"
              style={{ borderColor: "hsl(var(--border))" }} rows={4} placeholder="اشرح المشكلة بالتفصيل..." />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => { if (form.subject && form.message) { onSubmit(form.subject, form.message); onClose(); } }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #EC4899, #DB2777)" }}>
              <Send className="h-4 w-4" /> إرسال التذكرة
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "hsl(var(--border))" }}>إلغاء</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>(DEFAULT_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const { user } = useAuth();

  const handleReply = (ticketId: string, message: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId
      ? { ...t, status: "replied" as const, replies: [...t.replies, { sender: user?.name || "الدعم الفني", message, date: new Date().toISOString().slice(0, 10) }] }
      : t
    ));
  };

  const handleNewTicket = (subject: string, message: string) => {
    const newTicket: Ticket = {
      id: `T${String(tickets.length + 1).padStart(3, "0")}`,
      sender: user?.name || "مستخدم",
      subject,
      message,
      status: "open",
      date: new Date().toISOString().slice(0, 10),
      replies: [],
    };
    setTickets(prev => [newTicket, ...prev]);
  };

  const handleClose = (ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: "closed" as const } : t));
  };

  const openCount = tickets.filter(t => t.status === "open").length;
  const repliedCount = tickets.filter(t => t.status === "replied").length;
  const closedCount = tickets.filter(t => t.status === "closed").length;

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-pink-500" /> الدعم الفني - إدارة التذاكر
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">تتبع طلبات الدعم الفني والرد عليها</p>
        </div>
        <button onClick={() => setShowNewTicket(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #EC4899, #DB2777)" }}
          data-testid="button-new-ticket">
          <Plus className="h-4 w-4" /> تذكرة جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "مفتوحة", value: openCount, icon: AlertCircle, color: "#F59E0B" },
          { label: "مجاب عليها", value: repliedCount, icon: MessageSquare, color: "#3B82F6" },
          { label: "مغلقة", value: closedCount, icon: CheckCircle, color: "#10B981" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
              <Icon className="h-6 w-6" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-black text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tickets Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "hsl(var(--muted) / 0.5)", borderBottom: "2px solid hsl(var(--border))" }}>
              {["#", "المرسل", "الموضوع", "الحالة", "تاريخ الإرسال", "إجراءات"].map(h => (
                <th key={h} className="px-4 py-3 text-right text-xs font-black text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="font-bold text-foreground">لا توجد تذاكر دعم</p>
              </td></tr>
            ) : (
              tickets.map((ticket, i) => (
                <tr key={ticket.id} className="border-b border-border/40 hover:bg-primary/3 transition-colors"
                  data-testid={`row-ticket-${ticket.id}`}>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{ticket.id}</td>
                  <td className="px-4 py-3 font-semibold text-foreground text-sm">{ticket.sender}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{ticket.subject}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={ticket.status === "open"
                        ? { background: "rgba(245,158,11,0.1)", color: "#F59E0B" }
                        : ticket.status === "replied"
                          ? { background: "rgba(59,130,246,0.1)", color: "#3B82F6" }
                          : { background: "rgba(16,185,129,0.1)", color: "#10B981" }
                      }>
                      {ticket.status === "open" ? "مفتوحة" : ticket.status === "replied" ? "مجاب عليها" : "مغلقة"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{ticket.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedTicket(ticket)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #EC4899, #DB2777)" }}
                        data-testid={`button-reply-${ticket.id}`}>
                        <Send className="h-3 w-3" /> رد
                      </button>
                      {ticket.status !== "closed" && (
                        <button onClick={() => handleClose(ticket.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border"
                          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}>
                          <X className="h-3 w-3" /> إغلاق
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedTicket && <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} onReply={handleReply} />}
      {showNewTicket && <NewTicketModal onClose={() => setShowNewTicket(false)} onSubmit={handleNewTicket} />}
    </div>
  );
}
