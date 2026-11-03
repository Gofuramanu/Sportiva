// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const TOKEN_STORAGE_KEY = 'sportiva_token';
const MOCK_STORAGE_KEY = 'sportiva_mock_products';
const MOCK_ACTIVE_KEY = 'sportiva_use_mock';

export class ApiError extends Error {
  constructor({ status, code, message, fields = null }) {
    super(message || 'Terjadi kesalahan pada sistem');
    this.name = 'ApiError';
    this.status = status;
    this.code = code || `HTTP_${status}`;
    this.fields = fields;
  }
}

export const getAuthToken = () => localStorage.getItem(TOKEN_STORAGE_KEY) || '';

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export const isMockMode = () => {
  const forced = import.meta.env.VITE_USE_MOCK;
  if (forced === 'true') return true;
  return localStorage.getItem(MOCK_ACTIVE_KEY) === 'true';
};

export const setMockMode = (enabled) => {
  if (enabled) {
    localStorage.setItem(MOCK_ACTIVE_KEY, 'true');
  } else {
    localStorage.removeItem(MOCK_ACTIVE_KEY);
  }
};

export const PRODUCT_CATEGORIES = [
  { id: 1, name: 'Sepatu', status: 'active' },
  { id: 2, name: 'Alat Olahraga', status: 'active' },
  { id: 3, name: 'Pakaian', status: 'active' },
  { id: 4, name: 'Raket & Badminton', status: 'active' },
  { id: 5, name: 'Aksesoris & Gym', status: 'active' },
];

const INITIAL_MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Sepatu Lari Pro Glide',
    sku: 'SL-001',
    category_id: 1,
    price: 500000,
    stock: 25,
    status: 'active',
    description: 'Size: 40, 41, 42 • Warna: Obsidian White • Outsole karet anti-slip',
    seller_id: 1,
    created_at: '2026-03-15T08:00:00.000Z',
  },
  {
    id: 2,
    name: 'Bola Sepak Pro Match',
    sku: 'BS-002',
    category_id: 2,
    price: 200000,
    stock: 10,
    status: 'active',
    description: 'Size: 5 • Standar FIFA Certified • Bahan kulit sintesis PU tahan aus',
    seller_id: 1,
    created_at: '2026-03-14T09:30:00.000Z',
  },
  {
    id: 3,
    name: 'Jersey Olahraga Performance',
    sku: 'JO-003',
    category_id: 3,
    price: 150000,
    stock: 0,
    status: 'draft',
    description: 'Size: S, M, L, XL • Dri-Fit Athletic • Bahan cepat kering menyerap keringat',
    seller_id: 1,
    created_at: '2026-03-13T10:15:00.000Z',
  },
  {
    id: 4,
    name: 'Raket Badminton Carbon Pro',
    sku: 'RK-004',
    category_id: 4,
    price: 750000,
    stock: 12,
    status: 'active',
    description: 'Tension 30 lbs • High Carbon Fiber • Termasuk grip dan senar premium',
    seller_id: 1,
    created_at: '2026-03-12T14:20:00.000Z',
  },
  {
    id: 5,
    name: 'Tas Gym Duffle Waterproof',
    sku: 'TG-005',
    category_id: 5,
    price: 320000,
    stock: 4,
    status: 'active',
    description: 'Kapasitas 35L • Kompartemen sepatu terpisah • Bahan anti-air',
    seller_id: 1,
    created_at: '2026-03-11T11:00:00.000Z',
  },
  {
    id: 6,
    name: 'Matras Yoga Anti-Slip',
    sku: 'MY-006',
    category_id: 5,
    price: 180000,
    stock: 18,
    status: 'archived',
    description: 'Tebal 8mm • Eco-friendly TPE • Dilengkapi tali pengikat',
    seller_id: 1,
    created_at: '2026-03-10T16:45:00.000Z',
  },
];

function getMockData() {
  const stored = localStorage.getItem(MOCK_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_PRODUCTS));
  return INITIAL_MOCK_PRODUCTS;
}

function saveMockData(list) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(list));
}

/**
 * In-memory / LocalStorage Mock Controller matching productController.js
 */
