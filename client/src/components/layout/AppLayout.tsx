import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  Calendar,
  BarChart3,
  PlusCircle,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Droplet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: Activity },
    { to: "/reports/daily", label: "Daily Report", icon: Calendar },
    { to: "/reports/monthly", label: "Monthly Reports", icon: BarChart3 },
    { to: "/readings/new", label: "Add Reading", icon: PlusCircle },
    { to: "/profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Mobile Top Navigation */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link to="/dashboard" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-lavender-500 flex items-center justify-center text-white shadow-sm">
            <Droplet className="w-4 h-4 fill-white" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-base leading-none">Sweety</span>
            <span className="text-[10px] text-slate-500 block leading-tight">Glucose Tracker</span>
          </div>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 z-30">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-lavender-100 text-lavender-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-3">
            <div className="text-xs">
              <p className="font-medium text-slate-800">{user?.name}</p>
              <p className="text-slate-500 truncate max-w-[180px]">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-5 sticky top-0 h-screen select-none">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 pb-6 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-lavender-500 flex items-center justify-center text-white shadow-sm shadow-lavender-200">
            <Droplet className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg leading-none">Sweety</h1>
            <p className="text-xs text-slate-500 font-normal mt-0.5">Glucose Tracker</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 space-y-1.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-lavender-50 text-lavender-700 border border-lavender-200/70 shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-lavender-200 text-lavender-800 flex items-center justify-center font-semibold text-xs shrink-0">
                {user?.name ? user.name[0]?.toUpperCase() : "P"}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

