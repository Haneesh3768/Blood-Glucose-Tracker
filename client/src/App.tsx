import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import { ProtectedRoute } from "./components/auth/ProtectedRoute.js";
import { PublicRoute } from "./components/auth/PublicRoute.js";
import { AppLayout } from "./components/layout/AppLayout.js";
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { AddReadingPage } from "./pages/AddReadingPage.js";
import { EditReadingPage } from "./pages/EditReadingPage.js";
import { DailyReportPage } from "./pages/DailyReportPage.js";
import { MonthlyReportsPage } from "./pages/MonthlyReportsPage.js";
import { ProfilePage } from "./pages/ProfilePage.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex items-center space-x-3 text-violet-600">
          <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-600 font-medium text-sm">Verifying session...</span>
        </div>
      </div>
    );
  }

  // If session is active/restored, directly redirect to /dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root Route: If session is available, directly redirect to /dashboard, else /login */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public Authentication Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Authenticated Dashboard & Clinical Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/readings/new" element={<AddReadingPage />} />
              <Route path="/readings/:id/edit" element={<EditReadingPage />} />
              <Route path="/reports/daily" element={<DailyReportPage />} />
              <Route path="/reports/month-to-date" element={<MonthlyReportsPage />} />
              <Route path="/reports/monthly" element={<MonthlyReportsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
