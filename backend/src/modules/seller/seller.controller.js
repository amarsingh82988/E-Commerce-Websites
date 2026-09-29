import { sellerService } from "./seller.service.js";
import { User } from "../user/User.js";
import { Product } from "../product/Product.js";
import { Order } from "../order/Order.js";
import { categoryRepository } from "../category/category.repository.js";
import { productRepository } from "../product/product.repository.js";
import { orderRepository } from "../order/order.repository.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.service.js";
import { sessionService } from "../session/session.service.js";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  SINGLE SELLER MODE TOGGLE                                              ║
// ║  Set to `true`  → Only 1 seller can register. Seller ID filters are     ║
// ║                    skipped. All products/orders are global.              ║
// ║  Set to `false` → Multiple sellers can register. Every product, order,  ║
// ║                    and settings query is filtered by req.user._id.      ║
// ║                                                                         ║
// ║  To switch to multi-vendor: change `true` to `false` below.             ║
// ╚══════════════════════════════════════════════════════════════════════════╝
const IS_SINGLE_SELLER_MODE = true;

/**
 * Helper: Returns the seller's ObjectId to use for data filtering.
 * In single-seller mode, returns null (no filtering).
 * In multi-vendor mode, returns req.user._id.
 */
function getSellerFilter(req) {
  if (IS_SINGLE_SELLER_MODE) return null;
  return req.user._id || req.user.id;
}


// ══════════════════════════════════════════════════════════════════════════════
//  AUTH: Register, Verify, Login, Logout
// ══════════════════════════════════════════════════════════════════════════════

