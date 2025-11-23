import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import { format } from 'date-fns';
import React from 'react';
import { Line } from 'react-chartjs-2';
import SalesAnalytics from './SalesAnalytics';

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

const AnalyticsTab: React.FC = () => {
  // Fetch orders for analytics
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

  if (ordersLoading) {
    return (
      <main className="pt-20">
        <div className="container mx-auto py-10">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-blue-500 bg-blue-100 transition ease-in-out duration-150">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading analytics...
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (ordersError) {
    return (
      <main className="pt-20">
        <div className="container mx-auto py-10">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 inline-block">
                Error loading analytics: {ordersError.message}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20">
      <div className="container mx-auto py-8">
        <SalesAnalytics orders={orders} />
      </div>
    </main>
  );
};

export default AnalyticsTab;