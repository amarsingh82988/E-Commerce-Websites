import { User } from "./User.js";
import { sessionService } from "../session/session.service.js";

/** Extract sessionId from cookie */
function extractSessionId(req) {
  if (req.cookies?.sessionId) return req.cookies.sessionId;
  return null;
}

/** userProtect — Any authenticated user (customer, seller, superadmin) */
export async function userProtect(req, res, next) {
  const sessionId = extractSessionId(req);
  if (!sessionId) return res.status(401).json({ message: "Authentication required" });

  try {
    const session = await sessionService.verifyAndRefreshSession(sessionId);
    if (!session) {
      sessionService.clearSessionCookie(res);
      return res.status(401).json({ message: "Session expired or invalid. Please log in again." });
    }

    const user = await User.findById(session.userId).lean();
    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.isBlocked) return res.status(403).json({ message: "Account is blocked" });
    
    req.user = user;
    next();
  } catch (err) {
    console.error("Session verification error:", err);
    return res.status(401).json({ message: "Authentication failed" });
  }
}

/** optionalUserProtect — Extracts user if session is present and valid, but doesn't block guests */
export async function optionalUserProtect(req, res, next) {
  const sessionId = extractSessionId(req);
  if (!sessionId) {
    req.user = null;
    return next();
  }
  
  try {
    const session = await sessionService.verifyAndRefreshSession(sessionId);
    if (session) {
      const user = await User.findById(session.userId).lean();
      if (user && !user.isBlocked) {
        req.user = user;
      } else {
        req.user = null;
      }
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
}
