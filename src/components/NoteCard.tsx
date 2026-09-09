import React, { useState, useRef, useEffect } from 'react';
import {
  Pin,
  Palette,
  Bell,
  Archive,
  ArchiveRestore,
  Trash2,
  MoreVertical,
  Tag,
  Users,
  Copy,
  Code,
  RotateCcw,
  Check,
  CheckSquare,
} from 'lucide-react';
import { Note, NoteColor, NOTE_COLORS } from '../types';

interface NoteCardProps {
  note: Note;
  labels: string[];
  onClick: () => void;
  onUpdateNote: (note: Partial<Note> & { id: string }) => void;
  onRequestDelete: (note: Note, permanent: boolean) => void;
  onRequestRestore?: (note: Note) => void;
  onOpenCollaborate: (note: Note) => void;
  onInspectRaw: (note: Note) => void;
  onFilterByLabel?: (label: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  labels,
  onClick,
  onUpdateNote,
  onRequestDelete,
  onRequestRestore,
  onOpenCollaborate,
  onInspectRaw,
  onFilterByLabel,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
        setShowColorPicker(false);
        setShowLabelPicker(false);
        setShowReminderPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const colorConfig = NOTE_COLORS[note.color || 'default'];

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateNote({ id: note.id, isPinned: !note.isPinned });
  };

