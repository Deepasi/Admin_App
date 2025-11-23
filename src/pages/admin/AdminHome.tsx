import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  Users, 
  RefreshCw,
  Plus,
  CheckCircle,
  Eye,
  Shield,
  Heart,
  Leaf
} from 'lucide-react';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const AdminHome: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Orders pending count
  const { data: ordersPending = 0, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin', 'ordersPending'],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'pending_payment', 'processing']);
      if (error) throw error;
      return count || 0;
    }
  });

  // Live stock map: product_id -> actual_stock
  const { data: liveStock = [] } = useQuery({
    queryKey: ['admin', 'liveStock'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('stock_movements')
        .select('product_id, new_quantity, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const map = new Map<string, number>();
      data?.forEach((m: any) => {
        if (!map.has(m.product_id)) map.set(m.product_id, m.new_quantity);
      });
      return Array.from(map.entries()).map(([product_id, actual_stock]) => ({ product_id, actual_stock }));
    }
  });

  // Products with min_stock_level to compute low stock count
  const { data: products = [] } = useQuery({
    queryKey: ['admin', 'productsBasic'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('products')
        .select('id, title, min_stock_level, stock_quantity')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // Total sales today
  const { data: totalSalesToday = 0, isLoading: salesLoading } = useQuery({
    queryKey: ['admin', 'salesToday'],
    queryFn: async () => {
      const start = startOfToday();
      const { data, error } = await (supabase as any)
        .from('orders')
        .select('total')
        .gte('created_at', start)
        .in('status', ['paid', 'shipped', 'delivered']);
      if (error) throw error;
      const sum = (data || []).reduce((s: number, o: any) => s + (o.total || 0), 0);
      return sum;
    }
  });

  // Recent customers count (last 7 days)
  const { data: recentCustomers = 0 } = useQuery({
    queryKey: ['admin', 'recentCustomers'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count, error } = await (supabase as any)
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());
      if (error) throw error;
      return count || 0;
    }
  });

  React.useEffect(() => {
    const channel = supabase
      .channel('admin-home-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'ordersPending'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'salesToday'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'recentCustomers'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'liveStock'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'productsBasic'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'recentCustomers'] });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  const lowStockItems = React.useMemo(() => {
    const stockMap = new Map((liveStock as any[]).map((s: any) => [s.product_id, s.actual_stock]));
    return (products as any[])
      .map(p => ({
        id: p.id,
        title: p.title,
        actual_stock: stockMap.has(p.id) ? stockMap.get(p.id) : (p.stock_quantity ?? 0),
        min_stock_level: p.min_stock_level ?? 10,
      }))
      .filter(p => p.actual_stock <= p.min_stock_level);
  }, [products, liveStock]);

  // Recent alerts/activities (low stock or out of stock)
  const alerts = React.useMemo(() => {
    return (lowStockItems as any[]).slice(0, 6).map(p => ({
      id: p.id,
      title: p.title,
      message: p.actual_stock === 0 ? `Out of stock` : `Stock is ${p.actual_stock} (min ${p.min_stock_level})`,
      level: p.actual_stock === 0 ? 'critical' : 'warning'
    }));
  }, [lowStockItems]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-blue-200 to-indigo-200 relative overflow-hidden">
      {/* Animated background bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 pt-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          
          {/* Header Section */}
          <header className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Welcome Back!</h1>
                <p className="text-slate-600 mt-2 text-sm sm:text-base">
                  Here's what's happening with your store today
                </p>
              </div>
              <div className="flex items-center gap-4 mt-4 sm:mt-0">
                <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-red-100 flex items-center">
                  <Clock className="h-4 w-4 mr-2 hidden sm:block text-red-600" />
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="hidden sm:flex border-red-200 text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </header>

          {/* Stats Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-10">
            {/* Orders Pending */}
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5 sm:p-6 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs sm:text-sm text-slate-500 font-medium mb-2">Orders Pending</div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {ordersLoading ? '-' : ordersPending}
                  </div>
                  <div className="text-xs text-slate-400 mt-3 flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-red-500" />
                    Needs attention
                  </div>
                </div>
                <div className="bg-red-100 p-2 sm:p-3 rounded-full group-hover:scale-110 transition-transform">
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
              </div>
              {ordersPending > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-4 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => navigate('/admin/orders')}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Orders
                </Button>
              )}
            </div>

            {/* Low Stock Items */}
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5 sm:p-6 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs sm:text-sm text-slate-500 font-medium mb-2">Low Stock</div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900">{lowStockItems.length}</div>
                  <div className="text-xs text-slate-400 mt-3 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                    Requires restocking
                  </div>
                </div>
                <div className="bg-amber-100 p-2 sm:p-3 rounded-full group-hover:scale-110 transition-transform">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                </div>
              </div>
              {lowStockItems.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-4 text-xs text-amber-600 hover:bg-amber-50"
                  onClick={() => navigate('/admin/products')}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Manage Stock
                </Button>
              )}
            </div>

            {/* Total Sales Today */}
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5 sm:p-6 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs sm:text-sm text-slate-500 font-medium mb-2">Sales Today</div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {salesLoading ? '-' : `₹${totalSalesToday.toLocaleString()}`}
                  </div>
                  <div className="text-xs text-slate-400 mt-3 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    Today's revenue
                  </div>
                </div>
                <div className="bg-green-100 p-2 sm:p-3 rounded-full group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Recent Customers */}
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5 sm:p-6 hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-xs sm:text-sm text-slate-500 font-medium mb-2">New Customers</div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900">{recentCustomers}</div>
                  <div className="text-xs text-slate-400 mt-3 flex items-center">
                    <Users className="h-3 w-3 mr-1 text-purple-500" />
                    Last 7 days
                  </div>
                </div>
                <div className="bg-purple-100 p-2 sm:p-3 rounded-full group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Quick Actions</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="sm:hidden border-red-200 text-red-700 hover:bg-red-50"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              <Button 
                onClick={() => navigate('/admin/products')} 
                className="bg-red-600 hover:bg-red-700 h-12 sm:h-14 text-sm sm:text-base font-medium shadow-lg"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Add Product
              </Button>
              <Button 
                onClick={() => navigate('/admin/orders')} 
                variant="outline" 
                className="h-12 sm:h-14 text-sm sm:text-base font-medium border-red-200 text-red-700 hover:bg-red-50"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Process Orders
              </Button>
              <Button 
                onClick={() => navigate('/admin/analytics')}
                variant="outline"
                className="h-12 sm:h-14 text-sm sm:text-base font-medium border-red-200 text-red-700 hover:bg-red-50"
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                View Reports
              </Button>
            </div>
          </section>

          {/* Recent Activity & Alerts */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                Recent Activity & Alerts
                {alerts.length > 0 && (
                  <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                    {alerts.length}
                  </span>
                )}
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-600 hidden sm:flex hover:bg-red-50"
                onClick={() => navigate('/admin/alerts')}
              >
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
              {alerts.length === 0 ? (
                <div className="p-8 sm:p-10 text-center">
                  <div className="bg-green-50 p-4 rounded-full inline-block">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mt-5">All Clear!</h3>
                  <p className="text-slate-600 mt-2">
                    No alerts at the moment. Everything is running smoothly.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-red-100">
                  {alerts.map((alert, index) => (
                    <div 
                      key={alert.id} 
                      className={`p-4 sm:p-5 hover:bg-red-50 transition-colors cursor-pointer ${
                        index === 0 ? 'rounded-t-xl' : ''
                      } ${index === alerts.length - 1 ? 'rounded-b-xl' : ''}`}
                      onClick={() => navigate('/admin/products')}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${
                          alert.level === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-slate-900 text-base">
                              {alert.title}
                            </h4>
                            <span className="text-xs text-slate-500 bg-red-50 px-2 py-1 rounded whitespace-nowrap">
                              Just now
                            </span>
                          </div>
                          <p className={`text-sm mt-2 ${
                            alert.level === 'critical' ? 'text-red-600 font-medium' : 'text-amber-600'
                          }`}>
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-red-50 sm:hidden">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-red-600 hover:bg-red-100"
                      onClick={() => navigate('/admin/alerts')}
                    >
                      View all alerts
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* System Benefits */}
          <section className="mb-10">
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">System Benefits</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-red-50">
                  <Shield className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="font-medium text-slate-900">Secure & Reliable</p>
                    <p className="text-sm text-slate-600">Enterprise-grade security</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-amber-50">
                  <Heart className="h-6 w-6 text-amber-600" />
                  <div>
                    <p className="font-medium text-slate-900">Easy to Use</p>
                    <p className="text-sm text-slate-600">Intuitive interface</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50">
                  <Leaf className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-slate-900">Eco-Friendly</p>
                    <p className="text-sm text-slate-600">Digital operations</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* System Status */}
          <section className="bg-white rounded-xl shadow-sm border border-red-100 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">System Status</h3>
                <p className="text-slate-600 text-sm mt-1">All systems operational</p>
              </div>
              <div className="flex items-center text-green-600">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-medium">Online</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;