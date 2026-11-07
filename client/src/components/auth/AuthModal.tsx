import React, { useState } from "react";
import { Activity, Lock, Mail, User, AlertCircle, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";

export const AuthModal: React.FC = () => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setError("Name is required.");
          setIsSubmitting(false);
          return;
        }
        await signup(name, email, password);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Authentication failed.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login("patient@sweety.app", "Password123!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Demo login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white text-center relative">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white mb-3 shadow-inner">
            <Activity className="h-7 w-7 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Sweety</h2>
          <p className="text-emerald-100 text-sm mt-1">
            Personal Blood Glucose Monitoring Portal
          </p>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                isLogin
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                !isLogin
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@sweety.app"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-200 transition disabled:opacity-50"
            >
              {isSubmitting
                ? "Processing..."
                : isLogin
                ? "Sign In to Sweety"
                : "Create Patient Account"}
            </button>
          </form>

          {/* Quick Demo Access Button */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>One-Click Evaluator Demo Sign In (Preloaded Data)</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Credentials: <code>patient@sweety.app</code> / <code>Password123!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
