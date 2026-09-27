import dotenv from "dotenv";
import fs from "fs";

// Load appropriate .env file based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || "production"; // direct production db load
const envFile = nodeEnv === "production" ? ".env" : ".env.development";

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config(); // fallback to default .env if specific one doesn't exist
}

const num = (value, fallback) => (value ? Number(value) : fallback);

export const env = {
  port: num(process.env.PORT, 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL,
  mongoUri: process.env.MONGODB_URI,

  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cookieSecret: process.env.COOKIE_SECRET || "",
  otpTtlMinutes: num(process.env.OTP_TTL_MINUTES, 10),
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  },
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: num(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM || "",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
};

export const isConfigured = {
  razorpay: Boolean(env.razorpay.keyId && env.razorpay.keySecret),
  smtp: Boolean(env.smtp.host && env.smtp.user && env.smtp.pass),
  cloudinary: Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret),
};
