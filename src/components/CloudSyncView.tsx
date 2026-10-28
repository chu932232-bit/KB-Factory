import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Cloud, 
  Smartphone, 
  Copy, 
  Check, 
  ExternalLink, 
  RotateCcw, 
  CheckCircle2, 
  Radio, 
  ShieldCheck,
  Database,
  Trash2,
  Calendar,
  LogOut,
  Sparkles,
  Loader2
} from 'lucide-react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { RetentionStatus } from '../types/feed';

interface CloudSyncViewProps {
  lastSync: string;
  onRefresh: () => void;
}

export const CloudSyncView: React.FC<CloudSyncViewProps> = ({
  lastSync,
  onRefresh
}) => {
  const { user, logout } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [cleaningRetention, setCleaningRetention] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [retentionStatus, setRetentionStatus] = useState<RetentionStatus | null>(null);
  const [loadingRetention, setLoadingRetention] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-app-url.vercel.app';

  useEffect(() => {
    loadRetention();
  }, []);

  const loadRetention = async () => {
    try {
      setLoadingRetention(true);
      const res = await api.getRetentionStatus();
      setRetentionStatus(res);
    } catch (err) {
      console.warn('Retention status fetch error:', err);
    } finally {
      setLoadingRetention(false);
    }
  };

  const handleRunRetentionCleanup = async () => {
    try {
      setCleaningRetention(true);
      const res = await api.runRetentionCleanup();
      setStatusMsg({
        text: res.prunedCount > 0 
          ? `Retention cleanup finished: ${res.prunedCount} expired records older than 365 days pruned.`
          : 'All database records are fresh and well within the 365-day retention window.',
        type: 'success'
      });
      setRetentionStatus(res.status);
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error running retention cleanup', type: 'error' });
    } finally {
      setCleaningRetention(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExecuteClearAllData = async () => {
    setResetting(true);
    try {
      await api.clearAllData();
      setStatusMsg({ text: 'All your records have been cleared from Cloud Firestore. Fresh workspace initialized.', type: 'success' });
      onRefresh();
      loadRetention();
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Error clearing data', type: 'error' });
    } finally {
      setResetting(false);
      setIsResetModalOpen(false);
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentUrl)}&bgcolor=255-255-255&color=217-119-6&margin=4`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600 dark:text-emerald-400" />
          <span>100% Serverless Cloud Infrastructure</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
          <Cloud className="w-6 h-6 text-amber-600 dark:text-amber-500" />
          <span>Cloud Database &amp; Account</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Your business is powered directly by Google Authentication and Firebase Cloud Firestore with zero background servers.
        </p>
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

      {/* Authenticated Google Account Card */}
      {user && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/20" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="text-left">
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{user.displayName || 'Google Account'}</span>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] rounded-full font-bold">
                  Verified
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">UID: {user.uid}</div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 self-end sm:self-center"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Serverless Cloud Infrastructure Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 shadow-xs">
          <Database className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-left text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100">Firebase Firestore</div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Real-time serverless database</div>
            <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 shadow-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-left text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100">Account-Isolated</div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Zero-trust security rules</div>
            <div className="text-slate-600 dark:text-slate-400 font-medium text-[10px] mt-1">
              Data private to your UID
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 shadow-xs">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-left text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100">Zero Background Server</div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Deployable to Vercel for free</div>
            <div className="text-indigo-600 dark:text-indigo-400 font-medium text-[10px] mt-1">
              Instant static loading
            </div>
          </div>
        </div>
      </div>

      {/* 1-Year Retention Policy Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">1-Year Automatic Data Retention Policy</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
            365 Days Active
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          All transactions, khatas, factory purchases, and payment entries remain securely stored in your Firestore database for up to 365 days. Records older than 1 year are automatically pruned to keep your system performing fast.
        </p>

        {retentionStatus && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {retentionStatus.collectionBreakdown.purchases}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Purchases</div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {retentionStatus.collectionBreakdown.sales}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Sales</div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {retentionStatus.collectionBreakdown.payments}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Payments</div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {retentionStatus.collectionBreakdown.thirdPartyPayments}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Deposits</div>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl col-span-2 sm:col-span-1">
              <div className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {retentionStatus.collectionBreakdown.companyPayments}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Treasury</div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-slate-400">
            Retention Cutoff: <span className="font-mono text-slate-600 dark:text-slate-300">{retentionStatus?.cutoffDate || '365 days ago'}</span>
          </div>

          <button
            onClick={handleRunRetentionCleanup}
            disabled={cleaningRetention || loadingRetention}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {cleaningRetention ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Pruning...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Run Retention Cleanup</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Multi-Device QR Code Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col items-center text-center transition-colors">
        <div className="p-3.5 bg-white rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
          <img 
            src={qrCodeUrl} 
            alt="Scan QR code to open on mobile"
            className="w-44 h-44 sm:w-52 sm:h-52 rounded-xl object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Open on Any Smartphone or Tablet</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5 max-w-sm">
          Scan with your phone camera or copy the link below. Simply sign in with your Google account on any device to access the exact same live ERP records.
        </p>

        {/* URL Box & Action Buttons */}
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
                  <span>Copy App Link</span>
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

      {/* Danger Zone: Reset Records */}
      <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold text-rose-900 dark:text-rose-200 block">Clear All My Records (Fresh Start)</span>
          <span className="text-rose-700 dark:text-rose-400 text-[11px]">
            Permanently clear all your sales, purchases, customers, and payment history in Cloud Firestore.
          </span>
        </div>

        <button
          onClick={() => setIsResetModalOpen(true)}
          disabled={resetting}
          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{resetting ? 'Clearing...' : 'Clear All Data'}</span>
        </button>
      </div>

      <ConfirmDeleteModal
        isOpen={isResetModalOpen}
        title="Wipe & Reset All Records in Cloud Firestore"
        description="Are you sure you want to clear all data and start completely fresh? All customer sales, wholesale ledger, purchases, and payment history under your Google account will be permanently deleted from the cloud database."
        confirmLabel="Wipe & Start Fresh"
        isDeleting={resetting}
        onConfirm={handleExecuteClearAllData}
        onClose={() => setIsResetModalOpen(false)}
      />

    </div>
  );
};
