import express from "express";
import { categoryRepository } from "./category.repository.js";

const router = express.Router();

/**
 * GET /api/categories - Public endpoint to list active categories for customers
 */
router.get("/", async (req, res) => {
  try {
    const categories = await categoryRepository.findAllCategories(false);
    return res.json(categories);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/categories/:slug - Public endpoint to fetch category details by slug
 */
router.get("/:slug", async (req, res) => {
  try {
    const category = await categoryRepository.findCategoryBySlug(req.params.slug);
    if (!category) return res.status(404).json({ message: "Category not found" });
    return res.json(category);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
