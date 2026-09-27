import { userRepository } from "../../repositories/user.repository.js";

export async function getWishlist(req, res) {
  try {
    const wishlist = await userRepository.getWishlist(req.user._id || req.user.id);
    return res.json(wishlist);
  } catch (err) {
    console.error(err);
    if (err.message === "User not found") return res.status(404).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateWishlist(req, res) {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds)) return res.status(400).json({ message: "productIds must be an array" });
    const wishlist = await userRepository.updateWishlist(req.user._id || req.user.id, productIds);
    return res.json(wishlist);
  } catch (err) {
    console.error(err);
    if (err.message === "User not found") return res.status(404).json({ message: err.message });
    if (err.message === "Wishlist must be an array of product IDs") return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
}
