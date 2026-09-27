import { User } from "../user/User.js";
import { sessionService } from "../session/session.service.js";

function extractSessionId(req) {
  if (req.cookies?.sessionId) return req.cookies.sessionId;
  return null;
}

/** protectSeller — restricts access to sellers and superadmins */
export async function protectSeller(req, res, next) {
  const sessionId = extractSessionId(req);
  if (!sessionId) return res.status(401).json({ message: "Authentication required" });

  try {
    const session = await sessionService.verifyAndRefreshSession(sessionId);
    if (!session) {
      sessionService.clearSessionCookie(res);
      return res.status(401).json({ message: "Session expired or invalid. Please log in again." });
    }

    if (!["seller", "superadmin"].includes(session.role)) {
      return res.status(403).json({ message: "Seller access required" });
    }

    const user = await User.findById(session.userId).lean();
    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.isBlocked) return res.status(403).json({ message: "Account is blocked" });
    if (user.isDeleted) return res.status(403).json({ message: "Account is deactivated" });
    
    req.user = user;
    next();
  } catch (err) {
    console.error("Session verification error:", err);
    return res.status(401).json({ message: "Authentication failed" });
  }
}
