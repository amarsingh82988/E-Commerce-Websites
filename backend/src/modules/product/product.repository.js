import { Product } from "./Product.js";
import { Category } from "../category/Category.js";
import slugify from "slugify";

export async function findProductById(id, sellerId = null) {
  const filter = { _id: id, isDeleted: false };
  // --- MULTI-VENDOR: If sellerId is provided, restrict to that seller's products ---
  if (sellerId) filter.seller = sellerId;
  return await Product.findOne(filter).populate("category").exec();
}

export async function findProductBySlug(slug) {
  let product = await Product.findOne({ slug: slug.toLowerCase(), isDeleted: false }).populate("category").exec();
  if (!product && slug.match(/^[0-9a-fA-F]{24}$/)) {
    product = await Product.findOne({ _id: slug, isDeleted: false }).populate("category").exec();
  }
  return product;
}

export async function findAllProducts(queryOpts = {}) {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    badge,
    sort = "newest",
    page = 1,
    limit = 20,
    includeInactive = false,
    // --- MULTI-VENDOR: Filter products by seller ---
    sellerId = null,
  } = queryOpts;

  const filter = { isDeleted: false };
  if (!includeInactive) filter.isActive = true;

  // --- MULTI-VENDOR: Restrict to seller's own products when sellerId is given ---
  if (sellerId) filter.seller = sellerId;

  // Filter by category slug or ObjectId
  if (category) {
    if (category.match(/^[0-9a-fA-F]{24}$/)) {
      filter.category = category;
    } else {
      const catDoc = await Category.findOne({ slug: category.toLowerCase() });
      if (catDoc) {
        filter.category = catDoc._id;
      }
    }
  }

  // Filter by search term
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  // Filter by price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }

  // Filter by badges
  if (badge) {
    if (badge === "featured") filter.featured = true;
    if (badge === "bestseller") filter.bestseller = true;
    if (badge === "newArrival") filter.newArrival = true;
  }

  // Sorting
  let sortObj = { createdAt: -1 };
  if (sort === "price-asc") sortObj = { price: 1 };
  if (sort === "price-desc") sortObj = { price: -1 };
  if (sort === "rating") sortObj = { rating: -1, reviewCount: -1 };
  if (sort === "newest") sortObj = { createdAt: -1 };

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(filter).populate("category").sort(sortObj).skip(skip).limit(limitNum).exec(),
    Product.countDocuments(filter),
  ]);

  return { products, total, page: pageNum, pages: Math.ceil(total / limitNum) };
}

export async function createProduct(data) {
  if (data.category && typeof data.category === "string" && !data.category.match(/^[0-9a-fA-F]{24}$/)) {
    const catDoc = await Category.findOne({ slug: data.category.toLowerCase() });
    if (catDoc) {
      data.category = catDoc._id;
    }
  }

  const baseSlug = data.slug ? slugify(data.slug, { lower: true, strict: true }) : slugify(data.name, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  while (await Product.exists({ slug: uniqueSlug })) {
    uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  data.slug = uniqueSlug;

  if (!data.sku || data.sku.trim() === "") {
    let isSkuUnique = false;
    let newSku = "";
    while (!isSkuUnique) {
      newSku = "SKU-" + String(Math.floor(100000 + Math.random() * 900000));
      if (!(await Product.exists({ sku: newSku }))) {
        isSkuUnique = true;
      }
    }
    data.sku = newSku;
  }

  if (data.images && data.images.length > 0 && !data.featuredImage) {
    data.featuredImage = data.images[0];
  }

  const product = new Product(data);
  const saved = await product.save();
  return await Product.findById(saved._id).populate("category").exec();
}

export async function updateProduct(id, updateData, sellerId = null) {
  const filter = { _id: id, isDeleted: false };
  // --- MULTI-VENDOR: Ensure seller can only update their own products ---
  if (sellerId) filter.seller = sellerId;

  if (updateData.category && typeof updateData.category === "string" && !updateData.category.match(/^[0-9a-fA-F]{24}$/)) {
    const catDoc = await Category.findOne({ slug: updateData.category.toLowerCase() });
    if (catDoc) {
      updateData.category = catDoc._id;
    }
  }

  if (updateData.name && !updateData.slug) {
    updateData.slug = slugify(updateData.name, { lower: true, strict: true });
  } else if (updateData.slug) {
    updateData.slug = slugify(updateData.slug, { lower: true, strict: true });
  }

  if (updateData.images && updateData.images.length > 0 && !updateData.featuredImage) {
    updateData.featuredImage = updateData.images[0];
  }

  return await Product.findOneAndUpdate(filter, updateData, { new: true, runValidators: true }).populate("category").exec();
}

export async function softDeleteProduct(id, deletedBy, sellerId = null) {
  const filter = { _id: id };
  // --- MULTI-VENDOR: Ensure seller can only delete their own products ---
  if (sellerId) filter.seller = sellerId;

  return await Product.findOneAndUpdate(
    filter,
    { isDeleted: true, deletedAt: new Date(), deletedBy },
    { new: true }
  ).exec();
}

export async function toggleBadges(id, badgeData, sellerId = null) {
  const filter = { _id: id };
  // --- MULTI-VENDOR: Ensure seller can only toggle their own product badges ---
  if (sellerId) filter.seller = sellerId;

  return await Product.findOneAndUpdate(filter, badgeData, { new: true }).populate("category").exec();
}

export const productRepository = {
  findProductById,
  findProductBySlug,
  findAllProducts,
  createProduct,
  updateProduct,
  softDeleteProduct,
  toggleBadges,
};
