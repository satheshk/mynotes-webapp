import React, { useState } from 'react';
import {
  Code2,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Check,
  AlertCircle,
  Play,
  HelpCircle,
  Copy,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { AppsScriptApp } from '../types';

interface AppsScriptConfigViewProps {
  appsScripts: AppsScriptApp[];
  onSaveAppsScripts: (appsScripts: AppsScriptApp[]) => void;
  onOpenApp: (appId: string) => void;
  onBackToNotes: () => void;
}

export const AppsScriptConfigView: React.FC<AppsScriptConfigViewProps> = ({
  appsScripts,
  onSaveAppsScripts,
  onOpenApp,
  onBackToNotes,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const maxReached = appsScripts.length >= 5;

  const handleStartAdd = () => {
    if (maxReached) return;
    setEditId(null);
    setTitle('');
    setUrl('');
    setDescription('');
    setUrlError(null);
    setIsEditing(true);
  };

  const handleStartEdit = (app: AppsScriptApp) => {
    setEditId(app.id);
    setTitle(app.title);
    setUrl(app.url);
    setDescription(app.description || '');
    setUrlError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditId(null);
    setTitle('');
    setUrl('');
    setDescription('');
    setUrlError(null);
  };

  const validateUrl = (testUrl: string): boolean => {
    if (!testUrl.trim()) {
      setUrlError('Web App URL is required');
      return false;
    }
    try {
      const parsed = new URL(testUrl.trim());
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        setUrlError('URL must start with https:// or http://');
        return false;
      }
      return true;
    } catch {
      setUrlError('Please enter a valid URL (e.g. https://script.google.com/macros/s/.../exec)');
      return false;
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setUrlError('Heading / title is required');
      return;
    }
    if (!validateUrl(url)) {
      return;
    }

    const now = new Date().toISOString();
    let updated: AppsScriptApp[];

    if (editId) {
      // Edit existing
      updated = appsScripts.map((app) =>
        app.id === editId
          ? {
              ...app,
              title: title.trim(),
              url: url.trim(),
              description: description.trim() || undefined,
              updatedAt: now,
            }
          : app
      );
    } else {
      // Add new (max 5)
      if (appsScripts.length >= 5) {
        setUrlError('Maximum 5 Apps Script URLs allowed');
        return;
      }
      const newApp: AppsScriptApp = {
        id: 'gas_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: title.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      updated = [...appsScripts, newApp];
    }

    onSaveAppsScripts(updated);
    handleCancel();
  };

  const handleDelete = (id: string, appTitle: string) => {
    if (window.confirm(`Remove Google Apps Script integration "${appTitle}"?`)) {
      const updated = appsScripts.filter((app) => app.id !== id);
      onSaveAppsScripts(updated);
      if (editId === id) {
        handleCancel();
      }
    }
  };

  const codeSnippet = `function doGet(e) {
  return HtmlService.createHtmlOutput('<h1>Hello from Google Apps Script</h1>')
    .setTitle('My Keep App')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); // Allows embedding in Keep Notes
}`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 sm:px-4 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Google Apps Script Configuration
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Configure up to 5 Apps Script Web App URLs to launch directly inside Keep Notes
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
            {appsScripts.length} / 5 configured
          </span>
          <button
            id="add-new-gas-btn"
            onClick={handleStartAdd}
            disabled={maxReached || isEditing}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Web App</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Form Card */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          id="gas-config-form"
          className="p-5 bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-700/80 rounded-2xl shadow-md space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-500" />
              {editId ? 'Edit Apps Script Integration' : 'Add New Apps Script Web App'}
            </h2>
            <span className="text-xs text-neutral-400">Slot {appsScripts.length + (editId ? 0 : 1)} of 5</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Heading / Display Title <span className="text-red-500">*</span>
              </label>
              <input
                id="gas-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Employee Directory, Leave Request Form, Report Dashboard"
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                This heading will appear in the sidebar navigation next to Notes and Reminders.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Google Apps Script Web App URL <span className="text-red-500">*</span>
              </label>
              <input
                id="gas-url-input"
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (urlError) setUrlError(null);
                }}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
              {urlError ? (
                <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {urlError}
                </p>
              ) : (
                <p className="text-[11px] text-neutral-400 mt-1">
                  Must end in <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono">/exec</code> from a deployed Google Apps Script Web App.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Description (Optional)
              </label>
              <input
                id="gas-desc-input"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of what this Apps Script tool does"
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="gas-submit-btn"
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {editId ? 'Save Changes' : 'Add Apps Script'}
            </button>
          </div>
        </form>
      )}

      {/* Configured Apps Scripts List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Configured Apps Script URLs ({appsScripts.length} of 5)
        </h2>

        {appsScripts.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mx-auto">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                No Google Apps Script URLs configured yet
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">
                Add up to 5 Google Apps Script Web App links. Their headings will appear right next to Notes and Reminders in the sidebar, allowing you to load your custom Apps Script web apps directly inside Keep Notes.
              </p>
            </div>
            {!isEditing && (
              <button
                onClick={handleStartAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Configure First Web App</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {appsScripts.map((app, index) => (
              <div
                key={app.id}
                id={`gas-app-card-${app.id}`}
                className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {app.title}
                    </h3>
                  </div>

                  {app.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate pl-7">
                      {app.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 pl-7 text-xs text-neutral-400">
                    <code className="bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-[11px] font-mono text-neutral-600 dark:text-neutral-300 truncate max-w-md">
                      {app.url}
                    </code>
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-400 hover:text-amber-500 transition-colors p-1"
                      title="Open Web App URL in new browser tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pl-7 sm:pl-0">
                  <button
                    onClick={() => onOpenApp(app.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-blue-200 dark:border-blue-800/60"
                    title="Launch and view this Apps Script inside Keep Notes"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Open in Keep</span>
                  </button>

                  <button
                    onClick={() => handleStartEdit(app)}
                    className="p-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                    title="Edit configuration"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(app.id, app.title)}
                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
                    title="Delete integration"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Google Apps Script Deployment Guide */}
      <div className="p-5 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3.5 text-xs text-neutral-700 dark:text-neutral-300">
        <div className="flex items-start gap-2.5">
          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
              How to deploy your Google Apps Script for in-app embedding
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
              Google Apps Script requires two quick settings so that Google permits the web app to run inside an iframe container:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Step 1 */}
          <div className="p-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl space-y-1.5">
            <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">
              1. Deployment Settings (Apps Script Editor)
            </span>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-neutral-600 dark:text-neutral-300">
              <li>In your Apps Script editor, click <strong>Deploy</strong> &gt; <strong>New deployment</strong>.</li>
              <li>Select type: <strong>Web app</strong>.</li>
              <li>Execute as: <strong>Me</strong> (or <em>User accessing the web app</em>).</li>
              <li>Who has access: <strong>Anyone</strong> or <strong>Anyone with Google account</strong>.</li>
              <li>Copy the resulting Web App URL ending in <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">/exec</code>.</li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">
                2. In-App Iframe Embedding (ALLOWALL)
              </span>
              <button
                type="button"
                onClick={handleCopySnippet}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
              Add <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-amber-600 dark:text-amber-400">.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)</code> in your <code className="font-mono">doGet()</code> so the browser doesn't block the iframe:
            </p>
            <pre className="p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg text-[10px] font-mono overflow-x-auto leading-tight">
{codeSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
