// src/pages/ProductManagementPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { productApi, getAuthToken, setAuthToken, isMockMode, setMockMode } from '../services/api';
import ProductTable from '../components/ProductTable';
import ProductFormModal from '../components/ProductFormModal';
import ToastNotification from '../components/ToastNotification';
import StatusBadge from '../components/StatusBadge';
import ThemeToggle from '../components/ThemeToggle';

const DEFAULT_FILTERS = {
  q: '',
  category: '',
  status: '',
  sort: 'created_at',
  order: 'desc',
  page: 1,
  limit: 10,
};

function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get('q') || '',
    category: params.get('category') || '',
    status: params.get('status') || '',
    sort: params.get('sort') || 'created_at',
    order: params.get('order') || 'desc',
    page: Math.max(1, parseInt(params.get('page') || '1', 10) || 1),
    limit: Math.max(1, parseInt(params.get('limit') || '10', 10) || 10),
  };
}

function writeFiltersToUrl(filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', String(filters.category));
  if (filters.status) params.set('status', filters.status);
  if (filters.sort && filters.sort !== 'created_at') params.set('sort', filters.sort);
  if (filters.order && filters.order !== 'desc') params.set('order', filters.order);
  if (Number(filters.page) > 1) params.set('page', String(filters.page));
  if (Number(filters.limit) !== 10) params.set('limit', String(filters.limit));

  const queryString = params.toString();
  const nextUrl = queryString
    ? `${window.location.pathname}?${queryString}`
    : window.location.pathname;

  window.history.replaceState(null, '', nextUrl);
}

