// mockBackend.js
// Standalone Node.js HTTP Backend Server for Sportiva Catalog (Module 10)
// Runs on port 4000 without requiring any external dependencies!

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 4000;

let products = [
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
    description: 'Size: 5 • Standar FIFA Certified • Kulit sintesis PU tahan aus',
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
    description: 'Size: S, M, L, XL • Dri-Fit Athletic • Cepat kering menyerap keringat',
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
    description: 'Tension 30 lbs • High Carbon Fiber • Senar & grip premium',
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

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(payload));
};

const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Buffer JSON body if method has body
  let bodyData = '';
  req.on('data', (chunk) => {
    bodyData += chunk;
  });

  req.on('end', () => {
    let body = {};
    if (bodyData) {
      try {
        body = JSON.parse(bodyData);
      } catch {
        // invalid json
      }
    }

    // 1. GET /api/v1/products (READ LIST)
    if (pathname === '/api/v1/products' && req.method === 'GET') {
      let filtered = [...products];
      const q = query.q ? query.q.toLowerCase() : null;
      const category = query.category;
      const status = query.status;
      const sort = query.sort || 'created_at';
      const order = (query.order || 'desc').toLowerCase();
      const page = parseInt(query.page || '1', 10);
      const limit = parseInt(query.limit || '10', 10);

      if (q) {
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q)
        );
      }

      if (category) {
        filtered = filtered.filter((p) => String(p.category_id) === String(category));
      }

      if (status) {
        filtered = filtered.filter((p) => p.status === status);
      }

      filtered.sort((a, b) => {
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

      const total = filtered.length;
      const offset = (page - 1) * limit;
      const paginated = filtered.slice(offset, offset + limit);

      return sendJson(res, 200, {
        data: paginated,
        total,
        page,
        limit,
      });
    }

    // 2. GET /api/v1/products/:id (READ DETAIL)
    const detailMatch = pathname.match(/^\/api\/v1\/products\/([^/]+)$/);
    if (detailMatch && req.method === 'GET') {
      const id = detailMatch[1];
      const found = products.find((p) => String(p.id) === String(id));
      if (!found) {
        return sendJson(res, 404, {
          error: { code: 'NOT_FOUND', message: 'Produk tidak ditemukan' },
        });
      }
      return sendJson(res, 200, { data: found });
    }

    // 3. POST /api/v1/products (CREATE)
    if (pathname === '/api/v1/products' && req.method === 'POST') {
      const { name, category_id, price, stock, description, status, sku, image_url } = body;

      const errors = {};
      if (!name || name.trim().length < 3) errors.name = 'Nama minimal 3 karakter';
      if (!price || Number(price) <= 0) errors.price = 'Harga harus > 0';
      if (stock === undefined || stock === null || Number(stock) < 0) errors.stock = 'Stok tidak boleh negatif';
      if (!category_id) errors.category_id = 'Kategori wajib diisi';

      if (Object.keys(errors).length > 0) {
        return sendJson(res, 422, {
          error: { code: 'VALIDATION_ERROR', message: 'Periksa input', fields: errors },
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
      return sendJson(res, 201, {
        data: newProduct,
        message: 'Produk berhasil dibuat',
      });
    }

    // 4. PATCH /api/v1/products/:id (UPDATE)
    if (detailMatch && req.method === 'PATCH') {
      const id = detailMatch[1];
      const index = products.findIndex((p) => String(p.id) === String(id));
      if (index === -1) {
        return sendJson(res, 404, {
          error: { code: 'NOT_FOUND', message: 'Produk tidak ditemukan' },
        });
      }

      const product = products[index];

      // Business rule: Archived cannot transition to active directly
      if (body.status === 'active' && product.status === 'archived') {
        return sendJson(res, 409, {
          error: { code: 'CONFLICT', message: 'Produk terarsip tidak bisa diaktifkan' },
        });
      }

      const updated = {
        ...product,
        ...body,
        id: product.id,
        price: body.price !== undefined ? Number(body.price) : product.price,
        stock: body.stock !== undefined ? Number(body.stock) : product.stock,
        category_id: body.category_id !== undefined ? Number(body.category_id) : product.category_id,
      };

      products[index] = updated;
      return sendJson(res, 200, {
        data: updated,
        message: 'Produk diperbarui',
      });
    }

    // 5. DELETE /api/v1/products/:id (DELETE)
    if (detailMatch && req.method === 'DELETE') {
      const id = detailMatch[1];
      const index = products.findIndex((p) => String(p.id) === String(id));
      if (index === -1) {
        return sendJson(res, 404, {
          error: { code: 'NOT_FOUND', message: 'Produk tidak ditemukan' },
        });
      }

      products.splice(index, 1);
      return sendJson(res, 200, {
        message: 'Produk berhasil dihapus',
      });
    }

    // 404 for unknown route
    return sendJson(res, 404, {
      error: { code: 'NOT_FOUND', message: 'Endpoint tidak ditemukan' },
    });
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Sportiva Backend API Server (Module 10)`);
  console.log(` Berjalan di: http://localhost:${PORT}/api/v1/products`);
  console.log(` CORS diaktifkan untuk frontend (port 5173)`);
  console.log(`=======================================================`);
});

