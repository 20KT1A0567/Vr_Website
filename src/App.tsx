import { Route, Routes } from "react-router-dom";
import { SiteLayout } from "components/layouts/SiteLayout";
import { CartPage } from "pages/CartPage";
import { CheckoutPage } from "pages/CheckoutPage";
import { ContactPage } from "pages/ContactPage";
import { HomePage } from "pages/HomePage";
import { LoginPage } from "pages/LoginPage";
import { OrdersPage } from "pages/OrdersPage";
import { ProductDetailPage } from "pages/ProductDetailPage";
import { ProductsPage } from "pages/ProductsPage";
import { RegisterPage } from "pages/RegisterPage";
import { StoresPage } from "pages/StoresPage";
import { WishlistPage } from "pages/WishlistPage";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/stores" element={<StoresPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}
