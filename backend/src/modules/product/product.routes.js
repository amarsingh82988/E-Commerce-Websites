import express from "express";
import { productRepository } from "./product.repository.js";

const router = express.Router();

/**
 * GET /api/products - Public product catalog listing with search, category, price range, badge filters & pagination
 */
router.get("/", async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, badge, sort, page, limit } = req.query;
    const result = await productRepository.findAllProducts({
      category,
      search,
      minPrice,
      maxPrice,
      badge,
      sort,
      page,
      limit,
      includeInactive: false,
    });
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/products/:slug - Public endpoint to get product details by slug
 */
router.get("/:slug", async (req, res) => {
  try {
    const product = await productRepository.findProductBySlug(req.params.slug);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/products/id/:id - Public endpoint to get product details by ID
 */
router.get("/id/:id", async (req, res) => {
  try {
    const product = await productRepository.findProductById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
