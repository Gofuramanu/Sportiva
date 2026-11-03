// src/components/ToastNotification.jsx
import React, { useEffect } from 'react';

/**
 * Reusable Floating Toast Manager for Module 10 Success & Error States.
 * Supports both Light Theme (Wireframe Admin) & Minimal Dark Mode.
 */
export default function ToastNotification({ toasts = [], onDismiss, onRetry }) {
  if (!toasts.length) return null;

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-md flex-col gap-3 sm:top-5 sm:right-5 sm:bottom-auto"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => onDismiss(toast.id)}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss, onRetry }) {
  const isError = toast.type === 'error';

  useEffect(() => {
    const duration = isError ? 8000 : 4000;
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [isError, onDismiss]);

  return (
    <div
      role="alert"
      className={`pointer-events-auto relative overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all ${
        isError
          ? 'border-rose-200 bg-white/95 text-slate-900 shadow-rose-500/10 dark:border-rose-500/40 dark:bg-zinc-900/95 dark:text-rose-100 dark:shadow-rose-950/30'
          : 'border-emerald-200 bg-white/95 text-slate-900 shadow-emerald-500/10 dark:border-emerald-500/40 dark:bg-zinc-900/95 dark:text-emerald-100 dark:shadow-emerald-950/30'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
            isError
              ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-400'
              : 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400'
          }`}
        >
          {isError ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {toast.title || (isError ? 'Operasi Gagal' : 'Berhasil')}
            </p>
            {isError && (toast.code || toast.status) && (
              <span className="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
                {toast.status ? `${toast.status} • ` : ''}
                {toast.code || 'ERROR'}
              </span>
            )}
          </div>

          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-zinc-300">
            {toast.message}
          </p>

          {/* Recovery Action Button ("Coba Lagi") */}
          {isError && typeof toast.retryAction === 'function' && (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  if (onRetry) {
                    onRetry(toast.retryAction);
                  } else {
                    toast.retryAction();
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 focus:ring-2 focus:ring-rose-500/30 focus:outline-none dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-200 dark:hover:bg-rose-500/30 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Coba Lagi
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup notifikasi"
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
