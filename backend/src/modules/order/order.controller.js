import mongoose from "mongoose";
import crypto from "crypto";
import { Order } from "./Order.js";
import { Settings } from "../content/Settings.js";
import { decrypt } from "../../utils/crypto.service.js";
import { Product } from "../product/Product.js";
import { env } from "../../config/env.js";
import { Coupon } from "../coupon/Coupon.js";
import Razorpay from "razorpay";


/** Helper function to calculate tamper-proof server-side totals */
async function calculateServerTotals(rawItems, paymentMethod, couponCode, session = null) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("Cart cannot be empty.");
  }

  let subtotal = 0;
  const processedItems = [];

  for (const item of rawItems) {
    const pId = item.productId || item.product || item.id;
    if (!pId) throw new Error("Invalid product in cart item.");

    let query = Product.findById(pId);
    if (session) query = query.session(session);
    let productDoc = await query.lean();

    if (!productDoc) {
      let fallbackQuery = Product.findOne({ slug: String(pId).toLowerCase() });
      if (session) fallbackQuery = fallbackQuery.session(session);
      productDoc = await fallbackQuery.lean();
    }

    if (!productDoc || productDoc.isDeleted || !productDoc.isActive) {
      throw new Error(`Product "${item.name || 'item'}" is no longer available.`);
    }

    const qty = Math.max(1, Number(item.qty || item.quantity || 1));

    if (productDoc.stock < qty) {
      throw new Error(`Insufficient stock for "${productDoc.name}". Only ${productDoc.stock} available.`);
    }

    const unitPrice = productDoc.price;
    subtotal += unitPrice * qty;

    processedItems.push({
      product: productDoc._id,
      name: productDoc.name,
      slug: productDoc.slug,
      image: productDoc.featuredImage || (productDoc.images && productDoc.images[0]) || "",
      price: unitPrice,
      quantity: qty,
      color: item.color || "",
      size: item.size || "",
      note: item.note || "",
      // --- MULTI-VENDOR: Track which seller owns this item ---
      seller: productDoc.seller || null,
    });
  }

  let discount = 0;
  let validCoupon = null;

  if (couponCode && String(couponCode).trim()) {
    const cleanCode = String(couponCode).trim().toUpperCase();
    let couponQuery = Coupon.findOne({ code: cleanCode });
    if (session) couponQuery = couponQuery.session(session);
    const couponDoc = await couponQuery;

    if (!couponDoc) {
      throw new Error(`Coupon code "${cleanCode}" is not valid.`);
    }
    const validationErr = couponDoc.isValidNow(subtotal);
    if (validationErr) {
      throw new Error(validationErr);
    }
    discount = couponDoc.discountFor(subtotal);
    validCoupon = couponDoc;
  }

  let settings = await Settings.findOne().lean();
  if (!settings || !settings.shipping) {
    settings = { shipping: { fee: 79, freeThreshold: 1499, codFee: 49 } };
  }

  const afterDiscount = Math.max(0, subtotal - discount);
  const shippingFee = subtotal === 0 || subtotal >= (settings.shipping.freeThreshold ?? 1499) ? 0 : (settings.shipping.fee ?? 79);
  const codFee = paymentMethod === "cod" ? (settings.shipping.codFee ?? 49) : 0;
  const total = afterDiscount + shippingFee + codFee;

  return {
    subtotal,
    discount,
    shippingFee,
    codFee,
    total,
    items: processedItems,
    coupon: validCoupon ? { code: validCoupon.code, discount } : undefined,
    validCoupon,
  };
}

/** Generate a unique order number */
function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `AHC-${timestamp}-${random}`;
}

