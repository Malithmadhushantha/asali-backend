const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const Product = require('../models/Product');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// Initialize Supabase client
// Replace with your actual Supabase URL and key
const supabase = createClient(
  process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
  process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const { category, featured, search, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (featured) query.featured = featured === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single product (public)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create product (admin only)
router.post('/', verifyToken, verifyAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, category, sizes, colors, stock, featured } = req.body;
    
    let imageUrls = [];

    // Upload images to Supabase
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `${Date.now()}-${Math.random()}.${file.originalname.split('.').pop()}`;
        
        const { data, error } = await supabase.storage
          .from('products')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) {
          console.error('Supabase upload error:', error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);

        imageUrls.push(urlData.publicUrl);
      }
    }

    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      category,
      sizes: JSON.parse(sizes || '[]'),
      colors: JSON.parse(colors || '[]'),
      stock: parseInt(stock),
      featured: featured === 'true',
      images: imageUrls
    });

    await product.save();
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product (admin only)
router.put('/:id', verifyToken, verifyAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, category, sizes, colors, stock, featured } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let imageUrls = [...product.images];

    // Upload new images to Supabase
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `${Date.now()}-${Math.random()}.${file.originalname.split('.').pop()}`;
        
        const { data, error } = await supabase.storage
          .from('products')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
          });

        if (error) {
          console.error('Supabase upload error:', error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);

        imageUrls.push(urlData.publicUrl);
      }
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price: parseFloat(price),
        category,
        sizes: JSON.parse(sizes || '[]'),
        colors: JSON.parse(colors || '[]'),
        stock: parseInt(stock),
        featured: featured === 'true',
        images: imageUrls
      },
      { new: true }
    );

    res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete product (admin only)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all products for admin
router.get('/admin/all', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;