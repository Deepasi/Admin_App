import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductsTab from './admin/ProductsTab';
import OrdersTab from './admin/OrdersTab';
import UsersTab from './admin/UsersTab';
import AnalyticsTab from './admin/AnalyticsTab';
import LiveStockManager  from './admin/stockmanagement';

const Admin: React.FC = () => {
  return (
    <main className="pt-20">
      <div className="container mx-auto py-10">
      <h1 className="text-3xl mt-9 font-bold mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-400 text-black text-xs sm:text-sm md:text-base gap-0.5 sm:gap-1 p-1">
          <TabsTrigger value="products" className="px-1 py-2 sm:px-1.3 sm:py-1.8 text-xs sm:text-sm font-medium truncate min-w-0">
            Products
          </TabsTrigger>
          <TabsTrigger value="orders" className="px-1 py-2 sm:px-1.5 sm:py-1.8 text-xs sm:text-sm font-medium truncate min-w-0">
            Orders
          </TabsTrigger>
          <TabsTrigger value="users" className="px-1 py-2 sm:px-1.5 sm:py-1.8 text-xs sm:text-sm font-medium truncate min-w-0">
            <span className="hidden sm:inline">Active Users</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="px-1 py-2 sm:px-1.5 sm:py-1.8 text-xs sm:text-sm font-medium truncate min-w-0">
            <span className="hidden sm:inline">Sale Analytics</span>
            <span className="sm:hidden">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
      </div>
    </main>
  );
};

export default Admin;