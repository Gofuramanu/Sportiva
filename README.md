# ⚡ Sportiva — Platform E-Commerce Perlengkapan Olahraga Yogyakarta

Repositori pengembangan aplikasi web **Sportiva** (*Backoffice Operational Console & Catalog Platform*), dibangun menggunakan pendekatan *Software Development Life Cycle* (SDLC) bertahap pada mata kuliah **Praktikum Aplikasi Web (INF60285)** — Program Studi Teknologi Informasi, Fakultas Teknik, Universitas Negeri Yogyakarta.

---

## 📌 Ringkasan Proyek

**Sportiva** adalah platform *e-commerce* perlengkapan olahraga terkurasi yang menargetkan wilayah DI Yogyakarta dan sekitarnya. Sistem *Backoffice* ini dirancang bagi **Admin** dan **Seller** untuk mengelola katalog produk, memantau ketersediaan stok lintas cabang gudang secara *real-time*, serta memproses pesanan pelanggan secara terpusat.

### Fitur Unggulan Saat Ini
- **Dual Theme System (*Light & Dark Mode*)**: Mendukung tema terang sesuai spesifikasi *wireframe* resmi serta tema gelap modern (*Minimal Dark Mode*) dengan penyimpanan preferensi otomatis.
- **Core CRUD Katalog Produk (P-A02)**: Operasi *Create, Read, Update, Delete* penuh yang terintegrasi dengan pencarian *debounced*, penyaringan kategori/status, pengurutan multi-kolom, dan penomoran halaman tersinkronisasi URL (*URL Query Sync*).
- **4 Mandatory UI States**: Penanganan eksplisit untuk kondisi *Loading* (*skeleton* & proteksi *double-submit*), *Empty State* (*Reset Filter*), *Error State* (pemisahan validasi *inline* `HTTP 422` vs. *Floating Toast* `HTTP 401/403/404/409/500` dengan aksi **Coba Lagi**), serta *Success State*.
- **Dual Data Mode**: Dapat terhubung langsung ke server HTTP Backend riil maupun beralih ke *Mock Data Interaktif* satu klik untuk keperluan demonstrasi mandiri.

---

## 🛠️ Tech Stack

| Lapisan | Teknologi |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS v4 |
| **Backend Reference & Mock API** | Node.js (HTTP REST API / Express + Sequelize ORM Contract) |
| **Format Pertukaran Data** | JSON terstandarisasi (`{ data, message }` & `{ error: { code, message, fields } }`) |
| **Autentikasi & Otorisasi** | JWT `Authorization: Bearer <token>` berbasis Role (`Admin`, `Seller`, `Public`) |

---

## 📂 Struktur Repositori

```text
SPORTIVA/
├── frontend/                          # Aplikasi Frontend React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProductFormModal.jsx   # Modal tambah/edit produk + validasi inline HTTP 422
│   │   │   ├── ProductTable.jsx       # Tabel katalog, search/filter/sort, skeleton, empty state
│   │   │   ├── StatusBadge.jsx        # Lencana status konsisten (Aktif, Draft, Diarsipkan)
│   │   │   ├── ThemeToggle.jsx        # Pengalih Light Theme & Dark Theme
│   │   │   └── ToastNotification.jsx  # Notifikasi melayang sukses/galat + tombol Coba Lagi
│   │   ├── pages/
│   │   │   ├── ProductManagementPage.jsx # Halaman utama P-A01 (Ringkasan) & P-A02 (Kelola Produk)
│   │   │   └── StockManagementPage.jsx   # Mockup UI terisolasi P-A03 (Manajemen Stok)
│   │   └── services/
│   │       └── api.js                 # HTTP client terpusat & adapter Mock Data
│   ├── .env.example                   # Contoh konfigurasi environment frontend
│   └── vite.config.js                 # Konfigurasi Vite & proxy API
├── wireframe admin/                   # Referensi desain antarmuka resmi (P-A00 s.d. P-A04)
├── gemini-code-1793632699338.js       # Referensi implementasi productController.js (Sequelize)
├── mockBackend.js                     # Server HTTP Node.js mandiri (Port 4000) sesuai kontrak P10
├── CRUD.docx                          # Dokumen kontrak endpoint & matriks parameter query
└── Modul Praktikum Pertemuan 10.pdf   # Spesifikasi & Quality Gate Praktikum Pertemuan 10
```

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

