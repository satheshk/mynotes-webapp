import React, { useState } from 'react';
import { Tag, Plus, Check, Trash2, X, Edit2 } from 'lucide-react';

interface LabelManagerModalProps {
  isOpen: boolean;
  labels: string[];
  onSaveLabels: (labels: string[]) => void;
  onRequestDeleteLabel: (label: string) => void;
  onClose: () => void;
}

export const LabelManagerModal: React.FC<LabelManagerModalProps> = ({
  isOpen,
  labels,
  onSaveLabels,
  onRequestDeleteLabel,
  onClose,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLabel.trim();
    if (trimmed && !labels.includes(trimmed)) {
      onSaveLabels([...labels, trimmed]);
      setNewLabel('');
    }
  };

  const handleStartEdit = (index: number, text: string) => {
    setEditingIndex(index);
    setEditingText(text);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editingText.trim();
    if (trimmed && trimmed !== labels[index]) {
      const updated = [...labels];
      updated[index] = trimmed;
      onSaveLabels(updated);
    }
    setEditingIndex(null);
  };

  return (
    <div
      id="label-manager-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        id="label-manager-modal-card"
        className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Edit Labels</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Create new label input */}
          <form onSubmit={handleAdd} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Tag className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                id="create-label-input"
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Create new label..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900 dark:text-neutral-100"
              />
              {newLabel && (
                <button
                  type="button"
                  onClick={() => setNewLabel('')}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!newLabel.trim()}
              className="p-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Label list */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {labels.map((label, index) => (
              <div
                key={label + index}
                className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-700/80 group"
              >
                {editingIndex === index ? (
                  <div className="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-white dark:bg-neutral-800 border border-amber-500 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(index)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                    <Tag className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="text-xs text-neutral-800 dark:text-neutral-200 truncate">{label}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 shrink-0">
                  {editingIndex !== index && (
                    <button
                      onClick={() => handleStartEdit(index, label)}
                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      title="Rename label"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onRequestDeleteLabel(label)}
                    className="p-1 text-neutral-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Delete label"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end border-t border-neutral-100 dark:border-neutral-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
