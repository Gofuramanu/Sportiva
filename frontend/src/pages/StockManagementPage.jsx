// src/pages/StockManagementPage.jsx
// MOCKUP TERISOLASI — P-A03: MANAJEMEN STOK (Murni Data Dummy Lokal, Mendukung Light & Dark Theme)
import React, { useState, useMemo } from 'react';
import ThemeToggle from '../components/ThemeToggle';

const WAREHOUSE_BRANCHES = [
  { id: 'YGY-01', name: 'Gudang Pusat (YGY-01)', location: 'Sleman, Yogyakarta' },
  { id: 'YGY-02', name: 'Gerai Malioboro (YGY-02)', location: 'Kota Yogyakarta' },
  { id: 'YGY-03', name: 'Gudang Transit (YGY-03)', location: 'Bantul, Yogyakarta' },
];

const CATEGORIES = [
  'Sepatu',
  'Alat Olahraga',
  'Pakaian',
  'Raket & Badminton',
  'Aksesoris & Gym',
];

const INITIAL_DUMMY_STOCK = [
  {
    id: 1,
    name: 'Sepatu Lari',
    subtitle: 'Sportiva AeroStride Pro',
    sku: 'SL-001',
    category: 'Sepatu',
    stock: 25,
    minStock: 10,
    updatedAt: '12 Jan 2026',
    warehouseId: 'YGY-01',
  },
  {
    id: 2,
    name: 'Bola Sepak',
    subtitle: 'Sportiva Strike Match Ball Size 5',
    sku: 'BS-002',
    category: 'Alat Olahraga',
    stock: 10,
    minStock: 15,
    updatedAt: '15 Jan 2026',
    warehouseId: 'YGY-01',
  },
  {
    id: 3,
    name: 'Jersey Olahraga',
    subtitle: 'Sportiva AeroVapor QuickDry',
    sku: 'JO-003',
    category: 'Pakaian',
    stock: 0,
    minStock: 5,
    updatedAt: '10 Jan 2026',
    warehouseId: 'YGY-01',
  },
  {
    id: 4,
    name: 'Raket Badminton',
    subtitle: 'Sportiva Carbonex Pro 30Lbs',
    sku: 'RK-004',
    category: 'Raket & Badminton',
    stock: 18,
    minStock: 8,
    updatedAt: '16 Jan 2026',
    warehouseId: 'YGY-01',
  },
  {
    id: 5,
    name: 'Tas Gym Duffle',
    subtitle: 'Sportiva HydroShield 35L',
    sku: 'TG-005',
    category: 'Aksesoris & Gym',
    stock: 4,
    minStock: 8,
    updatedAt: '14 Jan 2026',
    warehouseId: 'YGY-01',
  },
  {
    id: 6,
    name: 'Matras Yoga TPE',
    subtitle: 'Sportiva ZenGrip 8mm Anti-Slip',
    sku: 'MY-006',
    category: 'Aksesoris & Gym',
    stock: 32,
    minStock: 10,
    updatedAt: '17 Jan 2026',
    warehouseId: 'YGY-01',
  },
  {
    id: 7,
    name: 'Sepatu Futsal',
    subtitle: 'Sportiva SalaSpeed IC',
    sku: 'SF-007',
    category: 'Sepatu',
    stock: 0,
    minStock: 6,
    updatedAt: '09 Jan 2026',
    warehouseId: 'YGY-01',
  },
  {
    id: 8,
    name: 'Shuttlecock Feather',
    subtitle: 'Sportiva Tournament Grade (1 Slop)',
    sku: 'SC-008',
    category: 'Raket & Badminton',
    stock: 7,
    minStock: 12,
    updatedAt: '15 Jan 2026',
    warehouseId: 'YGY-01',
  },
];

function getStockCondition(stock, minStock) {
  const current = Number(stock) || 0;
  const threshold = Number(minStock) || 0;
  if (current <= 0) return 'habis';
  if (current <= threshold) return 'menipis';
  return 'tersedia';
}

