import express from "express";

import { Content } from "./Content.js";
import { Settings } from "./Settings.js";
// import { env } from "../../config/env.js";

const router = express.Router();

const defaultContent = {
  hero: {
    title: "Handmade with Love",
    subtitle: "Discover unique, artisanal crafts made by local creators.",
    imageUrl: "",
    buttonText: "Shop Now",
    buttonLink: "/shop",
  },
  about: {
    title: "Our Story",
    content: "Apne Hath Crafts was born out of a love for handmade, unique items. We believe in supporting local artisans and bringing their beautiful creations to a wider audience. Every piece tells a story, crafted with care and dedication.",
    imageUrl: "",
  },
  faqs: [
    {
      id: "1",
      question: "How long does shipping take?",
      answer: "Standard shipping takes 5-7 business days. Custom orders may take longer depending on the item.",
    },
    {
      id: "2",
      question: "Do you accept returns?",
      answer: "Yes, we accept returns within 14 days of delivery for unused items in their original packaging.",
    },
  ],
  policies: {
    shipping: "We ship all across India. Standard shipping takes 5-7 business days. Expedited shipping is available at checkout.",
    returnPolicy: "We want you to be completely satisfied with your purchase. If for any reason you are not, we accept returns within 14 days.",
    privacy: "Your privacy is important to us. We only collect information necessary to process your order.",
    terms: "By accessing this website, you agree to be bound by these website Terms and Conditions of Use.",
  },
};

import { sessionService } from "../session/session.service.js";

/**
 * Middleware: Verify seller / superadmin session for editing content
 */
async function protectContentAdmin(req, res, next) {
  const sessionId = req.cookies?.sessionId;

  if (!sessionId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const session = await sessionService.verifyAndRefreshSession(sessionId);
    if (!session) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }
    if (!["seller", "superadmin"].includes(session.role)) {
      return res.status(403).json({ message: "Seller or Super Admin access required" });
    }
    req.user = { id: session.userId, role: session.role };
    next();
  } catch (_err) {
    return res.status(401).json({ message: "Authentication failed" });
  }
}

/**
 * GET /api/content - Public endpoint to get site content
 */
router.get("/", async (req, res) => {
  try {
    let contentDoc = await Content.findOne();
    if (!contentDoc) {
      contentDoc = await Content.create(defaultContent);
    }
    return res.json(contentDoc);
  } catch (err) {
    console.error("Fetch content error:", err);
    return res.status(500).json({ message: "Server error fetching content" });
  }
});

import { deleteFromCloudinary } from "../../utils/cloudinary.service.js";
import { encrypt, decrypt } from "../../utils/crypto.service.js";

/**
 * PUT /api/content - Protected admin endpoint to update site content
 */
router.put("/", protectContentAdmin, async (req, res) => {
  try {
    const updateData = req.body;
    let contentDoc = await Content.findOne();

    if (!contentDoc) {
      contentDoc = await Content.create(updateData);
    } else {
      // Cleanup replaced images
      if (updateData.hero?.imageUrl !== undefined && contentDoc.hero?.imageUrl && updateData.hero.imageUrl !== contentDoc.hero.imageUrl) {
        await deleteFromCloudinary(contentDoc.hero.imageUrl);
      }
      if (updateData.about?.imageUrl !== undefined && contentDoc.about?.imageUrl && updateData.about.imageUrl !== contentDoc.about.imageUrl) {
        await deleteFromCloudinary(contentDoc.about.imageUrl);
      }

      contentDoc = await Content.findOneAndUpdate({}, updateData, {
        new: true,
        runValidators: true,
      });
    }

    return res.json({
      success: true,
      message: "Content updated successfully",
      content: contentDoc,
    });
  } catch (err) {
    console.error("Update content error:", err);
    return res.status(500).json({ message: "Server error updating content" });
  }
});


/**
 * GET /api/v1/content/settings - Protected endpoint to get store settings
 */
router.get("/settings", protectContentAdmin, async (req, res) => {
  try {
    // --- MULTI-VENDOR: Fetch settings specific to this seller ---
    const sellerId = req.user?._id || null;
    let settings = await Settings.findOne({ seller: sellerId }).lean();
    if (!settings) {
      // Fallback: try global settings (seller=null)
      settings = await Settings.findOne({ seller: null }).lean();
    }
    if (!settings) {
      settings = await Settings.create({ storeName: "Apne Hath Crafts", seller: sellerId });
      settings = settings.toObject();
    }
    // Decrypt keys to send to admin, but mask them
    if (settings.paymentGateway?.privateKey) {
       const decrypted = decrypt(settings.paymentGateway.privateKey);
       settings.paymentGateway.privateKey = decrypted ? "HIDDEN:" + decrypted.substring(0, 4) + "***" : "";
    }
    if (settings.paymentGateway?.webhookSecret) {
       const decrypted = decrypt(settings.paymentGateway.webhookSecret);
       settings.paymentGateway.webhookSecret = decrypted ? "HIDDEN:" + decrypted.substring(0, 4) + "***" : "";
    }
    return res.json(settings);
  } catch (_err) {
    return res.status(500).json({ message: "Server error fetching settings" });
  }
});

/**
 * PUT /api/v1/content/settings - Protected endpoint to update store settings
 */
router.put("/settings", protectContentAdmin, async (req, res) => {
  try {
    const updateData = req.body;
    // --- MULTI-VENDOR: Scope settings to this seller ---
    const sellerId = req.user?._id || null;
    let settings = await Settings.findOne({ seller: sellerId });
    if (!settings) {
      // Fallback: try global settings
      settings = await Settings.findOne({ seller: null });
    }
    
    // Encrypt secrets if they were updated (and are not the hidden mask)
    if (updateData.paymentGateway) {
       if (updateData.paymentGateway.privateKey && updateData.paymentGateway.privateKey.startsWith("HIDDEN:")) {
          delete updateData.paymentGateway.privateKey;
       } else if (updateData.paymentGateway.privateKey) {
          updateData.paymentGateway.privateKey = encrypt(updateData.paymentGateway.privateKey);
       }
       
       if (updateData.paymentGateway.webhookSecret && updateData.paymentGateway.webhookSecret.startsWith("HIDDEN:")) {
          delete updateData.paymentGateway.webhookSecret;
       } else if (updateData.paymentGateway.webhookSecret) {
          updateData.paymentGateway.webhookSecret = encrypt(updateData.paymentGateway.webhookSecret);
       }
    }

    if (!settings) {
      updateData.seller = sellerId;
      settings = await Settings.create(updateData);
    } else {
      settings = await Settings.findOneAndUpdate({ _id: settings._id }, updateData, { new: true });
    }
    return res.json({ success: true, settings });
  } catch (_err) {
    return res.status(500).json({ message: "Server error updating settings" });
  }
});


/**
 * GET /api/v1/content/public-settings - Public endpoint to get shipping/payment config
 */
router.get("/public-settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ storeName: "Apne Hath Crafts" });
    }
    // Return only safe public fields
    return res.json({
      storeName: settings.storeName,
      contactEmail: settings.contactEmail,
      phone: settings.phone,
      address: settings.address,
      socialLinks: settings.socialLinks,
      shipping: settings.shipping,
      paymentGateway: {
        provider: settings.paymentGateway?.provider,
        publicKey: settings.paymentGateway?.publicKey,
      }
    });
  } catch (_err) {
    return res.status(500).json({ message: "Server error fetching public settings" });
  }
});

export default router;

