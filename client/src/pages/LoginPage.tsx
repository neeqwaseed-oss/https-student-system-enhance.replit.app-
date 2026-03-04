import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useGlobalToast } from "@/App";
import logoImg from "@assets/image_1772507398400.png";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const { toast } = useGlobalToast();

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.setQueryData(["/api/auth/me"], data.user);
        setLocation("/");
      } else {
        toast({ title: "خطأ في تسجيل الدخول", description: data.error, variant: "destructive" });
      }
    },
    onError: () => toast({ title: "خطأ في الاتصال", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({ title: "يرجى إدخال اسم المستخدم وكلمة المرور", variant: "destructive" });
      return;
    }
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden" dir="rtl">
      {/* Gradient Background */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)"
      }} />

      {/* Animated orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-float" style={{ background: "hsl(262, 80%, 58%)" }} />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-15 animate-float delay-300" style={{ background: "hsl(217, 91%, 55%)" }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl opacity-10 animate-float delay-500" style={{ background: "hsl(188, 95%, 43%)" }} />

      {/* Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
        backgroundSize: "32px 32px"
      }} />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-scale-in">
        <div className="rounded-2xl overflow-hidden" style={{
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)"
        }}>
          {/* Card Header */}
          <div className="px-8 pt-8 pb-6 text-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.95)", border: "2px solid rgba(255,255,255,0.2)" }}>
                  <img src={logoImg} alt="شعار مكتبة عين انجاز" className="w-24 h-24 object-contain" />
                </div>
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ boxShadow: "0 0 30px rgba(139,92,246,0.5), 0 0 60px rgba(59,130,246,0.3)" }} />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white mb-0.5">مكتبة عين الإنجاز</h1>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>للخدمات الطلابية والإلكترونية والأدوات المدرسية</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>نظام الإدارة المتكامل</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <div>
              <label className="block text-xs font-bold mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                اسم المستخدم
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  className="w-full pr-10 pl-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)"
                  }}
                  onFocus={e => { e.target.style.background = "rgba(255,255,255,0.12)"; e.target.style.borderColor = "rgba(139,92,246,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.15)"; }}
                  onBlur={e => { e.target.style.background = "rgba(255,255,255,0.08)"; e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.boxShadow = "none"; }}
                  data-testid="input-username"
                  dir="ltr"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-10 py-3 rounded-xl text-sm text-white placeholder:text-white/30 outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)"
                  }}
                  onFocus={e => { e.target.style.background = "rgba(255,255,255,0.12)"; e.target.style.borderColor = "rgba(139,92,246,0.6)"; e.target.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.15)"; }}
                  onBlur={e => { e.target.style.background = "rgba(255,255,255,0.08)"; e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.boxShadow = "none"; }}
                  data-testid="input-password"
                  dir="ltr"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 rounded-xl text-sm font-bold text-white mt-2 transition-all duration-200 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
                boxShadow: "0 8px 24px rgba(139,92,246,0.4)"
              }}
              onMouseEnter={e => { if (!loginMutation.isPending) (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جاري تسجيل الدخول...
                </span>
              ) : "تسجيل الدخول"}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-6 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-2 opacity-40">
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.3)" }} />
              <img src={logoImg} alt="" className="w-5 h-5 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
              <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.3)" }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>
              © {new Date().getFullYear()} مكتبة عين الإنجاز للخدمات الطلابية
            </p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              جميع الحقوق محفوظة — نظام الإدارة المتكامل
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
