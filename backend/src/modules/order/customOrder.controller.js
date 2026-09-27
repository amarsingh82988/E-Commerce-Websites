import { CustomOrder } from "./CustomOrder.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.service.js";

export async function createCustomOrder(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required. Only logged-in users can request a custom order." });
    }

    const { name, email, phone, type, budget, deadline, colors, size, details, referenceImage } = req.body;

    if (!name || !email || !type || !details) {
      return res.status(400).json({ message: "Name, email, product type, and details are required." });
    }

    if (details.trim().length < 10) {
      return res.status(400).json({ message: "Please describe your idea in a little more detail (at least 10 characters)." });
    }

    const customOrder = new CustomOrder({
      user: req.user._id || req.user.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : "",
      type: type.trim(),
      budget: budget ? budget.trim() : "",
      deadline: deadline ? deadline.trim() : "",
      colors: colors ? colors.trim() : "",
      size: size ? size.trim() : "",
      details: details.trim(),
      referenceImage: typeof referenceImage === "string" ? referenceImage.trim() : "",
      status: "requested",
    });

    await customOrder.save();

    return res.status(201).json({
      success: true,
      message: "Custom order request created successfully!",
      customOrder,
    });
  } catch (err) {
    console.error("Error creating custom order:", err);
    if (req.body.referenceImage) {
      await deleteFromCloudinary(req.body.referenceImage);
    }
    return res.status(500).json({ message: "Failed to create custom order request." });
  }
}

export async function getMyCustomOrders(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const userId = req.user._id || req.user.id;
    const orders = await CustomOrder.find({ user: userId }).sort({ createdAt: -1 }).lean();

    return res.json(orders);
  } catch (err) {
    console.error("Error fetching user custom orders:", err);
    return res.status(500).json({ message: "Server error fetching custom orders." });
  }
}

export async function getAllCustomOrders(req, res) {
  try {
    const orders = await CustomOrder.find().populate("user", "name email phone").sort({ createdAt: -1 }).lean();
    return res.json(orders);
  } catch (err) {
    console.error("Error fetching all custom orders:", err);
    return res.status(500).json({ message: "Server error fetching all custom orders." });
  }
}

export async function updateCustomOrder(req, res) {
  try {
    const { id } = req.params;
    const { status, quoteAmount, notes } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (quoteAmount !== undefined) updates.quoteAmount = Number(quoteAmount);
    if (notes !== undefined) updates.notes = notes;

    const order = await CustomOrder.findByIdAndUpdate(id, updates, { new: true });
    if (!order) {
      return res.status(404).json({ message: "Custom order not found." });
    }

    return res.json({ success: true, message: "Custom order updated", order });
  } catch (err) {
    console.error("Error updating custom order:", err);
    return res.status(500).json({ message: "Server error updating custom order." });
  }
}
