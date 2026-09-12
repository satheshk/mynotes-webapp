export type NoteColor =
  | 'default'
  | 'coral'
  | 'peach'
  | 'sand'
  | 'mint'
  | 'sage'
  | 'fog'
  | 'storm'
  | 'dusk'
  | 'blossom'
  | 'clay'
  | 'chalk';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  driveFileId?: string;
  title: string;
  content: string;
  checklist: ChecklistItem[];
  isChecklist: boolean;
  color: NoteColor;
  labels: string[];
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  trashedAt?: string;
  reminder?: string; // ISO date string
  collaborators?: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface EncryptedPayload {
  v: number; // version 1
  salt: string; // base64
  iv: string; // base64
  data: string; // base64 ciphertext
  updatedAt: string;
}

export interface EncryptedNoteFile {
  noteId: string;
  payload: EncryptedPayload;
  updatedAt: string;
}

export interface DriveFolderConfig {
  folderId: string;
  folderName: string;
  metadataFileId?: string;
}

export interface AppsScriptApp {
  id: string;
  title: string;
  url: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppMetadata {
  version: number;
  salt: string;
  canary: EncryptedPayload;
  labels: string[];
  appsScripts?: AppsScriptApp[];
  updatedAt: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export type CurrentView =
  | 'notes'
  | 'reminders'
  | 'archive'
  | 'trash'
  | 'apps-script-config'
  | { label: string }
  | { appScriptId: string };

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export const NOTE_COLORS: Record<
  NoteColor,
  { name: string; bgClass: string; borderClass: string; hex: string }
> = {
  default: {
    name: 'Default',
    bgClass: 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
    borderClass: 'border-neutral-200 dark:border-neutral-700',
    hex: '#ffffff',
  },
  coral: {
    name: 'Coral',
    bgClass: 'bg-[#faafa8] text-neutral-900 dark:text-neutral-900',
    borderClass: 'border-[#f28b82]',
    hex: '#faafa8',
  },
  peach: {
    name: 'Peach',
    bgClass: 'bg-[#f39f76] text-neutral-900 dark:text-neutral-900',
    borderClass: 'border-[#f6ad55]',
    hex: '#f39f76',
  },
  sand: {
    name: 'Sand',
    bgClass: 'bg-[#fff8b8] text-neutral-900 dark:text-neutral-900',
    borderClass: 'border-[#fef08a]',
    hex: '#fff8b8',
  },
  mint: {
    name: 'Mint',
    bgClass: 'bg-[#e2f6d3] text-neutral-900 dark:text-neutral-900',
    borderClass: 'border-[#bbf7d0]',
    hex: '#e2f6d3',
  },
  sage: {
    name: 'Sage',
    bgClass: 'bg-[#b4ddd3] text-neutral-900 dark:text-neutral-900',
    borderClass: 'border-[#99f6e4]',
    hex: '#b4ddd3',
  },
  fog: {
    name: 'Fog',
    bgClass: 'bg-[#d4e4ed] text-neutral-900 dark:text-neutral-900',
    borderClass: 'border-[#bae6fd]',
    hex: '#d4e4ed',
  },
  storm: {
    name: 'Storm',
    bgClass: 'bg-[#aeccdc] text-neutral-900 dark:text-neutral-900',
    borderClass: 'border-[#93c5fd]',
    hex: '#aeccdc',
  },
  dusk: {
    name: 'Dusk',
    bgClass: 'bg-[#d3bfdb] text-neutral-900 dark:text-neutral-900',
    borderClass: 'border-[#e9d5ff]',
    hex: '#d3bfdb',
  },
  blossom: {
    name: 'Blossom',
    bgClass: 'bg-[#f6e2dd] text-neutral-900 dark:text-neutral-900',
    borderClass: 'border-[#fbcfe8]',
    hex: '#f6e2dd',
  },
  clay: {
    name: 'Clay',
    bgClass: 'bg-[#e9e3d4] text-neutral-900 dark:text-neutral-900',
    borderClass: 'border-[#d6d3d1]',
    hex: '#e9e3d4',
  },
  chalk: {
    name: 'Chalk',
    bgClass: 'bg-[#efeff1] text-neutral-900 dark:text-neutral-900',
    borderClass: 'border-[#e5e7eb]',
    hex: '#efeff1',
  },
};
