// src/pages/admin/Alerts.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  Package, 
  ShoppingCart, 
  Users, 
  ChevronDown,
  ChevronUp,
  Eye,
  Plus,
  UserPlus,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const AlertsPage = () => {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>('low_stock');

  // Fetch low stock products
  const { data: lowStockAlerts, isLoading: lowStockLoading } = useQuery({
    queryKey: ['admin-alerts-low-stock'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, title, stock_quantity, min_stock_level')
        .order('stock_quantity', { ascending: true });

      if (error) throw error;

      return (products || [])
        .filter(p => p.stock_quantity <= (p.min_stock_level || 10))
        .map(product => ({
          id: product.id,
          title: product.title,
          description: `Stock: ${product.stock_quantity} (Min: ${product.min_stock_level || 10})`,
          severity: product.stock_quantity === 0 ? 'critical' : 'warning',
          timestamp: new Date().toISOString(),
        }));
    }
  });

  // Fetch pending orders
  const { data: orderAlerts, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-alerts-pending-orders'],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, total, created_at, status, order_number')
        .in('status', ['pending', 'pending_payment', 'processing'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (orders || []).map(order => ({
        id: order.id,
        title: `Order #${order.order_number || order.id.slice(-8)}`,
        description: `Total: ₹${order.total || 0}`,
        status: order.status.replace('_', ' ').toUpperCase(),
        timestamp: order.created_at,
      }));
    }
  });

  // Fetch recent customers
  const { data: customerAlerts, isLoading: customersLoading } = useQuery({
    queryKey: ['admin-alerts-new-customers'],
    queryFn: async () => {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email, created_at')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (profiles || []).map(profile => ({
        id: profile.id,
        title: `New Customer: ${profile.name || 'Unknown'}`,
        description: `Email: ${profile.email}`,
        timestamp: profile.created_at,
      }));
    }
  });

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const isLoading = lowStockLoading || ordersLoading || customersLoading;

  const AlertSection = ({ 
    title, 
    icon: Icon, 
    count, 
    sectionKey, 
    alerts, 
    emptyMessage,
    badgeColor,
    onViewAll
  }: {
    title: string;
    icon: any;
    count: number;
    sectionKey: string;
    alerts: any[];
    emptyMessage: string;
    badgeColor: string;
    onViewAll: () => void;
  }) => (
    <div className="bg-white rounded-lg border border-slate-200 mb-4 overflow-hidden">
      {/* Section Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${badgeColor}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600">
              {count} item{count !== 1 ? 's' : ''} requiring attention
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {count > 0 && (
            <Badge variant="secondary" className={badgeColor.replace('bg-', 'bg-').replace(' ', '')}>
              {count}
            </Badge>
          )}
          {openSection === sectionKey ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Section Content */}
      {openSection === sectionKey && (
        <div className="border-t border-slate-200">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              {emptyMessage}
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto">
                {alerts.map((alert, index) => (
                  <div
                    key={alert.id}
                    className={`p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${
                      index === 0 ? 'border-t-0' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 text-sm mb-1">
                          {alert.title}
                        </h4>
                        <p className="text-sm text-slate-600 mb-2">
                          {alert.description}
                        </p>
                        {alert.status && (
                          <Badge variant="outline" className="text-xs mb-2">
                            {alert.status}
                          </Badge>
                        )}
                        <div className="flex items-center text-xs text-slate-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="ml-4 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewAll();
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {alerts.length > 0 && (
                <div className="p-3 border-t border-slate-200 bg-slate-50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-center"
                    onClick={onViewAll}
                  >
                    View All {title}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <main className="pt-20 bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-64 mb-6"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded mb-4"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20 bg-slate-50 min-h-screen pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Alerts & Notifications</h1>
          <p className="text-slate-600">
            Manage and review all system alerts in one place
          </p>
        </header>

        {/* Alert Sections */}
        <div className="space-y-4">
          <AlertSection
            title="Low Stock Products"
            icon={Package}
            count={lowStockAlerts?.length || 0}
            sectionKey="low_stock"
            alerts={lowStockAlerts || []}
            emptyMessage="All products are well stocked"
            badgeColor="bg-red-500"
            onViewAll={() => navigate('/admin/products')}
          />

          <AlertSection
            title="Pending Orders"
            icon={ShoppingCart}
            count={orderAlerts?.length || 0}
            sectionKey="pending_orders"
            alerts={orderAlerts || []}
            emptyMessage="No pending orders"
            badgeColor="bg-amber-500"
            onViewAll={() => navigate('/admin/orders')}
          />

          <AlertSection
            title="New Customers"
            icon={UserPlus}
            count={customerAlerts?.length || 0}
            sectionKey="new_customers"
            alerts={customerAlerts || []}
            emptyMessage="No new customers in the last 24 hours"
            badgeColor="bg-blue-500"
            onViewAll={() => navigate('/admin')}
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              onClick={() => navigate('/admin/products')}
              className="justify-start h-12"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Manage Products
            </Button>
            <Button 
              onClick={() => navigate('/admin/orders')}
              className="justify-start h-12"
              variant="outline"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Process Orders
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AlertsPage;