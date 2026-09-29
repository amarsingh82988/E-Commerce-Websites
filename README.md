# Apne Hath Crafts - E-Commerce Platform

Welcome to the **Apne Hath Crafts** repository. 

This project is a modern, full-stack MERN (MongoDB, Express, React 19, Node.js) e-commerce application designed for handmade crafts. It is designed to act as a highly scalable single-vendor storefront, or can be instantly toggled into a **Multi-Vendor Marketplace**.

## 🚀 Key Features
- **Multi-Vendor Ready**: The entire backend schema and APIs are decoupled and isolated by Seller ID. A simple config toggle switches the platform into marketplace mode.
- **Robust Security**: Perfect NPM Audit scores, Strict ESLint configurations, rate-limiting, XSS sanitization, and NoSQL injection protection built right in.
- **Dynamic Content**: From Admin settings (like toggling Cash on Delivery) to auto-hiding empty storefront sections, the UI is completely data-driven.
- **Smart Checkout**: Real-time address auto-saving and selection, seamless coupon applications, and tamper-proof server-side total calculations.

## 📖 Developer Documentation

All developer documentation has been explicitly separated into the respective frontend and backend documentation folders. If you are taking over this project, please begin by reviewing these handover guides:

- 💻 **Frontend Documentation:** [frontend/README.md](./frontend/README.md) & [frontend/docs/FRONTEND_HANDOVER.md](./frontend/docs/FRONTEND_HANDOVER.md)
  - Details React 19, Vite 8, Tailwind 4, smart rendering states, routing, API layers, and recent UI implementations.

- ⚙️ **Backend Documentation:** [backend/README.md](./backend/README.md) & [backend/docs/BACKEND_HANDOVER.md](./backend/docs/BACKEND_HANDOVER.md)
  - Details Multi-Vendor logic, Express configurations, strict linting standards, schema optimizations (flattened user schemas), authentication, and order tracking.

- 🔌 **API Reference:** [backend/docs/API_INTEGRATION_REPORT.md](./backend/docs/API_INTEGRATION_REPORT.md)
  - Complete REST API route dictionary.

---

*This architecture has been carefully curated to ensure decoupled database collections, strict TypeScript/API contracts, perfect code-health linting, and scalable MERN patterns.*
