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
                
                
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/auth" element={<Auth />} />
               <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
                <Route path="/admin/products" element={<ProtectedRoute adminOnly><ProductsTab /></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute adminOnly><OrdersTab /></ProtectedRoute>} />
                 <Route path="/user-profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                 <Route path="/" element={<HomeRouter />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
            <BottomNavbar /> {/*  fixed bottom navbar */}
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
