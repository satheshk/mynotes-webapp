import React, { useState, useRef } from 'react';
import {
  Code2,
  RefreshCw,
  ExternalLink,
  Settings,
  AlertTriangle,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { AppsScriptApp } from '../types';

interface AppsScriptViewerProps {
  app: AppsScriptApp;
  onOpenConfig: () => void;
}

export const AppsScriptViewer: React.FC<AppsScriptViewerProps> = ({
  app,
  onOpenConfig,
}) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEmbedHelp, setShowEmbedHelp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      ref={containerRef}
      id={`apps-script-viewer-${app.id}`}
      className={`flex flex-col ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-white dark:bg-neutral-900'
          : 'h-[calc(100vh-80px)] w-full'
      }`}
    >
      {/* Viewer Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shrink-0 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Code2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
              {app.title}
            </h1>
            {app.description ? (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                {app.description}
              </p>
            ) : (
              <p className="text-[11px] text-neutral-400 truncate font-mono">
                {app.url}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="gas-refresh-btn"
            type="button"
            onClick={handleRefresh}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Reload Web App"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <a
            id="gas-open-external-btn"
            href={app.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700"
            title="Open in new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New tab</span>
          </a>

          <button
            id="gas-fullscreen-btn"
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer hidden md:block"
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            id="gas-embed-help-btn"
            type="button"
            onClick={() => setShowEmbedHelp(!showEmbedHelp)}
            className="p-1.5 text-neutral-500 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Troubleshooting & Iframe Permissions"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            id="gas-configure-btn"
            type="button"
            onClick={onOpenConfig}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg transition-colors cursor-pointer border border-amber-200 dark:border-amber-800/60"
            title="Configure Apps Script URLs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Helpful alert dropdown if the user needs info on embedding restrictions */}
      {showEmbedHelp && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 flex items-start justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Blank screen or refused to connect?</p>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                Google blocks embedding unless your Apps Script allows iframe embedding. In your Apps Script{' '}
                <code className="bg-white/60 dark:bg-black/30 px-1 py-0.5 rounded font-mono">doGet()</code>, return:{' '}
                <code className="bg-white/60 dark:bg-black/30 px-1 py-0.5 rounded font-mono">
                  HtmlService.createHtmlOutput(...).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
                </code>
                . Alternatively, click <strong>New tab</strong> to open your script directly!
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowEmbedHelp(false)}
            className="text-amber-700 dark:text-amber-400 hover:text-amber-900 text-xs font-bold px-2 py-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* Embedded Iframe Container */}
      <div className="relative flex-1 w-full bg-neutral-100 dark:bg-neutral-950 overflow-hidden">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xs">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-2" />
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Loading {app.title}...
            </p>
          </div>
        )}

        <iframe
          key={iframeKey}
          id="gas-embedded-frame"
          src={app.url}
          title={app.title}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-top-navigation-by-user-activation"
          allow="clipboard-read; clipboard-write; camera; microphone; geolocation"
        />
      </div>
    </div>
  );
};
