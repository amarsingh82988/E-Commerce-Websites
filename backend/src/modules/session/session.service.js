import crypto from "crypto";
import { Session } from "./Session.js";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const sessionService = {
  /**
   * Creates a new session in the database
   */
  async createSession(userId, role, userModel = "User") {
    // Generate a secure random session ID
    const sessionId = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await Session.create({
      sessionId,
      userId,
      role,
      userModel,
      expiresAt,
    });

    return { sessionId, expiresAt };
  },

  /**
   * Verifies and retrieves a session.
   * Extends the TTL (Rolling Session) to keep active users logged in.
   */
  async verifyAndRefreshSession(sessionId) {
    if (!sessionId) return null;

    const session = await Session.findOne({ sessionId });
    
    // If no session found or it has expired (though MongoDB TTL index handles deletion, we check just in case)
    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    // Rolling Session: Extend TTL if less than 3 days left
    const timeRemaining = session.expiresAt.getTime() - Date.now();
    if (timeRemaining < 3 * 24 * 60 * 60 * 1000) {
      session.expiresAt = new Date(Date.now() + SESSION_TTL_MS);
      await session.save();
    }

    return session;
  },

  /**
   * Destroys a session on logout
   */
  async destroySession(sessionId) {
    if (!sessionId) return;
    await Session.deleteOne({ sessionId });
  },

  /**
   * Helper to set session cookie securely
   */
  setSessionCookie(res, sessionId, expiresAt) {
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
    });
  },

  /**
   * Helper to clear session cookie securely
   */
  clearSessionCookie(res) {
    res.cookie("sessionId", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }
};
