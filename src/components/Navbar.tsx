import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LogOut, Settings, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // (cart removed for admin-first layout)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // menu toggle removed — mobile uses compact auth/profile actions

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully."
    });
    navigate('/');
  };

  const publicMenuItems = [
    { title: 'Home', path: '/' },
    { title: 'About', path: '/about' },
    { title: 'Contact', path: '/contact' },
  ];

  const adminMenuItems = [
    { title: 'Stock', path: '/admin/products' },
    { title: 'Order History', path: '/admin/orders' },
    { title: 'Sales Analytics', path: '/admin/sales' },
    { title: 'Users', path: '/admin/users' },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-md' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 md:h-20 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-display font-bold text-brand-red">SCR</span>
              <span className="text-2xl font-display ml-2 text-foreground">Admin</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            {/* Public menu items - always visible */}
            {publicMenuItems.map((item) => (
              <Link
                key={item.title}
                to={item.path}
                className="px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-brand-cream hover:text-brand-red"
              >
                {item.title}
              </Link>
            ))}

            {/* Admin-only menu items - only visible when user is logged in and is admin */}
            {user && isAdmin && adminMenuItems.map((item) => (
              <Link
                key={item.title}
                to={item.path}
                className="px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-brand-cream hover:text-brand-red"
              >
                {item.title}
              </Link>
            ))}

            {/* Authentication */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    <span className="text-sm truncate max-w-[150px]">{user.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {!isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/user-profile" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/user-profile" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Button className="bg-brand-red hover:bg-brand-red/90 text-white" asChild>
                  <Link to="/auth">Sign Up</Link>
                </Button>

              </div>
            )}
          </div>

          {/* Mobile Navigation Toggle */}
          {/* Cart Icon + Hamburger Toggle for Mobile */}
          <div className="flex items-center gap-4 md:hidden">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    <span className="text-sm truncate max-w-[150px]">{user.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  {/* Mobile menu items for admin */}
                  {user && isAdmin && (
                    <>
                      {adminMenuItems.map((item) => (
                        <DropdownMenuItem key={item.title} asChild>
                          <Link to={item.path} className="flex items-center">
                            {item.title}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {!isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/user-profile" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/user-profile" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button className="bg-brand-red hover:bg-brand-red/90 text-white" asChild>
                <Link to="/auth">Sign Up</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;