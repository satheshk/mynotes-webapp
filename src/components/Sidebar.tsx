import React from 'react';
import {
  Lightbulb,
  Bell,
  Tag,
  Pencil,
  Archive,
  Trash2,
  Shield,
  FolderLock,
} from 'lucide-react';
import { CurrentView, Note } from '../types';

interface SidebarProps {
  currentView: CurrentView;
  onSelectView: (view: CurrentView) => void;
  labels: string[];
  notes: Note[];
  isOpen: boolean;
  onOpenLabelManager: () => void;
  onOpenSecurity: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  labels,
  notes,
  isOpen,
  onOpenLabelManager,
  onOpenSecurity,
}) => {
  const activeNotesCount = notes.filter((n) => !n.isArchived && !n.isTrashed).length;
  const remindersCount = notes.filter((n) => n.reminder && !n.isTrashed).length;
  const archivedCount = notes.filter((n) => n.isArchived && !n.isTrashed).length;
  const trashedCount = notes.filter((n) => n.isTrashed).length;

  const isViewActive = (view: CurrentView): boolean => {
    if (typeof view === 'string' && typeof currentView === 'string') {
      return view === currentView;
    }
    if (typeof view === 'object' && typeof currentView === 'object') {
      return view.label === currentView.label;
    }
    return false;
  };

  const getLabelCount = (label: string): number => {
    return notes.filter((n) => !n.isTrashed && n.labels.includes(label)).length;
  };

  return (
    <aside
      id="keep-sidebar"
      className={`fixed lg:static top-[57px] bottom-0 left-0 z-20 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-200 overflow-y-auto ${
        isOpen ? 'w-64 shadow-xl lg:shadow-none translate-x-0' : 'w-0 lg:w-16 -translate-x-full lg:translate-x-0 overflow-hidden'
      }`}
    >
      <div className="py-3 space-y-1">
        {/* Notes */}
        <button
          id="nav-notes"
          onClick={() => onSelectView('notes')}
          className={`w-full flex items-center gap-6 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
            isOpen ? 'rounded-r-full mr-3' : 'justify-center rounded-xl mx-2 w-12 h-12'
          } ${
            isViewActive('notes')
              ? 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-semibold'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title="Notes"
        >
          <Lightbulb className="w-5 h-5 shrink-0 text-amber-500" />
          {isOpen && (
            <div className="flex items-center justify-between flex-1 min-w-0 pr-2">
              <span className="truncate">Notes</span>
              <span className="text-xs font-normal text-neutral-400">{activeNotesCount}</span>
            </div>
          )}
        </button>

        {/* Reminders */}
        <button
          id="nav-reminders"
          onClick={() => onSelectView('reminders')}
          className={`w-full flex items-center gap-6 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
            isOpen ? 'rounded-r-full mr-3' : 'justify-center rounded-xl mx-2 w-12 h-12'
          } ${
            isViewActive('reminders')
              ? 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-semibold'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title="Reminders"
        >
          <Bell className="w-5 h-5 shrink-0 text-neutral-500" />
          {isOpen && (
            <div className="flex items-center justify-between flex-1 min-w-0 pr-2">
              <span className="truncate">Reminders</span>
              {remindersCount > 0 && (
                <span className="text-xs font-normal text-neutral-400">{remindersCount}</span>
              )}
            </div>
          )}
        </button>

        {/* Labels Divider */}
        <div className="my-2 border-t border-neutral-200 dark:border-neutral-800" />

        {/* Labels list */}
        {labels.map((label) => {
          const count = getLabelCount(label);
          return (
            <button
              key={label}
              id={`nav-label-${label}`}
              onClick={() => onSelectView({ label })}
              className={`w-full flex items-center gap-6 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
                isOpen ? 'rounded-r-full mr-3' : 'justify-center rounded-xl mx-2 w-12 h-12'
              } ${
                isViewActive({ label })
                  ? 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-semibold'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title={label}
            >
              <Tag className="w-5 h-5 shrink-0 text-neutral-400" />
              {isOpen && (
                <div className="flex items-center justify-between flex-1 min-w-0 pr-2">
                  <span className="truncate">{label}</span>
                  {count > 0 && <span className="text-xs font-normal text-neutral-400">{count}</span>}
                </div>
              )}
            </button>
          );
        })}

        {/* Edit labels */}
        <button
          id="nav-edit-labels"
          onClick={onOpenLabelManager}
          className={`w-full flex items-center gap-6 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
            isOpen ? 'rounded-r-full mr-3' : 'justify-center rounded-xl mx-2 w-12 h-12'
          }`}
          title="Edit labels"
        >
          <Pencil className="w-5 h-5 shrink-0 text-neutral-400" />
          {isOpen && <span className="truncate">Edit labels</span>}
        </button>

        {/* Archive & Trash Divider */}
        <div className="my-2 border-t border-neutral-200 dark:border-neutral-800" />

        {/* Archive */}
        <button
          id="nav-archive"
          onClick={() => onSelectView('archive')}
          className={`w-full flex items-center gap-6 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
            isOpen ? 'rounded-r-full mr-3' : 'justify-center rounded-xl mx-2 w-12 h-12'
          } ${
            isViewActive('archive')
              ? 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-semibold'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title="Archive"
        >
          <Archive className="w-5 h-5 shrink-0 text-neutral-500" />
          {isOpen && (
            <div className="flex items-center justify-between flex-1 min-w-0 pr-2">
              <span className="truncate">Archive</span>
              {archivedCount > 0 && (
                <span className="text-xs font-normal text-neutral-400">{archivedCount}</span>
              )}
            </div>
          )}
        </button>

        {/* Trash */}
        <button
          id="nav-trash"
          onClick={() => onSelectView('trash')}
          className={`w-full flex items-center gap-6 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
            isOpen ? 'rounded-r-full mr-3' : 'justify-center rounded-xl mx-2 w-12 h-12'
          } ${
            isViewActive('trash')
              ? 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-semibold'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title="Trash"
        >
          <Trash2 className="w-5 h-5 shrink-0 text-neutral-500" />
          {isOpen && (
            <div className="flex items-center justify-between flex-1 min-w-0 pr-2">
              <span className="truncate">Trash</span>
              {trashedCount > 0 && (
                <span className="text-xs font-normal text-neutral-400">{trashedCount}</span>
              )}
            </div>
          )}
        </button>

        {/* E2EE Info button */}
        <button
          id="nav-e2ee-security"
          onClick={onOpenSecurity}
          className={`w-full flex items-center gap-6 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer ${
            isOpen ? 'rounded-r-full mr-3' : 'justify-center rounded-xl mx-2 w-12 h-12'
          }`}
          title="E2EE Security & Storage"
        >
          <Shield className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          {isOpen && <span className="truncate">E2EE Security</span>}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 mt-8 border-t border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-2 text-neutral-400 text-xs">
            <FolderLock className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">Stored in Google Drive</span>
          </div>
        </div>
      )}
    </aside>
  );
};
