import { Category } from "./Category.js";
import slugify from "slugify";

export async function findAllCategories(includeInactive = false) {
  const query = includeInactive ? {} : { isActive: true };
  return await Category.find(query).sort({ sortOrder: 1, name: 1 }).exec();
}

export async function findCategoryById(id) {
  return await Category.findById(id).exec();
}

export async function findCategoryBySlug(slug) {
  return await Category.findOne({ slug: slug.toLowerCase() }).exec();
}

export async function createCategory(data) {
  if (!data.slug && data.name) {
    data.slug = slugify(data.name, { lower: true, strict: true });
  } else if (data.slug) {
    data.slug = slugify(data.slug, { lower: true, strict: true });
  }

  const category = new Category(data);
  return await category.save();
}

export async function updateCategory(id, updateData) {
  if (updateData.name && !updateData.slug) {
    updateData.slug = slugify(updateData.name, { lower: true, strict: true });
  } else if (updateData.slug) {
    updateData.slug = slugify(updateData.slug, { lower: true, strict: true });
  }

  return await Category.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
}

export async function deleteCategory(id) {
  return await Category.findByIdAndDelete(id).exec();
}

export const categoryRepository = {
  findAllCategories,
  findCategoryById,
  findCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
