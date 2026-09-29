# Apne Hath Crafts - Frontend Client

This is the React + TypeScript frontend for the Apne Hath Crafts e-commerce platform.

## Features & Tech Stack
- **React 19 & Vite 8**: Bleeding-edge React stack with lightning-fast builds.
- **Tailwind CSS 4**: Modern utility-first styling.
- **Dynamic UI Adaptation**: Components seamlessly adapt (or hide) based on backend data (e.g., hiding empty Best Sellers/Review sections).
- **Checkout & Address Book**: Seamless multi-address selection during checkout.
- **Admin & Seller Dashboards**: Granular settings configurations, including toggling Cash on Delivery (COD) visibility.
- **Security & Linting**: XSS protection via DOMPurify and 100% clean ESLint profile.

## Getting Started

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup Environment variables:
   Copy `.env.example` to `.env` (if applicable) and configure `VITE_API_URL`.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Linting & Building:
   ```bash
   npm run lint
   npm run build
   ```

## Documentation
- [Frontend Handover Guide](./docs/FRONTEND_HANDOVER.md)
