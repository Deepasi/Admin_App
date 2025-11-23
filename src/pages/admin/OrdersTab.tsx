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
    name?: string;
    email?: string;
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
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const userIds = [...new Set(ordersData.map(order => order.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      const ordersWithProfiles = ordersData.map(order => ({
        ...order,
        profiles: profilesData?.find(profile => profile.id === order.user_id)
      }));

      const ordersWithItems = await Promise.all(
        (ordersWithProfiles || []).map(async (order) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              *,
              products (
                title, price, image
              )
            `)
            .eq('order_id', order.id);

          return {
            ...order,
            order_items: itemsData || []
          };
        })
      );

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
        (order.profiles?.email && order.profiles.email.toLowerCase().includes(term)) ||
        (order.customer_email && order.customer_email.toLowerCase().includes(term)) ||
        (order.customer_phone && order.customer_phone.toLowerCase().includes(term))
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
            <div className="p-2 sm:p-4 bg-blue-100 border border-blue-600 rounded-lg hover:bg-blue-200 transition">
              <h4 className="text-xs sm:text-sm font-medium text-blue-600">Total Orders</h4>
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
            <div className="space-y-3 sm:space-y-4 bg-gray-300 border border-black rounded-lg shadow p-3 sm:p-6">
              {filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 1, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border-l-4 rounded-lg p-3 sm:p-4 transition-all duration-300 shadow-md cursor-pointer ${expandedOrderId === order.id
                    ? ' text-black bg-blue-50 border-blue-200 '
                    : 'bg-white border-gray-200 hover:bg-gray-200 hover:border-pink-200'
                    }`}
                  onClick={() => toggleOrderExpansion(order.id)}>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    {/* Mobile: Stack vertically, Desktop: Side by side */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm sm:text-base truncate">
                            Order #{order.order_number || order.id.slice(0, 8)}
                          </h3>
                          <p className="text-xs sm:text-sm text-black truncate">
                            {order.profiles?.name || order.customer_name || 'Unknown Customer'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>

                        {/* Price and Status */}
                        <div className="flex flex-col items-end ml-2">
                          <p className="font-medium text-sm">₹{order.total?.toFixed(2) || '0.00'}</p>
                          <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expand Indicator - Desktop only */}
                    <div className="hidden sm:flex items-center">
                      {expandedOrderId === order.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Mobile Expand Indicator */}
                  <div className="flex justify-center sm:hidden mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-blue-600">
                      {expandedOrderId === order.id ? (
                        <>
                          <span className="text-xs">Hide Details</span>
                          <ChevronUp className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          <span className="text-xs">Tap to view details</span>
                          <ChevronDown className="w-3 h-3" />
                        </>
                      )}
                    </div>
                  </div>

                  {expandedOrderId === order.id && (
                    <motion.div
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t"
                    >
                      <div className="grid grid-cols-1 gap-4 mb-4">
                        {/* Mobile: Stack all info vertically */}
                        <div className="space-y-3 sm:hidden">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-medium mb-2 text-sm">Customer Info</h4>
                            <div className="space-y-1">
                              <p className="text-xs"><strong>Name:</strong> {order.profiles?.name || order.customer_name || 'N/A'}</p>
                              <p className="text-xs"><strong>Email:</strong> {order.profiles?.email || order.customer_email || 'N/A'}</p>
                              <p className="text-xs"><strong>Phone:</strong> {order.customer_phone || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-medium mb-2 text-sm">Delivery Info</h4>
                            <div className="space-y-1">
                              <p className="text-xs"><strong>Address:</strong> {order.delivery_address || 'N/A'}</p>
                              <p className="text-xs"><strong>City:</strong> {order.delivery_city || 'N/A'}</p>
                              <p className="text-xs"><strong>State:</strong> {order.delivery_state || 'N/A'}</p>
                              <p className="text-xs"><strong>ZIP:</strong> {order.delivery_zip_code || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Desktop: Two column layout */}
                        <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Customer Information</h4>
                            <p className="text-sm"><strong>Name:</strong> {order.profiles?.name || order.customer_name || 'N/A'}</p>
                            <p className="text-sm"><strong>Email:</strong> {order.profiles?.email || order.customer_email || 'N/A'}</p>
                            <p className="text-sm"><strong>Phone:</strong> {order.customer_phone || 'N/A'}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Delivery Information</h4>
                            <p className="text-sm"><strong>Address:</strong> {order.delivery_address || 'N/A'}</p>
                            <p className="text-sm"><strong>City:</strong> {order.delivery_city || 'N/A'}</p>
                            <p className="text-sm"><strong>State:</strong> {order.delivery_state || 'N/A'}</p>
                            <p className="text-sm"><strong>ZIP:</strong> {order.delivery_zip_code || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2 text-sm sm:text-base">Order Items</h4>
                        {order.order_items && order.order_items.length > 0 ? (
                          <div className="space-y-2">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded">
                                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                  {item.products?.image && (
                                    <img
                                      src={item.products.image}
                                      alt={item.products.title}
                                      className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded flex-shrink-0"
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-xs sm:text-sm truncate">{item.products?.title || 'Unknown Product'}</p>
                                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                  <p className="font-medium text-xs sm:text-sm">₹{item.price?.toFixed(2) || '0.00'}</p>
                                  <p className="text-xs text-gray-500">
                                    Total: ₹{((item.price || 0) * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-xs sm:text-sm">No items found for this order</p>
                        )}
                      </div>

                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm"><strong>Payment Method:</strong> {order.payment_method || 'N/A'}</p>
                            {order.cancelled_at && (
                              <p className="text-xs sm:text-sm text-red-600">
                                <strong>Cancelled:</strong> {format(new Date(order.cancelled_at), 'MMM dd, yyyy HH:mm')}
                                {order.cancellation_reason && (
                                  <span className="block">Reason: {order.cancellation_reason}</span>
                                )}
                              </p>
                            )}
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-base sm:text-lg font-bold">Total: ₹{order.total?.toFixed(2) || '0.00'}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default OrdersTab;