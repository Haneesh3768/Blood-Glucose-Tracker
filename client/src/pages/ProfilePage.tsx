import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Shield,
  LogOut,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.js";

export const ProfilePage: React.FC = () => {
  const { user, logout, logoutAll } = useAuth();
  const navigate = useNavigate();

  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleLogoutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      await logoutAll();
      navigate("/login");
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 leading-tight">Patient Profile & Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Account identity, clinical glycemic targets reference, and session management
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-lavender-100 text-lavender-700 flex items-center justify-center font-bold text-xl">
            {user?.name ? user.name[0]?.toUpperCase() : "P"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.email}</span>
            </div>
            <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Patient Account</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Target Standards (ADA Guidelines) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-lavender-600" />
              <span>Clinical Glycemic Target Guidelines</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Based on American Diabetes Association (ADA) clinical standards for adults with diabetes
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
            ADA 2026 Reference
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center space-x-2 text-emerald-700 font-semibold text-xs mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Fasting Target</span>
            </div>
            <div className="text-lg font-bold text-slate-900">70 – 130 mg/dl</div>
            <p className="text-[11px] text-slate-500 mt-1">Before morning breakfast or meals</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center space-x-2 text-amber-700 font-semibold text-xs mb-1">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              <span>Post-Meal Target</span>
            </div>
            <div className="text-lg font-bold text-slate-900">&lt; 180 mg/dl</div>
            <p className="text-[11px] text-slate-500 mt-1">1–2 hours after start of a meal</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center space-x-2 text-rose-700 font-semibold text-xs mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Hypoglycemia Alert</span>
            </div>
            <div className="text-lg font-bold text-slate-900">&lt; 70 mg/dl</div>
            <p className="text-[11px] text-slate-500 mt-1">Take fast-acting carbohydrates</p>
          </div>
        </div>

        <div className="p-3 bg-lavender-50/60 border border-lavender-100 rounded-xl text-xs text-lavender-900 flex items-start space-x-2">
          <Info className="w-4 h-4 text-lavender-600 shrink-0 mt-0.5" />
          <span>
            These targets are standard clinical benchmarks. Individual goals should be set in
            consultation with your endocrinologist or primary healthcare provider.
          </span>
        </div>
      </div>

      {/* Security & Session Management */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Security & Sessions</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your authenticated tokens and multi-device sessions
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>Sign Out Current Device</span>
          </button>

          <button
            onClick={handleLogoutAll}
            disabled={isLoggingOutAll}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>{isLoggingOutAll ? "Signing out..." : "Sign Out All Devices"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