  const handleToggleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateNote({ id: note.id, isArchived: !note.isArchived, isPinned: false });
  };

  const handleToggleCheckItem = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    const updated = note.checklist.map((ci) =>
      ci.id === itemId ? { ...ci, completed: !ci.completed } : ci
    );
    onUpdateNote({ id: note.id, checklist: updated });
  };

  const handleColorSelect = (e: React.MouseEvent, newColor: NoteColor) => {
    e.stopPropagation();
    onUpdateNote({ id: note.id, color: newColor });
    setShowColorPicker(false);
  };

  const handleToggleLabel = (e: React.MouseEvent, label: string) => {
    e.stopPropagation();
    const current = note.labels || [];
    const updated = current.includes(label)
      ? current.filter((l) => l !== label)
      : [...current, label];
    onUpdateNote({ id: note.id, labels: updated });
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateNote({
      title: note.title ? `${note.title} (Copy)` : 'Copy',
      content: note.content,
      checklist: note.checklist,
      isChecklist: note.isChecklist,
      color: note.color,
      labels: note.labels,
      isPinned: false,
      isArchived: false,
      isTrashed: false,
    });
    setShowMoreMenu(false);
  };

  const handleCopyText = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${note.title ? note.title + '\n\n' : ''}${
      note.isChecklist
        ? note.checklist.map((c) => `[${c.completed ? 'x' : ' '}] ${c.text}`).join('\n')
        : note.content
    }`;
    navigator.clipboard.writeText(text);
    setShowMoreMenu(false);
  };

  return (
    <div
      id={`note-card-${note.id}`}
      onClick={onClick}
      className={`group relative rounded-2xl p-4 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${colorConfig.borderClass} ${colorConfig.bgClass} flex flex-col justify-between overflow-visible`}
    >
      <div>
        {/* Header: Title and Pin button */}
        <div className="flex items-start justify-between gap-2 mb-2">
          {note.title ? (
            <h3 className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-100 line-clamp-2">
              {note.title}
            </h3>
          ) : (
            <div />
          )}

          {!note.isTrashed && (
            <button
              onClick={handleTogglePin}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                note.isPinned
                  ? 'opacity-100 text-amber-600 bg-amber-100/70 dark:bg-amber-900/40'
                  : 'opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
              title={note.isPinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-amber-600' : ''}`} />
            </button>
          )}
        </div>

        {/* Body content */}
        {!note.isChecklist ? (
          note.content && (
            <p className="text-xs text-neutral-700 dark:text-neutral-200 whitespace-pre-wrap line-clamp-8 leading-relaxed mb-3">
              {note.content}
            </p>
          )
        ) : (
          /* Checklist preview */
          <div className="space-y-1 mb-3">
            {note.checklist.slice(0, 7).map((item) => (
              <div
                key={item.id}
                onClick={(e) => handleToggleCheckItem(e, item.id)}
                className="flex items-center gap-2 text-xs cursor-pointer group/item"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => {}}
                  className="w-3.5 h-3.5 rounded-xs text-amber-600 accent-amber-500 pointer-events-none"
                />
                <span
                  className={`truncate ${
                    item.completed ? 'line-through text-neutral-400' : 'text-neutral-700 dark:text-neutral-200'
                  }`}
                >
                  {item.text}
                </span>
              </div>
            ))}
            {note.checklist.length > 7 && (
              <span className="text-[11px] text-neutral-400 block pt-0.5">
                +{note.checklist.length - 7} more items
              </span>
            )}
          </div>
        )}

        {/* Labels & Reminder badges */}
        {(note.reminder || (note.labels && note.labels.length > 0) || (note.collaborators && note.collaborators.length > 0)) && (
          <div className="flex flex-wrap items-center gap-1 mb-3">
            {note.reminder && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-black/5 dark:bg-white/10 font-medium text-neutral-700 dark:text-neutral-200">
                <Bell className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                {new Date(note.reminder).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}

            {note.labels?.map((label) => (
              <span
                key={label}
                onClick={(e) => {
                  e.stopPropagation();
                  onFilterByLabel?.(label);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-200 hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                title={`Filter notes with "${label}"`}
              >
                <Tag className="w-2.5 h-2.5 text-neutral-400" />
                {label}
              </span>
            ))}

            {note.collaborators && note.collaborators.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                <Users className="w-2.5 h-2.5" />
                {note.collaborators.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Footer (Keep style) */}
      <div
        className="flex items-center justify-between pt-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
        ref={moreMenuRef}
      >
        {!note.isTrashed ? (
          <div className="flex items-center gap-0.5 text-neutral-500 relative">
            {/* Reminder */}
            <div className="relative">
              <button
                onClick={() => setShowReminderPicker(!showReminderPicker)}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Remind me"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>

              {showReminderPicker && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50 w-48 space-y-1.5">
                  <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block">
                    Set reminder
                  </span>
                  <input
                    type="datetime-local"
                    value={note.reminder ? note.reminder.substring(0, 16) : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        onUpdateNote({ id: note.id, reminder: new Date(e.target.value).toISOString() });
                      }
                      setShowReminderPicker(false);
                    }}
                    className="w-full text-xs p-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md"
                  />
                  {note.reminder && (
                    <button
                      onClick={() => {
                        onUpdateNote({ id: note.id, reminder: undefined });
                        setShowReminderPicker(false);
                      }}
                      className="text-[11px] text-red-500 hover:underline block pt-1"
                    >
                      Remove reminder
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Collaborate */}
            <button
              onClick={() => onOpenCollaborate(note)}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Collaborator"
            >
              <Users className="w-3.5 h-3.5" />
            </button>

            {/* Color Palette */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Background options"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>

              {showColorPicker && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 grid grid-cols-4 gap-1.5 z-50 w-36">
                  {(Object.keys(NOTE_COLORS) as NoteColor[]).map((cKey) => {
                    const c = NOTE_COLORS[cKey];
                    return (
                      <button
                        key={cKey}
                        onClick={(e) => handleColorSelect(e, cKey)}
                        className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                          note.color === cKey ? 'border-amber-600 ring-1 ring-amber-500' : 'border-neutral-300'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {note.color === cKey && <Check className="w-2.5 h-2.5 text-neutral-800" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Archive */}
            <button
              onClick={handleToggleArchive}
              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title={note.isArchived ? 'Unarchive' : 'Archive'}
            >
              {note.isArchived ? (
                <ArchiveRestore className="w-3.5 h-3.5" />
              ) : (
                <Archive className="w-3.5 h-3.5" />
              )}
            </button>

            {/* More options menu */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="More"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {showMoreMenu && (
                <div className="absolute bottom-full right-0 sm:left-0 mb-2 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-1.5 z-50 text-xs">
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      onRequestDelete(note, false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Move to trash
                  </button>

                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowLabelPicker(true);
                    }}
                    className="w-full px-3 py-1.5 text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Change labels
                  </button>

                  <button
                    onClick={handleDuplicate}
                    className="w-full px-3 py-1.5 text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Make a copy
                  </button>

                  <button
                    onClick={handleCopyText}
                    className="w-full px-3 py-1.5 text-left text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Copy note text
                  </button>

                  <div className="border-t border-neutral-100 dark:border-neutral-700 my-1" />

                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      onInspectRaw(note);
                    }}
                    className="w-full px-3 py-1.5 text-left text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2"
                  >
                    <Code className="w-3.5 h-3.5" />
                    View Drive Ciphertext
                  </button>
                </div>
              )}

              {/* Label Selector popover */}
              {showLabelPicker && (
                <div className="absolute bottom-full left-0 mb-2 p-3 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50 w-48 space-y-1.5 max-h-48 overflow-y-auto">
                  <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block">
                    Labels
                  </span>
                  {labels.map((l) => (
                    <label
                      key={l}
                      className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 p-1 rounded-md"
                    >
                      <input
                        type="checkbox"
                        checked={note.labels?.includes(l) || false}
                        onChange={(e) => handleToggleLabel(e as unknown as React.MouseEvent, l)}
                        className="rounded-xs text-amber-500 accent-amber-500"
                      />
                      <span className="truncate">{l}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Trash View Actions */
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRequestRestore?.(note)}
              className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Restore note"
            >
              <RotateCcw className="w-4 h-4 text-emerald-600" />
            </button>

            <button
              onClick={() => onRequestDelete(note, true)}
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors cursor-pointer"
              title="Delete permanently (Confirmation required)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
