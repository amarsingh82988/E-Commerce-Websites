import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import { rateLimit } from "express-rate-limit";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

import userModuleRoutes from "./modules/user/user.routes.js";
import sellerModuleRoutes from "./modules/seller/seller.routes.js";
import superAdminModuleRoutes from "./modules/superadmin/superadmin.routes.js";
import publicCategoryRoutes from "./modules/category/category.routes.js";
import publicProductRoutes from "./modules/product/product.routes.js";
import uploadRoutes from "./modules/upload/upload.routes.js";
import contentRoutes from "./modules/content/content.routes.js";
import customOrderRoutes from "./modules/order/customOrder.routes.js";
import reviewRoutes from "./modules/review/review.routes.js";
import orderRoutes from "./modules/order/order.routes.js";
import couponRoutes from "./modules/coupon/coupon.routes.js";

const app = express();

// Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "10kb" })); // Body limit is 10kb
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser(env.cookieSecret));

// Express 5 `req.query` compatibility patch for older middlewares that mutate req
app.use((req, res, next) => {
  const originalQuery = req.query;
  Object.defineProperty(req, 'query', {
    value: originalQuery,
    configurable: true,
    writable: true,
    enumerable: true
  });
  next();
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS (Cross Site Scripting)
app.use(xss());

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: { message: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", globalLimiter);


// Setup Logger for basic debugging (Writes to access.log)
morgan.token('req-body', (req) => JSON.stringify(req.body || {}));
const accessLogStream = fs.createWriteStream(path.join(rootDir, 'access.log'), { flags: 'a' });
app.use(morgan(':date[iso] | :method :url | Status: :status | Time: :response-time ms | Body: :req-body', { stream: accessLogStream }));
app.use(morgan("dev")); // Still log to console


// Connect to DB
connectDB().catch((err) => {
  console.error("Database connection failed:", err);
  process.exit(1);
});

// Modular Primary Routes (/api/v1)
app.use("/api/v1/auth", userModuleRoutes);
app.use("/api/v1/user", userModuleRoutes);
app.use("/api/v1/seller", sellerModuleRoutes);
app.use("/api/v1/admin", superAdminModuleRoutes);
app.use("/api/v1/categories", publicCategoryRoutes);
app.use("/api/v1/products", publicProductRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/content", contentRoutes);
app.use("/api/v1/custom-orders", customOrderRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/coupons", couponRoutes);

// Fallback Legacy Route Mounts (/api)
app.use("/api/auth", userModuleRoutes);
app.use("/api/user", userModuleRoutes);
app.use("/api/seller", sellerModuleRoutes);
app.use("/api/admin", superAdminModuleRoutes);
app.use("/api/categories", publicCategoryRoutes);
app.use("/api/products", publicProductRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/custom-orders", customOrderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);





// Simple health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

export default app;
