import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  user_id: string;
  updated_at: string;
  order_number?: string;
  payment_method?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip_code?: string;
  payment_id?: string;
  payment_order_id?: string;
  payment_signature?: string;
  admin_visible?: boolean;
  cancelled_at?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  profiles?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
  order_items?: Array<{
    id: string;
    quantity: number;
    price: number;
    products?: {
      title: string;
      price: string;
      image: string;
    };
  }>;
}

const OrdersTab: React.FC = () => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  // Fetch orders with proper error handling
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
          const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false }) as { data: Order[] | null; error: any };

      if (ordersError) throw ordersError;

      const userIds = [...new Set((ordersData || []).map(order => order.user_id).filter(Boolean))];
      console.log('User IDs:', userIds);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, phone, address, city, state, zip_code')
        .in('id', userIds) as { data: Array<Order['profiles']> | null; error: any };

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }
      console.log('Profiles data:', profilesData);

      const ordersWithProfiles = (ordersData || []).map(order => {
        const profile = profilesData?.find(profile => profile.id === order.user_id);
        return {
          ...order,
          profiles: profile,
          customer_name: order.customer_name || order.name || profile?.name,
          customer_email: order.customer_email || order.email || profile?.email,
          customer_phone: order.customer_phone || order.phone || profile?.phone,
          delivery_address: order.delivery_address || order.address || profile?.address,
          delivery_city: order.delivery_city || order.city || profile?.city,
          delivery_state: order.delivery_state || order.state || profile?.state,
          delivery_zip_code: order.delivery_zip_code || order.zip_code || profile?.zip_code,
        };
      });

      const ordersWithItems = await Promise.all(
        ordersWithProfiles.map(async (order) => {
          const { data: itemsData, error: itemsError } = await (supabase
            .from('order_items')
            .select(`
              *,
              products (
                title, price, image
              )
            `)
            .eq('order_id', order.id) as any);

          return {
            ...order,
            order_items: itemsData || []
          };
        })
      );

      console.log('Final orders data:', ordersWithItems);
      return ordersWithItems as Order[];
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Calculate order statistics
  const orderStats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusCounts: {}
      };
    }

    const visibleOrders = orders.filter(order => order.admin_visible !== false);

    return {
      totalOrders: visibleOrders.length,
      totalRevenue: visibleOrders.reduce((sum, order) => sum + (order.total || 0), 0),
      averageOrderValue: visibleOrders.length > 0 ?
        visibleOrders.reduce((sum, order) => sum + (order.total || 0), 0) / visibleOrders.length : 0,
      statusCounts: visibleOrders.reduce((counts, order) => {
        counts[order.status] = (counts[order.status] || 0) + 1;
        return counts;
      }, {} as Record<string, number>)
    };
  }, [orders]);

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search term (order number, customer name, email, phone)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        (order.order_number && order.order_number.toLowerCase().includes(term)) ||
        (order.profiles?.name && order.profiles.name.toLowerCase().includes(term)) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(term)) ||
        (order.name && order.name.toLowerCase().includes(term)) ||
        (order.profiles?.email && order.profiles.email.toLowerCase().includes(term)) ||
        (order.customer_email && order.customer_email.toLowerCase().includes(term)) ||
        (order.email && order.email.toLowerCase().includes(term)) ||
        (order.customer_phone && order.customer_phone.toLowerCase().includes(term)) ||
        (order.phone && order.phone.toLowerCase().includes(term))
      );
    }

    // Sort
    if (sortBy === 'date_desc') {
      filtered = filtered.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'date_asc') {
      filtered = filtered.slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'amount_desc') {
      filtered = filtered.slice().sort((a, b) => (b.total || 0) - (a.total || 0));
    } else if (sortBy === 'amount_asc') {
      filtered = filtered.slice().sort((a, b) => (a.total || 0) - (b.total || 0));
    }

    return filtered;
  }, [orders, statusFilter, searchTerm, sortBy]);

  const groupedOrdersByDate = useMemo(() => {
    const groups = new Map<string, { dateKey: string; label: string; orders: Order[] }>();
    const todayKey = format(new Date(), 'yyyy-MM-dd');

    filteredOrders.forEach(order => {
      const date = new Date(order.created_at);
      const dateKey = format(date, 'yyyy-MM-dd');
      const label = dateKey === todayKey ? 'Today' : format(date, 'MMMM dd, yyyy');

      if (!groups.has(dateKey)) {
        groups.set(dateKey, { dateKey, label, orders: [] });
      }

      groups.get(dateKey)?.orders.push(order);
    });

    return Array.from(groups.values());
  }, [filteredOrders]);

  // Toggle order expansion function
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <main className="pt-20">
      <div className="container mx-auto px-4 sm:px-0 py-10 pb-24">
        <div className="bg-white border border-black rounded-lg shadow p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3">
            <h2 className="text-lg sm:text-2xl font-semibold">Order Management</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <select
                className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Payment</option>
                <option value="completed">Completed Payment</option>
                <option value="cancelled">Cancelled Orders</option>
              </select>
              <select
                className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date_desc">Newest Order</option>
                <option value="date_asc">Oldest Order</option>
                <option value="amount_desc">Highest Price</option>
                <option value="amount_asc">Lowest Price</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4 sm:mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by order number, customer name, email, or phone..."
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>

          {/* Order Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-2 sm:p-4 bg-yellow-100 border border-yellow-400 rounded-lg hover:bg-yellow-200 transition">
              <h4 className="text-xs sm:text-sm font-medium text-yellow-700">Total Orders</h4>
              <p className="text-lg sm:text-2xl font-bold">{orderStats.totalOrders}</p>
            </div>
            <div className="p-2 sm:p-4 bg-green-100 border border-green-600 rounded-lg hover:bg-green-200 transition">
              <h4 className="text-xs sm:text-sm font-medium text-green-600">Total Revenue</h4>
              <p className="text-lg sm:text-2xl font-bold">₹{orderStats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-2 sm:p-4 bg-purple-200 border border-purple-600 rounded-lg hover:bg-purple-300 transition">
              <h4 className="text-xs sm:text-sm font-medium text-purple-600">Avg Order</h4>
              <p className="text-lg sm:text-2xl font-bold">₹{orderStats.averageOrderValue.toFixed(2)}</p>
            </div>
            <div className="p-2 sm:p-4 bg-orange-100 border border-orange-500 rounded-lg hover:bg-yellow-100 transition">
              <h4 className="text-xs sm:text-sm font-bold text-orange-600">Status Count</h4>
              <div className="text-xs sm:text-sm">
                {Object.entries(orderStats.statusCounts).map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span className="capitalize">{status}: {count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Orders List */}
          {ordersLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : ordersError ? (
            <div className="text-center py-8 text-red-600">
              Error loading orders: {ordersError.message}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No orders found</div>
          ) : (
            <div className="space-y-6">
              {groupedOrdersByDate.map(group => (
                <div key={group.dateKey} className="rounded-2xl border border-sky-400 bg-sky-100 p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{group.label}</h3>
                      <p className="text-sm text-slate-600">{group.orders.length} order{group.orders.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-sm text-slate-500">{group.label === 'Today' ? 'Showing today’s orders' : ''}</div>
                  </div>

                  <div className="space-y-4">
                    {group.orders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0.95, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-2xl border p-4 sm:p-5 shadow-sm ${expandedOrderId === order.id ? 'bg-white border-blue-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base truncate">Order #{order.order_number || order.id.slice(0, 8)}</h4>
                            <p className="text-xs sm:text-sm text-slate-700 truncate">{order.profiles?.name || order.customer_name || order.name || 'Unknown Customer'}</p>
                            <p className="text-xs text-slate-500">{format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}</p>
                          </div>
                          <div className="flex items-center justify-between gap-3 sm:justify-end">
                            <div className="text-right">
                              <p className="font-semibold text-sm">₹{order.total?.toFixed(2) || '0.00'}</p>
                              <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : order.status === 'pending' ? 'bg-amber-100 text-amber-800' : order.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'}`}>
                                {order.status}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleOrderExpansion(order.id)}
                              className="inline-flex items-center gap-1 text-blue-600 text-xs sm:text-sm font-medium"
                            >
                              {expandedOrderId === order.id ? 'Hide details' : 'View details'}
                              {expandedOrderId === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {expandedOrderId === order.id && (
                          <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }} className="mt-4 border-t border-slate-200 pt-4">
                            <div className="grid gap-4 md:grid-cols-2 mb-4">
                              <div className="rounded-xl bg-slate-100 p-3">
                                <h5 className="font-semibold text-sm mb-2">Customer Info</h5>
                                <p className="text-xs text-slate-700"><strong>Name:</strong> {order.profiles?.name || order.customer_name || order.name || 'N/A'}</p>
                                <p className="text-xs text-slate-700"><strong>Email:</strong> {order.profiles?.email || order.customer_email || order.email || 'N/A'}</p>
                                <p className="text-xs text-slate-700"><strong>Phone:</strong> {order.customer_phone || order.phone || 'N/A'}</p>
                              </div>
                              <div className="rounded-xl bg-slate-100 p-3">
                                <h5 className="font-semibold text-sm mb-2">Delivery Info</h5>
                                <p className="text-xs text-slate-700"><strong>Address:</strong> {order.delivery_address || order.address || 'N/A'}</p>
                                <p className="text-xs text-slate-700"><strong>City:</strong> {order.delivery_city || order.city || 'N/A'}</p>
                                <p className="text-xs text-slate-700"><strong>State:</strong> {order.delivery_state || order.state || 'N/A'}</p>
                                <p className="text-xs text-slate-700"><strong>ZIP:</strong> {order.delivery_zip_code || order.zip_code || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="rounded-xl bg-slate-100 p-3 mb-4">
                              <h5 className="font-semibold text-sm mb-2">Order Items</h5>
                              {order.order_items && order.order_items.length > 0 ? (
                                <div className="space-y-2">
                                  {order.order_items.map(item => (
                                    <div key={item.id} className="flex items-center justify-between gap-3 bg-white rounded-xl p-3">
                                      <div className="flex items-center gap-3">
                                        {item.products?.image && <img src={item.products.image} alt={item.products.title} className="w-10 h-10 rounded object-cover" />}
                                        <div>
                                          <p className="text-sm font-medium truncate">{item.products?.title || 'Unknown Product'}</p>
                                          <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-semibold">₹{item.price?.toFixed(2) || '0.00'}</p>
                                        <p className="text-xs text-slate-500">Total: ₹{((item.price || 0) * item.quantity).toFixed(2)}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500">No items found for this order</p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center text-xs text-slate-600">
                              <p><strong>Payment Method:</strong> {order.payment_method || 'N/A'}</p>
                              {order.cancelled_at && (
                                <p><strong>Cancelled:</strong> {format(new Date(order.cancelled_at), 'MMM dd, yyyy HH:mm')} {order.cancellation_reason ? `• Reason: ${order.cancellation_reason}` : ''}</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default OrdersTab;
