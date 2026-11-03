// src/components/StatusBadge.jsx
import React from 'react';

const STATUS_CONFIG = {
  active: {
    label: 'AKTIF',
    dotClass: 'bg-emerald-500 dark:bg-emerald-400',
    badgeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  draft: {
    label: 'DRAFT',
    dotClass: 'bg-amber-500 dark:bg-amber-400',
    badgeClass:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300',
  },
  archived: {
    label: 'DIARSIPKAN',
    dotClass: 'bg-slate-400 dark:bg-zinc-400',
    badgeClass:
      'border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-300',
  },
};

export default function StatusBadge({ status = 'draft', stock }) {
  const normalizedStatus = String(status).toLowerCase();
  const config = STATUS_CONFIG[normalizedStatus] || {
    label: String(status).toUpperCase(),
    dotClass: 'bg-slate-400 dark:bg-zinc-400',
    badgeClass:
      'border-slate-200 bg-slate-100 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  };

  const isOutOfStock = stock !== undefined && Number(stock) === 0;

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wider ${config.badgeClass}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
        {config.label}
      </span>

      {isOutOfStock && (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          ! STOK HABIS
        </span>
      )}
    </div>
  );
}
