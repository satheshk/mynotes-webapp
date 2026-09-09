import React, { useState, useRef, useEffect } from 'react';
import {
  CheckSquare,
  Palette,
  Bell,
  Tag,
  Pin,
  Plus,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { Note, NoteColor, ChecklistItem, NOTE_COLORS } from '../types';

interface NoteEditorProps {
  labels: string[];
  onSaveNote: (note: Partial<Note>) => void;
  activeLabel?: string;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  labels,
  onSaveNote,
  activeLabel,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isChecklist, setIsChecklist] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [color, setColor] = useState<NoteColor>('default');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(activeLabel ? [activeLabel] : []);
  const [isPinned, setIsPinned] = useState(false);
  const [reminder, setReminder] = useState<string | undefined>(undefined);

  // Popover states
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeLabel && !selectedLabels.includes(activeLabel)) {
      setSelectedLabels([activeLabel]);
    }
  }, [activeLabel]);

  // Click outside to save and collapse
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (isExpanded) {
          handleSaveAndClose();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, title, content, checklist, isChecklist, color, selectedLabels, isPinned, reminder]);

  const handleSaveAndClose = () => {
    const hasText = title.trim() || content.trim();
    const hasChecklist = isChecklist && checklist.some((item) => item.text.trim());

    if (hasText || hasChecklist) {
      onSaveNote({
        title: title.trim(),
        content: content.trim(),
        checklist: checklist.filter((item) => item.text.trim()),
        isChecklist,
        color,
        labels: selectedLabels,
        isPinned,
        reminder,
      });
    }

    // Reset fields
    setTitle('');
    setContent('');
    setIsChecklist(false);
    setChecklist([]);
    setNewChecklistText('');
    setColor('default');
    setSelectedLabels(activeLabel ? [activeLabel] : []);
    setIsPinned(false);
    setReminder(undefined);
    setShowColorPicker(false);
    setShowLabelPicker(false);
    setShowReminderPicker(false);
    setIsExpanded(false);
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    setChecklist([
      ...checklist,
      {
        id: 'cl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        text: newChecklistText.trim(),
        completed: false,
      },
    ]);
    setNewChecklistText('');
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist(
      checklist.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleDeleteChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const toggleLabel = (label: string) => {
    if (selectedLabels.includes(label)) {
      setSelectedLabels(selectedLabels.filter((l) => l !== label));
    } else {
      setSelectedLabels([...selectedLabels, label]);
    }
  };

  const colorConfig = NOTE_COLORS[color];

  return (
    <div className="w-full max-w-xl mx-auto mb-6 sm:mb-8 px-2 sm:px-0">
      <div
        ref={containerRef}
        id="note-editor-card"
        className={`rounded-2xl transition-all duration-200 border ${colorConfig.borderClass} ${colorConfig.bgClass} shadow-md overflow-visible relative`}
      >
        {!isExpanded ? (
          /* Collapsed View */
          <div
            onClick={() => setIsExpanded(true)}
            className="flex items-center justify-between px-4 py-3 cursor-text text-neutral-500 dark:text-neutral-400"
          >
            <span className="text-sm font-medium">Take a note...</span>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                id="start-checklist-btn"
                onClick={() => {
                  setIsExpanded(true);
                  setIsChecklist(true);
                }}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer text-neutral-600 dark:text-neutral-300"
                title="New list"
              >
                <CheckSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Expanded View */
          <div className="p-4 space-y-3">
            {/* Title & Pin */}
            <div className="flex items-start justify-between gap-2">
              <input
                id="note-editor-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full bg-transparent font-semibold text-base focus:outline-none placeholder:text-neutral-400 text-inherit"
                autoFocus
              />
              <button
                id="note-editor-pin-btn"
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isPinned
                    ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/40'
                    : 'text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
                title={isPinned ? 'Unpin note' : 'Pin note'}
              >
                <Pin className={`w-4 h-4 ${isPinned ? 'fill-amber-600' : ''}`} />
              </button>
            </div>

            {/* Note Content (Text or Checklist) */}
            {!isChecklist ? (
              <textarea
                id="note-editor-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Take a note..."
                rows={3}
                className="w-full bg-transparent text-sm focus:outline-none resize-none placeholder:text-neutral-400 text-inherit leading-relaxed"
              />
            ) : (
              /* Checklist view */
              <div className="space-y-1.5">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklistItem(item.id)}
                      className="w-4 h-4 rounded-sm text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-500"
                    />
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) =>
                        setChecklist(
                          checklist.map((ci) =>
                            ci.id === item.id ? { ...ci, text: e.target.value } : ci
                          )
                        )
                      }
                      className={`flex-1 bg-transparent text-sm focus:outline-none text-inherit ${
                        item.completed ? 'line-through text-neutral-400' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-500 transition-opacity p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add checklist item */}
                <form onSubmit={handleAddChecklistItem} className="flex items-center gap-2 pt-1">
                  <Plus className="w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    placeholder="List item..."
                    className="flex-1 bg-transparent text-sm focus:outline-none text-inherit placeholder:text-neutral-400"
                  />
                </form>
              </div>
            )}

            {/* Label Chips & Reminder Badge */}
            {(selectedLabels.length > 0 || reminder) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {reminder && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-black/5 dark:bg-white/10 font-medium">
                    <Bell className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    {new Date(reminder).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    <button
                      type="button"
                      onClick={() => setReminder(undefined)}
                      className="hover:text-red-500 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedLabels.map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-black/5 dark:bg-white/10 font-medium"
                  >
                    <Tag className="w-3 h-3 text-neutral-500" />
                    {l}
                    <button
                      type="button"
                      onClick={() => toggleLabel(l)}
                      className="hover:text-red-500 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/10">
              <div className="flex items-center gap-0.5 text-neutral-600 dark:text-neutral-300 relative">
                {/* Color Palette button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    title="Background options"
                  >
                    <Palette className="w-4 h-4" />
                  </button>

                  {showColorPicker && (
                    <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 grid grid-cols-4 sm:grid-cols-6 gap-1.5 z-50">
                      {(Object.keys(NOTE_COLORS) as NoteColor[]).map((cKey) => {
                        const c = NOTE_COLORS[cKey];
                        return (
                          <button
                            key={cKey}
                            type="button"
                            onClick={() => {
                              setColor(cKey);
                              setShowColorPicker(false);
                            }}
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                              color === cKey ? 'border-amber-600 ring-1 ring-amber-500' : 'border-neutral-300'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          >
                            {color === cKey && <Check className="w-3 h-3 text-neutral-800" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Reminder button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowReminderPicker(!showReminderPicker)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    title="Remind me"
                  >
                    <Bell className="w-4 h-4" />
                  </button>

                  {showReminderPicker && (
                    <div className="absolute bottom-full left-0 mb-2 p-3 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 space-y-2 z-50 w-52">
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                        Set Reminder Date
                      </span>
                      <input
                        type="datetime-local"
                        value={reminder ? reminder.substring(0, 16) : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            setReminder(new Date(e.target.value).toISOString());
                          }
                          setShowReminderPicker(false);
                        }}
                        className="w-full text-xs p-1.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                      />
                    </div>
                  )}
                </div>

                {/* Label button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLabelPicker(!showLabelPicker)}
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    title="Change labels"
                  >
                    <Tag className="w-4 h-4" />
                  </button>

                  {showLabelPicker && (
                    <div className="absolute bottom-full left-0 mb-2 p-3 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 space-y-2 z-50 w-48 max-h-48 overflow-y-auto">
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                        Label Note
                      </span>
                      {labels.length === 0 ? (
                        <p className="text-xs text-neutral-400">No labels created yet</p>
                      ) : (
                        labels.map((l) => (
                          <label
                            key={l}
                            className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 p-1 rounded-md"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLabels.includes(l)}
                              onChange={() => toggleLabel(l)}
                              className="rounded-xs text-amber-500 accent-amber-500"
                            />
                            <span className="truncate">{l}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Checklist Mode button */}
                <button
                  type="button"
                  onClick={() => setIsChecklist(!isChecklist)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    isChecklist
                      ? 'text-amber-600 bg-amber-100/80 dark:bg-amber-900/40'
                      : 'hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                  title={isChecklist ? 'Switch to text note' : 'Switch to checklist'}
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
              </div>

              {/* Close / Save Button */}
              <button
                id="note-editor-close-btn"
                type="button"
                onClick={handleSaveAndClose}
                className="px-4 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-100 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
