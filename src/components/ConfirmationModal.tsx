import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="confirmation-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
    >
      <div
        id="confirmation-modal-container"
        className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            {isDestructive && (
              <div className="p-1.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
          </div>
          <button
            id="confirmation-modal-close"
            onClick={onCancel}
            className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-700">
          <button
            id="confirmation-modal-cancel-btn"
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            id="confirmation-modal-confirm-btn"
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors cursor-pointer shadow-xs ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500'
                : 'bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
