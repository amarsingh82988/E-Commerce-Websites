import { userRepository } from "./user.repository.js";
import { userService } from "./user.service.js";
import { sessionService } from "../session/session.service.js";

export async function register(req, res) {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "Name, email, phone and password are required" });
    }
    const user = await userService.register(name, email, password, phone);
    return res.status(201).json({ message: "User registered. Verification OTP sent to email.", userId: user._id });
  } catch (err) {
    console.error(err);
    if (err.message === "User with this email already exists") return res.status(409).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function verifyEmail(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Email and code are required" });
    await userService.verifyEmail(email, code);
    return res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    if (err.message === "Invalid or expired OTP") return res.status(401).json({ message: err.message });
    if (err.message === "User not found") return res.status(404).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function loginStep1(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const result = await userService.loginStep1(email, password);
    return res.json({ message: result.message });
  } catch (err) {
    console.error(err);
    if (err.message === "Invalid credentials") return res.status(401).json({ message: err.message });
    if (err.message === "Email not verified" || err.message === "Account is blocked" || err.message.includes("Seller accounts")) {
      return res.status(403).json({ message: err.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
}

export async function loginStep2(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Email and OTP code are required" });
    const result = await userService.loginStep2(email, code);

    // Create session in DB
    const { sessionId, expiresAt } = await sessionService.createSession(
      result.user.id,
      result.user.role,
      "User"
    );

    // Set HTTP-only cookie
    sessionService.setSessionCookie(res, sessionId, expiresAt);

    return res.json({ message: "Login successful", user: result.user });
  } catch (err) {
    console.error(err);
    if (err.message === "Invalid or expired OTP" || err.message === "Invalid credentials") {
      return res.status(401).json({ message: err.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    await userService.forgotPassword(email);
    return res.json({ message: "Password reset OTP sent" });
  } catch (err) {
    console.error(err);
    if (err.message === "User not found") return res.status(404).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "Email, code and newPassword are required" });
    }
    await userService.resetPassword(email, code, newPassword);
    return res.json({ message: "Password has been updated" });
  } catch (err) {
    console.error(err);
    if (err.message === "Invalid or expired OTP") return res.status(401).json({ message: err.message });
    if (err.message === "User not found") return res.status(404).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getProfile(req, res) {
  try {
    const profile = await userService.getProfile(req.user._id || req.user.id);
    return res.json(profile);
  } catch (err) {
    console.error(err);
    if (err.message === "User not found") return res.status(404).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateProfile(req, res) {
  try {
    const allowedUpdates = {
      name: req.body.name,
      phone: req.body.phone,
      addresses: req.body.addresses,
    };
    Object.keys(allowedUpdates).forEach((key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]);
    const updatedProfile = await userService.updateProfile(req.user._id || req.user.id, allowedUpdates);
    return res.json(updatedProfile);
  } catch (err) {
    console.error(err);
    if (err.message === "User not found") return res.status(404).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function logout(req, res) {
  const sessionId = req.cookies?.sessionId;
  if (sessionId) {
    await sessionService.destroySession(sessionId);
  }
  sessionService.clearSessionCookie(res);
  return res.json({ message: "Logged out successfully" });
}

export async function getCart(req, res) {
  try {
    if (!req.user) return res.json([]);
    const cart = await userRepository.getCart(req.user._id || req.user.id);
    return res.json(cart);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateCart(req, res) {
  try {
    const items = req.body.cart || req.body.items;
    if (!Array.isArray(items)) return res.status(400).json({ message: "cart or items must be an array" });
    if (!req.user) return res.json(items);
    const cart = await userRepository.updateCart(req.user._id || req.user.id, items);
    return res.json(cart);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function getWishlist(req, res) {
  try {
    if (!req.user) return res.json([]);
    const wishlist = await userRepository.getWishlist(req.user._id || req.user.id);
    return res.json(wishlist);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateWishlist(req, res) {
  try {
    const productIds = req.body.wishlist || req.body.productIds;
    if (!Array.isArray(productIds)) return res.status(400).json({ message: "wishlist or productIds must be an array" });
    if (!req.user) return res.json(productIds);
    const wishlist = await userRepository.updateWishlist(req.user._id || req.user.id, productIds);
    return res.json(wishlist);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
