import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from './contexts/LanguageContext';
import About from "./pages/About";
import Admin from "./pages/Admin";
import ProductsTab from "./pages/admin/ProductsTab";
import OrdersTab from "./pages/admin/OrdersTab";
import Auth from "./pages/Auth";
import Contact from "./pages/Contact";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/password_reset";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import UserProfile from "./pages/UserProfile.tsx";
import BottomNavbar from "./components/BottomNavbar";
import LandingPage from "./pages/LandingPage";
import HomeRouter from "./pages/HomeRouter";
import AnalyticsTab from "./pages/admin/AnalyticsTab";
import AlertsPage from "./pages/admin/Alerts"; // Make sure this import is correct
import UsersTab from "./pages/admin/UsersTab";
import SalesAnalytics from "./pages/admin/SalesAnalytics";

const queryClient = new QueryClient();

// Create a separate component for the app content that uses the language context
const AppContent = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navbar />
            <AnimatePresence mode="wait">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomeRouter />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected user routes */}
                <Route path="/user-profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

                {/* Admin-only routes */}
                <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

                <Route path="/admin/products" element={<ProtectedRoute adminOnly><ProductsTab /></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute adminOnly><OrdersTab /></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><AnalyticsTab /></ProtectedRoute>} />
                <Route path="/admin/sales" element={<ProtectedRoute adminOnly><AnalyticsTab /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute adminOnly><UsersTab /></ProtectedRoute>} />

                {/* Add the alerts route - make sure the path matches exactly */}
                <Route path="/admin/alerts" element={<ProtectedRoute adminOnly><AlertsPage /></ProtectedRoute>} />

                {/* Removed public /products and /orders routes since they should only be accessible to admins */}

                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
            <BottomNavbar /> {/* fixed bottom navbar */}
            <Footer />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

// Main App component that wraps everything with LanguageProvider
const App = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;