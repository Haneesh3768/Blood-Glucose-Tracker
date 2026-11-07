import React, { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import { Navbar } from "./components/common/Navbar.js";
import { AuthModal } from "./components/auth/AuthModal.js";
import { DailyTimeline } from "./components/dashboard/DailyTimeline.js";
import { ReportsView } from "./components/reports/ReportsView.js";
import { ReadingsHistory } from "./components/readings/ReadingsHistory.js";
import { ReadingModal } from "./components/readings/ReadingModal.js";
import { DeleteConfirmModal } from "./components/readings/DeleteConfirmModal.js";
import { fetchReadings, deleteReading } from "./api/readingsApi.js";
import { getTodayDateString } from "./utils/glucose.js";
import type { Reading, TimeSlot } from "./types/index.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const MainDashboard: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const qClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"dashboard" | "reports" | "history">("dashboard");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Modal states
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);
  const [defaultSlot, setDefaultSlot] = useState<TimeSlot | undefined>(undefined);

  const [deletingReading, setDeletingReading] = useState<Reading | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch readings for currently selected date
  const { data: dailyData } = useQuery({
    queryKey: ["dailyReadings", selectedDate],
    queryFn: () => fetchReadings({ date: selectedDate }),
    enabled: !!user,
  });

  const dailyReadings = dailyData?.readings || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReading(id),
    onSuccess: () => {
      qClient.invalidateQueries({ queryKey: ["dailyReadings"] });
      qClient.invalidateQueries({ queryKey: ["report"] });
      qClient.invalidateQueries({ queryKey: ["readingsHistory"] });
      setIsDeleteModalOpen(false);
      setDeletingReading(null);
    },
  });

  const handleOpenAdd = (slot?: TimeSlot) => {
    setEditingReading(null);
    setDefaultSlot(slot || "Morning (fasting)");
    setIsReadingModalOpen(true);
  };

  const handleOpenEdit = (reading: Reading) => {
    setEditingReading(reading);
    setDefaultSlot(undefined);
    setIsReadingModalOpen(true);
  };

  const handleOpenDelete = (reading: Reading) => {
    setDeletingReading(reading);
    setIsDeleteModalOpen(true);
  };

  const handleModalSuccess = () => {
    qClient.invalidateQueries({ queryKey: ["dailyReadings"] });
    qClient.invalidateQueries({ queryKey: ["report"] });
    qClient.invalidateQueries({ queryKey: ["readingsHistory"] });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      <Navbar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={() => handleOpenAdd()}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <DailyTimeline
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            readings={dailyReadings}
            onAddSlot={(slot) => handleOpenAdd(slot)}
            onEditReading={handleOpenEdit}
            onDeleteReading={handleOpenDelete}
          />
        )}

        {activeTab === "reports" && (
          <ReportsView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onAddReading={() => handleOpenAdd()}
          />
        )}

        {activeTab === "history" && (
          <ReadingsHistory
            onEditReading={handleOpenEdit}
            onDeleteReading={handleOpenDelete}
          />
        )}
      </main>

      {/* Add / Edit Reading Modal */}
      <ReadingModal
        isOpen={isReadingModalOpen}
        onClose={() => setIsReadingModalOpen(false)}
        onSuccess={handleModalSuccess}
        initialReading={editingReading}
        defaultDate={selectedDate}
        defaultSlot={defaultSlot}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        reading={deletingReading}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          if (deletingReading) {
            deleteMutation.mutate(deletingReading.id);
          }
        }}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainDashboard />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
