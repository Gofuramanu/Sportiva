// src/components/ProductTable.jsx
import React, { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';
import { PRODUCT_CATEGORIES } from '../services/api';

const SORT_OPTIONS = [
  { label: 'Terbaru (Created ↓)', sort: 'created_at', order: 'desc' },
  { label: 'Terlama (Created ↑)', sort: 'created_at', order: 'asc' },
  { label: 'Harga Terendah (Rp ↑)', sort: 'price', order: 'asc' },
  { label: 'Harga Tertinggi (Rp ↓)', sort: 'price', order: 'desc' },
  { label: 'Nama Produk (A - Z)', sort: 'name', order: 'asc' },
  { label: 'Nama Produk (Z - A)', sort: 'name', order: 'desc' },
];

const formatCurrencyIDR = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const getCategoryName = (categoryId, categoryObj) => {
  if (categoryObj?.name) return categoryObj.name;
  const found = PRODUCT_CATEGORIES.find((c) => Number(c.id) === Number(categoryId));
  return found ? found.name : `Kategori #${categoryId ?? '-'}`;
};

export default function ProductTable({
  products = [],
  total = 0,
  filters,
  onFilterChange,
  onResetFilters,
  onEdit,
  onDelete,
  onCreateNew,
  onRetryFetch,
  onEnableMock,
  isLoading = false,
  fetchError = null,
  deletingId = null,
}) {
  const [searchInput, setSearchInput] = useState(filters.q || '');
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null);

  useEffect(() => {
    setSearchInput(filters.q || '');
  }, [filters.q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.q || '')) {
        onFilterChange({ q: searchInput, page: 1 });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, filters.q, onFilterChange]);

  const hasActiveFilters = Boolean(
    filters.q ||
      filters.category ||
      filters.status ||
      filters.sort !== 'created_at' ||
      filters.order !== 'desc'
  );

  const currentPage = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 10;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleSortSelect = (e) => {
    const [sort, order] = e.target.value.split(':');
    onFilterChange({ sort, order, page: 1 });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteProduct || deletingId) return;
    const target = confirmDeleteProduct;
    await onDelete(target);
    setConfirmDeleteProduct(null);
  };

  return (
    <div className="space-y-4">
      {/* Filter, Search & Sort Toolbar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:shadow-lg">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* Search Input (?q=) */}
          <div className="relative lg:col-span-5">
            <svg
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama produk, SKU, atau kategori..."
              aria-label="Cari produk"
              className="w-full rounded-xl border border-slate-200/80 bg-slate-100/80 py-2.5 pr-9 pl-10 text-sm text-slate-900 placeholder-slate-400 transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  onFilterChange({ q: '', page: 1 });
                }}
                aria-label="Bersihkan pencarian"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Category Dropdown (?category=) */}
          <div className="lg:col-span-2">
            <select
              aria-label="Filter Kategori"
              value={filters.category || ''}
              onChange={(e) => onFilterChange({ category: e.target.value, page: 1 })}
              className="w-full rounded-xl border border-slate-200/80 bg-slate-100/80 px-3 py-2.5 text-sm font-medium text-slate-800 transition focus:border-slate-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-emerald-500"
            >
              <option value="">Semua Kategori</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown (?status=) */}
          <div className="lg:col-span-2">
            <select
              aria-label="Filter Status"
              value={filters.status || ''}
              onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
              className="w-full rounded-xl border border-slate-200/80 bg-slate-100/80 px-3 py-2.5 text-sm font-medium text-slate-800 transition focus:border-slate-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-emerald-500"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="draft">Draft</option>
              <option value="archived">Diarsipkan</option>
            </select>
          </div>

          {/* Sort & Order Dropdown (?sort= & ?order=) */}
          <div className="lg:col-span-3">
            <select
              aria-label="Urutkan Produk"
              value={`${filters.sort || 'created_at'}:${filters.order || 'desc'}`}
              onChange={handleSortSelect}
              className="w-full rounded-xl border border-slate-200/80 bg-slate-100/80 px-3 py-2.5 text-sm font-medium text-slate-800 transition focus:border-slate-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-emerald-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={`${opt.sort}:${opt.order}`} value={`${opt.sort}:${opt.order}`}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Pill Strip */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-3 text-xs dark:border-zinc-800/70">
            <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-zinc-400">
              <span>Filter aktif:</span>
              {filters.q && (
                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  Kata kunci: &ldquo;{filters.q}&rdquo;
                </span>
              )}
              {filters.category && (
                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {getCategoryName(filters.category)}
                </span>
              )}
              {filters.status && (
                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  Status: {filters.status}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onResetFilters}
              className="font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Main Data Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-100/75 text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                <th className="px-6 py-4">Produk</th>
                <th className="px-4 py-4">SKU / Kategori</th>
                <th className="px-4 py-4">Harga</th>
                <th className="px-4 py-4 text-center">Stok</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm dark:divide-zinc-800/70">
              {/* 1. MANDATORY UI STATE: LOADING SKELETON */}
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-200 dark:bg-zinc-800" />
                        <div className="space-y-2">
                          <div className="h-4 w-44 rounded bg-slate-200 dark:bg-zinc-800" />
                          <div className="h-3 w-60 rounded bg-slate-100 dark:bg-zinc-800/60" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-2">
                        <div className="h-3.5 w-16 rounded bg-slate-200 dark:bg-zinc-800" />
                        <div className="h-5 w-24 rounded-md bg-slate-100 dark:bg-zinc-800/70" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 rounded bg-slate-200 dark:bg-zinc-800" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="mx-auto h-5 w-12 rounded bg-slate-200 dark:bg-zinc-800" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-zinc-800" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="ml-auto flex justify-end gap-2">
                        <div className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-zinc-800" />
                        <div className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-zinc-800" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : fetchError && products.length === 0 ? (
                /* 2. MANDATORY UI STATE: SYSTEM/API ERROR FALLBACK */
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
                          />
                        </svg>
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-zinc-100">
                        Gagal Memuat Katalog Produk
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                        [{fetchError.code || 'ERROR'}] {fetchError.message}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={onRetryFetch}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25 cursor-pointer"
                        >
                          Coba Lagi
                        </button>
                        {onEnableMock && (
                          <button
                            type="button"
                            onClick={onEnableMock}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:border dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/30 cursor-pointer"
                          >
                            Beralih ke Mock Data (Mode Demo)
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                /* 3. MANDATORY UI STATE: EMPTY STATE WITH "RESET FILTER" */
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-zinc-100">
                        {hasActiveFilters
                          ? 'Produk Tidak Ditemukan'
                          : 'Belum Ada Produk di Katalog Sportiva'}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">
                        {hasActiveFilters
                          ? 'Tidak ada item olahraga yang cocok dengan pencarian atau filter yang Anda pilih. Coba kata kunci lain atau atur ulang filter.'
                          : 'Katalog produk masih kosong. Mulai tambahkan produk perlengkapan olahraga pertama Anda.'}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={onResetFilters}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Reset Filter
                        </button>
                        {onCreateNew && (
                          <button
                            type="button"
                            onClick={onCreateNew}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 cursor-pointer"
                          >
                            + Tambah Produk
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                /* 4. DATA ROWS */
                products.map((product) => {
                  const isDeletingThis = deletingId === product.id;
                  const skuCode =
                    product.sku || `SPV-${String(product.id).padStart(3, '0')}`;
                  const stockCount = Number(product.stock) || 0;

                  return (
                    <tr
                      key={product.id}
                      className="group transition-colors hover:bg-slate-50/90 dark:hover:bg-zinc-800/35"
                    >
                      {/* Image & Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-slate-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <svg
                                className="h-5 w-5 text-slate-700 dark:text-emerald-400/80"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900 dark:font-semibold dark:text-zinc-100">
                              {product.name}
                            </p>
                            <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500 dark:text-zinc-400">
                              {product.description || 'Perlengkapan olahraga resmi Sportiva Yogyakarta'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Category */}
                      <td className="px-4 py-4">
                        <p className="font-mono text-xs font-semibold text-slate-700 dark:font-medium dark:text-zinc-300">
                          {skuCode}
                        </p>
                        <span className="mt-1 inline-flex items-center rounded-md border border-indigo-200/70 bg-indigo-50/80 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:font-medium dark:text-indigo-300">
                          {getCategoryName(product.category_id, product.category)}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4 font-bold whitespace-nowrap text-slate-900 dark:font-semibold dark:text-zinc-100">
                        {formatCurrencyIDR(product.price)}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-4 text-center">
                        {stockCount === 0 ? (
                          <div>
                            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                              0
                            </span>
                            <span className="block text-[10px] font-semibold tracking-wider text-rose-600 uppercase dark:text-rose-400">
                              KOSONG
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span
                              className={`text-sm font-bold ${
                                stockCount < 5
                                  ? 'text-amber-600 dark:text-amber-300'
                                  : 'text-slate-900 dark:text-zinc-100'
                              }`}
                            >
                              {stockCount}
                            </span>
                            <span className="block text-[10px] font-medium tracking-wider text-slate-500 uppercase dark:text-zinc-500">
                              UNIT
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-4">
                        <StatusBadge status={product.status} stock={stockCount} />
                      </td>

                      {/* Actions: Edit / Delete */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={isDeletingThis}
                            onClick={() => onEdit(product)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-indigo-100/80 disabled:opacity-50 dark:border-zinc-700/80 dark:bg-zinc-800/70 dark:font-medium dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={Boolean(deletingId)}
                            onClick={() => setConfirmDeleteProduct(product)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:font-medium dark:text-rose-300 dark:hover:bg-rose-500/20 cursor-pointer"
                          >
                            {isDeletingThis ? (
                              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            ) : (
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                            {isDeletingThis ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && products.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/50 px-6 py-3.5 sm:flex-row dark:border-zinc-800 dark:bg-zinc-950/40">
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Menampilkan{' '}
              <span className="font-bold text-slate-900 dark:font-semibold dark:text-zinc-200">
                {products.length}
              </span>{' '}
              dari{' '}
              <span className="font-bold text-slate-900 dark:font-semibold dark:text-zinc-200">
                {total}
              </span>{' '}
              produk
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onFilterChange({ page: currentPage - 1 })}
                aria-label="Halaman sebelumnya"
                className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                &lsaquo;
              </button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                .filter(
                  (pageNum) =>
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - currentPage) <= 1
                )
                .map((pageNum, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && pageNum - prev > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsis && (
                        <span className="px-1 text-xs text-slate-400 dark:text-zinc-500">&hellip;</span>
                      )}
                      <button
                        type="button"
                        onClick={() => onFilterChange({ page: pageNum })}
                        className={`min-w-[32px] rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                          pageNum === currentPage
                            ? 'bg-slate-950 text-white shadow-xs dark:bg-emerald-500 dark:text-zinc-950 dark:shadow-emerald-500/20'
                            : 'border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onFilterChange({ page: currentPage + 1 })}
                aria-label="Halaman berikutnya"
                className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                &rsaquo;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Destructive Action Confirmation Dialog */}
      {confirmDeleteProduct && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-black/75"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">Hapus Produk?</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                  Anda akan menghapus{' '}
                  <span className="font-semibold text-slate-900 dark:text-zinc-200">
                    &ldquo;{confirmDeleteProduct.name}&rdquo;
                  </span>{' '}
                  dari katalog Sportiva. Tindakan ini memerlukan otorisasi Admin atau pemilik produk.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setConfirmDeleteProduct(null)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-500 dark:hover:bg-rose-400 cursor-pointer"
              >
                {deletingId === confirmDeleteProduct.id && (
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {deletingId === confirmDeleteProduct.id ? 'Menghapus...' : 'Ya, Hapus Produk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
