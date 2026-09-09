import React, { useState } from 'react';
import { Shield, KeyRound, Sparkles, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { generateSuggestedPassphrase } from '../services/crypto';

interface PassphraseModalProps {
  isOpen: boolean;
  isNewSetup: boolean;
  onSetPassphrase: (passphrase: string) => Promise<boolean>;
}

export const PassphraseModal: React.FC<PassphraseModalProps> = ({
  isOpen,
  isNewSetup,
  onSetPassphrase,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    const suggested = generateSuggestedPassphrase();
    setPassphrase(suggested);
    setConfirmPassphrase(suggested);
    setShowPassword(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passphrase.trim()) {
      setError('Please enter a passphrase.');
      return;
    }

    if (isNewSetup) {
      if (passphrase.length < 8) {
        setError('Passphrase must be at least 8 characters long.');
        return;
      }
      if (passphrase !== confirmPassphrase) {
        setError('Passphrases do not match.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const success = await onSetPassphrase(passphrase);
      if (!success) {
        setError(
          isNewSetup
            ? 'Failed to initialize encryption. Please try again.'
            : 'Incorrect passphrase. Could not decrypt your canary key.'
        );
      }
    } catch (err) {
      setError('An error occurred during key derivation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="passphrase-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        id="passphrase-modal-card"
        className="w-full max-w-lg bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
      >
        <div className="bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 border-b border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {isNewSetup ? 'Set End-to-End Encryption Key' : 'Unlock Your Encrypted Notes'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {isNewSetup
                  ? 'All notes are encrypted using AES-256-GCM before saving to Google Drive'
                  : 'Enter your encryption passphrase to decrypt your notes'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3.5 text-xs text-amber-800 dark:text-amber-200 flex gap-2.5 items-start">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              <strong>Zero-Knowledge Encryption:</strong> Your passphrase is used client-side to derive your AES-256-GCM key. It is never stored on Google Drive or transmitted across any server.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-3 text-xs text-red-700 dark:text-red-300 flex gap-2 items-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {isNewSetup ? 'Choose Master Passphrase' : 'Enter Master Passphrase'}
              </label>
              {isNewSetup && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Safe Key
                </button>
              )}
            </div>

            <div className="relative">
              <input
                id="passphrase-input"
                type={showPassword ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="e.g. coral-glacier-aurora-72"
                className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 pr-10 text-neutral-900 dark:text-neutral-100"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isNewSetup && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Confirm Master Passphrase
              </label>
              <input
                id="confirm-passphrase-input"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassphrase}
                onChange={(e) => setConfirmPassphrase(e.target.value)}
                placeholder="Re-enter your passphrase"
                className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900 dark:text-neutral-100"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Keep this passphrase in a safe place. If you open Keep Notes on another device, you will enter this passphrase to sync your notes.
              </p>
            </div>
          )}

          <div className="pt-2">
            <button
              id="passphrase-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              {isSubmitting
                ? 'Deriving PBKDF2 Key...'
                : isNewSetup
                ? 'Encrypt & Create Vault'
                : 'Unlock Notes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