function handleMockRequest(endpoint, { method = 'GET', body, params } = {}) {
  const products = getMockData();

  // 1. GET /products (List)
  if (endpoint === '/products' && method === 'GET') {
    let result = [...products];
    const q = params?.q?.toLowerCase();
    const category = params?.category;
    const status = params?.status;
    const sort = params?.sort || 'created_at';
    const order = (params?.order || 'desc').toLowerCase();
    const page = parseInt(params?.page || '1', 10);
    const limit = parseInt(params?.limit || '10', 10);

    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    if (category) {
      result = result.filter((p) => String(p.category_id) === String(category));
    }
    if (status) {
      result = result.filter((p) => p.status === status);
    }

    result.sort((a, b) => {
      let valA = a[sort];
      let valB = b[sort];
      if (sort === 'price' || sort === 'stock') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    const total = result.length;
    const offset = (page - 1) * limit;
    const paged = result.slice(offset, offset + limit);

    return {
      data: paged,
      total,
      page,
      limit,
    };
  }

  // 2. GET /products/:id (Detail)
  const detailMatch = endpoint.match(/^\/products\/([^/]+)$/);
  if (detailMatch && method === 'GET') {
    const id = detailMatch[1];
    const found = products.find((p) => String(p.id) === String(id));
    if (!found) {
      throw new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'Produk tidak ditemukan',
      });
    }
    return { data: found };
  }

  // 3. POST /products (Create)
  if (endpoint === '/products' && method === 'POST') {
    const { name, category_id, price, stock, description, status, sku, image_url } = body || {};
    const errors = {};
    if (!name || name.trim().length < 3) errors.name = 'Nama minimal 3 karakter';
    if (!price || Number(price) <= 0) errors.price = 'Harga harus > 0';
    if (stock === undefined || stock === null || Number(stock) < 0) errors.stock = 'Stok tidak boleh negatif';
    if (!category_id) errors.category_id = 'Kategori wajib diisi';

    if (Object.keys(errors).length > 0) {
      throw new ApiError({
        status: 422,
        code: 'VALIDATION_ERROR',
        message: 'Periksa input',
        fields: errors,
      });
    }

    const cat = PRODUCT_CATEGORIES.find((c) => String(c.id) === String(category_id));
    if (!cat || cat.status !== 'active') {
      throw new ApiError({
        status: 409,
        code: 'BUSINESS_RULE',
        message: 'Kategori tidak valid',
      });
    }

    const newId = products.length ? Math.max(...products.map((p) => Number(p.id) || 0)) + 1 : 1;
    const newProduct = {
      id: newId,
      name: name.trim(),
      sku: sku || `SPV-${String(newId).padStart(3, '0')}`,
      category_id: Number(category_id),
      price: Number(price),
      stock: Number(stock) || 0,
      description: description || '',
      status: status || 'draft',
      image_url: image_url || '',
      seller_id: 1,
      created_at: new Date().toISOString(),
    };

    products.unshift(newProduct);
    saveMockData(products);
    return { data: newProduct, message: 'Produk berhasil dibuat' };
  }

  // 4. PATCH /products/:id (Update)
  if (detailMatch && method === 'PATCH') {
    const id = detailMatch[1];
    const index = products.findIndex((p) => String(p.id) === String(id));
    if (index === -1) {
      throw new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'Produk tidak ditemukan',
      });
    }

    const product = products[index];

    // Business rule: Cannot activate archived product directly
    if (body.status === 'active' && product.status === 'archived') {
      throw new ApiError({
        status: 409,
        code: 'CONFLICT',
        message: 'Produk terarsip tidak bisa diaktifkan',
      });
    }

    const updated = {
      ...product,
      ...body,
      id: product.id, // prevent ID overwrite
      price: body.price !== undefined ? Number(body.price) : product.price,
      stock: body.stock !== undefined ? Number(body.stock) : product.stock,
      category_id: body.category_id !== undefined ? Number(body.category_id) : product.category_id,
    };

    products[index] = updated;
    saveMockData(products);
    return { data: updated, message: 'Produk diperbarui' };
  }

  // 5. DELETE /products/:id (Delete)
  if (detailMatch && method === 'DELETE') {
    const id = detailMatch[1];
    const index = products.findIndex((p) => String(p.id) === String(id));
    if (index === -1) {
      throw new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'Produk tidak ditemukan',
      });
    }

    products.splice(index, 1);
    saveMockData(products);
    return { message: 'Produk berhasil dihapus' };
  }

  throw new ApiError({
    status: 404,
    code: 'NOT_FOUND',
    message: 'Endpoint tidak ditemukan',
  });
}

/**
 * Core HTTP client wrapper with intelligent Mock fallback
 */
export async function apiRequest(endpoint, { method = 'GET', body, params, requireAuth = false } = {}) {
  // If mock mode is active, handle locally
  if (isMockMode()) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const res = handleMockRequest(endpoint, { method, body, params });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      }, 150); // simulate realistic network latency
    });
  }

  const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        url.searchParams.set(key, String(value).trim());
      }
    });
  }

  const headers = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAuthToken();
  if (token || requireAuth) {
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Tidak dapat terhubung ke server Sportiva. Periksa koneksi jaringan atau server API.',
    });
  }

  if (response.status === 204) {
    return { data: null, message: 'Operasi berhasil dijalankan' };
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errObj = payload?.error || {};
    throw new ApiError({
      status: response.status,
      code: errObj.code || `HTTP_${response.status}`,
      message: errObj.message || getDefaultErrorMessage(response.status),
      fields: errObj.fields || null,
    });
  }

  return payload;
}

function getDefaultErrorMessage(status) {
  switch (status) {
    case 401:
      return 'Sesi belum terautentikasi atau token Bearer tidak valid.';
    case 403:
      return 'Akses ditolak. Anda tidak memiliki izin untuk aksi ini.';
    case 404:
      return 'Produk tidak ditemukan.';
    case 409:
      return 'Konflik aturan bisnis atau transisi status tidak diizinkan.';
    case 422:
      return 'Periksa kembali input form Anda.';
    default:
      return 'Gangguan server internal. Silakan coba beberapa saat lagi.';
  }
}

export const productApi = {
  getProducts: (queryParams = {}) =>
    apiRequest('/products', { method: 'GET', params: queryParams }),

  getProductById: (id) =>
    apiRequest(`/products/${encodeURIComponent(id)}`, { method: 'GET' }),

  createProduct: (payload) =>
    apiRequest('/products', { method: 'POST', body: payload, requireAuth: true }),

  updateProduct: (id, payload) =>
    apiRequest(`/products/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload, requireAuth: true }),

  deleteProduct: (id) =>
    apiRequest(`/products/${encodeURIComponent(id)}`, { method: 'DELETE', requireAuth: true }),
};
