import { Home, Box, BarChart, ShoppingBag, User, Truck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';

export default function BottomNavbar() {
    const location = useLocation();
    const { user, loading, isAdmin } = useAuth();

    const isActiveRoute = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const getNavClass = (path: string) =>
        `flex flex-col items-center text-xs transition-colors ${isActiveRoute(path) ? 'text-brand-red' : 'text-gray-600 hover:text-brand-red'}`;

    // Hide navbar for unauthenticated users (and while auth is loading)
    if (loading) return null;
    if (!user) return null;

    // Hide navbar on specific routes (optional)
    const hiddenRoutes = ["/login", "/register"];
    if (hiddenRoutes.includes(location.pathname)) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-md md:hidden">
            <div className="flex justify-around items-center py-2">
                <Link to="/" className={getNavClass('/') }>
                    <Home className="h-5 w-5 mb-0.5" />
                    Home
                </Link>
                
                <Link to={isAdmin ? "/admin/products" : "/products"} className={getNavClass(isAdmin ? "/admin/products" : "/products") }>
                    <Box className="h-5 w-5 mb-0.5" />
                    Stock
                </Link>

                <Link to={isAdmin ? "/admin/orders" : "/orders"} className={getNavClass(isAdmin ? "/admin/orders" : "/orders") }>
                    <ShoppingBag className="h-5 w-5 mb-0.5" />
                    Orders
                </Link>

                {/* FIXED: Changed from /admin/assign-delivery to /admin/delivery */}
                {isAdmin && (
                    <Link to="/admin/delivery" className={getNavClass('/admin/delivery')}>
                        <Truck className="h-5 w-5 mb-0.5" />
                        Assign
                    </Link>
                )}
                
                <Link to={isAdmin ? "/admin/sales" : "/"} className={getNavClass(isAdmin ? "/admin/sales" : "/") }>
                    <BarChart className="h-5 w-5 mb-0.5" />
                    Sales
                </Link>
                
                <Link to={isAdmin ? "/admin/users" : "/user-profile"} className={getNavClass(isAdmin ? "/admin/users" : "/user-profile") }>
                    <User className="h-5 w-5 mb-0.5" />
                    Users
                </Link>
            </div>
        </nav>
    );
}
