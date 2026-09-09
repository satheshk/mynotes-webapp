import React, { useState } from 'react';
import { Users, Copy, Check, X, Share2, Plus, Mail } from 'lucide-react';
import { Note } from '../types';

interface CollaborateModalProps {
  isOpen: boolean;
  note: Note | null;
  onUpdateCollaborators: (noteId: string, collaborators: string[]) => void;
  onClose: () => void;
}

export const CollaborateModal: React.FC<CollaborateModalProps> = ({
  isOpen,
  note,
  onUpdateCollaborators,
  onClose,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!isOpen || !note) return null;

  const collaborators = note.collaborators || [];

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    if (!collaborators.includes(newEmail.trim())) {
      onUpdateCollaborators(note.id, [...collaborators, newEmail.trim()]);
    }
    setNewEmail('');
  };

  const handleRemoveCollaborator = (email: string) => {
    onUpdateCollaborators(
      note.id,
      collaborators.filter((c) => c !== email)
    );
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/#sharedNote=${encodeURIComponent(note.id)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyNoteExport = () => {
    const payload = JSON.stringify(
      {
        title: note.title,
        content: note.content,
        checklist: note.checklist,
        isChecklist: note.isChecklist,
        color: note.color,
        labels: note.labels,
      },
      null,
      2
    );
    navigator.clipboard.writeText(payload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div
      id="collaborate-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        id="collaborate-modal-card"
        className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Collaborators & Sharing
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              Note Title
            </span>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {note.title || 'Untitled Note'}
            </p>
          </div>

          {/* Add collaborator */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Add Collaborator Email
            </label>
            <form onSubmit={handleAddCollaborator} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="collaborator@example.com"
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>
          </div>

          {/* Collaborator list */}
          {collaborators.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-2">
                Active Collaborators ({collaborators.length})
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {collaborators.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700/60 text-xs"
                  >
                    <span className="truncate text-neutral-800 dark:text-neutral-200">{email}</span>
                    <button
                      onClick={() => handleRemoveCollaborator(email)}
                      className="text-neutral-400 hover:text-red-500 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Share Links */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-700 space-y-2">
            <button
              onClick={handleCopyShareLink}
              className="w-full py-2 px-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
              {copiedLink ? 'Link Copied to Clipboard!' : 'Copy Direct Link to Note'}
            </button>
            <button
              onClick={handleCopyNoteExport}
              className="w-full py-2 px-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copiedPayload ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copiedPayload ? 'Note Export Copied!' : 'Copy Note as JSON Snapshot'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
