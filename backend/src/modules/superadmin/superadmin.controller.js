import { superAdminService } from "./superadmin.service.js";
import { sessionService } from "../session/session.service.js";

export async function adminLoginStep1(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const result = await superAdminService.loginStep1(email, password);
    return res.json(result);
  } catch (err) {
    console.error(err);
    if (err.message === "Invalid credentials") return res.status(401).json({ message: err.message });
    if (err.message === "Access denied" || err.message === "Email not verified" || err.message === "Account is blocked") {
      return res.status(403).json({ message: err.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
}

export async function adminLoginStep2(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: "Email and OTP code are required" });
    const result = await superAdminService.loginStep2(email, code);

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
    return res.status(500).json({ message: "Server error" });
  }
}

export async function adminForgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    await superAdminService.forgotPassword(email);
    return res.json({ message: "Password reset OTP sent" });
  } catch (err) {
    console.error(err);
    if (err.message === "Admin not found") return res.status(404).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function adminResetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "Email, code and newPassword are required" });
    }
    await superAdminService.resetPassword(email, code, newPassword);
    return res.json({ message: "Password has been updated" });
  } catch (err) {
    console.error(err);
    if (err.message === "Invalid or expired OTP") return res.status(401).json({ message: err.message });
    if (err.message === "Admin not found") return res.status(404).json({ message: err.message });
    return res.status(500).json({ message: "Server error" });
  }
}

export async function adminLogout(req, res) {
  const sessionId = req.cookies?.sessionId;
  if (sessionId) {
    await sessionService.destroySession(sessionId);
  }
  sessionService.clearSessionCookie(res);
  return res.json({ message: "Admin logged out successfully" });
}
