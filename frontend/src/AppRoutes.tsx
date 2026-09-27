import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ShopProvider } from "@/store/shop";
import { Toaster } from "@/components/ui/sonner";

// ── Modular Feature Exports ──────────────────────────────────────────────────
import {
  // Catalog
  HomePage,
  ShopPage,
  ProductPage,
  CategoriesPage,
  CategoryPage,
  SearchPage,
  // Order
  CheckoutPage,
  OrderConfirmationPage,
  TrackOrderPage,
  CustomOrdersPage,
  // User
  UserLoginPage as LoginPage,
  UserRegisterPage as RegisterPage,
  UserProfilePage as ProfilePage,
  UserCartPage as CartPage,
  UserWishlistPage as WishlistPage,
  RequireAuth,
  GuestOnly,
  // Seller
  SellerLoginPage,
  SellerRegisterPage,
  // SuperAdmin
  SuperAdminLoginPage,
  SuperAdminForgotPasswordPage as AdminForgotPasswordPage,
  SuperAdminResetPasswordPage as AdminResetPasswordPage,
  // Admin Module
  AdminDashboardPage,
  AdminProfilePage,
  AdminProductsPage,
  AdminCategoriesPage,
  AdminOrdersPage,
  AdminInvoicePage,
  AdminCustomOrdersPage,
  AdminReviewsPage,
  AdminCouponsPage,
  AdminContentPage,
  AdminSettingsPage,
  AdminLayout,
  RequireAdmin,
  // Content
  AboutPage,
  ContactPage,
  FaqPage,
  TermsPage,
  PrivacyPolicyPage,
  ReturnPolicyPage,
  ShippingPolicyPage,
  AuthPortalPage,
} from "@/modules";

function NotFoundPage() {
  return <Navigate to="/" replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <ShopProvider>
        <Routes>
          {/* ── Customer / Public ─────────────────────────────────────────── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/custom-orders" element={<CustomOrdersPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/return-policy" element={<ReturnPolicyPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />

          {/* ── Authentication ───────────────────────────────────────────── */}
          <Route path="/auth" element={<AuthPortalPage />} />           {/* Role picker */}
          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />               {/* Customer login */}
          <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />         {/* Customer register */}
          <Route path="/seller/login" element={<GuestOnly><SellerLoginPage /></GuestOnly>} />
          <Route path="/seller/register" element={<GuestOnly><SellerRegisterPage /></GuestOnly>} />
          <Route path="/superadmin/login" element={<GuestOnly><SuperAdminLoginPage /></GuestOnly>} />

          {/* Password reset (seller/superadmin share the same reset UI) */}
          <Route path="/seller/forgot-password" element={<AdminForgotPasswordPage />} />
          <Route path="/seller/reset-password" element={<AdminResetPasswordPage />} />

          {/* ── Protected Dashboard (seller + superadmin) ────────────────── */}
          <Route
            path="/seller/orders/:id/invoice"
            element={
              <RequireAdmin>
                <AdminInvoicePage />
              </RequireAdmin>
            }
          />
          <Route
            path="/seller"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="custom-orders" element={<AdminCustomOrdersPage />} />
            <Route path="customers" element={<div className="p-8 text-muted-foreground">Customers — coming soon</div>} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="content" element={<AdminContentPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster position="top-center" />
      </ShopProvider>
    </BrowserRouter>
  );
}
