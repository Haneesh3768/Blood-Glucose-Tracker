import React from "react";
import { Activity, LogOut, User as UserIcon, Calendar } from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";

interface NavbarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  activeTab: "dashboard" | "reports" | "history";
  onTabChange: (tab: "dashboard" | "reports" | "history") => void;
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedDate,
  onDateChange,
  activeTab,
  onTabChange,
  onOpenAddModal,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <Activity className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Sweety
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Glucose Tracker
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Personal Glycemic Monitor
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => onTabChange("dashboard")}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === "dashboard"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Today's Slots
            </button>
            <button
              onClick={() => onTabChange("reports")}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === "reports"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Reports & Stats
            </button>
            <button
              onClick={() => onTabChange("history")}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === "history"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Readings
            </button>
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Add Button */}
            <button
              onClick={onOpenAddModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition"
            >
              <span>+ Add Reading</span>
            </button>

            {/* Date Quick Switcher */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-sm">
              <Calendar className="h-4 w-4 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent text-slate-800 text-xs font-medium focus:outline-none cursor-pointer"
                title="Select reference date"
              />
            </div>

            {/* User Dropdown / Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                {user?.name ? user.name.slice(0, 2) : <UserIcon className="h-4 w-4" />}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.name || "Patient"}
                </p>
                <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