### 1. Menjalankan Server Backend (Port `4000`)
Buka terminal pada direktori utama proyek, lalu jalankan server API mandiri:
```powershell
node mockBackend.js
```
Server akan aktif di `http://localhost:4000/api/v1/products`.

### 2. Menjalankan Aplikasi Frontend (Port `5173`)
Buka terminal baru, masuk ke folder `frontend`, pasang dependensi, dan jalankan Vite:
```powershell
cd frontend
cp .env.example .env
npm install
npm run dev
```
Buka peramban di `http://localhost:5173`.

---

## 🔗 Ringkasan Kontrak Endpoint (Entitas: `Products`)

| Operasi | Metode & Rute | Hak Akses | Status Respons Utama |
| :--- | :--- | :--- | :--- |
| **Create** | `POST /api/v1/products` | `Admin`, `Seller` | `201`, `422`, `401`, `403`, `409` |
| **Read List** | `GET /api/v1/products?q=&category=&status=&sort=&order=&page=&limit=` | Publik | `200`, `500` |
| **Read Detail** | `GET /api/v1/products/{id}` | Publik | `200`, `404` |
| **Update** | `PATCH /api/v1/products/{id}` | `Admin`, Pemilik | `200`, `403`, `404`, `409` (*archived → active ditolak*), `422` |
| **Delete** | `DELETE /api/v1/products/{id}` | `Admin`, Pemilik | `200` / `204`, `403`, `404`, `409` |

---

## 📅 Log Progres Mingguan (SDLC Milestone Tracker)

Bagian ini diperbarui setiap minggu mengikuti tahapan modul praktikum untuk memudahkan penelusuran progres (*traceability*).

### ✅ Pertemuan 10 — Core CRUD & Data Flow *(Selesai & Lulus Quality Gate)*
- [x] Penetapan kontrak endpoint CRUD & parameter *query* (`?q=`, `?category=`, `?status=`, `?sort=`, `?order=`, `?page=`, `?limit=`).
- [x] Pemisahan validasi input (`HTTP 422 VALIDATION_ERROR` per kolom) dan aturan bisnis domain (`HTTP 409 CONFLICT` pada transisi ilegal `archived -> active`).
- [x] Implementasi penuh antarmuka **P-A02 (Kelola Produk)** & ringkasan awal **P-A01 (Dashboard Admin)**.
- [x] Implementasi 4 kondisi wajib antarmuka (*Loading Skeleton & Double-Submit Guard*, *Empty State + Reset Filter*, *Inline & Toast Error + Coba Lagi*, *Success Toast + Auto-Refetch*).
- [x] Penambahan sistem tema ganda (*Light Theme* sesuai *wireframe* & *Minimal Dark Mode*).

### 🔄 Persiapan Pertemuan 11 — Ekspansi Modul Inventaris *(UI Prototype Ready)*
- [x] Pembuatan prototipe antarmuka terisolasi **P-A03 (Manajemen Stok)** di `StockManagementPage.jsx` menggunakan data *dummy* lokal tanpa mengganggu stabilitas kode P10.
- [x] Kalkulasi dinamis indikator kondisi stok (*Tersedia*, *Menipis*, *Habis*), ekspor laporan `.csv` lokal, pemilih cabang gudang Yogyakarta (`YGY-01` s.d. `YGY-03`), dan modal simulasi mutasi stok.
- [ ] Integrasi *Service Adapter* `P-A03` ke *endpoint* backend resmi setelah spesifikasi Pertemuan 11 diturunkan.

### 📋 Rencana Pertemuan Selanjutnya (Backlog Terjadwal)
- [ ] Pembangunan antarmuka terisolasi & mesin status konfiguratif untuk **P-A04 (Manajemen Pesanan)**.
- [ ] Agregasi metrik lintas modul secara menyeluruh pada **P-A01 (Dashboard Admin)** dan halaman autentikasi **P-A00 (Login Admin)**.
- [ ] Pengujian integrasi *end-to-end* lintas entitas (*Produk — Stok — Pesanan*) & *deployment*.
