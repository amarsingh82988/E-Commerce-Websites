import { userRepository } from "../../repositories/user.repository.js";

export async function getCart(req, res) {
  try {
    const cart = await userRepository.getCart(req.user._id || req.user.id);
    return res.json(cart);
  } catch (err) {
    console.error(err);
    if (err.message === "User not found") return res.status(404).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateCart(req, res) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ message: "items must be an array" });
    const cart = await userRepository.updateCart(req.user._id || req.user.id, items);
    return res.json(cart);
  } catch (err) {
    console.error(err);
    if (err.message === "User not found") return res.status(404).json({ message: err.message });
    if (err.message === "Cart items must be an array") return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
}
