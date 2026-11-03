// P10_Sportiva/03_Implementation/productController.js
const { Product, Category, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.createProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    // 1. Otorisasi (Role Access)[cite: 23, 24]
    if (!['Seller', 'Admin'].includes(req.user.role)) {
      await t.rollback();
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Akses ditolak" } });
    }

    const { name, category_id, price, stock, description, status } = req.body;

    // 2. Server-side Validation[cite: 19]
    const errors = {};
    if (!name || name.length < 3) errors.name = "Nama minimal 3 karakter";
    if (!price || Number(price) <= 0) errors.price = "Harga harus > 0";
    if (stock < 0) errors.stock = "Stok tidak boleh negatif";
    if (!category_id) errors.category_id = "Kategori wajib diisi";

    if (Object.keys(errors).length > 0) {
      await t.rollback();
      return res.status(422).json({
        error: { code: "VALIDATION_ERROR", message: "Periksa input", fields: errors }
      }); //[cite: 20]
    }

    // 3. Business Logic[cite: 19]
    const category = await Category.findByPk(category_id);
    if (!category || category.status !== 'active') {
      await t.rollback();
      return res.status(409).json({ error: { code: "BUSINESS_RULE", message: "Kategori tidak valid" } });
    }

    // 4. Database Transaction[cite: 17, 24]
    const newProduct = await Product.create({
      name, category_id, price, stock: stock || 0, description, status: status || 'draft', seller_id: req.user.id
    }, { transaction: t });

    await t.commit();
    // 5. Konsistensi Response[cite: 20]
    return res.status(201).json({ data: newProduct, message: "Produk berhasil dibuat" });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Gangguan server" } }); //[cite: 20]
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const { q, category, status, sort = 'created_at', order = 'desc', page = 1, limit = 10 } = req.query; //[cite: 23]
    const where = {};
    
    if (q) where.name = { [Op.iLike]: `%${q}%` };
    if (category) where.category_id = category;
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const products = await Product.findAndCountAll({
      where,
      order: [[sort, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({ data: products.rows, total: products.count, page, limit }); //[cite: 20]
  } catch (error) {
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Gangguan server" } });
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Produk tidak ditemukan" } }); //[cite: 20]
    return res.status(200).json({ data: product });
  } catch (error) {
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Gangguan server" } });
  }
};

exports.updateProduct = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      await t.rollback();
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Produk tidak ditemukan" } });
    }

    // Cek Otorisasi Kepemilikan[cite: 18, 23, 24]
    if (req.user.role !== 'Admin' && product.seller_id !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Bukan pemilik data" } });
    }

    // Business Logic: Transisi Status[cite: 22]
    if (req.body.status === 'active' && product.status === 'archived') {
      await t.rollback();
      return res.status(409).json({ error: { code: "CONFLICT", message: "Produk terarsip tidak bisa diaktifkan" } }); //[cite: 20, 22]
    }

    await product.update(req.body, { transaction: t });
    await t.commit();

    return res.status(200).json({ data: product, message: "Produk diperbarui" });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Gangguan server" } });
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Produk tidak ditemukan" } });

    if (req.user.role !== 'Admin' && product.seller_id !== req.user.id) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Bukan pemilik data" } }); //[cite: 18, 24]
    }

    await product.destroy();
    return res.status(200).json({ message: "Produk berhasil dihapus" }); //[cite: 20]
  } catch (error) {
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Gangguan server" } });
  }
};