import { Note, AppMetadata, DriveFolderConfig, SyncStatus, AppsScriptApp } from '../types';
import {
  getOrCreateKeepFolder,
  loadMetadata,
  saveMetadata,
  listNoteFiles,
  downloadNotePayload,
  uploadNotePayload,
  deleteNoteFile,
  DEFAULT_FOLDER_NAME,
} from './drive';
import {
  encryptData,
  decryptData,
  createCanary,
  verifyCanary,
  generateSalt,
  deriveKeyFromPassphrase,
} from './crypto';

const LOCAL_STORAGE_NOTES_PREFIX = 'keep_notes_cache_';
const LOCAL_STORAGE_META_PREFIX = 'keep_meta_cache_';

export interface SyncEngineEvents {
  onNotesUpdated: (notes: Note[]) => void;
  onLabelsUpdated: (labels: string[]) => void;
  onAppsScriptsUpdated?: (scripts: AppsScriptApp[]) => void;
  onSyncStatusChanged: (status: SyncStatus, lastSync: Date | null, error: string | null) => void;
  onPassphraseNeeded: (salt: string, isNewSetup: boolean) => void;
  onFolderReady: (folder: DriveFolderConfig) => void;
}

export class KeepSyncEngine {
  private accessToken: string | null = null;
  private cryptoKey: CryptoKey | null = null;
  private salt: string | null = null;
  private folder: DriveFolderConfig | null = null;
  private metadata: AppMetadata | null = null;
  private notes: Map<string, Note> = new Map();
  private pendingUploads: Set<string> = new Set();
  private pendingDeletions: Set<{ noteId: string; driveFileId: string }> = new Set();
  private syncTimer: number | null = null;
  private debounceTimer: number | null = null;
  private isSyncing = false;
  private lastSyncTime: Date | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private events: SyncEngineEvents;
  private userId: string = 'default';

