import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/auth';
import { KeepSyncEngine } from './services/sync';
import {
  Note,
  CurrentView,
  SyncStatus,
  UserProfile,
  DriveFolderConfig,
} from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { NoteCard } from './components/NoteCard';
import { NoteModal } from './components/NoteModal';
import { LabelManagerModal } from './components/LabelManagerModal';
import { PassphraseModal } from './components/PassphraseModal';
import { SecurityModal } from './components/SecurityModal';
import { CollaborateModal } from './components/CollaborateModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { LoginScreen } from './components/LoginScreen';
import {
  Lightbulb,
  Bell,
  Archive,
  Trash2,
  Tag,
  Search,
  AlertCircle,
  Pin,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [folder, setFolder] = useState<DriveFolderConfig | null>(null);
  const [salt, setSalt] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [labels, setLabels] = useState<string[]>(['Personal', 'Work', 'Ideas', 'Tasks']);
  const [currentView, setCurrentView] = useState<CurrentView>('notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGridView, setIsGridView] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals
  const [passphraseModalOpen, setPassphraseModalOpen] = useState(false);
  const [isNewPassphraseSetup, setIsNewPassphraseSetup] = useState(true);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [collaborateNote, setCollaborateNote] = useState<Note | null>(null);

  // Confirmation Modal
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const syncEngineRef = useRef<KeepSyncEngine | null>(null);

  // Initialize Sync Engine
  useEffect(() => {
    const engine = new KeepSyncEngine({
      onNotesUpdated: (updatedNotes) => {
        setNotes([...updatedNotes]);
      },
      onLabelsUpdated: (updatedLabels) => {
        setLabels([...updatedLabels]);
      },
      onSyncStatusChanged: (status, lastSync, err) => {
        setSyncStatus(status);
        if (lastSync) setLastSyncTime(lastSync);
        if (err) console.error('Sync status error:', err);
      },
      onPassphraseNeeded: (workspaceSalt, isNew) => {
        setSalt(workspaceSalt);
        setIsNewPassphraseSetup(isNew);
        setPassphraseModalOpen(true);
      },
      onFolderReady: (readyFolder) => {
        setFolder(readyFolder);
      },
    });

    syncEngineRef.current = engine;
  }, []);

  // Initialize Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (firebaseUser, token) => {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });
        setNeedsAuth(false);
        syncEngineRef.current?.setAuth(token, firebaseUser.uid);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        syncEngineRef.current?.setAuth(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser({
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        });
        setNeedsAuth(false);
        syncEngineRef.current?.setAuth(result.accessToken, result.user.uid);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAuthError('Sign in failed: ' + msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
    syncEngineRef.current?.setAuth(null);
  };

  const handleSetPassphrase = async (passphrase: string): Promise<boolean> => {
    if (!syncEngineRef.current) return false;
    const success = await syncEngineRef.current.setPassphrase(passphrase);
    if (success) {
      setPassphraseModalOpen(false);
    }
    return success;
  };

  const handleSaveNote = (noteData: Partial<Note> & { id?: string }) => {
    if (!syncEngineRef.current) return;
    const saved = syncEngineRef.current.saveNote(noteData);
    if (editingNote && editingNote.id === saved.id) {
      setEditingNote(saved);
    }
  };

  const handleRequestDelete = (note: Note, permanent: boolean) => {
    if (permanent) {
      // Destructive delete confirmation required
      setConfirmDialog({
        isOpen: true,
        title: 'Delete note permanently?',
        message: `This will permanently delete "${note.title || 'Untitled note'}" from Google Drive. This action cannot be undone.`,
        confirmLabel: 'Delete forever',
        isDestructive: true,
        onConfirm: () => {
          syncEngineRef.current?.deleteNotePermanently(note.id);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      // Move to trash
      handleSaveNote({
        id: note.id,
        isTrashed: true,
        trashedAt: new Date().toISOString(),
        isPinned: false,
      });
    }
  };

  const handleRequestRestore = (note: Note) => {
    handleSaveNote({
      id: note.id,
      isTrashed: false,
      trashedAt: undefined,
    });
  };

  const handleEmptyTrash = () => {
    const trashedCount = notes.filter((n) => n.isTrashed).length;
    if (trashedCount === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Empty trash?',
      message: `All ${trashedCount} note(s) in trash will be permanently deleted from Google Drive. This cannot be undone.`,
      confirmLabel: 'Empty Trash',
      isDestructive: true,
      onConfirm: () => {
        syncEngineRef.current?.emptyTrash();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleRequestDeleteLabel = (label: string) => {
    const affectedNotes = notes.filter((n) => n.labels.includes(label));
    setConfirmDialog({
      isOpen: true,
      title: `Delete label "${label}"?`,
      message: `We'll delete this label and remove it from ${affectedNotes.length} note(s). Your notes won't be deleted.`,
      confirmLabel: 'Delete label',
      isDestructive: true,
      onConfirm: () => {
        const newLabels = labels.filter((l) => l !== label);
        setLabels(newLabels);
        syncEngineRef.current?.updateLabels(newLabels);

        // Remove label from affected notes
        for (const n of affectedNotes) {
          handleSaveNote({
            id: n.id,
            labels: n.labels.filter((l) => l !== label),
          });
        }

        if (typeof currentView === 'object' && currentView.label === label) {
          setCurrentView('notes');
        }

        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSyncNow = () => {
    syncEngineRef.current?.syncWithDrive();
  };

  const handleGetRawCiphertext = async (noteId: string): Promise<string> => {
    if (!syncEngineRef.current) return '';
    return await syncEngineRef.current.getRawEncryptedPayload(noteId);
  };

  const handleExportBackup = (): string => {
    if (!syncEngineRef.current) return '{}';
    return syncEngineRef.current.exportEncryptedBackup();
  };

  // Filter notes based on view and search query
  const filteredNotes = useMemo(() => {
    let result = notes;

    // View filter
    if (currentView === 'notes') {
      result = result.filter((n) => !n.isArchived && !n.isTrashed);
    } else if (currentView === 'reminders') {
      result = result.filter((n) => n.reminder && !n.isTrashed);
    } else if (currentView === 'archive') {
      result = result.filter((n) => n.isArchived && !n.isTrashed);
    } else if (currentView === 'trash') {
      result = result.filter((n) => n.isTrashed);
    } else if (typeof currentView === 'object' && currentView.label) {
      result = result.filter((n) => !n.isTrashed && n.labels.includes(currentView.label));
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((n) => {
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchContent = n.content.toLowerCase().includes(q);
        const matchChecklist = n.checklist.some((c) => c.text.toLowerCase().includes(q));
        const matchLabels = n.labels.some((l) => l.toLowerCase().includes(q));
        return matchTitle || matchContent || matchChecklist || matchLabels;
      });
    }

    return result;
  }, [notes, currentView, searchQuery]);

  // Pinned vs Others separation (only in main notes view when not searching)
  const pinnedNotes = useMemo(() => {
    if (currentView !== 'notes' && typeof currentView !== 'object') return [];
    return filteredNotes.filter((n) => n.isPinned);
  }, [filteredNotes, currentView]);

  const unpinnedNotes = useMemo(() => {
    if (currentView !== 'notes' && typeof currentView !== 'object') return filteredNotes;
    if (pinnedNotes.length === 0) return filteredNotes;
    return filteredNotes.filter((n) => !n.isPinned);
  }, [filteredNotes, pinnedNotes, currentView]);

  // If not authenticated, show the Google Sign-in screen
  if (needsAuth) {
    return <LoginScreen onLogin={handleLogin} isLoading={isAuthLoading} error={authError} />;
  }

  const activeLabelString = typeof currentView === 'object' ? currentView.label : undefined;

  return (
    <div id="app-root" className="min-h-screen bg-[#fafaf9] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        syncStatus={syncStatus}
        lastSyncTime={lastSyncTime}
        onSyncNow={handleSyncNow}
        isGridView={isGridView}
        onToggleView={() => setIsGridView(!isGridView)}
        user={user}
        folder={folder}
        onOpenSecurity={() => setSecurityModalOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          labels={labels}
          notes={notes}
          isOpen={isSidebarOpen}
          onOpenLabelManager={() => setLabelManagerOpen(true)}
          onOpenSecurity={() => setSecurityModalOpen(true)}
        />

        {/* Main Content Workspace */}
        <main
          id="keep-main-content"
          className={`flex-1 overflow-y-auto px-3 sm:px-8 py-6 transition-all duration-200 ${
            isSidebarOpen ? 'lg:ml-0' : ''
          }`}
        >
          {/* Note Creator Box (Shown only in Notes or Label view) */}
          {(currentView === 'notes' || typeof currentView === 'object') && !searchQuery && (
            <NoteEditor
              labels={labels}
              onSaveNote={handleSaveNote}
              activeLabel={activeLabelString}
            />
          )}

          {/* Trash Banner */}
          {currentView === 'trash' && (
            <div
              id="trash-banner"
              className="max-w-xl mx-auto mb-6 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between gap-4 text-xs text-amber-900 dark:text-amber-200"
            >
              <span>Notes in Trash are deleted permanently after 7 days.</span>
              <button
                id="empty-trash-btn"
                onClick={handleEmptyTrash}
                disabled={notes.filter((n) => n.isTrashed).length === 0}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-medium rounded-lg shrink-0 transition-colors cursor-pointer"
              >
                Empty Trash
              </button>
            </div>
          )}

          {/* Archive Banner */}
          {currentView === 'archive' && (
            <div className="max-w-xl mx-auto mb-6 text-center text-xs text-neutral-400">
              Archived notes are kept safe in your encrypted Drive folder without cluttering your main view.
            </div>
          )}

          {/* Notes Grid / List */}
          {filteredNotes.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center text-neutral-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-1">
                {currentView === 'notes' && <Lightbulb className="w-8 h-8" />}
                {currentView === 'reminders' && <Bell className="w-8 h-8" />}
                {currentView === 'archive' && <Archive className="w-8 h-8" />}
                {currentView === 'trash' && <Trash2 className="w-8 h-8" />}
                {typeof currentView === 'object' && <Tag className="w-8 h-8" />}
              </div>
              <p className="text-base font-semibold text-neutral-600 dark:text-neutral-300">
                {searchQuery
                  ? 'No matching notes found'
                  : currentView === 'notes'
                  ? 'Notes you add appear here'
                  : currentView === 'reminders'
                  ? 'Notes with upcoming reminders appear here'
                  : currentView === 'archive'
                  ? 'Your archived notes appear here'
                  : currentView === 'trash'
                  ? 'No notes in Trash'
                  : `No notes with label "${activeLabelString}"`}
              </p>
              <p className="text-xs max-w-sm">
                {searchQuery
                  ? 'Try searching for different keywords or checking labels.'
                  : 'All notes are automatically encrypted with AES-256-GCM and synced with your Google Drive.'}
              </p>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Pinned Section */}
              {pinnedNotes.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 px-1">
                    <Pin className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pinned ({pinnedNotes.length})</span>
                  </div>
                  <div
                    className={
                      isGridView
                        ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start'
                        : 'max-w-2xl mx-auto space-y-3'
                    }
                  >
                    {pinnedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        labels={labels}
                        onClick={() => setEditingNote(note)}
                        onUpdateNote={handleSaveNote}
                        onRequestDelete={handleRequestDelete}
                        onRequestRestore={handleRequestRestore}
                        onOpenCollaborate={(n) => setCollaborateNote(n)}
                        onInspectRaw={() => setSecurityModalOpen(true)}
                        onFilterByLabel={(l) => setCurrentView({ label: l })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Others / Main Section */}
              <div>
                {pinnedNotes.length > 0 && (
                  <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 px-1">
                    Others ({unpinnedNotes.length})
                  </div>
                )}
                <div
                  className={
                    isGridView
                      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start'
                      : 'max-w-2xl mx-auto space-y-3'
                  }
                >
                  {unpinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      labels={labels}
                      onClick={() => setEditingNote(note)}
                      onUpdateNote={handleSaveNote}
                      onRequestDelete={handleRequestDelete}
                      onRequestRestore={handleRequestRestore}
                      onOpenCollaborate={(n) => setCollaborateNote(n)}
                      onInspectRaw={() => setSecurityModalOpen(true)}
                      onFilterByLabel={(l) => setCurrentView({ label: l })}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Note Edit Modal */}
      <NoteModal
        isOpen={Boolean(editingNote)}
        note={editingNote}
        labels={labels}
        onSaveNote={handleSaveNote}
        onRequestDelete={handleRequestDelete}
        onOpenCollaborate={(n) => setCollaborateNote(n)}
        onClose={() => setEditingNote(null)}
      />

      {/* Passphrase Setup / Unlock Modal */}
      <PassphraseModal
        isOpen={passphraseModalOpen}
        isNewSetup={isNewPassphraseSetup}
        onSetPassphrase={handleSetPassphrase}
      />

      {/* Label Manager Modal */}
      <LabelManagerModal
        isOpen={labelManagerOpen}
        labels={labels}
        onSaveLabels={(updated) => {
          setLabels(updated);
          syncEngineRef.current?.updateLabels(updated);
        }}
        onRequestDeleteLabel={handleRequestDeleteLabel}
        onClose={() => setLabelManagerOpen(false)}
      />

      {/* E2EE Security & Storage Inspection Modal */}
      <SecurityModal
        isOpen={securityModalOpen}
        salt={salt}
        folder={folder}
        notes={notes}
        onGetRawCiphertext={handleGetRawCiphertext}
        onExportBackup={handleExportBackup}
        onClose={() => setSecurityModalOpen(false)}
      />

      {/* Collaboration / Share Modal */}
      <CollaborateModal
        isOpen={Boolean(collaborateNote)}
        note={collaborateNote}
        onUpdateCollaborators={(noteId, collabs) => {
          handleSaveNote({ id: noteId, collaborators: collabs });
          if (collaborateNote) {
            setCollaborateNote({ ...collaborateNote, collaborators: collabs });
          }
        }}
        onClose={() => setCollaborateNote(null)}
      />

      {/* Confirmation Modal for Destructive Operations */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
