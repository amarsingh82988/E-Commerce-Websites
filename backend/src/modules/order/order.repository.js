import { Order } from "./Order.js";

export async function findOrderById(id) {
  try {
    return await Order.findOne({ _id: id, isDeleted: false }).populate("user items.product").exec();
  } catch (err) {
    return null; // Ignore CastError for invalid ObjectIds
  }
}

export async function findOrderByNumber(orderNumber) {
  return await Order.findOne({ orderNumber, isDeleted: false }).populate("user items.product").exec();
}

export async function findOrdersByUser(userId) {
  return await Order.find({ user: userId, isDeleted: false }).sort({ createdAt: -1 }).exec();
}

export async function findAllOrders(filter = {}) {
  return await Order.find({ isDeleted: false, ...filter }).populate("user").sort({ createdAt: -1 }).exec();
}

export async function createOrder(orderData) {
  const order = new Order(orderData);
  return await order.save();
}

export async function updateOrderStatus(id, status, note, trackingNumber, courier) {
  let order = await Order.findById(id).catch(() => null);
  if (!order) {
    order = await Order.findOne({ orderNumber: id });
  }
  if (!order) return null;

  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (courier) order.courier = courier;

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
