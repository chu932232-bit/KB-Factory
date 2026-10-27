import React, { useState } from 'react';
import { api } from '../services/api';
import { 
  Cloud, 
  Smartphone, 
  Copy, 
  Check, 
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface CloudSyncViewProps {
  lastSync: string;
  onRefresh: () => void;
}

export const CloudSyncView: React.FC<CloudSyncViewProps> = ({
  lastSync,
  onRefresh
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-app-url.run.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExecuteClearAllData = async () => {
    setResetting(true);
    try {
      await api.clearAllData();
      setStatusMsg({ text: 'All records cleared. KB Factory is now clean and fresh.', type: 'success' });
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error clearing data', type: 'error' });
    } finally {
      setResetting(false);
      setIsResetModalOpen(false);
    }
  };

  // Clean QR Code for smartphone scanning
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}&bgcolor=255-255-255&color=217-119-6&margin=4`;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
          <span>Live Cloud Sync Active</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
          <Cloud className="w-6 h-6 text-amber-600 dark:text-amber-500" />
          <span>Access KB Factory Anywhere</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Your data syncs automatically in the background. Use the QR code or link below to open this app on your phone, tablet, or another computer.
        </p>
      </div>

      {/* Dual Storage Security Status Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="text-left text-xs">
            <div className="font-bold text-emerald-900 dark:text-emerald-200">1. Cloud Database Storage</div>
            <div className="text-emerald-700 dark:text-emerald-400 font-medium">Active (365-Day Retention)</div>
          </div>
        </div>
        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div className="text-left text-xs">
            <div className="font-bold text-indigo-900 dark:text-indigo-200">2. Local Device Backup</div>
            <div className="text-indigo-700 dark:text-indigo-400 font-medium">Active (Offline 365-Day Backup)</div>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-center gap-2 font-medium ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' 
            : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Single Clean QR Code Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col items-center text-center transition-colors">
        
        {/* QR Code Container */}
        <div className="p-3.5 bg-white rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
          <img 
            src={qrCodeUrl} 
            alt="Scan QR code to open on mobile"
            className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Scan with Phone Camera</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5 max-w-sm">
          Point your smartphone camera at the QR code to instantly open KB Factory with all your current stock and khatas.
        </p>

        {/* URL Box & Copy Link Button */}
        <div className="w-full max-w-md space-y-2.5">
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300">
            <span className="truncate flex-1 text-left px-1">{currentUrl}</span>
            <button
              onClick={handleCopyLink}
              className="p-1.5 hover:text-amber-700 dark:hover:text-amber-400 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
              title="Copy URL"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyLink}
              className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>Open in New Tab</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer Info & Discreet Reset */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 text-xs text-slate-400 dark:text-slate-500">
        <div>
          <span>Last synced: {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Live'}</span>
        </div>

        <button
          onClick={() => setIsResetModalOpen(true)}
          disabled={resetting}
          className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5 cursor-pointer text-slate-400 dark:text-slate-500"
          title="Clear all records to start completely fresh"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{resetting ? 'Clearing...' : 'Clear All Entries (Fresh Start)'}</span>
        </button>
      </div>

      <ConfirmDeleteModal
        isOpen={isResetModalOpen}
        title="Wipe & Reset All Records"
        description="Are you sure you want to clear all data and start completely fresh? All customer sales, wholesale ledger, purchases, and payment history will be permanently wiped clean."
        confirmLabel="Wipe & Start Fresh"
        isDeleting={resetting}
        onConfirm={handleExecuteClearAllData}
        onClose={() => setIsResetModalOpen(false)}
      />

    </div>
  );
};
