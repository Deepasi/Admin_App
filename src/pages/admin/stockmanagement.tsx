
// stockmanagement.tsx - Fixed Real-time Stock Management Component
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, Package, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

interface StockMovement {
  id: string;
  product_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
  notes?: string;
  products?: {
    title: string;
    unit: string;
  };
}

interface Product {
  id: string;
  title: string;
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  unit: string;
}

// Stock Management Functions
export class StockManager {
  // Calculate current stock using database function
  static async getCurrentStock(productId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_current_stock', { product_uuid: productId });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating current stock:', error);
      
      // Fallback: calculate from movements if RPC fails
      try {
        const { data: movements, error: movementError } = await supabase
          .from('stock_movements')
          .select('movement_type, quantity, new_quantity')
          .eq('product_id', productId)
          .order('created_at', { ascending: true });

        if (movementError) throw movementError;

        let currentStock = 0;
        movements?.forEach(movement => {
          switch (movement.movement_type) {
            case 'in':
              currentStock += movement.quantity;
              break;
            case 'out':
              currentStock -= movement.quantity;
              break;
            case 'adjustment':
              currentStock = movement.new_quantity;
              break;
          }
        });

        return Math.max(0, currentStock);
      } catch (fallbackError) {
        console.error('Fallback stock calculation failed:', fallbackError);
        return 0;
      }
    }
  }

  // Create stock movement record with proper validation
  static async createStockMovement(
    productId: string,
    movementType: 'in' | 'out' | 'adjustment',
    quantity: number,
    reason: string,
    referenceId?: string,
    referenceType?: string,
    notes?: string
  ) {
    try {
      // Get current stock and product info
      const [currentStock, productInfo] = await Promise.all([
        this.getCurrentStock(productId),
        supabase.from('products').select('max_stock_level, min_stock_level, title').eq('id', productId).single()
      ]);

      if (productInfo.error) throw productInfo.error;
      
      const previousQuantity = currentStock;
      let newQuantity = previousQuantity;

      // Calculate new quantity based on movement type
      switch (movementType) {
        case 'in':
          const incomingAmount = Math.abs(quantity);
          newQuantity = previousQuantity + incomingAmount;
          
          // Check if this would exceed max capacity
          if (productInfo.data.max_stock_level && newQuantity > productInfo.data.max_stock_level) {
            const availableCapacity = productInfo.data.max_stock_level - previousQuantity;
            console.warn(`Warning: Adding ${incomingAmount} would exceed max capacity. Available capacity: ${availableCapacity}`);
            // You can choose to limit the quantity or throw an error
            // newQuantity = productInfo.data.max_stock_level; // Limit to max
            // Or throw error:
            // throw new Error(`Insufficient capacity. Max: ${productInfo.data.max_stock_level}, Current: ${previousQuantity}, Available: ${availableCapacity}`);
          }
          break;
          
        case 'out':
          const deductionAmount = Math.abs(quantity);
          if (previousQuantity < deductionAmount) {
            throw new Error(`Insufficient stock for ${productInfo.data.title}. Available: ${previousQuantity}, Requested: ${deductionAmount}`);
          }
          newQuantity = previousQuantity - deductionAmount;
          break;
          
        case 'adjustment':
          newQuantity = Math.max(0, quantity);
          
          // Check if adjustment exceeds max capacity
          if (productInfo.data.max_stock_level && newQuantity > productInfo.data.max_stock_level) {
            console.warn(`Warning: Adjustment would exceed max capacity of ${productInfo.data.max_stock_level}`);
          }
          break;
      }

      // Create stock movement record
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: productId,
          movement_type: movementType,
          quantity: Math.abs(quantity),
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          reason,
          reference_id: referenceId,
          reference_type: referenceType,
          notes,
          created_at: new Date().toISOString()
        });

      if (movementError) throw movementError;

      // The trigger will automatically update the stock_quantity in products table
      
      return { 
        success: true, 
        newQuantity, 
        previousQuantity,
        availableCapacity: productInfo.data.max_stock_level ? productInfo.data.max_stock_level - newQuantity : null,
        isLowStock: newQuantity <= (productInfo.data.min_stock_level || 0),
        isOverstocked: productInfo.data.max_stock_level ? newQuantity >= productInfo.data.max_stock_level : false
      };
    } catch (error) {
      console.error('Stock movement error:', error);
      throw error;
    }
  }

  // Handle order placement - reduce stock (called manually, not in real-time subscription)
  static async handleOrderPlacement(orderItems: Array<{ product_id: string; quantity: number }>, orderId: string) {
    try {
      console.log('Processing order placement for order:', orderId);
      
      // Check if this order has already been processed
      const { data: existingMovements } = await supabase
        .from('stock_movements')
        .select('id')
        .eq('reference_id', orderId)
        .eq('reference_type', 'order')
        .eq('movement_type', 'out');

      if (existingMovements && existingMovements.length > 0) {
        console.log('Order already processed, skipping stock deduction');
        return;
      }

      for (const item of orderItems) {
        await this.createStockMovement(
          item.product_id.toString(),
          'out',
          item.quantity,
          'Order placement',
          orderId,
          'order',
          `Stock reduced due to order ${orderId}`
        );
      }
      
      console.log('Order placement stock deduction completed');
    } catch (error) {
      console.error('Error handling order placement:', error);
      throw error;
    }
  }

  // Handle order cancellation - restore stock
  static async handleOrderCancellation(orderItems: Array<{ product_id: string; quantity: number }>, orderId: string) {
    try {
      console.log('Processing order cancellation for order:', orderId);
      
      // Check if cancellation has already been processed
      const { data: existingCancellations } = await supabase
        .from('stock_movements')
        .select('id')
        .eq('reference_id', orderId)
        .eq('reference_type', 'order_cancellation')
        .eq('movement_type', 'in');

      if (existingCancellations && existingCancellations.length > 0) {
        console.log('Order cancellation already processed, skipping stock restoration');
        return;
      }

      for (const item of orderItems) {
        await this.createStockMovement(
          item.product_id.toString(),
          'in',
          item.quantity,
          'Order cancellation',
          orderId,
          'order_cancellation',
          `Stock restored due to order cancellation ${orderId}`
        );
      }
      
      console.log('Order cancellation stock restoration completed');
    } catch (error) {
      console.error('Error handling order cancellation:', error);
      throw error;
    }
  }

  // Get products with low stock using the database view
  static async getLowStockProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('low_stock_products')
        .select('id, title, unit, min_stock_level, max_stock_level, current_stock, stock_status')
        .order('current_stock', { ascending: true });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        title: item.title,
        unit: item.unit,
        min_stock_level: item.min_stock_level,
        max_stock_level: item.max_stock_level,
        stock_quantity: item.current_stock
      }));
    } catch (error) {
      console.error('Error getting low stock products:', error);
      
      // Fallback to manual calculation if view doesn't exist
      try {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, title, min_stock_level, max_stock_level, unit');

        if (productsError) throw productsError;

        const lowStockProducts: Product[] = [];

        for (const product of products || []) {
          const currentStock = await this.getCurrentStock(product.id);
          
          if (currentStock <= product.min_stock_level) {
            lowStockProducts.push({
              ...product,
              stock_quantity: currentStock
            });
          }
        }

        return lowStockProducts.sort((a, b) => a.stock_quantity - b.stock_quantity);
      } catch (fallbackError) {
        console.error('Fallback low stock calculation failed:', fallbackError);
        return [];
      }
    }
  }

  // Get stock summary for all products
  static async getStockSummary() {
    try {
      const { data, error } = await supabase
        .from('stock_summary')
        .select('*')
        .order('title');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting stock summary:', error);
      return [];
    }
  }
}

