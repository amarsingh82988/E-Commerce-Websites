import { User } from "./User.js";
import { Cart } from "./Cart.js";
import { Wishlist } from "./Wishlist.js";
import { Address } from "./Address.js";

export async function findByEmail(email, selectFields = "") {
  let query = User.findOne({ email });
  if (selectFields) query = query.select(selectFields);
  return await query.exec();
}

export async function findById(id, selectFields = "") {
  let query = User.findById(id);
  if (selectFields) query = query.select(selectFields);
  return await query.exec();
}

export async function createUser(userData, opts = {}) {
  const user = new User(userData);
  return await user.save(opts);
}

export async function updateUser(id, updateData, opts = {}) {
  return await User.findByIdAndUpdate(
    id,
    updateData,
    { new: true, ...opts }
  ).exec();
}

export async function getCart(userId) {
  const cartDoc = await Cart.findOne({ userId }).exec();
  if (!cartDoc || !cartDoc.items) return [];
  return cartDoc.items.map((item) => ({
    productId: item.productId,
    qty: item.qty || 1,
    color: item.color,
    size: item.size,
    note: item.note,
  }));
}

export async function updateCart(userId, rawItems) {
  const formattedItems = (rawItems || []).map((item) => ({
    productId: (item.productId || item.product || item._id || "").toString(),
    qty: item.qty || item.quantity || 1,
    color: item.color || "",
    size: item.size || "",
    note: item.note || "",
  })).filter(i => i.productId);

  const cartDoc = await Cart.findOneAndUpdate(
    { userId },
    { items: formattedItems },
    { upsert: true, new: true, ...opts }
  ).exec();

  if (!cartDoc || !cartDoc.items) return [];
  return cartDoc.items.map((item) => ({
    productId: item.productId,
    qty: item.qty || 1,
    color: item.color,
    size: item.size,
    note: item.note,
  }));
}

export async function getWishlist(userId) {
  const wishlistDoc = await Wishlist.findOne({ userId }).exec();
  if (!wishlistDoc || !wishlistDoc.items) return [];
  return wishlistDoc.items.map(id => id.toString());
}

export async function updateWishlist(userId, productIds) {
  const ids = (productIds || []).map((id) => (typeof id === "object" ? id._id || id.id : id)).filter(Boolean);
  const wishlistDoc = await Wishlist.findOneAndUpdate(
    { userId },
    { items: ids },
    { upsert: true, new: true }
  ).exec();
  
  if (!wishlistDoc || !wishlistDoc.items) return [];
  return wishlistDoc.items.map((id) => id.toString());
}

export async function getAddresses(userId) {
  const addressDoc = await Address.findOne({ userId }).exec();
  return addressDoc ? addressDoc.addresses : [];
}

export async function updateAddresses(userId, addresses, opts = {}) {
  const addressDoc = await Address.findOneAndUpdate(
    { userId },
    { addresses: addresses || [] },
    { upsert: true, new: true }
  ).exec();
  return addressDoc ? addressDoc.addresses : [];
}

export const userRepository = {
  findByEmail,
  findById,
  createUser,
  updateUser,
  getCart,
  updateCart,
  getWishlist,
  updateWishlist,
  getAddresses,
  updateAddresses,
};
