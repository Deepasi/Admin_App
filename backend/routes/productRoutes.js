// routes/productRoutes.js
import express from 'express';
import Product from '../models/Product.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a product (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    const newProduct = new Product({
      title: req.body.title,
      image: req.body.image,
      price: req.body.price,
      unit: req.body.unit,
      description: req.body.description,
      fullDescription: req.body.fullDescription,
      ingredients: req.body.ingredients,
      usageInstructions: req.body.usageInstructions
    });

    const product = await newProduct.save();
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a product (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update fields
    const { title, image, price, unit, description, fullDescription, ingredients, usageInstructions } = req.body;
    
    product.title = title || product.title;
    product.image = image || product.image;
    product.price = price || product.price;
    product.unit = unit || product.unit;
    product.description = description || product.description;
    product.fullDescription = fullDescription || product.fullDescription;
    product.ingredients = ingredients || product.ingredients;
    product.usageInstructions = usageInstructions || product.usageInstructions;
    product.updatedAt = Date.now();

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a product (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Note: product.remove() is deprecated, use deleteOne instead
    await Product.deleteOne({ _id: req.params.id });
    res.json({ message: 'Product removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;