/** Create Order & Initiate Payment (Razorpay or COD) with DB Transaction Support */
export async function createOrder(req, res) {
  let session = null;
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required to place an order." });
    }

    const { items, shippingAddress, paymentMethod, customerNote, couponCode } = req.body;

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.line1 || !shippingAddress.pincode) {
      return res.status(400).json({ message: "Full shipping address with name, phone, address line, and PIN code is required." });
    }

    const validPaymentMethod = paymentMethod === "cod" ? "cod" : "razorpay";

    // 1. Calculate tamper-proof totals & coupon discount on server
    const { subtotal, discount, shippingFee, codFee, total, items: processedItems, coupon: couponInfo, validCoupon } = await calculateServerTotals(items, validPaymentMethod, couponCode);

    const orderNumber = generateOrderNumber();
    const userId = req.user._id || req.user.id;
    const userEmail = req.user.email || shippingAddress.email;

    session = await mongoose.startSession();
    session.startTransaction();

    // --- MULTI-VENDOR: Collect unique seller IDs from all items ---
    const sellerIds = [...new Set(
      processedItems.map(i => i.seller).filter(Boolean).map(s => s.toString())
    )];

    // 2. Create Order record in DB
    const [order] = await Order.create(
      [
        {
          orderNumber,
          user: userId,
          email: userEmail.toLowerCase(),
          items: processedItems,
          // --- MULTI-VENDOR: Store seller IDs for efficient querying ---
          sellers: sellerIds,
          shippingAddress: {
            fullName: shippingAddress.fullName.trim(),
            phone: shippingAddress.phone.trim(),
            line1: shippingAddress.line1.trim(),
            line2: shippingAddress.line2 ? shippingAddress.line2.trim() : "",
            city: shippingAddress.city ? shippingAddress.city.trim() : "",
            state: shippingAddress.state ? shippingAddress.state.trim() : "",
            pincode: shippingAddress.pincode.trim(),
            country: shippingAddress.country || "India",
          },
          coupon: couponInfo,
          subtotal,
          discount,
          shippingFee,
          codFee,
          total,
          paymentMethod: validPaymentMethod,
          paymentStatus: "pending",
          status: validPaymentMethod === "cod" ? "confirmed" : "pending",
          customerNote: customerNote ? customerNote.trim() : "",
          timeline: [
            {
              status: validPaymentMethod === "cod" ? "confirmed" : "pending",
              note: validPaymentMethod === "cod" ? "Order placed with Cash on Delivery" : "Order initiated via Razorpay",
              at: new Date(),
            },
          ],
        }
      ],
      { session }
    );

    // Increment coupon usedCount if coupon was applied
    if (validCoupon) {
      validCoupon.usedCount = (validCoupon.usedCount || 0) + 1;
      await validCoupon.save({ session });
    }

    // 3. Handle COD Payment Transaction
    if (validPaymentMethod === "cod") {
      for (const item of processedItems) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        success: true,
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentMethod: "cod",
        status: "confirmed",
        total: order.total,
        message: "Order placed successfully with Cash on Delivery!",
      });
    }

    // 4. Handle Razorpay Payment
    let razorpayOrderId = "";
    let razorpayKeyId = "";
    let razorpaySecret = "";

    // --- SINGLE SELLER MODE TOGGLE ---
    // If you want to enable MULTIPLE SELLERS, comment out this variable below and set it to false.
    const IS_SINGLE_SELLER_MODE = true; 
    // ---------------------------------

    const settingsObj = await Settings.findOne().lean();

    if (IS_SINGLE_SELLER_MODE) {
       // Single Seller Mode: Use DB settings if configured, otherwise fallback to .env credentials
       if (settingsObj?.paymentGateway?.provider === "razorpay" && settingsObj.paymentGateway.publicKey) {
           razorpayKeyId = settingsObj.paymentGateway.publicKey;
           razorpaySecret = decrypt(settingsObj.paymentGateway.privateKey) || env.razorpay.keySecret;
       } else {
           razorpayKeyId = env.razorpay.keyId;
           razorpaySecret = env.razorpay.keySecret;
       }
    } else {
       // Multiple Seller Mode: DO NOT use .env fallback. Use strictly the seller's payment credentials.
       // Note: In a fully multi-vendor setup, you would fetch Settings/Credentials based on the specific Seller's ID!
       if (settingsObj?.paymentGateway?.provider === "razorpay" && settingsObj.paymentGateway.publicKey) {
           razorpayKeyId = settingsObj.paymentGateway.publicKey;
           razorpaySecret = decrypt(settingsObj.paymentGateway.privateKey) || "";
       }
    }

    let dynamicRazorpay = null;
    if (razorpayKeyId && razorpaySecret) {
       dynamicRazorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpaySecret });
    }

    if (dynamicRazorpay) {
      const options = {
        amount: Math.round(total * 100),
        currency: "INR",
        receipt: orderNumber,
        notes: {
          orderNumber,
          userId: String(userId),
        },
      };
      const rzpOrder = await dynamicRazorpay.orders.create(options);
      razorpayOrderId = rzpOrder.id;
    } else {
      razorpayOrderId = `rzp_order_mock_${Date.now()}`;
    }

    order.razorpay = { orderId: razorpayOrderId };
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentMethod: "razorpay",
      razorpayOrderId,
      amount: total,
      amountPaise: Math.round(total * 100),
      currency: "INR",
      key: razorpayKeyId,
    });
  } catch (err) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error("Error creating order:", err);
    return res.status(400).json({ message: err.message || "Failed to process order." });
  }
}