export default function ProductManagementPage() {
  // Active Backoffice Screen: 'P-A02' (Kelola Produk) or 'P-A01' (Dashboard Admin)
  const [activeScreen, setActiveScreen] = useState('P-A02');

  // Synchronized URL query state
  const [filters, setFilters] = useState(readFiltersFromUrl);

  // Server data & Mandatory UI states
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Modal & Mutation states (POST / PATCH / DELETE)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [serverFieldErrors, setServerFieldErrors] = useState({});

  // Toast Notification Queue
  const [toasts, setToasts] = useState([]);

  // Mock / Demo Mode state
  const [mockActive, setMockActive] = useState(isMockMode);

  // Bearer Token Auth Drawer/Popover
  const [tokenInput, setTokenInput] = useState(getAuthToken);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const pushToast = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, ...toast }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync URL bar whenever filters change
  useEffect(() => {
    writeFiltersToUrl(filters);
  }, [filters]);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => setFilters(readFiltersFromUrl());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // READ LIST: GET /api/v1/products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await productApi.getProducts(filters);
      setProducts(Array.isArray(response?.data) ? response.data : []);
      setTotalProducts(Number(response?.total ?? response?.data?.length ?? 0));
    } catch (err) {
      setFetchError(err);
      pushToast({
        type: 'error',
        title: 'Gagal Memuat Produk',
        status: err.status,
        code: err.code,
        message: err.message,
        retryAction: () => fetchProducts(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, pushToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter handlers
  const handleFilterChange = useCallback((partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setServerFieldErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal (fetches fresh detail via GET /api/v1/products/{id})
  const handleOpenEdit = async (product) => {
    setServerFieldErrors({});
    setEditingProduct(product);
    setIsModalOpen(true);

    try {
      const detailRes = await productApi.getProductById(product.id);
      if (detailRes?.data) {
        setEditingProduct(detailRes.data);
      }
    } catch (err) {
      if (err.status === 404) {
        setIsModalOpen(false);
        pushToast({
          type: 'error',
          title: 'Produk Tidak Ditemukan',
          status: err.status,
          code: err.code,
          message: err.message,
          retryAction: () => fetchProducts(),
        });
      }
    }
  };

  // CREATE (POST) & UPDATE (PATCH) handler
  const submitProductPayload = async (payload, targetProduct = editingProduct) => {
    setIsSubmitting(true);
    setServerFieldErrors({});

    try {
      if (targetProduct?.id) {
        const res = await productApi.updateProduct(targetProduct.id, payload);
        pushToast({
          type: 'success',
          title: 'Produk Diperbarui',
          message: res?.message || 'Data produk berhasil diperbarui.',
        });
      } else {
        const res = await productApi.createProduct(payload);
        pushToast({
          type: 'success',
          title: 'Produk Ditambahkan',
          message: res?.message || 'Produk baru berhasil ditambahkan ke katalog Sportiva.',
        });
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (err) {
      if (err.status === 422 && err.fields) {
        setServerFieldErrors(err.fields);
        return;
      }

      pushToast({
        type: 'error',
        title: targetProduct?.id ? 'Gagal Memperbarui Produk' : 'Gagal Membuat Produk',
        status: err.status,
        code: err.code,
        message: err.message,
        retryAction: () => submitProductPayload(payload, targetProduct),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE handler
  const handleDeleteProduct = async (product) => {
    setDeletingId(product.id);
    try {
      const res = await productApi.deleteProduct(product.id);
      pushToast({
        type: 'success',
        title: 'Produk Dihapus',
        message: res?.message || `Produk "${product.name}" berhasil dihapus.`,
      });
      await fetchProducts();
    } catch (err) {
      pushToast({
        type: 'error',
        title: 'Gagal Menghapus Produk',
        status: err.status,
        code: err.code,
        message: err.message,
        retryAction: () => handleDeleteProduct(product),
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleMock = (enabled) => {
    setMockMode(enabled);
    setMockActive(enabled);
    pushToast({
      type: 'success',
      title: enabled ? 'Mode Demo Aktif' : 'Mode Server Riil Aktif',
      message: enabled
        ? 'Aplikasi sekarang menggunakan Mock Data interaktif lokal.'
        : 'Aplikasi beralih menghubungkan API server riil.',
    });
    fetchProducts();
  };

  const handleSaveToken = (e) => {
    e.preventDefault();
    setAuthToken(tokenInput);
    setShowAuthModal(false);
    pushToast({
      type: 'success',
      title: 'Token Autentikasi Disimpan',
      message: tokenInput.trim()
        ? 'Bearer token siap digunakan untuk operasi Create, Update, dan Delete.'
        : 'Bearer token dihapus (Mode Public / Guest).',
    });
  };

  // Computed Inventory KPIs for P-A01 & P-A02
  const totalStockUnits = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const activeCount = products.filter((p) => p.status === 'active').length;
  const lowStockCount = products.filter((p) => (Number(p.stock) || 0) < 5).length;
  const estimatedInventoryValue = products.reduce(
    (acc, p) => acc + (Number(p.price) || 0) * (Number(p.stock) || 0),
    0
  );
  const stockAvailabilityPct =
    products.length > 0
      ? Math.round(
          (products.filter((p) => Number(p.stock) > 0).length / products.length) * 1000
        ) / 10
      : 0;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Floating Toast Notification Manager */}
      <ToastNotification
        toasts={toasts}
        onDismiss={dismissToast}
        onRetry={(retryFn) => retryFn()}
      />

      {/* Left Sidebar (Matching Sportiva Backoffice Wireframe Light & Dark) */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white px-4 py-6 transition-colors md:flex dark:border-zinc-800/80 dark:bg-zinc-950">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm dark:bg-emerald-500 dark:text-zinc-950 dark:shadow-lg dark:shadow-emerald-500/20">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h7v8l10-12h-7V2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-wide text-slate-900 dark:text-zinc-100">
                SPORTIVA
              </p>
              <p className="text-[10px] font-medium tracking-widest text-slate-500 uppercase dark:text-zinc-500">
                Backoffice
              </p>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="mt-8">
            <p className="px-3 text-[10px] font-semibold tracking-widest text-slate-400 uppercase dark:text-zinc-500">
              Main Menu
            </p>
            <nav className="mt-2.5 space-y-1">
              <button
                type="button"
                onClick={() => setActiveScreen('P-A01')}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition cursor-pointer ${
                  activeScreen === 'P-A01'
                    ? 'bg-slate-950 font-semibold text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
                Dashboard
              </button>

              <button
                type="button"
                onClick={() => setActiveScreen('P-A02')}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition cursor-pointer ${
                  activeScreen === 'P-A02'
                    ? 'bg-slate-950 font-semibold text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Produk
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Region Info & Logout */}
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-900/50">
            <p className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
              Sportiva Yogyakarta
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-500">
              Module 10 &bull; Core CRUD &amp; Data Flow
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTokenInput('');
              setAuthToken('');
              pushToast({
                type: 'success',
                title: 'Sesi Token Direset',
                message: 'Bearer token dihapus (kembali ke mode Guest/Public).',
              });
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Console Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-6 py-4 backdrop-blur transition-colors dark:border-zinc-800/80 dark:bg-zinc-950/90">
          <div className="flex items-center gap-3">
            {/* Mobile screen switcher */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 md:hidden dark:border-zinc-800 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setActiveScreen('P-A01')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  activeScreen === 'P-A01'
                    ? 'bg-slate-950 text-white dark:bg-zinc-100 dark:text-zinc-950'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                P-A01
              </button>
              <button
                type="button"
                onClick={() => setActiveScreen('P-A02')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  activeScreen === 'P-A02'
                    ? 'bg-slate-950 text-white dark:bg-zinc-100 dark:text-zinc-950'
                    : 'text-slate-600 dark:text-zinc-400'
                }`}
              >
                P-A02
              </button>
            </div>

            <span className="rounded-md border border-indigo-100 bg-indigo-50/80 px-2.5 py-1 text-[10px] font-bold tracking-widest text-slate-700 uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:font-semibold dark:text-zinc-400">
              Operational Console
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Light / Dark Theme Switcher */}
            <ThemeToggle />

            {/* Mode Toggle: Real API Server vs. Mock Data */}
            <button
              type="button"
              onClick={() => handleToggleMock(!mockActive)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                mockActive
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25'
                  : 'border-slate-200 bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
              title="Beralih antara Server API Riil dan Mock Data Lokal"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  mockActive ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-slate-400 dark:bg-zinc-600'
                }`}
              />
              {mockActive ? 'Mode Demo (Mock Data)' : 'Mode Server API'}
            </button>

            {/* JWT Token Configurator for Role Access Testing */}
            <button
              type="button"
              onClick={() => {
                setTokenInput(getAuthToken());
                setShowAuthModal(true);
              }}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                getAuthToken()
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20'
                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  getAuthToken() ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-500 dark:bg-amber-400'
                }`}
              />
              {getAuthToken() ? 'Bearer Token Aktif' : 'Set Bearer Token'}
            </button>

            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3 dark:border-zinc-800">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-200">
                  Admin User
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-500">Administrator</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white dark:border dark:border-zinc-700 dark:bg-zinc-900 dark:text-emerald-400">
                AU
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-7">
          {activeScreen === 'P-A01' ? (
            /* =========================================================
               SCREEN P-A01: DASHBOARD ADMIN
               ========================================================= */
            <div className="space-y-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                      Dashboard Admin
                    </h1>
                    <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-indigo-700 uppercase dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                      Live System
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                    Selamat datang, Admin Sportiva &mdash; ringkasan operasional katalog Yogyakarta.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveScreen('P-A02')}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Buka Katalog Produk &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveScreen('P-A02');
                      handleOpenCreate();
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-zinc-950 dark:shadow-lg dark:shadow-emerald-500/20 dark:hover:bg-emerald-400 cursor-pointer"
                  >
                    + Kelola Produk
                  </button>
                </div>
              </div>

              {/* P-A01 KPI Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  label="TOTAL PRODUK"
                  value={isLoading ? '...' : totalProducts}
                  subtext="Total entitas di database"
                  accent="emerald"
                />
                <KpiCard
                  label="TOTAL STOK"
                  value={isLoading ? '...' : totalStockUnits}
                  subtext="Unit perlengkapan olahraga"
                  accent="indigo"
                />
                <KpiCard
                  label="PRODUK AKTIF"
                  value={isLoading ? '...' : activeCount}
                  subtext="Siap tayang ke pembeli"
                  accent="emerald"
                />
                <KpiCard
                  label="PERLU RESTOCK"
                  value={isLoading ? '...' : lowStockCount}
                  subtext="Stok di bawah 5 unit"
                  accent={lowStockCount > 0 ? 'rose' : 'zinc'}
                />
              </div>

              {/* P-A01 Quick Product Snapshot */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-zinc-800/90 dark:bg-zinc-900/80">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-slate-900 dark:bg-emerald-400" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      Produk Terbaru
                    </h2>
                    <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                      Real-time sync
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('P-A02')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer"
                  >
                    Kelola Semua Produk &rsaquo;
                  </button>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-zinc-800/60"
                      />
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500 dark:text-zinc-400">
                    Belum ada produk untuk ditampilkan. Klik <strong>+ Kelola Produk</strong> untuk mulai menambahkan data.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800/70">
                    {products.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-4 py-3.5"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:font-semibold dark:text-zinc-100">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-zinc-500">
                            Stok: {item.stock} unit &bull; Rp{' '}
                            {Number(item.price || 0).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={item.status} stock={item.stock} />
                          <button
                            type="button"
                            onClick={() => {
                              setActiveScreen('P-A02');
                              handleOpenEdit(item);
                            }}
                            className="rounded-lg border border-indigo-100 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-indigo-100/80 dark:border-zinc-700 dark:bg-zinc-800 dark:font-medium dark:text-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                          >
                            Detail / Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* =========================================================
               SCREEN P-A02: KELOLA PRODUK (PRIMARY CRUD MODULE)
               ========================================================= */
            <div className="space-y-6">
              {/* Breadcrumb & Header */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs text-slate-500 dark:text-zinc-500">
                    Backoffice &rsaquo;{' '}
                    <span className="font-semibold text-slate-800 dark:font-medium dark:text-zinc-300">
                      Katalog Produk
                    </span>
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                    Kelola Produk
                  </h1>
                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                    Kelola informasi produk, SKU, variasi stok, dan ketersediaan di katalog Sportiva.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase dark:text-zinc-500">
                        Total SKU
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                        {isLoading ? '...' : `${totalProducts} Item`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 dark:bg-emerald-500 dark:text-zinc-950 dark:shadow-lg dark:shadow-emerald-500/20 dark:hover:bg-emerald-400 cursor-pointer"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                    Tambah Produk
                  </button>
                </div>
              </div>

              {/* Reusable ProductTable Component */}
              <ProductTable
                products={products}
                total={totalProducts}
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteProduct}
                onCreateNew={handleOpenCreate}
                onRetryFetch={fetchProducts}
                onEnableMock={() => handleToggleMock(true)}
                isLoading={isLoading}
                fetchError={fetchError}
                deletingId={deletingId}
              />

              {/* Bottom Inventory Metrics matching Wireframe P-A02 */}
              <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-zinc-800/90 dark:bg-zinc-900/70">
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
                      Ketersediaan Stok
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-emerald-400">
                      {isLoading ? '...' : `${stockAvailabilityPct}%`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                      Persentase SKU halaman aktif siap dikirim
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-zinc-800/90 dark:bg-zinc-900/70">
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
                      Peringatan Restock
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                      {isLoading ? '...' : `${lowStockCount} SKU`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                      Stok berada di bawah ambang 5 unit
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-zinc-800/90 dark:bg-zinc-900/70">
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
                      Estimasi Nilai Stok
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-blue-600 dark:text-indigo-400">
                      {isLoading
                        ? '...'
                        : `Rp ${estimatedInventoryValue.toLocaleString('id-ID')}`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                      Valuasi inventaris halaman aktif Sportiva
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-400">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsModalOpen(false);
            setEditingProduct(null);
            setServerFieldErrors({});
          }
        }}
        onSubmit={(payload) => submitProductPayload(payload, editingProduct)}
        initialProduct={editingProduct}
        isSubmitting={isSubmitting}
        serverFieldErrors={serverFieldErrors}
      />

      {/* Bearer Token Auth Modal */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-black/75"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveToken}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Konfigurasi Bearer Token (JWT)
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
              Endpoint <code className="font-semibold text-slate-900 dark:text-zinc-200">POST</code>,{' '}
              <code className="font-semibold text-slate-900 dark:text-zinc-200">PATCH</code>, dan{' '}
              <code className="font-semibold text-slate-900 dark:text-zinc-200">DELETE</code> mewajibkan header{' '}
              <code className="font-semibold text-indigo-600 dark:text-emerald-400">
                Authorization: Bearer &lt;token&gt;
              </code>{' '}
              dengan role <strong>Admin</strong> atau <strong>Seller</strong>.
            </p>
            <textarea
              rows={3}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Tempelkan JWT token Admin/Seller di sini..."
              className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-100/80 p-3 font-mono text-xs text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:placeholder-zinc-600 dark:focus:border-emerald-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 cursor-pointer"
              >
                Simpan Token
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, subtext, accent = 'emerald' }) {
  const accentMap = {
    emerald:
      'border-slate-200/90 dark:border-emerald-500/20',
    indigo:
      'border-slate-200/90 dark:border-indigo-500/20',
    rose:
      'border-rose-200 dark:border-rose-500/30',
    zinc:
      'border-slate-200/90 dark:border-zinc-800',
  };

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-xs dark:bg-zinc-900/80 dark:shadow-md ${
        accentMap[accent] || accentMap.zinc
      }`}
    >
      <p
        className={`text-[11px] font-semibold tracking-wider uppercase ${
          accent === 'rose'
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-slate-500 dark:text-zinc-400'
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-zinc-100">{value}</p>
      <p className="mt-2 text-xs text-slate-500 dark:text-zinc-500">{subtext}</p>
    </div>
  );
}
