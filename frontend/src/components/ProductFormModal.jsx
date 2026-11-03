// src/components/ProductFormModal.jsx
import React, { useState, useEffect } from 'react';
import { PRODUCT_CATEGORIES } from '../services/api';

const INITIAL_FORM_STATE = {
  name: '',
  sku: '',
  category_id: '',
  price: '',
  stock: '0',
  status: 'draft',
  description: '',
  image_url: '',
};

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialProduct = null,
  isSubmitting = false,
  serverFieldErrors = {},
}) {
  const isEditMode = Boolean(initialProduct?.id);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [fieldErrors, setFieldErrors] = useState({});
  const [bypassClientValidation, setBypassClientValidation] = useState(false);

  // Hydrate or reset form when modal opens or target product changes
  useEffect(() => {
    if (isOpen) {
      if (initialProduct) {
        setFormData({
          name: initialProduct.name ?? '',
          sku: initialProduct.sku ?? '',
          category_id: initialProduct.category_id ? String(initialProduct.category_id) : '',
          price: initialProduct.price !== undefined ? String(initialProduct.price) : '',
          stock: initialProduct.stock !== undefined ? String(initialProduct.stock) : '0',
          status: initialProduct.status ?? 'draft',
          description: initialProduct.description ?? '',
          image_url: initialProduct.image_url ?? '',
        });
      } else {
        setFormData(INITIAL_FORM_STATE);
      }
      setFieldErrors({});
    }
  }, [isOpen, initialProduct]);

  // Synchronize HTTP 422 field-level errors returned by backend
  useEffect(() => {
    if (serverFieldErrors && Object.keys(serverFieldErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...serverFieldErrors }));
    }
  }, [serverFieldErrors]);

  if (!isOpen) return null;

  const validateClient = () => {
    const errors = {};
    if (!formData.name || formData.name.trim().length < 3) {
      errors.name = 'Nama minimal 3 karakter';
    }
    if (!formData.category_id) {
      errors.category_id = 'Kategori wajib diisi';
    }
    if (formData.price === '' || Number(formData.price) <= 0 || Number.isNaN(Number(formData.price))) {
      errors.price = 'Harga harus > 0';
    }
    if (formData.stock === '' || Number(formData.stock) < 0 || Number.isNaN(Number(formData.stock))) {
      errors.stock = 'Stok tidak boleh negatif';
    }
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!bypassClientValidation) {
      const clientErrors = validateClient();
      if (Object.keys(clientErrors).length > 0) {
        setFieldErrors(clientErrors);
        return;
      }
    }

    setFieldErrors({});

    const payload = {
      name: formData.name.trim(),
      category_id: formData.category_id ? Number(formData.category_id) : '',
      price: formData.price !== '' ? Number(formData.price) : 0,
      stock: formData.stock !== '' ? Number(formData.stock) : 0,
      status: formData.status,
      description: formData.description.trim(),
      ...(formData.sku.trim() ? { sku: formData.sku.trim() } : {}),
      ...(formData.image_url.trim() ? { image_url: formData.image_url.trim() } : {}),
    };

    await onSubmit(payload);
  };

  const isArchivedTransitionWarning =
    isEditMode && initialProduct?.status === 'archived' && formData.status === 'active';

  const inputBaseClass = (hasErr) =>
    `mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none ${
      hasErr
        ? 'border-rose-500 bg-rose-50/40 text-slate-900 placeholder-slate-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 dark:border-rose-500/70 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500'
        : 'border-slate-200 bg-slate-100/80 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20'
    }`;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm dark:bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-indigo-600 uppercase dark:text-emerald-400">
              {isEditMode ? 'Edit Katalog Produk' : 'Produk Baru'}
            </span>
            <h2
              id="product-modal-title"
              className="mt-0.5 text-lg font-bold text-slate-900 dark:text-zinc-100"
            >
              {isEditMode ? `Perbarui: ${initialProduct.name}` : 'Tambah Produk Sportiva'}
            </h2>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            aria-label="Tutup modal"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4 px-6 py-5">
          {/* Domain Rule Notice for Archived Products */}
          {isEditMode && initialProduct?.status === 'archived' && (
            <div
              className={`rounded-xl border p-3 text-xs leading-relaxed ${
                isArchivedTransitionWarning
                  ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200'
                  : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
              }`}
            >
              <strong className="font-semibold">Aturan Transisi Status (Domain Rule):</strong> Produk dengan status{' '}
              <code className="rounded bg-black/10 px-1 py-0.5 dark:bg-black/30">archived</code> tidak dapat langsung
              diaktifkan ke <code className="rounded bg-black/10 px-1 py-0.5 dark:bg-black/30">active</code> (akan
              ditolak server dengan HTTP 409 CONFLICT). Ubah ke{' '}
              <code className="rounded bg-black/10 px-1 py-0.5 dark:bg-black/30">draft</code> terlebih dahulu.
            </div>
          )}

          {/* Product Name */}
          <div>
            <label htmlFor="product-name" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Nama Produk <span className="text-rose-500 dark:text-rose-400">*</span>
            </label>
            <input
              id="product-name"
              name="name"
              type="text"
              disabled={isSubmitting}
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Sepatu Lari Pro Glide"
              className={inputBaseClass(Boolean(fieldErrors.name))}
            />
            {fieldErrors.name && <FieldErrorMessage message={fieldErrors.name} />}
          </div>

          {/* SKU & Category Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="product-category"
                className="block text-xs font-semibold text-slate-700 dark:text-zinc-300"
              >
                Kategori <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <select
                id="product-category"
                name="category_id"
                disabled={isSubmitting}
                value={formData.category_id}
                onChange={handleChange}
                className={inputBaseClass(Boolean(fieldErrors.category_id))}
              >
                <option value="">Pilih Kategori...</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} (ID: {cat.id})
                  </option>
                ))}
              </select>
              {fieldErrors.category_id && <FieldErrorMessage message={fieldErrors.category_id} />}
            </div>

            <div>
              <label htmlFor="product-sku" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Kode SKU <span className="font-normal text-slate-400 dark:text-zinc-500">(Opsional)</span>
              </label>
              <input
                id="product-sku"
                name="sku"
                type="text"
                disabled={isSubmitting}
                value={formData.sku}
                onChange={handleChange}
                placeholder="Contoh: SL-001"
                className={inputBaseClass(Boolean(fieldErrors.sku))}
              />
              {fieldErrors.sku && <FieldErrorMessage message={fieldErrors.sku} />}
            </div>
          </div>

          {/* Price, Stock & Status Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="product-price" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Harga (Rp) <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <input
                id="product-price"
                name="price"
                type="number"
                min="1"
                step="any"
                disabled={isSubmitting}
                value={formData.price}
                onChange={handleChange}
                placeholder="500000"
                className={inputBaseClass(Boolean(fieldErrors.price))}
              />
              {fieldErrors.price && <FieldErrorMessage message={fieldErrors.price} />}
            </div>

            <div>
              <label htmlFor="product-stock" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Stok Unit <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <input
                id="product-stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                disabled={isSubmitting}
                value={formData.stock}
                onChange={handleChange}
                placeholder="25"
                className={inputBaseClass(Boolean(fieldErrors.stock))}
              />
              {fieldErrors.stock && <FieldErrorMessage message={fieldErrors.stock} />}
            </div>

            <div>
              <label htmlFor="product-status" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Status Katalog
              </label>
              <select
                id="product-status"
                name="status"
                disabled={isSubmitting}
                value={formData.status}
                onChange={handleChange}
                className={inputBaseClass(Boolean(fieldErrors.status))}
              >
                <option value="draft">Draft</option>
                <option value="active">Aktif (Active)</option>
                <option value="archived">Diarsipkan (Archived)</option>
              </select>
              {fieldErrors.status && <FieldErrorMessage message={fieldErrors.status} />}
            </div>
          </div>

          {/* Image URL (Optional) */}
          <div>
            <label htmlFor="product-image" className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
              URL Gambar Produk <span className="font-normal text-slate-400 dark:text-zinc-500">(Opsional)</span>
            </label>
            <input
              id="product-image"
              name="image_url"
              type="url"
              disabled={isSubmitting}
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
              className={inputBaseClass(false)}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="product-description"
              className="block text-xs font-semibold text-slate-700 dark:text-zinc-300"
            >
              Deskripsi &amp; Spesifikasi Varian
            </label>
            <textarea
              id="product-description"
              name="description"
              rows={3}
              disabled={isSubmitting}
              value={formData.description}
              onChange={handleChange}
              placeholder="Contoh: Size: 40, 41, 42 • Warna: Obsidian White • Outsole karet anti-slip"
              className={inputBaseClass(Boolean(fieldErrors.description))}
            />
            {fieldErrors.description && <FieldErrorMessage message={fieldErrors.description} />}
          </div>

          {/* QA Helper Toggle for Module 10 Server-Side 422 Testing */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-zinc-800/80">
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={bypassClientValidation}
                onChange={(e) => setBypassClientValidation(e.target.checked)}
                className="rounded border-slate-300 bg-white text-slate-900 focus:ring-slate-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-emerald-500"
              />
              Lewati validasi client (uji respons HTTP 422 dari server)
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-zinc-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:text-zinc-950 dark:shadow-emerald-500/20 dark:hover:bg-emerald-400 cursor-pointer"
            >
              {isSubmitting && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {isSubmitting
                ? 'Menyimpan...'
                : isEditMode
                ? 'Simpan Perubahan'
                : '+ Simpan Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldErrorMessage({ message }) {
  return (
    <p
      role="alert"
      className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
    >
      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{message}</span>
    </p>
  );
}