/** Verify Razorpay Payment Signature & Confirm Order (Idempotent + DB Transaction) */
export async function verifyRazorpayPayment(req, res) {
  let session = null;
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Razorpay order ID, payment ID, and signature are required." });
    }

    // ── Idempotency & Duplicate Payment Prevention Check ──
    const existingPaidWithPaymentId = await Order.findOne({
      "razorpay.paymentId": razorpay_payment_id,
    }).lean();

    if (existingPaidWithPaymentId) {
      return res.json({
        success: true,
        message: "Payment already verified (Idempotent request).",
        orderNumber: existingPaidWithPaymentId.orderNumber,
        order: existingPaidWithPaymentId,
      });
    }

    // Find order by ID or Razorpay Order ID
    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
    }
    if (!order) {
      order = await Order.findOne({ "razorpay.orderId": razorpay_order_id });
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Check if order is already marked as paid
    if (order.paymentStatus === "paid") {
      return res.json({
        success: true,
        message: "Payment already verified!",
        orderNumber: order.orderNumber,
        order,
      });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    // HMAC SHA256 Signature Verification
    // --- SINGLE SELLER MODE TOGGLE ---
    const IS_SINGLE_SELLER_MODE = true; 
    // ---------------------------------
    
    let rzpSecret = "";
    const settingsObj = await Settings.findOne().lean();
    
    if (IS_SINGLE_SELLER_MODE) {
       if (settingsObj?.paymentGateway?.provider === "razorpay" && settingsObj.paymentGateway.privateKey) {
           rzpSecret = decrypt(settingsObj.paymentGateway.privateKey) || env.razorpay.keySecret;
       } else {
           rzpSecret = env.razorpay.keySecret;
       }
    } else {
       if (settingsObj?.paymentGateway?.provider === "razorpay" && settingsObj.paymentGateway.privateKey) {
           rzpSecret = decrypt(settingsObj.paymentGateway.privateKey) || "";
       }
    }

    if (rzpSecret) {
      const generated_signature = crypto
        .createHmac("sha256", rzpSecret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generated_signature !== razorpay_signature) {
        order.paymentStatus = "failed";
        order.timeline.push({ status: "failed", note: "Razorpay signature verification failed", at: new Date() });
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();
        return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
      }
    }

    // ── Execute Payment Confirmation & Stock Decrement ──

    order.paymentStatus = "paid";
    order.status = "confirmed";
    order.razorpay = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    };
    order.timeline.push({
      status: "confirmed",
      note: `Payment verified via Razorpay (Payment ID: ${razorpay_payment_id})`,
      at: new Date(),
    });

    // Decrement product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
          { session }
      );
    }

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: "Payment verified successfully! Order confirmed.",
      orderNumber: order.orderNumber,
      order,
    });
  } catch (err) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error("Error verifying payment:", err);
    return res.status(500).json({ message: "Failed to verify payment." });
  }
}

/** Get Logged In User's Orders */
export async function getMyOrders(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const userId = req.user._id || req.user.id;
    const orConditions = [{ user: userId }];
    if (req.user.email) {
      orConditions.push({ email: req.user.email.toLowerCase() });
    }
    
    const orders = await Order.find({ $or: orConditions })
    .sort({ createdAt: -1 })
    .lean();

    return res.json(orders);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    return res.status(500).json({ message: "Failed to fetch orders." });
  }
}

/** Get Order Details by Order Number or ID */
export async function getOrderDetails(req, res) {
  try {
    const { identifier } = req.params;

    let order = await Order.findOne({ orderNumber: identifier }).lean();
    if (!order && identifier.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(identifier).lean();
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Security check: ensure user owns order or is admin/seller
    if (req.user) {
      const userId = (req.user._id || req.user.id).toString();
      const orderUserId = order.user ? order.user.toString() : "";
      const isOwner = orderUserId === userId || order.email.toLowerCase() === req.user.email?.toLowerCase();
      const isAdminOrSeller = req.user.role === "superadmin" || req.user.role === "seller";

      if (!isOwner && !isAdminOrSeller) {
        return res.status(403).json({ message: "Access denied." });
      }
    }

    return res.json(order);
  } catch (err) {
    console.error("Error fetching order details:", err);
    return res.status(500).json({ message: "Failed to fetch order details." });
  }
}