export async function sellerRegister(req, res) {
  try {
    // --- SINGLE SELLER MODE: Block registration if a seller already exists ---
    if (IS_SINGLE_SELLER_MODE) {
      const existingSeller = await User.findOne({ role: "seller" }).lean();
      if (existingSeller) {
        return res.status(403).json({
          message: "Registration is currently closed. Only one seller account is allowed in single-seller mode."
        });
      }
    }

    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "Name, email, phone and password are required" });
    }
    const user = await sellerService.register(name, email, password, phone);
    return res.status(201).json({ message: "Seller registered. Verification OTP sent to email.", userId: user._id });
  } catch (err) {
    console.error(err);
    if (err.message === "User with this email already exists") return res.status(409).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function sellerVerifyEmail(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Email and code are required" });
    await sellerService.verifyEmail(email, code);
    return res.json({ message: "Seller email verified successfully. You can now log in." });
  } catch (err) {
    console.error(err);
    if (err.message === "Invalid or expired OTP") return res.status(401).json({ message: err.message });
    if (err.message === "User not found") return res.status(404).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function sellerLoginStep1(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const result = await sellerService.loginStep1(email, password);
    return res.json(result);
  } catch (err) {
    console.error(err);
    if (err.message === "Invalid credentials") return res.status(401).json({ message: err.message });
    if (err.message === "Email not verified") return res.status(403).json({ message: "Please verify your email first. Check your inbox for the verification OTP." });
    if (err.message === "Account is blocked") return res.status(403).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function sellerLoginStep2(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Email and OTP code are required" });
    const result = await sellerService.loginStep2(email, code);

    // Create session
    const { sessionId, expiresAt } = await sessionService.createSession(
      result.user.id,
      result.user.role,
      "User"
    );
    sessionService.setSessionCookie(res, sessionId, expiresAt);

    return res.json({ message: "Login successful", user: result.user });
  } catch (err) {
    console.error(err);
    if (err.message === "Invalid or expired OTP" || err.message === "Invalid credentials") {
      return res.status(401).json({ message: err.message });
    }
    if (err.message.includes("Access denied")) {
      return res.status(403).json({ message: err.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
}

export async function sellerLogout(req, res) {
  const sessionId = req.cookies?.sessionId;
  if (sessionId) {
    await sessionService.destroySession(sessionId);
  }
  sessionService.clearSessionCookie(res);
  return res.json({ message: "Logged out successfully" });
}


// ══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

export async function getDashboardStats(req, res) {
  try {
    const sellerId = getSellerFilter(req);

    // --- MULTI-VENDOR: Stats are scoped to this seller's data ---
    const productFilter = { isDeleted: false };
    const orderFilter = {};
    if (sellerId) {
      productFilter.seller = sellerId;
      orderFilter.sellers = sellerId;
    }

    const [totalProducts, totalOrders, pendingOrders, revenueAgg] = await Promise.all([
      Product.countDocuments(productFilter),
      Order.countDocuments(orderFilter),
      Order.countDocuments({ ...orderFilter, status: "pending" }),
      Order.aggregate([
        { $match: { ...orderFilter, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    return res.json({
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue: revenueAgg.length > 0 ? revenueAgg[0].total : 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════════════════════

export async function getAllProducts(req, res) {
  try {
    const { category, search, page, limit } = req.query;
    const sellerId = getSellerFilter(req);

    const result = await productRepository.findAllProducts({
      category,
      search,
      page,
      limit,
      includeInactive: true,
      // --- MULTI-VENDOR: Only show this seller's products ---
      sellerId,
    });
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function createProduct(req, res) {
  try {
    const {
      name,
      slug,
      sku,
      shortDescription,
      description,
      price,
      compareAtPrice,
      category,
      stock,
      images,
      featuredImage,
      colors,
      sizes,
      materials,
      careInstructions,
      estimatedDelivery,
      customizable,
      tags,
      featured,
      bestseller,
      newArrival,
      isActive,
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ message: "Name, price, and category are required" });
    }

    const productData = {
      name,
      slug,
      sku,
      shortDescription: shortDescription || "",
      description: description || "",
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      category,
      stock: stock ? Number(stock) : 0,
      images: images || [],
      featuredImage: featuredImage || (images && images.length > 0 ? images[0] : ""),
      colors: colors || [],
      sizes: sizes || [],
      materials: materials || "",
      careInstructions: careInstructions || "",
      estimatedDelivery: estimatedDelivery || "7-10 days",
      customizable: Boolean(customizable),
      tags: tags || [],
      featured: Boolean(featured),
      bestseller: Boolean(bestseller),
      newArrival: Boolean(newArrival),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      // --- MULTI-VENDOR: Tag product with seller's ID ---
      seller: req.user._id || req.user.id,
    };

    const product = await productRepository.createProduct(productData);

    return res.status(201).json({ message: "Product created successfully", product });
  } catch (err) {
    console.error(err);

    // Rollback: Delete any orphaned images from Cloudinary since product creation failed
    if (req.body.images && Array.isArray(req.body.images)) {
      for (const imgUrl of req.body.images) {
        await deleteFromCloudinary(imgUrl);
      }
    }
    if (req.body.featuredImage && (!req.body.images || !req.body.images.includes(req.body.featuredImage))) {
      await deleteFromCloudinary(req.body.featuredImage);
    }

    if (err.code === 11000) {
      return res.status(409).json({ message: "Product with this slug or SKU already exists" });
    }
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const sellerId = getSellerFilter(req);

    // --- MULTI-VENDOR: findProductById checks seller ownership ---
    const oldProduct = await productRepository.findProductById(id, sellerId);
    if (!oldProduct) return res.status(404).json({ message: "Product not found" });

    // --- MULTI-VENDOR: updateProduct checks seller ownership ---
    const product = await productRepository.updateProduct(id, updateData, sellerId);

    // Cleanup removed images from Cloudinary
    if (updateData.images && Array.isArray(updateData.images)) {
      const oldImages = oldProduct.images || [];
      for (const oldImg of oldImages) {
        if (!updateData.images.includes(oldImg)) {
          await deleteFromCloudinary(oldImg);
        }
      }
    }

    return res.json({ message: "Product updated successfully", product });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const sellerId = getSellerFilter(req);

    // --- MULTI-VENDOR: findProductById checks seller ownership ---
    const oldProduct = await productRepository.findProductById(id, sellerId);
    if (!oldProduct) return res.status(404).json({ message: "Product not found" });

    // --- MULTI-VENDOR: softDeleteProduct checks seller ownership ---
    await productRepository.softDeleteProduct(id, req.user._id, sellerId);

    // Cleanup images from Cloudinary when deleted from DB
    if (oldProduct.images && Array.isArray(oldProduct.images)) {
      for (const imgUrl of oldProduct.images) {
        await deleteFromCloudinary(imgUrl);
      }
    }
    if (oldProduct.featuredImage && (!oldProduct.images || !oldProduct.images.includes(oldProduct.featuredImage))) {
      await deleteFromCloudinary(oldProduct.featuredImage);
    }

    return res.json({ message: "Product soft deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function toggleProductBadges(req, res) {
  try {
    const { id } = req.params;
    const { featured, bestseller, newArrival } = req.body;
    const sellerId = getSellerFilter(req);

    // --- MULTI-VENDOR: toggleBadges checks seller ownership ---
    const product = await productRepository.toggleBadges(id, { featured, bestseller, newArrival }, sellerId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    return res.json({ message: "Product badges updated", product });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════════════════════════════════════

export async function getCategories(req, res) {
  try {
    const categories = await categoryRepository.findAllCategories(true);
    return res.json(categories);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function createCategory(req, res) {
  try {
    const { name, slug, description, image, sortOrder, isActive } = req.body;
    if (!name) return res.status(400).json({ message: "Category name is required" });

    const category = await categoryRepository.createCategory({
      name,
      slug,
      description: description || "",
      image: image || "",
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    });


    return res.status(201).json({ message: "Category created successfully", category });
  } catch (err) {
    console.error(err);

    // Rollback: Delete image if category creation failed
    if (req.body.image) {
      await deleteFromCloudinary(req.body.image);
    }

    if (err.code === 11000) return res.status(409).json({ message: "Category with this slug already exists" });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const oldCategory = await categoryRepository.findCategoryById(id);
    if (!oldCategory) return res.status(404).json({ message: "Category not found" });

    const category = await categoryRepository.updateCategory(id, updateData);

    // Cleanup removed image from Cloudinary
    if (updateData.image !== undefined && oldCategory.image && updateData.image !== oldCategory.image) {
      await deleteFromCloudinary(oldCategory.image);
    }

    return res.json({ message: "Category updated successfully", category });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const oldCategory = await categoryRepository.findCategoryById(id);
    if (!oldCategory) return res.status(404).json({ message: "Category not found" });

    await categoryRepository.deleteCategory(id);

    // Cleanup image from Cloudinary when deleted from DB
    if (oldCategory.image) {
      await deleteFromCloudinary(oldCategory.image);
    }

    return res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════════════════════════════════════════════

export async function getAllOrders(req, res) {
  try {
    const sellerId = getSellerFilter(req);

    // --- MULTI-VENDOR: Only fetch orders containing this seller's items ---
    const orders = await orderRepository.findAllOrders({}, sellerId);
    return res.json(orders);
  } catch (err) {
    console.error("Error fetching all orders:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getOrderById(req, res) {
  try {
    const { id } = req.params;
    let order = await orderRepository.findOrderById(id);
    if (!order) {
      order = await orderRepository.findOrderByNumber(id);
    }
    if (!order) return res.status(404).json({ message: "Order not found" });

    // --- MULTI-VENDOR: Verify seller has items in this order ---
    const sellerId = getSellerFilter(req);
    if (sellerId) {
      const sellerIdStr = sellerId.toString();
      const hasSeller = (order.sellers || []).some(s => s.toString() === sellerIdStr);
      if (!hasSeller) return res.status(404).json({ message: "Order not found" });
    }

    return res.json(order);
  } catch (err) {
    console.error("Error fetching order:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, note, trackingNumber, courier } = req.body;
    const sellerId = getSellerFilter(req);

    // --- MULTI-VENDOR: updateOrderStatus verifies seller ownership ---
    const order = await orderRepository.updateOrderStatus(id, status, note, trackingNumber, courier, sellerId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json({ message: "Order status updated", order });
  } catch (err) {
    console.error("Error updating order status:", err);
    return res.status(500).json({ message: "Server error" });
  }
}


// ══════════════════════════════════════════════════════════════════════════════
//  CUSTOM ORDERS (placeholder)
// ══════════════════════════════════════════════════════════════════════════════

export async function getAllRequests(req, res) {
  try {
    return res.json([]);
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateQuote(req, res) {
  try {
    return res.json({ message: "Quote updated" });
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateStatus(req, res) {
  try {
    return res.json({ message: "Status updated" });
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function addUpdate(req, res) {
  try {
    return res.json({ message: "Update added" });
  } catch (_err) {
    return res.status(500).json({ message: "Server error" });
  }
}
