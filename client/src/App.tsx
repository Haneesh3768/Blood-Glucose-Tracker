import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext.js";
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

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
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
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/readings/new" element={<AddReadingPage />} />
              <Route path="/readings/:id/edit" element={<EditReadingPage />} />
              <Route path="/reports/daily" element={<DailyReportPage />} />
              <Route path="/reports/month-to-date" element={<MonthlyReportsPage />} />
              <Route path="/reports/monthly" element={<MonthlyReportsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
