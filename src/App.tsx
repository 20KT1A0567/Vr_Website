import { Route, Routes } from "react-router-dom";
import { ScrollToTop } from "components/ScrollToTop";
import { SiteLayout } from "components/layouts/SiteLayout";
import { BrandsPage } from "pages/BrandsPage";
import { CartPage } from "pages/CartPage";
import { CheckoutPage } from "pages/CheckoutPage";
import { ComparePage } from "pages/ComparePage";
import { ContactPage } from "pages/ContactPage";
import { HomePage } from "pages/HomePage";
import { LoginPage } from "pages/LoginPage";
import { OrderDetailPage } from "pages/OrderDetailPage";
import { OrdersPage } from "pages/OrdersPage";
import { PaymentFailurePage } from "pages/PaymentFailurePage";
import { PaymentSuccessPage } from "pages/PaymentSuccessPage";
import { ProductDetailPage } from "pages/ProductDetailPage";
import { ProductsPage } from "pages/ProductsPage";
import { RegisterPage } from "pages/RegisterPage";
import { StoresPage } from "pages/StoresPage";
import { WishlistPage } from "pages/WishlistPage";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/brands" element={<BrandsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/failure" element={<PaymentFailurePage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/stores" element={<StoresPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Routes>
    </>
  );
}
