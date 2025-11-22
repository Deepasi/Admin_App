
import { Home, ShoppingBag, Phone, Package, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';

export default function BottomNavbar() {
    const location = useLocation();
    const { user, loading, isAdmin } = useAuth();

    // Hide navbar for unauthenticated users (and while auth is loading)
    if (loading) return null;
    if (!user) return null;

    // Hide navbar on specific routes (optional)
    const hiddenRoutes = ["/login", "/register"];
    if (hiddenRoutes.includes(location.pathname)) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-md md:hidden">
            <div className="flex justify-around items-center py-2">
                <Link to="/" className="flex flex-col items-center text-xs text-gray-600 hover:text-brand-red">
                    <Home className="h-5 w-5 mb-0.5" />
                    Home
                </Link>
                <Link to={isAdmin ? "/admin/products" : "/products"} className="flex flex-col items-center text-xs text-gray-600 hover:text-brand-red">
                    <ShoppingBag className="h-5 w-5 mb-0.5" />
                    Products
                </Link>

                <Link to={isAdmin ? "/admin/orders" : "/orders"} className="flex flex-col items-center text-xs text-gray-600 hover:text-brand-red">
                    <Package className="h-5 w-5 mb-0.5" />
                    Orders
                </Link>
                <Link to="/user-profile" className="flex flex-col items-center text-xs text-gray-600 hover:text-brand-red">
                    <User className="h-5 w-5 mb-0.5" />
                    Profile
                </Link>
                <Link to="/contact" className="flex flex-col items-center text-xs text-gray-600 hover:text-brand-red">
                    <Phone className="h-5 w-5 mb-0.5" />
                    Contact
                </Link>
            </div>
        </nav>
    );
}