  constructor(events: SyncEngineEvents) {
    this.events = events;

    // Set up cross-tab broadcast channel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('keep_e2ee_sync_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'NOTES_UPDATED') {
            this.loadFromLocalStorage();
            this.events.onNotesUpdated(this.getNotesList());
          } else if (event.data?.type === 'LABELS_UPDATED') {
            this.events.onLabelsUpdated(event.data.labels);
          } else if (event.data?.type === 'APPS_SCRIPTS_UPDATED') {
            this.events.onAppsScriptsUpdated?.(event.data.appsScripts || []);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or restricted:', e);
      }
    }

    // React to tab visibility
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.accessToken && this.cryptoKey) {
          this.syncWithDrive();
        }
      });
    }
  }

  public setAuth(accessToken: string | null, userId: string = 'default') {
    this.accessToken = accessToken;
    this.userId = userId;
    if (accessToken) {
      this.loadFromLocalStorage();
      this.initializeDriveFolder();
    } else {
      this.stopSyncTimer();
      this.cryptoKey = null;
      this.salt = null;
      this.folder = null;
      this.metadata = null;
      this.notes.clear();
      this.events.onSyncStatusChanged('offline', null, null);
    }
  }

  public async setPassphrase(passphrase: string): Promise<boolean> {
    if (!this.salt) {
      this.salt = generateSalt();
    }

    try {
      const derivedKey = await deriveKeyFromPassphrase(passphrase, this.salt);

      // If we have an existing metadata canary, verify it
      if (this.metadata?.canary) {
        const isValid = await verifyCanary(this.metadata.canary, derivedKey);
        if (!isValid) {
          return false;
        }
      } else if (this.accessToken && this.folder) {
        // First-time setup: create initial canary & save metadata to Drive
        const canary = await createCanary(derivedKey, this.salt);
        const newMeta: AppMetadata = {
          version: 1,
          salt: this.salt,
          canary,
          labels: ['Personal', 'Work', 'Ideas', 'Tasks'],
          appsScripts: [],
          updatedAt: new Date().toISOString(),
        };
        const fileId = await saveMetadata(
          this.accessToken,
          this.folder.folderId,
          newMeta,
          this.folder.metadataFileId
        );
        this.folder.metadataFileId = fileId;
        this.metadata = newMeta;
        this.saveMetaToLocalStorage(newMeta);
        this.events.onLabelsUpdated(newMeta.labels);
        this.events.onAppsScriptsUpdated?.([]);
      }

      this.cryptoKey = derivedKey;
      this.startSyncTimer();
      await this.syncWithDrive();
      return true;
    } catch (err) {
      console.error('Passphrase derivation error:', err);
      return false;
    }
  }

  private async initializeDriveFolder() {
    if (!this.accessToken) return;

    this.events.onSyncStatusChanged('syncing', this.lastSyncTime, null);

    try {
      // 1. Get or create folder
      const folder = await getOrCreateKeepFolder(this.accessToken, DEFAULT_FOLDER_NAME);
      this.folder = folder;
      this.events.onFolderReady(folder);

      // 2. Check metadata
      const { metadata, fileId } = await loadMetadata(this.accessToken, folder.folderId);
      if (fileId) {
        this.folder.metadataFileId = fileId;
      }

      if (metadata) {
        this.metadata = metadata;
        this.salt = metadata.salt;
        this.saveMetaToLocalStorage(metadata);
        this.events.onLabelsUpdated(metadata.labels || []);
        this.events.onAppsScriptsUpdated?.(metadata.appsScripts || []);

        // Prompt user for passphrase to unlock existing encrypted notes
        this.events.onPassphraseNeeded(metadata.salt, false);
      } else {
        // Setup new encrypted workspace
        const newSalt = generateSalt();
        this.salt = newSalt;
        this.events.onPassphraseNeeded(newSalt, true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Initialize drive error:', msg);
      this.events.onSyncStatusChanged('error', this.lastSyncTime, msg);
    }
  }

  public async syncWithDrive(): Promise<void> {
    if (!this.accessToken || !this.cryptoKey || !this.folder || this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    this.events.onSyncStatusChanged('syncing', this.lastSyncTime, null);

    try {
      // 1. Handle any queued deletions first
      if (this.pendingDeletions.size > 0) {
        for (const item of Array.from(this.pendingDeletions)) {
          try {
            await deleteNoteFile(this.accessToken, item.driveFileId);
            this.pendingDeletions.delete(item);
          } catch (delErr) {
            console.warn('Failed to delete remote note file:', delErr);
          }
        }
      }

      // 2. Fetch remote note files
      const remoteFiles = await listNoteFiles(this.accessToken, this.folder.folderId);
      const remoteFileMap = new Map<string, { id: string; modifiedTime?: string }>();

      for (const rf of remoteFiles) {
        // file name is `note_${noteId}.json`
        const match = rf.name.match(/^note_(.+)\.json$/);
        if (match) {
          const noteId = match[1];
          remoteFileMap.set(noteId, { id: rf.id, modifiedTime: rf.modifiedTime });
        }
      }

      let stateChanged = false;

      // 3. Process remote files into local memory
      for (const [noteId, remoteInfo] of remoteFileMap.entries()) {
        const localNote = this.notes.get(noteId);

        // Download if we don't have it, or if remote is newer and not locally modified
        const shouldDownload =
          !localNote ||
          (!this.pendingUploads.has(noteId) &&
            remoteInfo.modifiedTime &&
            new Date(remoteInfo.modifiedTime).getTime() > new Date(localNote.updatedAt).getTime());

        if (shouldDownload) {
          try {
            const encryptedPayload = await downloadNotePayload(this.accessToken, remoteInfo.id);
            const decryptedNote = await decryptData<Note>(encryptedPayload, this.cryptoKey);
            decryptedNote.driveFileId = remoteInfo.id;
            this.notes.set(noteId, decryptedNote);
            stateChanged = true;
          } catch (decErr) {
            console.error(`Failed to decrypt note ${noteId}:`, decErr);
          }
        }
      }

      // 4. Upload any pending local notes
      for (const noteId of Array.from(this.pendingUploads)) {
        const note = this.notes.get(noteId);
        if (note) {
          try {
            const encrypted = await encryptData(note, this.cryptoKey, this.salt!);
            const driveFileId = await uploadNotePayload(
              this.accessToken,
              this.folder.folderId,
              note.id,
              encrypted,
              note.driveFileId
            );
            note.driveFileId = driveFileId;
            this.pendingUploads.delete(noteId);
            stateChanged = true;
          } catch (upErr) {
            console.error(`Failed to upload note ${noteId}:`, upErr);
          }
        }
      }

      this.lastSyncTime = new Date();
      this.saveToLocalStorage();

      if (stateChanged) {
        this.events.onNotesUpdated(this.getNotesList());
        this.broadcastChannel?.postMessage({ type: 'NOTES_UPDATED' });
      }

      this.events.onSyncStatusChanged('synced', this.lastSyncTime, null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Drive sync failed:', msg);
      this.events.onSyncStatusChanged('error', this.lastSyncTime, msg);
    } finally {
      this.isSyncing = false;
    }
  }

  public getNotesList(): Note[] {
    return Array.from(this.notes.values()).sort((a, b) => {
      // Pinned first, then by updatedAt descending
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  public saveNote(note: Partial<Note> & { id?: string }): Note {
    const now = new Date().toISOString();
    const existing = note.id ? this.notes.get(note.id) : null;

    const updatedNote: Note = {
      id: note.id || 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      driveFileId: existing?.driveFileId || note.driveFileId,
      title: note.title !== undefined ? note.title : existing?.title || '',
      content: note.content !== undefined ? note.content : existing?.content || '',
      checklist: note.checklist !== undefined ? note.checklist : existing?.checklist || [],
      isChecklist: note.isChecklist !== undefined ? note.isChecklist : existing?.isChecklist || false,
      color: note.color !== undefined ? note.color : existing?.color || 'default',
      labels: note.labels !== undefined ? note.labels : existing?.labels || [],
      isPinned: note.isPinned !== undefined ? note.isPinned : existing?.isPinned || false,
      isArchived: note.isArchived !== undefined ? note.isArchived : existing?.isArchived || false,
      isTrashed: note.isTrashed !== undefined ? note.isTrashed : existing?.isTrashed || false,
      trashedAt: note.trashedAt !== undefined ? note.trashedAt : existing?.trashedAt,
      reminder: note.reminder !== undefined ? note.reminder : existing?.reminder,
      collaborators: note.collaborators !== undefined ? note.collaborators : existing?.collaborators || [],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      version: (existing?.version || 0) + 1,
    };

    this.notes.set(updatedNote.id, updatedNote);
    this.pendingUploads.add(updatedNote.id);

    this.saveToLocalStorage();
    this.events.onNotesUpdated(this.getNotesList());
    this.broadcastChannel?.postMessage({ type: 'NOTES_UPDATED' });

    this.scheduleDebouncedSync();
    return updatedNote;
  }

  public deleteNotePermanently(noteId: string): void {
    const note = this.notes.get(noteId);
    if (!note) return;

    if (note.driveFileId) {
      this.pendingDeletions.add({ noteId, driveFileId: note.driveFileId });
    }

    this.notes.delete(noteId);
    this.pendingUploads.delete(noteId);

    this.saveToLocalStorage();
    this.events.onNotesUpdated(this.getNotesList());
    this.broadcastChannel?.postMessage({ type: 'NOTES_UPDATED' });

    this.scheduleDebouncedSync();
  }

  public emptyTrash(): number {
    const trashed = Array.from(this.notes.values()).filter((n) => n.isTrashed);
    for (const note of trashed) {
      if (note.driveFileId) {
        this.pendingDeletions.add({ noteId: note.id, driveFileId: note.driveFileId });
      }
      this.notes.delete(note.id);
      this.pendingUploads.delete(note.id);
    }

    this.saveToLocalStorage();
    this.events.onNotesUpdated(this.getNotesList());
    this.broadcastChannel?.postMessage({ type: 'NOTES_UPDATED' });
    this.scheduleDebouncedSync();
    return trashed.length;
  }

  public async updateLabels(labels: string[]): Promise<void> {
    if (!this.metadata) return;

    this.metadata.labels = labels;
    this.metadata.updatedAt = new Date().toISOString();
    this.saveMetaToLocalStorage(this.metadata);
    this.events.onLabelsUpdated(labels);
    this.broadcastChannel?.postMessage({ type: 'LABELS_UPDATED', labels });

    if (this.accessToken && this.folder) {
      try {
        await saveMetadata(
          this.accessToken,
          this.folder.folderId,
          this.metadata,
          this.folder.metadataFileId
        );
      } catch (e) {
        console.error('Failed to update labels on Drive:', e);
      }
    }
  }

  public async updateAppsScripts(appsScripts: AppsScriptApp[]): Promise<void> {
    // Maximum 5 Apps Scripts enforced
    const sanitized = appsScripts.slice(0, 5);

    if (this.metadata) {
      this.metadata.appsScripts = sanitized;
      this.metadata.updatedAt = new Date().toISOString();
      this.saveMetaToLocalStorage(this.metadata);
    } else {
      // If metadata not yet loaded, create partial or cache
      const cached = this.loadMetaFromLocalStorage();
      if (cached) {
        cached.appsScripts = sanitized;
        this.saveMetaToLocalStorage(cached);
      }
    }

    this.events.onAppsScriptsUpdated?.(sanitized);
    this.broadcastChannel?.postMessage({ type: 'APPS_SCRIPTS_UPDATED', appsScripts: sanitized });

    if (this.accessToken && this.folder && this.metadata) {
      try {
        await saveMetadata(
          this.accessToken,
          this.folder.folderId,
          this.metadata,
          this.folder.metadataFileId
        );
      } catch (e) {
        console.error('Failed to update apps scripts on Drive:', e);
      }
    }
  }

  public async getRawEncryptedPayload(noteId: string): Promise<string> {
    const note = this.notes.get(noteId);
    if (!note || !this.cryptoKey || !this.salt) {
      return JSON.stringify({ error: 'Note or key unavailable' });
    }
    const encrypted = await encryptData(note, this.cryptoKey, this.salt);
    return JSON.stringify(encrypted, null, 2);
  }

  public exportEncryptedBackup(): string {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      salt: this.salt,
      canary: this.metadata?.canary,
      labels: this.metadata?.labels || [],
      // Export encrypted notes
      notesCount: this.notes.size,
    };
    return JSON.stringify(backup, null, 2);
  }

  private scheduleDebouncedSync() {
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.syncWithDrive();
    }, 800);
  }

  private startSyncTimer() {
    this.stopSyncTimer();
    // Background polling sync every 15 seconds
    this.syncTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.syncWithDrive();
      }
    }, 15000);
  }

  private stopSyncTimer() {
    if (this.syncTimer) {
      window.clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private saveToLocalStorage() {
    try {
      const data = JSON.stringify(Array.from(this.notes.values()));
      localStorage.setItem(LOCAL_STORAGE_NOTES_PREFIX + this.userId, data);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  private loadFromLocalStorage() {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_NOTES_PREFIX + this.userId);
      if (data) {
        const parsed: Note[] = JSON.parse(data);
        this.notes.clear();
        for (const note of parsed) {
          this.notes.set(note.id, note);
        }
      }

      // Also restore cached metadata for instantaneous offline/initial loading
      const meta = this.loadMetaFromLocalStorage();
      if (meta) {
        if (meta.labels?.length) {
          this.events.onLabelsUpdated(meta.labels);
        }
        if (meta.appsScripts) {
          this.events.onAppsScriptsUpdated?.(meta.appsScripts);
        }
      }
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
    }
  }

  public loadMetaFromLocalStorage(): AppMetadata | null {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_META_PREFIX + this.userId);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveMetaToLocalStorage(meta: AppMetadata) {
    try {
      localStorage.setItem(LOCAL_STORAGE_META_PREFIX + this.userId, JSON.stringify(meta));
    } catch (e) {
      console.warn('LocalStorage meta save failed:', e);
    }
  }

  public getFolderInfo(): DriveFolderConfig | null {
    return this.folder;
  }

  public getSalt(): string | null {
    return this.salt;
  }
}
