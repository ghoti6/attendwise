import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Mail,
  Lock,
  AlertCircle,
  X,
  UploadCloud,
  DownloadCloud,
  LogOut,
  CheckCircle2,
  User,
  ShieldCheck,
} from 'lucide-react';

interface CloudSyncModalProps {
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ onClose }) => {
  const {
    isSupabaseConfigured,
    cloudUser,
    cloudSyncStatus,
    lastCloudSyncTime,
    cloudErrorMessage,
    syncNow,
    uploadLocalToCloud,
    signUpWithEmail,
    signInWithEmail,
    signOutCloud,
  } = useAttendance();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [manualSyncLoading, setManualSyncLoading] = useState(false);
  const [manualSyncNotice, setManualSyncNotice] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    if (authMode === 'signup') {
      const res = await signUpWithEmail(email, password);
      setAuthLoading(false);
      if (res.error) {
        setAuthError(res.error);
      } else {
        setAuthSuccess('Account created! You are now signed in and your data will sync.');
        setEmail('');
        setPassword('');
      }
    } else {
      const res = await signInWithEmail(email, password);
      setAuthLoading(false);
      if (res.error) {
        setAuthError(res.error);
      } else {
        setAuthSuccess('Signed in successfully! Your attendance is now syncing.');
        setEmail('');
        setPassword('');
      }
    }
  };

  const handleManualUpload = async () => {
    setManualSyncLoading(true);
    const res = await uploadLocalToCloud();
    setManualSyncLoading(false);
    setManualSyncNotice(res.message);
    setTimeout(() => setManualSyncNotice(null), 3500);
  };

  const handleManualPull = async () => {
    setManualSyncLoading(true);
    await syncNow();
    setManualSyncLoading(false);
    setManualSyncNotice('Pulled latest attendance data from cloud.');
    setTimeout(() => setManualSyncNotice(null), 3500);
  };

  return (
    <div
      id="cloud-sync-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
              <Cloud className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">
                  {cloudUser ? 'Cloud Account & Sync' : authMode === 'signin' ? 'Sign In to Account' : 'Create New Account'}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0 whitespace-nowrap ${
                    isSupabaseConfigured
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {isSupabaseConfigured ? 'Cloud Live' : 'Local Storage'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {cloudUser
                  ? 'Your attendance records and timetable sync automatically to your account.'
                  : 'Sign in or create an account to access your attendance across all your devices.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Status Indicator (when logged in or configuring) */}
        {cloudUser && (
          <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {cloudSyncStatus === 'synced' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs truncate">
                    Cloud Synchronized
                  </span>
                </>
              )}
              {cloudSyncStatus === 'syncing' && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin shrink-0" />
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs truncate">
                    Syncing changes...
                  </span>
                </>
              )}
              {cloudSyncStatus === 'error' && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="text-rose-600 dark:text-rose-400 font-semibold text-xs truncate">
                    {cloudErrorMessage || 'Sync error'}
                  </span>
                </>
              )}
              {cloudSyncStatus === 'local_only' && (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="text-zinc-600 dark:text-zinc-400 text-xs truncate">
                    Local state active
                  </span>
                </>
              )}
            </div>

            {lastCloudSyncTime && (
              <span className="text-[10px] sm:text-[11px] text-zinc-400 font-mono shrink-0 ml-auto">
                Synced at: {new Date(lastCloudSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Missing Environment Config Alert (if any) */}
          {!isSupabaseConfigured && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Supabase Configuration</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/80">
                To enable live cloud authentication, ensure <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 font-mono">VITE_SUPABASE_URL</code> and <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 font-mono">VITE_SUPABASE_ANON_KEY</code> are set in your environment variables.
              </p>
            </div>
          )}

          {cloudUser ? (
            /* Logged-In User Dashboard */
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-base shrink-0">
                      {cloudUser.email ? cloudUser.email[0].toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span
                          className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[190px] xs:max-w-[240px] sm:max-w-none block"
                          title={cloudUser.email}
                        >
                          {cloudUser.email}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0 whitespace-nowrap">
                          Signed In
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate mt-0.5">
                        User ID: {cloudUser.id.substring(0, 14)}...
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={signOutCloud}
                    className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/60 sm:border-transparent"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/80 text-xs text-zinc-600 dark:text-zinc-300 flex items-start sm:items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                  <span className="leading-snug">All attendance updates, timetable slots, and subjects are securely saved to your account.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleManualUpload}
                    disabled={manualSyncLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer disabled:opacity-50 shadow-xs whitespace-nowrap min-h-[42px]"
                  >
                    <UploadCloud className="w-4 h-4 shrink-0" />
                    <span>Upload Local State</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleManualPull}
                    disabled={manualSyncLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap min-h-[42px]"
                  >
                    <DownloadCloud className="w-4 h-4 shrink-0" />
                    <span>Pull Latest Data</span>
                  </button>
                </div>
              </div>

              {manualSyncNotice && (
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-700 dark:text-indigo-300 text-center animate-in fade-in">
                  {manualSyncNotice}
                </div>
              )}
            </div>
          ) : (
            /* Login & Create Account Section */
            <div className="space-y-4">
              {/* Segmented control: Sign In vs Create Account */}
              <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                    authMode === 'signin'
                      ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                    authMode === 'signup'
                      ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="leading-snug">{authSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@college.edu"
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 mt-2 min-h-[42px] flex items-center justify-center"
                >
                  {authLoading
                    ? 'Processing...'
                    : authMode === 'signup'
                    ? 'Create Account & Sync Attendance'
                    : 'Sign In & Access Attendance'}
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  {authMode === 'signin'
                    ? "Don't have an account yet? Create one here"
                    : 'Already have an account? Sign in here'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 text-center sm:text-left">
            <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Secure account sync via Supabase</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