// Live Stock Manager Component
const LiveStockManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());

  // Fetch recent stock movements
  const { data: stockMovements = [], isLoading } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          products!inner(title, unit)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as StockMovement[];
    },
  });

  // Fetch low stock products using the new method
  const { data: lowStockProducts = [] } = useQuery<Product[]>({
    queryKey: ['low-stock-products'],
    queryFn: () => StockManager.getLowStockProducts(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to stock movements
    const movementsSubscription = supabase
      .channel('stock_movements_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stock_movements' },
        (payload) => {
          console.log('Stock movement change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
          queryClient.invalidateQueries({ queryKey: ['admin-products'] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['low-stock-products'] });
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Stock Updated",
              description: `Stock movement recorded`,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to product changes (for min/max levels)
    const productsSubscription = supabase
      .channel('products_stock_channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Product change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-products'] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['low-stock-products'] });
        }
      )
      .subscribe();

    // Subscribe to order changes - BUT don't process stock here
    // Stock should be processed when the order is actually placed, not in real-time subscription
    const ordersSubscription = supabase
      .channel('orders_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          console.log('Order change detected:', payload);
          
          // Only handle cancellations here, as new orders should be handled in order placement logic
          if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
            const oldStatus = payload.old.status;
            const newStatus = payload.new.status;
            const orderId = payload.new.id;

            if (oldStatus !== 'cancelled' && newStatus === 'cancelled' && !processingOrders.has(orderId)) {
              setProcessingOrders(prev => new Set(prev).add(orderId));
              
              try {
                const { data: orderItems } = await supabase
                  .from('order_items')
                  .select('product_id, quantity')
                  .eq('order_id', orderId);

                if (orderItems && orderItems.length > 0) {
                  await StockManager.handleOrderCancellation(orderItems, orderId);
                  toast({
                    title: "Stock Restored",
                    description: `Stock restored due to order cancellation`,
                  });
                }
              } catch (error) {
                console.error('Error handling order cancellation stock update:', error);
                toast({
                  title: "Error",
                  description: "Failed to restore stock for cancelled order",
                  variant: "destructive"
                });
              } finally {
                setProcessingOrders(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(orderId);
                  return newSet;
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      movementsSubscription.unsubscribe();
      productsSubscription.unsubscribe();
      ordersSubscription.unsubscribe();
    };
  }, [queryClient, toast, processingOrders]);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'out':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'adjustment':
        return <Package className="w-4 h-4 text-blue-600" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'out':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'adjustment':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stock movements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <strong className="text-amber-800">
              {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on stock
            </strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Stock Movements History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Recent Stock Movements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stockMovements.map((movement) => (
              <div
                key={movement.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {getMovementIcon(movement.movement_type)}
                  <div>
                    <p className="font-medium text-sm">
                      {movement.products?.title || 'Unknown Product'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {movement.reason} • {new Date(movement.created_at).toLocaleString()}
                    </p>
                    {movement.notes && (
                      <p className="text-xs text-gray-400 mt-1">{movement.notes}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={`${getMovementColor(movement.movement_type)} border`}>
                    {movement.movement_type === 'in' ? '+' : movement.movement_type === 'out' ? '-' : ''}
                    {movement.quantity} {movement.products?.unit}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {movement.previous_quantity} → {movement.new_quantity}
                  </p>
                </div>
              </div>
            ))}
            {stockMovements.length === 0 && (
              <p className="text-gray-500 text-center py-4">No stock movements recorded yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border border-amber-200 rounded-lg bg-amber-50">
                  <div>
                    <p className="font-medium">{product.title}</p>
                    <p className="text-sm text-gray-600">
                      Current: {product.stock_quantity} {product.unit} | 
                      Min Level: {product.min_stock_level} {product.unit} |
                      Max Capacity: {product.max_stock_level} {product.unit}
                    </p>
                    <p className="text-xs text-gray-500">
                      Available Capacity: {Math.max(0, product.max_stock_level - product.stock_quantity)} {product.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 mb-1">
                      {product.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                    </Badge>
                    <div className="text-xs text-gray-500">
                      {product.max_stock_level > 0 && (
                        <>
                          {Math.round((product.stock_quantity / product.max_stock_level) * 100)}% Full
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveStockManager;