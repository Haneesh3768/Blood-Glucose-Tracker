import React from "react";
import { AlertTriangle } from "lucide-react";
import type { Reading } from "../../types/index.js";
import { formatDisplayDate } from "../../utils/glucose.js";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  reading: Reading | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  reading,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !reading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Reading?</h3>
        <p className="text-sm text-slate-600 mb-4">
          Are you sure you want to remove the{" "}
          <strong className="text-slate-900">{reading.timeSlot}</strong> reading (
          <strong className="text-slate-900">{reading.value} mg/dl</strong>) on{" "}
          <strong className="text-slate-900">
            {formatDisplayDate(reading.readingDate)}
          </strong>
          ? This action cannot be undone.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm transition disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

