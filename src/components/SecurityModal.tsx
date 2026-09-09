import React, { useState } from 'react';
import { ShieldCheck, Lock, ExternalLink, Download, Code, X, Copy, Check } from 'lucide-react';
import { DriveFolderConfig, Note } from '../types';

interface SecurityModalProps {
  isOpen: boolean;
  salt: string | null;
  folder: DriveFolderConfig | null;
  notes: Note[];
  onGetRawCiphertext: (noteId: string) => Promise<string>;
  onExportBackup: () => string;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  salt,
  folder,
  notes,
  onGetRawCiphertext,
  onExportBackup,
  onClose,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');
  const [rawCiphertext, setRawCiphertext] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoadingRaw, setIsLoadingRaw] = useState(false);

  if (!isOpen) return null;

  const handleInspectNote = async (noteId: string) => {
    setSelectedNoteId(noteId);
    setIsLoadingRaw(true);
    try {
      const raw = await onGetRawCiphertext(noteId);
      setRawCiphertext(raw);
    } catch {
      setRawCiphertext('Failed to load raw encrypted payload.');
    } finally {
      setIsLoadingRaw(false);
    }
  };

  const handleDownloadBackup = () => {
    const jsonStr = onExportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keep-encrypted-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyRaw = () => {
    if (rawCiphertext) {
      navigator.clipboard.writeText(rawCiphertext);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const driveFolderUrl = folder ? `https://drive.google.com/drive/folders/${folder.folderId}` : null;

  return (
    <div
      id="security-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        id="security-modal-container"
        className="w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                End-to-End Encryption Architecture
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Zero-Knowledge Privacy • Client-side Web Crypto API
              </p>
            </div>
          </div>
          <button
            id="security-modal-close"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Architecture overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                Cipher Suite
              </span>
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">
                AES-256-GCM
              </span>
              <span className="text-xs text-neutral-500 mt-0.5 block">128-bit Auth Tag</span>
            </div>

            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                Key Derivation
              </span>
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">
                PBKDF2-SHA256
              </span>
              <span className="text-xs text-neutral-500 mt-0.5 block">100,000 Iterations</span>
            </div>

            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                Cloud Backend
              </span>
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block truncate">
                Google Drive
              </span>
              <span className="text-xs text-neutral-500 mt-0.5 block truncate">
                {folder?.folderName || 'Keep Notes (Encrypted)'}
              </span>
            </div>
          </div>

          {/* Drive folder link */}
          {driveFolderUrl && (
            <div className="flex items-center justify-between p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs text-amber-900 dark:text-amber-200">
                  Notes are stored as encrypted JSON payloads inside your personal Google Drive folder.
                </span>
              </div>
              <a
                href={driveFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 shrink-0 ml-2"
              >
                Open in Drive
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Inspect Ciphertext */}
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-neutral-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Inspect Live Encrypted Ciphertext
                </h3>
              </div>
              {rawCiphertext && (
                <button
                  onClick={handleCopyRaw}
                  className="text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Payload'}
                </button>
              )}
            </div>

            <p className="text-xs text-neutral-500 mb-3">
              Select a note to inspect its exact ciphertext structure as stored on Google Drive:
            </p>

            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {notes.slice(0, 8).map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleInspectNote(note.id)}
                  className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                    selectedNoteId === note.id
                      ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium'
                      : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  {note.title || 'Untitled note'}
                </button>
              ))}
            </div>

            <div className="bg-neutral-900 text-neutral-200 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48">
              {isLoadingRaw ? (
                <span className="text-neutral-400">Encrypting & generating payload...</span>
              ) : rawCiphertext ? (
                <pre>{rawCiphertext}</pre>
              ) : (
                <span className="text-neutral-400">Click a note button above to inspect its ciphertext.</span>
              )}
            </div>
          </div>

          {/* Salt & Backup */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80">
            <div>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                Workspace Salt:
              </span>
              <span className="text-[11px] font-mono text-neutral-500 break-all block mt-0.5">
                {salt || 'Derived dynamically'}
              </span>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="px-3.5 py-2 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-medium rounded-lg flex items-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Backup (.json)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
