import { AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ScrollToTop } from "components/ScrollToTop";
import { SiteLayout } from "components/layouts/SiteLayout";
import { MotionPage } from "components/ui/MotionPage";
import { BrandsPage } from "pages/BrandsPage";
import { CartPage } from "pages/CartPage";
import { CheckoutPage } from "pages/CheckoutPage";
import { ComparePage } from "pages/ComparePage";
import { ContactPage } from "pages/ContactPage";
import { HelpMeChoosePage } from "pages/HelpMeChoosePage";
import { HomePage } from "pages/HomePage";
import { InfoPage } from "pages/InfoPage";
import { LoginPage } from "pages/LoginPage";
import { OrderDetailPage } from "pages/OrderDetailPage";
import { OrdersPage } from "pages/OrdersPage";
import { PaymentFailurePage } from "pages/PaymentFailurePage";
import { PaymentSuccessPage } from "pages/PaymentSuccessPage";
import { ProductDetailPage } from "pages/ProductDetailPage";
import { ProductsPage } from "pages/ProductsPage";
import { StoresPage } from "pages/StoresPage";
import { WishlistPage } from "pages/WishlistPage";
import { AccountPage } from "pages/AccountPage";

export default function App() {
  const location = useLocation();
  return (
    <LazyMotion features={domAnimation} strict>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<SiteLayout />}>
            <Route index element={<MotionPage><HomePage /></MotionPage>} />
            <Route path="/brands" element={<MotionPage><BrandsPage /></MotionPage>} />
            <Route path="/products" element={<MotionPage><ProductsPage /></MotionPage>} />
            <Route path="/products/:id" element={<MotionPage><ProductDetailPage /></MotionPage>} />
            <Route path="/cart" element={<MotionPage><CartPage /></MotionPage>} />
            <Route path="/checkout" element={<MotionPage><CheckoutPage /></MotionPage>} />
            <Route path="/orders" element={<MotionPage><OrdersPage /></MotionPage>} />
            <Route path="/orders/:id" element={<MotionPage><OrderDetailPage /></MotionPage>} />
            <Route path="/payment/success" element={<MotionPage><PaymentSuccessPage /></MotionPage>} />
            <Route path="/payment/failure" element={<MotionPage><PaymentFailurePage /></MotionPage>} />
            <Route path="/wishlist" element={<MotionPage><WishlistPage /></MotionPage>} />
            <Route path="/account" element={<MotionPage><AccountPage /></MotionPage>} />
            <Route path="/stores" element={<MotionPage><StoresPage /></MotionPage>} />
            <Route path="/contact" element={<MotionPage><ContactPage /></MotionPage>} />
            <Route path="/help-me-choose" element={<MotionPage><HelpMeChoosePage /></MotionPage>} />
            <Route path="/:slug" element={<MotionPage><InfoPage /></MotionPage>} />
            <Route path="/compare" element={<MotionPage><ComparePage /></MotionPage>} />
            <Route path="/login" element={<MotionPage><LoginPage /></MotionPage>} />
            <Route path="/register" element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </LazyMotion>
  );
}
