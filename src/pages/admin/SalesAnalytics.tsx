import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import { format } from 'date-fns';
import React from 'react';
import { Line } from 'react-chartjs-2';

// Initialize Chart.js
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

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

interface SalesAnalyticsProps {
  orders: Order[];
}

const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({ orders }) => {
  // Calculate sales data
  const calculateSalesData = (orders: Order[]) => {
    const salesByMonth: Record<string, number> = {};
    orders.forEach(order => {
      const month = format(new Date(order.created_at), 'MMM yyyy');
      salesByMonth[month] = (salesByMonth[month] || 0) + (order.total || 0);
    });

    const labels = Object.keys(salesByMonth);
    const data = Object.values(salesByMonth);

    return { labels, data };
  };

  // Calculate order statistics
  const calculateOrderStats = (orders: Order[]) => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalOrders, totalRevenue, averageOrderValue, statusCounts };
  };

  const salesData = calculateSalesData(orders);
  const orderStats = calculateOrderStats(orders);

  const lineChartData = {
    labels: salesData.labels,
    datasets: [
      {
        label: 'Monthly Sales',
        data: salesData.data,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Sales Trend',
      },
    },
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sales Overview */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition duration-300">
        <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-lg bg-blue-100 border border-blue-300 hover:bg-blue-200 transition">
            <h4 className="text-sm font-medium text-blue-600">Total Orders</h4>
            <p className="text-xl sm:text-2xl font-bold">{orderStats.totalOrders}</p>
          </div>
          <div className="p-3 sm:p-4 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200 transition">
            <h4 className="text-sm font-medium text-green-600">Total Revenue</h4>
            <p className="text-xl sm:text-2xl font-bold">₹{orderStats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="p-3 sm:p-4 bg-purple-100 border border-purple-300 rounded-lg hover:bg-purple-200 transition sm:col-span-2 lg:col-span-1">
            <h4 className="text-sm font-medium text-purple-600">Average Order Value</h4>
            <p className="text-xl sm:text-2xl font-bold">₹{orderStats.averageOrderValue.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      {/* Sales Trend */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition duration-300">
        <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
        <div className="h-[250px] sm:h-[300px] lg:h-[400px] overflow-hidden">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
      </div>
      
      {/* Order Status Distribution */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition duration-300">
        <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 border border-blue-300 rounded-lg">
          {Object.entries(orderStats.statusCounts).map(([status, count]) => (
            <div
              key={status} 
              className="p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 hover:scale-[1.02] transition transform duration-200 ease-in-out"
            >
              <h4 className="text-sm font-medium text-gray-600 capitalize">{status} payment</h4>
              <p className="text-lg sm:text-xl font-bold">{count}</p> 
            </div>
          ))}
        </div>
      </div>

      {/* Additional Analytics Section */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition duration-300">
        <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="text-2xl font-bold text-indigo-600">{orders.filter(o => o.status === 'completed').length}</div>
            <div className="text-sm text-indigo-600">Completed Orders</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</div>
            <div className="text-sm text-yellow-600">Pending Orders</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{orders.filter(o => o.status === 'cancelled').length}</div>
            <div className="text-sm text-red-600">Cancelled Orders</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">
              {orders.length > 0 ? Math.round((orders.filter(o => o.status === 'completed').length / orders.length) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition duration-300">
        <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
        <div className="space-y-2">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className="flex-1">
                <div className="font-medium text-sm">
                  Order #{order.order_number || order.id.slice(0, 8)}
                </div>
                <div className="text-xs text-gray-500">
                  {order.profiles?.name || order.customer_name || 'Unknown Customer'}
                </div>
                <div className="text-xs text-gray-400">
                  {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">₹{order.total?.toFixed(2) || '0.00'}</div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No orders found to display analytics.
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesAnalytics;

