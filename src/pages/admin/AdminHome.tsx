import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, AlertTriangle, TrendingUp, Clock, ArrowRight } from 'lucide-react';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const AdminHome: React.FC = () => {
  const navigate = useNavigate();

  // Orders pending count
  const { data: ordersPending = 0 } = useQuery({
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

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const channel = supabase
      .channel('admin-home-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'ordersPending'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'salesToday'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_movements' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'liveStock'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'productsBasic'] });
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

  // Total sales today
  const { data: totalSalesToday = 0 } = useQuery({
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

  // Recent alerts/activities (low stock or out of stock)
  const alerts = React.useMemo(() => {
    return (lowStockItems as any[]).slice(0, 6).map(p => ({
      id: p.id,
      title: p.title,
      message: p.actual_stock === 0 ? `Out of stock` : `Stock is ${p.actual_stock} (min ${p.min_stock_level})`,
      level: p.actual_stock === 0 ? 'critical' : 'warning'
    }));
  }, [lowStockItems]);

  return (
    <main className="pt-20 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Welcome Back!</h1>
              <p className="text-slate-600 mt-2">Here's what's happening with your store today</p>
            </div>
            <div className="mt-4 sm:mt-0 text-sm text-slate-500 bg-white px-4 py-2 rounded-lg shadow-sm border">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500 font-medium mb-1">Orders Pending</div>
                <div className="text-3xl font-bold text-slate-900">{ordersPending}</div>
                <div className="text-xs text-slate-400 mt-2 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Needs attention
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500 font-medium mb-1">Low Stock Items</div>
                <div className="text-3xl font-bold text-slate-900">{lowStockItems.length}</div>
                <div className="text-xs text-slate-400 mt-2 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Requires restocking
                </div>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500 font-medium mb-1">Total Sales Today</div>
                <div className="text-3xl font-bold text-slate-900">₹{totalSalesToday.toLocaleString()}</div>
                <div className="text-xs text-slate-400 mt-2 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Today's revenue
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
            
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              onClick={() => navigate('/admin/products')} 
              className="bg-red-600 hover:bg-red-700 h-16 text-lg font-medium shadow-sm"
            >
              <Package className="h-5 w-5 mr-2" />
              Add New Product
            </Button>
            <Button 
              onClick={() => navigate('/admin/orders')} 
              variant="outline" 
              className="h-16 text-lg font-medium border-slate-300 hover:bg-slate-50"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Process Orders
            </Button>
            <Button 
              onClick={() => navigate('/admin')}
              variant="outline"
              className="h-16 text-lg font-medium border-slate-300 hover:bg-slate-50"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              View Reports
            </Button>
          </div>
        </section>

        {/* Recent Activity / Alerts */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Recent Activity & Alerts</h2>
            <Button variant="ghost" size="sm" className="text-slate-600">
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {alerts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="bg-green-50 p-4 rounded-lg inline-block">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mt-4">All Clear!</h3>
                <p className="text-slate-600 mt-2">No alerts at the moment. Everything is running smoothly.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {alerts.map((alert, index) => (
                  <div 
                    key={alert.id} 
                    className={`p-4 hover:bg-slate-50 transition-colors ${
                      index === 0 ? 'rounded-t-xl' : ''
                    } ${index === alerts.length - 1 ? 'rounded-b-xl' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        alert.level === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-slate-900 truncate">{alert.title}</h4>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            Now
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${
                          alert.level === 'critical' ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminHome;