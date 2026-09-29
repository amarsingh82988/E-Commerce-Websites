# Apne Hath Crafts - Backend Server

This is the Express + MongoDB backend for the Apne Hath Crafts e-commerce platform.

## Features & Architecture
- **Multi-Vendor Architecture**: Supports switching between a single-seller and multi-vendor marketplace mode.
- **Robust Security**: Protected against NoSQL Injection, XSS, and DoS attacks (via Helmet, express-mongo-sanitize, xss-clean, rate-limit).
- **Decoupled Data**: Uses domain-driven modular architecture (`src/modules/*`) with optimized, flattened MongoDB schemas.
- **Automated Workflows**: Auto-saves user addresses during checkout, handles Razorpay/COD integrations, and auto-logs order timelines.
- **Linting & Code Quality**: 100% clean ESLint configuration.

## Getting Started

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup Environment variables:
   Copy `.env.example` to `.env` and fill out MongoDB URI, JWT Secrets, Cloudinary keys, and Razorpay API credentials.

4. Start the server (Dev Mode):
   ```bash
   npm run dev
   ```

5. Linting:
   ```bash
   npm run lint
   ```

## Documentation
- [Backend Handover Guide](./docs/BACKEND_HANDOVER.md)
- [API Integration Report](./docs/API_INTEGRATION_REPORT.md)