const CONDITION_BADGE_MAP = {
  tersedia: {
    label: 'Stok Tersedia',
    dotClass: 'bg-emerald-500 dark:bg-emerald-400',
    badgeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  menipis: {
    label: 'Stok Menipis',
    dotClass: 'bg-amber-500 dark:bg-amber-400',
    badgeClass:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300',
  },
  habis: {
    label: 'Stok Habis',
    dotClass: 'bg-rose-500 dark:bg-rose-400',
    badgeClass:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
  },
};

export default function StockManagementPage({ embedded = false, onNavigate }) {
  const [items, setItems] = useState(INITIAL_DUMMY_STOCK);
  const [selectedWarehouse, setSelectedWarehouse] = useState(WAREHOUSE_BRANCHES[0].id);

  // Filter & Pagination state lokal
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // Interaksi UI lokal
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [adjustMode, setAdjustMode] = useState('set');
  const [adjustValue, setAdjustValue] = useState('');
  const [minStockValue, setMinStockValue] = useState('');
  const [adjustNote, setAdjustNote] = useState('Restock Supplier');
  const [adjustError, setAdjustError] = useState('');
  const [localToast, setLocalToast] = useState(null);

  const showToast = (title, message) => {
    setLocalToast({ id: Date.now(), title, message });
    setTimeout(() => {
      setLocalToast(null);
    }, 3500);
  };

  const kpiStats = useMemo(() => {
    const total = items.length || 1;
    let tersedia = 0;
    let menipis = 0;
    let habis = 0;

    items.forEach((item) => {
      const cond = getStockCondition(item.stock, item.minStock);
      if (cond === 'tersedia') tersedia += 1;
      else if (cond === 'menipis') menipis += 1;
      else habis += 1;
    });

    return {
      total: items.length,
      tersedia,
      menipis,
      habis,
      tersediaPct: Math.round((tersedia / total) * 1000) / 10,
      menipisPct: Math.round((menipis / total) * 1000) / 10,
      habisPct: Math.round((habis / total) * 1000) / 10,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q);

      const matchCategory = !categoryFilter || item.category === categoryFilter;
      const condition = getStockCondition(item.stock, item.minStock);
      const matchCondition = !conditionFilter || condition === conditionFilter;

      return matchSearch && matchCategory && matchCondition;
    });
  }, [items, searchQuery, categoryFilter, conditionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage, pageSize]);

  const hasActiveFilters = Boolean(searchQuery || categoryFilter || conditionFilter);

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setConditionFilter('');
    setCurrentPage(1);
  };

  const handleSimulateSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const branch = WAREHOUSE_BRANCHES.find((b) => b.id === selectedWarehouse);
      showToast(
        'Sinkronisasi Selesai',
        `Data stok untuk ${branch?.name || selectedWarehouse} telah disinkronkan (Simulasi Lokal).`
      );
    }, 650);
  };

  const handleExportCsv = () => {
    const headers = [
      'SKU',
      'Nama Produk',
      'Varian',
      'Kategori',
      'Stok Saat Ini',
      'Batas Min',
      'Kondisi',
      'Terakhir Diperbarui',
    ];
    const rows = filteredItems.map((item) => [
      item.sku,
      `"${item.name}"`,
      `"${item.subtitle}"`,
      `"${item.category}"`,
      item.stock,
      item.minStock,
      CONDITION_BADGE_MAP[getStockCondition(item.stock, item.minStock)].label,
      item.updatedAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stok-sportiva-${selectedWarehouse.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Ekspor Berhasil', `Laporan CSV (${filteredItems.length} SKU) berhasil diunduh.`);
  };

  const openUpdateStockModal = (item) => {
    setEditingItem(item);
    setAdjustMode('set');
    setAdjustValue(String(item.stock));
    setMinStockValue(String(item.minStock));
    setAdjustNote('Restock Supplier');
    setAdjustError('');
  };

  const handleSaveStockAdjustment = (e) => {
    e.preventDefault();
    if (!editingItem) return;

    const numericInput = Number(adjustValue);
    const numericMin = Number(minStockValue);

    if (adjustValue === '' || Number.isNaN(numericInput) || numericInput < 0) {
      setAdjustError('Nilai stok harus berupa angka 0 atau lebih besar.');
      return;
    }
    if (minStockValue === '' || Number.isNaN(numericMin) || numericMin < 0) {
      setAdjustError('Batas minimum stok tidak boleh negatif.');
      return;
    }

    let nextStock = editingItem.stock;
    if (adjustMode === 'set') nextStock = numericInput;
    if (adjustMode === 'add') nextStock = editingItem.stock + numericInput;
    if (adjustMode === 'subtract') nextStock = editingItem.stock - numericInput;

    if (nextStock < 0) {
      setAdjustError('Hasil akhir stok tidak boleh kurang dari 0 unit.');
      return;
    }

    const formattedToday = new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date());

    setItems((prev) =>
      prev.map((row) =>
        row.id === editingItem.id
          ? {
              ...row,
              stock: nextStock,
              minStock: numericMin,
              updatedAt: formattedToday,
            }
          : row
      )
    );

    showToast(
      'Stok Diperbarui',
      `${editingItem.name} (${editingItem.sku}) diperbarui menjadi ${nextStock} unit (${adjustNote}).`
    );
    setEditingItem(null);
  };

  const content = (
    <div className="space-y-6">
      {/* Header P-A03 */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase dark:font-semibold">
            <span className="text-blue-600 dark:text-emerald-400">Inventory Control</span>
            <span className="text-slate-300 dark:text-zinc-600">&bull;</span>
            <span className="text-slate-600 dark:text-zinc-400">Real-Time Sync</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Manajemen Stok
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Pantau dan kelola persediaan produk Sportiva di setiap cabang gudang.
          </p>
        </div>

        {/* Pemilih Cabang Gudang & Tombol Sinkronisasi */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center rounded-xl border border-indigo-100 bg-indigo-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <select
              aria-label="Pilih Cabang Gudang"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="bg-transparent pr-2 text-xs font-semibold text-slate-800 focus:outline-none dark:text-zinc-200 cursor-pointer"
            >
              {WAREHOUSE_BRANCHES.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                  className="bg-white text-slate-900 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSimulateSync}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-2 text-xs font-semibold text-slate-800 transition hover:bg-indigo-100/80 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <svg
              className={`h-3.5 w-3.5 text-slate-700 dark:text-emerald-400 ${
                isSyncing ? 'animate-spin' : ''
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi'}
          </button>
        </div>
      </div>

      {/* 3 Kartu Indikator Kondisi Stok (Sesuai Wireframe P-A03) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Kartu 1: Stok Tersedia */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                Produk dengan Stok Tersedia
              </p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-zinc-100">
                {kpiStats.tersedia}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              &bull; Optimal Status
            </span>
            <span className="text-slate-500 dark:text-zinc-400">
              {kpiStats.tersediaPct}% dari katalog
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${kpiStats.tersediaPct}%` }}
            />
          </div>
        </div>

        {/* Kartu 2: Stok Menipis */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                Produk dengan Stok Menipis
              </p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-zinc-100">
                {kpiStats.menipis}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              &bull; Di bawah batas minimum
            </span>
            <span className="text-slate-500 dark:text-zinc-400">
              {kpiStats.menipisPct}% dari katalog
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-300 dark:bg-amber-400"
              style={{ width: `${kpiStats.menipisPct}%` }}
            />
          </div>
        </div>

        {/* Kartu 3: Stok Habis */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                Produk dengan Stok Habis
              </p>
              <p className="mt-2 text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                {kpiStats.habis}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              &bull; Perlu restock segera
            </span>
            <span className="text-slate-500 dark:text-zinc-400">
              {kpiStats.habisPct}% dari katalog
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-rose-600 transition-all duration-300 dark:bg-rose-500"
              style={{ width: `${kpiStats.habisPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bilah Pencarian, Penyaringan & Ekspor Data */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:shadow-lg">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
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
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama produk atau SKU..."
              className="w-full rounded-xl border border-slate-200/80 bg-slate-100/80 py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder-slate-400 transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              aria-label="Filter Kategori"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200/80 bg-slate-100/80 px-3 py-2.5 text-sm font-medium text-slate-800 transition focus:border-slate-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-emerald-500"
            >
              <option value="">Semua Kategori</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="Filter Kondisi Stok"
              value={conditionFilter}
              onChange={(e) => {
                setConditionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200/80 bg-slate-100/80 px-3 py-2.5 text-sm font-medium text-slate-800 transition focus:border-slate-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-emerald-500"
            >
              <option value="">Semua Kondisi</option>
              <option value="tersedia">Stok Tersedia</option>
              <option value="menipis">Stok Menipis</option>
              <option value="habis">Stok Habis</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/80 px-3 py-2.5 text-xs font-semibold text-slate-800 transition hover:bg-indigo-100/80 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <svg className="h-4 w-4 text-slate-600 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
              </svg>
              Ekspor Data
            </button>
          </div>
        </div>
      </div>

      {/* Tabel Inventaris Stok */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-zinc-800/90 dark:bg-zinc-900/80 dark:shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-100/75 text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                <th className="px-6 py-4">Produk</th>
                <th className="px-4 py-4">SKU</th>
                <th className="px-4 py-4">Kategori</th>
                <th className="px-4 py-4 text-center">Stok Saat Ini</th>
                <th className="px-4 py-4 text-center">Batas Min</th>
                <th className="px-4 py-4">Kondisi Stok</th>
                <th className="px-4 py-4">Terakhir Diperbarui</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm dark:divide-zinc-800/70">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <p className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                        Data Stok Tidak Ditemukan
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                        Tidak ada SKU yang cocok dengan kata kunci atau filter kondisi stok saat ini.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-4 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                        >
                          Reset Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const condition = getStockCondition(item.stock, item.minStock);
                  const badge = CONDITION_BADGE_MAP[condition];
                  const isOut = condition === 'habis';
                  const isLow = condition === 'menipis';

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-slate-50/90 dark:hover:bg-zinc-800/35"
                    >
                      {/* Produk */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 font-mono text-xs font-bold text-slate-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-emerald-400">
                            {item.sku.split('-')[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:font-semibold dark:text-zinc-100">
                              {item.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-4">
                        <span className="rounded-md border border-indigo-100 bg-indigo-50/70 px-2 py-1 font-mono text-xs font-semibold text-slate-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                          {item.sku}
                        </span>
                      </td>

                      {/* Kategori */}
                      <td className="px-4 py-4 text-xs font-medium text-slate-600 dark:font-normal dark:text-zinc-300">
                        {item.category}
                      </td>

                      {/* Stok Saat Ini */}
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`text-sm font-extrabold ${
                            isOut
                              ? 'text-rose-600 dark:text-rose-400'
                              : isLow
                              ? 'text-amber-600 dark:text-amber-300'
                              : 'text-slate-900 dark:text-zinc-100'
                          }`}
                        >
                          {item.stock}
                        </span>
                      </td>

                      {/* Batas Min */}
                      <td className="px-4 py-4 text-center text-xs font-medium text-slate-500 dark:text-zinc-400">
                        {item.minStock}
                      </td>

                      {/* Kondisi Stok Badge */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.badgeClass}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
                          {badge.label}
                        </span>
                      </td>

                      {/* Terakhir Diperbarui */}
                      <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap dark:text-zinc-400">
                        {item.updatedAt}
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openUpdateStockModal(item)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                            isOut
                              ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-500 dark:bg-rose-500 dark:shadow-rose-500/20 dark:hover:bg-rose-400'
                              : 'border border-indigo-100 bg-indigo-50/80 text-slate-800 hover:bg-indigo-100/80 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {isOut ? (
                            <span className="font-bold">!</span>
                          ) : (
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          )}
                          Perbarui Stok
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Paginasi (Sesuai Wireframe P-A03) */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/50 px-6 py-3.5 sm:flex-row dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-zinc-400">
            <span>Tampilkan</span>
            <select
              aria-label="Jumlah baris per halaman"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:border-slate-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:border-emerald-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>&bull;</span>
            <span>
              Menampilkan{' '}
              <strong className="text-slate-900 dark:text-zinc-200">{paginatedItems.length}</strong> dari{' '}
              <strong className="text-slate-900 dark:text-zinc-200">{filteredItems.length}</strong> produk
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
            >
              &lsaquo;
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setCurrentPage(num)}
                className={`min-w-[32px] rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  num === safePage
                    ? 'bg-slate-950 text-white shadow-xs dark:bg-emerald-500 dark:text-zinc-950 dark:shadow-emerald-500/20'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
            >
              &rsaquo;
            </button>
          </div>
        </div>
      </div>

      {/* 2 Kartu Operasional Bawah (Sesuai Wireframe P-A03 Light & Dark) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-start gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 dark:border-indigo-500/20 dark:bg-indigo-500/5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-100/80 text-blue-600 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Pengiriman Masuk Hari Ini
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
              PO-2026-089 (Jersey Olahraga &amp; Bola Sepak) dijadwalkan tiba pukul 16:30 WIB dari
              Gudang Transit Sleman.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-100/80 text-slate-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Audit Stok Terjadwal
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
              Penyesuaian stok opname fisik mingguan akan berlangsung hari Jumat pukul 21:00 WIB.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Penyesuaian Stok Lokal */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-black/75"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSaveStockAdjustment}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 dark:border-zinc-800">
              <div>
                <span className="text-[11px] font-semibold tracking-wider text-indigo-600 uppercase dark:text-emerald-400">
                  Penyesuaian Inventaris ({selectedWarehouse})
                </span>
                <h2 className="mt-0.5 text-base font-bold text-slate-900 dark:text-zinc-100">
                  {editingItem.name} &mdash; {editingItem.sku}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">{editingItem.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:font-medium dark:text-zinc-300">
                  Metode Perubahan
                </label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {[
                    { id: 'set', label: 'Set Nilai Baru' },
                    { id: 'add', label: '+ Stok Masuk' },
                    { id: 'subtract', label: '- Stok Keluar' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setAdjustMode(mode.id);
                        setAdjustValue(mode.id === 'set' ? String(editingItem.stock) : '1');
                        setAdjustError('');
                      }}
                      className={`rounded-xl border px-2.5 py-2 text-xs font-semibold transition cursor-pointer ${
                        adjustMode === mode.id
                          ? 'border-slate-900 bg-slate-950 text-white dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'border-slate-200 bg-slate-100 text-slate-600 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:font-medium dark:text-zinc-300">
                    {adjustMode === 'set' ? 'Stok Baru (Unit)' : 'Jumlah Unit'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adjustValue}
                    onChange={(e) => {
                      setAdjustValue(e.target.value);
                      setAdjustError('');
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:font-medium dark:text-zinc-300">
                    Batas Minimum
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minStockValue}
                    onChange={(e) => {
                      setMinStockValue(e.target.value);
                      setAdjustError('');
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3.5 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:font-medium dark:text-zinc-300">
                  Alasan Mutasi
                </label>
                <select
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-100/80 px-3.5 py-2.5 text-sm text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-emerald-500"
                >
                  <option value="Restock Supplier">Restock Pengiriman Supplier</option>
                  <option value="Stok Opname Fisik">Penyesuaian Stok Opname Fisik</option>
                  <option value="Transfer Antar Cabang">Transfer Antar Cabang Gudang</option>
                  <option value="Barang Rusak / Retur">Koreksi Barang Rusak / Retur</option>
                </select>
              </div>

              {adjustError && (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  {adjustError}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2.5 border-t border-slate-200 pt-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-emerald-500 dark:text-zinc-950 dark:shadow-lg dark:shadow-emerald-500/20 dark:hover:bg-emerald-400 cursor-pointer"
              >
                Simpan Stok
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast Konfirmasi Lokal Terisolasi */}
      {localToast && (
        <div
          role="status"
          className="fixed right-5 bottom-5 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white/95 p-4 text-xs shadow-xl backdrop-blur dark:border-emerald-500/40 dark:bg-zinc-900/95 dark:shadow-2xl"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-zinc-100">{localToast.title}</p>
            <p className="mt-0.5 text-slate-600 dark:text-zinc-300">{localToast.message}</p>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Sidebar Standalone P-A03 */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-200/80 bg-white px-4 py-6 transition-colors md:flex dark:border-zinc-800/80 dark:bg-zinc-950">
        <div>
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

          <div className="mt-8">
            <p className="px-3 text-[10px] font-semibold tracking-widest text-slate-400 uppercase dark:text-zinc-500">
              Main Menu
            </p>
            <nav className="mt-2.5 space-y-1">
              {[
                { id: 'P-A01', label: 'Dashboard' },
                { id: 'P-A02', label: 'Produk' },
                { id: 'P-A03', label: 'Stok', active: true },
                { id: 'P-A04', label: 'Pesanan' },
              ].map((menu) => (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => onNavigate && onNavigate(menu.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition cursor-pointer ${
                    menu.active
                      ? 'bg-slate-950 font-semibold text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-950'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>{menu.label}</span>
                  <span className="text-[10px] opacity-60">{menu.id}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-900/50">
            <p className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
              P-A03 &bull; Manajemen Stok
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-500">
              Mockup UI Terisolasi (Dummy Data)
            </p>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </div>
        </div>
      </aside>

      {/* Konten Utama */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-6 py-4 backdrop-blur transition-colors dark:border-zinc-800/80 dark:bg-zinc-950/90">
          <div className="flex items-center gap-2.5">
            <span className="rounded-md border border-indigo-100 bg-indigo-50/80 px-2.5 py-1 text-[10px] font-bold tracking-widest text-slate-700 uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:font-semibold dark:text-zinc-400">
              Operational Console
            </span>
            <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
              Mockup Terisolasi &bull; Tanpa Koneksi API
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Light / Dark Theme Switcher */}
            <ThemeToggle />

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

        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-7">{content}</main>
      </div>
    </div>
  );
}
