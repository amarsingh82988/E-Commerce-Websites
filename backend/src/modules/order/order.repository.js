import { Order } from "./Order.js";

export async function findOrderById(id) {
  try {
    return await Order.findOne({ _id: id, isDeleted: false }).populate("user items.product").exec();
  } catch (_err) {
    return null; // Ignore CastError for invalid ObjectIds
  }
}

export async function findOrderByNumber(orderNumber) {
  return await Order.findOne({ orderNumber, isDeleted: false }).populate("user items.product").exec();
}

export async function findOrdersByUser(userId) {
  return await Order.find({ user: userId, isDeleted: false }).sort({ createdAt: -1 }).exec();
}

/**
 * findAllOrders
 * --- MULTI-VENDOR: When sellerId is provided, only returns orders that contain
 * items belonging to that seller (uses the `sellers` array for efficient lookup). ---
 */
export async function findAllOrders(filter = {}, sellerId = null) {
  const query = { isDeleted: false, ...filter };

  // --- MULTI-VENDOR: Filter orders to those containing this seller's items ---
  if (sellerId) {
    query.sellers = sellerId;
  }

  return await Order.find(query).populate("user").sort({ createdAt: -1 }).exec();
}

export async function createOrder(orderData) {
  const order = new Order(orderData);
  return await order.save();
}

/**
 * updateOrderStatus
 * --- MULTI-VENDOR: When sellerId is provided, ensures the seller owns
 * at least one item in the order before allowing status updates. ---
 */
export async function updateOrderStatus(id, status, note, trackingNumber, courier, sellerId = null) {
  let order = await Order.findById(id).catch(() => null);
  if (!order) {
    order = await Order.findOne({ orderNumber: id });
  }
  if (!order) return null;

  // --- MULTI-VENDOR: Verify seller ownership ---
  if (sellerId) {
    const sellerIdStr = sellerId.toString();
    const hasSeller = (order.sellers || []).some(s => s.toString() === sellerIdStr);
    if (!hasSeller) return null; // Seller doesn't own any items in this order
  }

  order.status = status;
  if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
  if (courier !== undefined) order.courier = courier;

  order.timeline.push({ status, note: note || `Status updated to ${status}` });
  return await order.save();
}

export const orderRepository = {
  findOrderById,
  findOrderByNumber,
  findOrdersByUser,
  findAllOrders,
  createOrder,
  updateOrderStatus,
};
