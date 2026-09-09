import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  LayoutGrid,
  Rows,
  ExternalLink,
  LogOut,
  FolderLock,
  Cloud,
} from 'lucide-react';
import { SyncStatus, UserProfile, DriveFolderConfig } from '../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  onSyncNow: () => void;
  isGridView: boolean;
  onToggleView: () => void;
  user: UserProfile | null;
  folder: DriveFolderConfig | null;
  onOpenSecurity: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  syncStatus,
  lastSyncTime,
  onSyncNow,
  isGridView,
  onToggleView,
  user,
  folder,
  onOpenSecurity,
  onLogout,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatSyncTime = (date: Date | null) => {
    if (!date) return 'Not synced yet';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const driveFolderUrl = folder ? `https://drive.google.com/drive/folders/${folder.folderId}` : null;

  return (
    <header
      id="keep-navbar"
      className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 py-2.5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 select-none shadow-2xs"
    >
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button
          id="toggle-sidebar-btn"
          onClick={onToggleSidebar}
          className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
          title="Main menu"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shadow-xs text-white">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-neutral-800 dark:text-neutral-100 hidden sm:inline-block">
            Keep Notes
          </span>
        </div>
      </div>

      {/* Middle: Google Keep Style Search Box */}
      <div className="flex-1 max-w-2xl mx-2 sm:mx-8">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
          <input
            id="keep-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search decrypted notes, labels, or checklists..."
            className="w-full pl-10 pr-9 py-2 bg-neutral-100 dark:bg-neutral-800/90 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 rounded-full text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
          />
          {searchQuery && (
            <button
              id="clear-search-btn"
              onClick={() => onSearchChange('')}
              className="absolute right-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Sync Status Button */}
        <button
          id="sync-now-btn"
          onClick={onSyncNow}
          disabled={syncStatus === 'syncing'}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title={`Click to sync with Google Drive. Last sync: ${formatSyncTime(lastSyncTime)}`}
        >
          {syncStatus === 'syncing' ? (
            <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
          ) : syncStatus === 'synced' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : syncStatus === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <Cloud className="w-4 h-4 text-neutral-400" />
          )}
          <span className="hidden md:inline font-medium">
            {syncStatus === 'syncing' ? 'Syncing...' : 'Synced'}
          </span>
        </button>

        {/* E2EE Shield badge */}
        <button
          id="open-security-btn"
          onClick={onOpenSecurity}
          className="flex items-center gap-1 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800/60"
          title="End-to-End Encrypted with AES-256-GCM"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden lg:inline">E2EE Active</span>
        </button>

        {/* View Toggle (Grid / List) */}
        <button
          id="toggle-view-mode-btn"
          onClick={onToggleView}
          className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
          title={isGridView ? 'List view' : 'Grid view'}
          aria-label={isGridView ? 'Switch to list view' : 'Switch to grid view'}
        >
          {isGridView ? <Rows className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
        </button>

        {/* User Profile Avatar with dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            id="user-profile-menu-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-8 h-8 rounded-full ring-2 ring-transparent hover:ring-amber-400 overflow-hidden flex items-center justify-center bg-amber-600 text-white text-xs font-bold transition-all cursor-pointer"
            aria-label="User account menu"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
            )}
          </button>

          {showProfileMenu && (
            <div
              id="user-profile-dropdown"
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-2 z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-amber-600 text-white font-bold shrink-0">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="User"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      user?.displayName?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {user?.displayName || 'Google User'}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Drive folder badge */}
              <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 flex items-center gap-1.5">
                    <FolderLock className="w-3.5 h-3.5 text-amber-500" />
                    Drive Backend:
                  </span>
                  {driveFolderUrl ? (
                    <a
                      href={driveFolderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-0.5"
                    >
                      Open
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-neutral-400">Connecting...</span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                  {folder?.folderName || 'Keep Notes (Encrypted)'}
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenSecurity();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  E2EE Vault & Keys
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
