import React, { useState } from 'react';
import {
  ShieldCheck,
  FolderLock,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface LoginScreenProps {
  onLogin: () => void;
  isLoading: boolean;
  error: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  isLoading,
  error,
}) => {
  const [copied, setCopied] = useState(false);
  const isUnauthorizedDomain = error?.toLowerCase().includes('unauthorized-domain');
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

  const handleCopyHostname = () => {
    if (currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      id="login-screen"
      className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 text-center space-y-5">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-400 text-white flex items-center justify-center shadow-lg shadow-amber-400/20 mx-auto">
          <svg
            className="w-10 h-10"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Keep Notes
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">
            Google Keep experience with End-to-End Encryption backed by your own Google Drive
          </p>
        </div>

        {/* Unauthorized Domain Guide for Vercel / Custom Domains */}
        {isUnauthorizedDomain ? (
          <div
            id="unauthorized-domain-banner"
            className="text-left p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Authorize Vercel Domain in Firebase
                </h4>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                  Firebase Authentication requires new deployment domains to be listed under
                  <strong> Authorized domains</strong> before Google OAuth popups are permitted.
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
                <span className="text-[11px] font-medium">Domain to add:</span>
                <button
                  type="button"
                  onClick={handleCopyHostname}
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Domain</span>
                    </>
                  )}
                </button>
              </div>
              <code className="block text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-800 dark:text-neutral-200 break-all select-all">
                {currentHostname}
              </code>
            </div>

            <div className="text-[11px] text-amber-900 dark:text-amber-200/90 space-y-1">
              <p className="font-semibold">Quick 3-step fix:</p>
              <ol className="list-decimal list-inside space-y-1 text-neutral-700 dark:text-neutral-300 pl-1">
                <li>
                  Open your{' '}
                  <a
                    href={firebaseSettingsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-600 dark:text-amber-400 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    Firebase Auth Settings
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Scroll down to the <strong>Authorized domains</strong> section.</li>
                <li>
                  Click <strong>Add domain</strong>, paste{' '}
                  <code className="px-1 py-0.5 bg-amber-200/60 dark:bg-amber-900/60 rounded font-mono">
                    {currentHostname}
                  </code>
                  , and click <strong>Save</strong>.
                </li>
              </ol>
            </div>

            <a
              href={firebaseSettingsUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-medium transition-colors"
            >
              Open Firebase Authorized Domains Settings
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : error ? (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-xs text-red-600 dark:text-red-300 text-left">
            {error}
          </div>
        ) : null}

        {/* Feature Highlights */}
        <div className="text-left space-y-3 py-1">
          <div className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Zero-Knowledge End-to-End Encryption
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                AES-256-GCM cipher keeps your notes private. No plain text ever touches the cloud.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <FolderLock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Google Drive Dedicated Folder
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Synchronizes securely with your personal Google Drive folder across all your devices.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <RefreshCw className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Real-Time Multi-Device Sync
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Instant background synchronization, offline editing, and collaboration.
              </p>
            </div>
          </div>
        </div>

        {/* Google Sign-in Material Button */}
        <div className="pt-2">
          <button
            id="google-signin-btn"
            onClick={onLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 rounded-full font-medium text-sm transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
            ) : (
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="w-5 h-5 block"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            )}
            <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>
        </div>

        <p className="text-[11px] text-neutral-400">
          Uses Google OAuth 2.0 to access your configured Google Drive folder.
        </p>
      </div>
    </div>
  );
};
