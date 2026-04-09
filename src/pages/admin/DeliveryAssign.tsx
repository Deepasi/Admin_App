import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DriverCard from '@/components/admin/DriverCard';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, Package, User, MapPin, Clock, Send, Loader2, RefreshCw, ChevronLeft, ChevronRight, Users, ShoppingBag } from 'lucide-react';

interface DriverProfile {
    id: string;
    full_name?: string;
    name?: string;
    phone?: string;
    city?: string;
    address?: string;
    created_at?: string;
    latitude?: number;
    longitude?: number;
}

interface OrderItem {
    id: string;
    order_number?: string;
    delivery_address?: string;
    delivery_city?: string;
    delivery_state?: string;
    status?: string;
    created_at?: string;
    delivery_lat?: number;
    delivery_lng?: number;
    latitude?: number;
    longitude?: number;
    name?: string;  // This is customer name in DB
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    payment_method?: string;
    payment_id?: string;
    payment_order_id?: string;
    payment_signature?: string;
    delivery_slot?: string;
    optimized_sequence?: number;
    driver_id?: string | null;
    assigned_at?: string | null;
    order_items?: Array<{
        id: string;
        quantity: number;
        price: number;
        products?: {
            title?: string;
            price?: string | number;
            image?: string;
        };
    }>;
}

interface OrderGroup {
    title: string;
    orders: OrderItem[];
}

const DeliveryAssign: React.FC = () => {
    const [drivers, setDrivers] = useState<DriverProfile[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [selectedDriver, setSelectedDriver] = useState<string>('');
    const [assigning, setAssigning] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [assignedOrders, setAssignedOrders] = useState<Record<string, OrderItem[]>>({});
    const [showSuccess, setShowSuccess] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'orders' | 'drivers'>('orders');

    useEffect(() => {
        fetchDrivers();
        fetchOrders();
    }, []);

    const fetchDrivers = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('drivers')
                .select('*')
                .order('full_name', { ascending: true });
            
            if (error) throw error;
            setDrivers((data || []) as DriverProfile[]);
        } catch (err) {
            console.error('Error fetching drivers:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('orders')
                .select(`
                    *,
                    order_items (
                        id,
                        quantity,
                        price,
                        products (
                            title,
                            price,
                            image
                        )
                    )
                `)
                .eq('status', 'pending')
                .is('driver_id', null)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setOrders((data || []) as OrderItem[]);
            await fetchAssignedOrders();
        } catch (err) {
            console.error('Error fetching orders:', err);
            setOrders([]);
        }
    };

    const fetchAssignedOrders = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('orders')
                .select('*')
                .not('driver_id', 'is', null)
                .order('assigned_at', { ascending: false });
            
            if (error) throw error;
            
            const grouped: Record<string, OrderItem[]> = {};
            const assigned = (data || []) as OrderItem[];
            assigned.forEach(order => {
                if (order.driver_id) {
                    if (!grouped[order.driver_id]) grouped[order.driver_id] = [];
                    grouped[order.driver_id].push(order);
                }
            });
            setAssignedOrders(grouped);
        } catch (err) {
            console.error('Error fetching assigned orders:', err);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDrivers();
        await fetchOrders();
        setSelectedOrders([]);
        setSelectedDriver('');
        setRefreshing(false);
    };

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrders(prev => 
            prev.includes(orderId) 
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const selectAllOrders = () => {
        if (selectedOrders.length === orders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(orders.map(o => o.id));
        }
    };

    const handleAssignOrders = async () => {
        if (!selectedDriver || selectedOrders.length === 0) {
            alert('Please select a driver and at least one order');
            return;
        }

        setAssigning(true);
        try {
            // IMPORTANT: Keep status as 'pending' - not 'assigned'
            // Driver will change to 'in_progress' when they start delivery
            const { error } = await (supabase as any)
                .from('orders')
                .update({
                    driver_id: selectedDriver,
                    assigned_at: new Date().toISOString(),
                    // status remains 'pending' - assignment doesn't change delivery status
                })
                .in('id', selectedOrders);

            if (error) throw error;

            const driverName = drivers.find(d => d.id === selectedDriver)?.full_name || 'Driver';
            setShowSuccess(`Successfully assigned ${selectedOrders.length} order(s) to ${driverName}`);
            
            setSelectedOrders([]);
            setSelectedDriver('');
            await fetchOrders();
            
            setTimeout(() => setShowSuccess(''), 3000);
        } catch (error) {
            console.error('Error assigning orders:', error);
            alert('Failed to assign orders. Please try again.');
        } finally {
            setAssigning(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getOrderTotal = (order: OrderItem) => {
        if (!order.order_items) return 0;
        return order.order_items.reduce((total, item) => {
            const price = typeof item.price === 'number' ? item.price : parseFloat(item.price as any) || 0;
            return total + (price * item.quantity);
        }, 0);
    };

    const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const toRad = (value: number) => (value * Math.PI) / 180;
        const R = 6371; // Earth radius in kilometers
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    const getOrderCoordinates = (order: OrderItem) => {
        if (order.delivery_lat !== undefined && order.delivery_lng !== undefined) {
            return { lat: order.delivery_lat, lng: order.delivery_lng };
        }
        if (order.latitude !== undefined && order.longitude !== undefined) {
            return { lat: order.latitude, lng: order.longitude };
        }
        return null;
    };

    const formatSlotTime = (slot: string) => {
        // Format slot: capitalize first letters and remove underscores
        // e.g., "morning_today" -> "Morning Today", "afternoon_tomorrow" -> "Afternoon Tomorrow"
        if (!slot || slot === 'No Slot') return 'No Slot';
        
        return slot
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const formatOrderDate = (dateString: string | undefined) => {
        if (!dateString) return 'Date N/A';
        
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
        
        if (dateOnly.getTime() === todayOnly.getTime()) {
            return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
            return `Tomorrow, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    const groupOrdersBySlot = (orders: OrderItem[]) => {
        const slotGroups: Record<string, OrderItem[]> = {};
        orders.forEach(order => {
            const slot = order.delivery_slot || 'No Slot';
            if (!slotGroups[slot]) slotGroups[slot] = [];
            slotGroups[slot].push(order);
        });
        return slotGroups;
    };

    const getClusterColor = (index: number) => {
        const colors = [
            'bg-gradient-to-r from-blue-50 to-blue-100',
            'bg-gradient-to-r from-green-50 to-green-100',
            'bg-gradient-to-r from-purple-50 to-purple-100',
            'bg-gradient-to-r from-pink-50 to-pink-100',
            'bg-gradient-to-r from-amber-50 to-amber-100',
            'bg-gradient-to-r from-indigo-50 to-indigo-100',
            'bg-gradient-to-r from-cyan-50 to-cyan-100',
            'bg-gradient-to-r from-teal-50 to-teal-100',
        ];
        return colors[index % colors.length];
    };

    const groupOrdersByDistance = (ordersToGroup: OrderItem[], maxDistanceKm = 5): OrderGroup[] => {
        const clusters: OrderGroup[] = [];
        const noCoords: OrderItem[] = [];

        ordersToGroup.forEach(order => {
            const coords = getOrderCoordinates(order);
            if (!coords) {
                noCoords.push(order);
                return;
            }

            let added = false;
            for (const cluster of clusters) {
                let isClose = false;

for (const existingOrder of cluster.orders) {
    const ref = getOrderCoordinates(existingOrder);
    if (!ref) continue;

    const distance = haversineDistance(
        coords.lat,
        coords.lng,
        ref.lat,
        ref.lng
    );

    if (distance <= maxDistanceKm) {
        isClose = true;
        break;
    }
}

if (isClose) {
    cluster.orders.push(order);
    added = true;
    break;
}
            }

            if (!added) {
                clusters.push({
                    title: '',
                    orders: [order],
                });
            }
        });

        clusters.forEach((cluster) => {
            const firstOrder = cluster.orders[0];
            cluster.title =
                firstOrder?.address ||
                firstOrder?.delivery_address ||
                `Cluster`;
        });

        if (noCoords.length > 0) {
            clusters.push({ title: 'Unknown location', orders: noCoords });
        }

        return clusters;
    };

    const groupedOrders = groupOrdersByDistance(orders, 5);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-200 via-blue-200 to-indigo-200 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-slate-700">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-200 via-blue-200 to-indigo-200 pb-20 md:pb-0 pt-20 md:pt-24">
            {/* Mobile Header */}
           <div className="md:hidden bg-gradient-to-r from-black to-slate-900 text-white shadow-xl border-b border-slate-700">
                <div className="px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Package className="w-6 h-6" />
                                Assign Deliveries
                            </h1>
                            <p className="text-xs text-slate-300 mt-1">
                                {drivers.length} drivers • {orders.length} orders pending
                            </p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="bg-white/15 p-2 rounded-xl hover:bg-white/25 transition-colors"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Mobile Tab Navigation */}
                <div className="flex border-t border-slate-700">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'orders'
                                ? 'bg-orange-500 text-white shadow-inner'
                                : 'bg-slate-900 text-orange-200 hover:bg-slate-800 hover:text-orange-100'
                        }`}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Orders ({orders.length})
                        {selectedOrders.length > 0 && activeTab === 'orders' && (
                            <span className="bg-white/15 text-white text-[11px] px-2 py-0.5 rounded-full">
                                {selectedOrders.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('drivers')}
                        className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'drivers'
                                ? 'bg-emerald-500 text-white shadow-inner'
                                : 'bg-slate-900 text-emerald-200 hover:bg-slate-800 hover:text-emerald-100'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Drivers ({drivers.length})
                        {selectedDriver && activeTab === 'drivers' && (
                            <span className="bg-white/15 text-white text-[11px] px-2 py-0.5 rounded-full">
                                ✓
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:block max-w-7xl mx-auto px-4 pt-6 pb-2">
                <div className="bg-gradient-to-r from-black to-slate-900 text-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Package className="w-7 h-7" />
                                Assign Deliveries
                            </h1>
                            <p className="text-sm text-blue-100 mt-1">
                                {drivers.length} drivers • {orders.length} unassigned orders
                            </p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {showSuccess && (
                <div className="fixed top-24 left-4 right-4 z-40 md:top-28 md:left-auto md:right-4 md:max-w-sm bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-300">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{showSuccess}</span>
                </div>
            )}

            {/* Desktop Layout */}
            <div className="hidden md:block max-w-7xl mx-auto px-4 py-6">
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Desktop Orders Column */}
                    <div className="bg-orange-50 rounded-xl shadow-md overflow-hidden border border-orange-100">
                        <div className="p-4 border-b bg-orange-100">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <h2 className="text-lg font-semibold flex items-center gap-2 text-orange-900">
                                    <Package className="w-5 h-5 text-orange-600" />
                                    Unassigned Orders
                                    <span className="text-sm bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">
                                        {orders.length}
                                    </span>
                                </h2>
                                {orders.length > 0 && (
                                    <button
                                        onClick={selectAllOrders}
                                        className="text-sm text-orange-700 hover:text-orange-800"
                                    >
                                        {selectedOrders.length === orders.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                )}
                            </div>
                            {selectedOrders.length > 0 && (
                                <div className="mt-2 text-sm text-orange-700">
                                    {selectedOrders.length} order(s) selected
                                </div>
                            )}
                        </div>
                        <div className="p-4 max-h-[600px] overflow-y-auto">
                            {renderOrdersList()}
                        </div>
                    </div>

                    {/* Desktop Drivers Column */}
                    <div className="space-y-6">
                        {renderDriversSelection()}
                        {renderAssignButton()}
                        {renderAssignedSummary()}
                    </div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden">
                {activeTab === 'orders' && (
                    <div className="p-4 pb-24">
                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500 rounded-lg shadow-sm p-4 mb-4">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div>
                                    <span className="text-sm font-bold text-orange-900">📍 Nearby Orders</span>
                                    <p className="text-xs text-orange-700 mt-1">Orders grouped by location ({groupedOrders.length} group{groupedOrders.length !== 1 ? 's' : ''})</p>
                                </div>
                                {orders.length > 0 && (
                                    <button
                                        onClick={selectAllOrders}
                                        className="text-sm text-orange-700 px-3 py-1 rounded-lg bg-orange-200 hover:bg-orange-300 font-semibold"
                                    >
                                        {selectedOrders.length === orders.length ? 'Clear All' : 'Select All'}
                                    </button>
                                )}
                            </div>
                            {selectedOrders.length > 0 && (
                                <div className="flex items-center gap-2 pt-2 border-t border-orange-200">
                                    <CheckCircle className="w-4 h-4 text-orange-600" />
                                    <span className="text-xs font-semibold text-orange-800">{selectedOrders.length} of {orders.length} orders selected</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 pb-20">
                            {groupedOrders.length === 0 ? (
                                <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                                    <p>All orders assigned!</p>
                                </div>
                            ) : (
                                groupedOrders.map((group, groupIndex) => (
                                    <div key={groupIndex} className={`rounded-2xl border-2 border-slate-200 shadow-md overflow-hidden ${getClusterColor(groupIndex)}`}>
                                        <div className="flex items-center justify-between gap-3 px-4 py-4 bg-white/90 backdrop-blur-sm border-b-2 border-slate-200">
                                            <div className="flex-1">
                                                <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                                                    📦 {group.title}
                                                </div>
                                                <div className="text-xs text-slate-600 mt-1">
                                                    {group.orders.length} order{group.orders.length !== 1 ? 's' : ''} • Nearby deliveries
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const ids = group.orders.map(o => o.id);
                                                    const allSelected = ids.every(id => selectedOrders.includes(id));
                                                    if (allSelected) {
                                                        setSelectedOrders(prev => prev.filter(id => !ids.includes(id)));
                                                    } else {
                                                        setSelectedOrders(prev => Array.from(new Set([...prev, ...ids])));
                                                    }
                                                }}
                                                className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                                            >
                                                {group.orders.every(o => selectedOrders.includes(o.id)) ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>

                                        <div className="space-y-4 p-4">
                                            {Object.entries(groupOrdersBySlot(group.orders)).map(([slot, slotOrders]) => (
                                                <div key={slot} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                                                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-400 to-orange-500 border-b border-orange-600">
                                                        <span className="text-sm font-bold text-black flex items-center gap-2">
                                                            🕐 {formatSlotTime(slot)}
                                                        </span>
                                                        <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-semibold border border-white/30 backdrop-blur-sm">
                                                            {slotOrders.length}
                                                        </span>
                                                    </div>
                                                    {slotOrders.map(order => {
                                                        const isSelected = selectedOrders.includes(order.id);
                                                        return (
                                                            <div
                                                                key={order.id}
                                                                onClick={() => toggleOrderSelection(order.id)}
                                                                className={`border-t px-4 py-4 transition-all ${
                                                                    isSelected
  ? 'bg-orange-200 shadow-md ring-2 ring-orange-300 rounded-xl'
  : 'bg-pink-50 hover:bg-pink-100 rounded-xl'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            {isSelected && <CheckCircle className="w-4 h-4 text-orange-600" />}
                                                                            <span className="font-semibold text-sm">
                                                                                #{order.order_number || order.id.slice(0, 8)}
                                                                            </span>
                                                                            <span className="text-[10px] font-semibold uppercase tracking-wide bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                                                                Pending
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-xs text-slate-600 mt-1 font-medium flex items-center gap-1">
                                                                            📅 {formatOrderDate(order.created_at)}
                                                                        </div>
                                                                        <div className="text-sm font-medium text-slate-800 mt-1">
                                                                            {order.name || 'Customer'}
                                                                        </div>
                                                                        <div className="text-xs text-slate-500 flex items-start gap-1 mt-2">
                                                                            <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                                                            <span className="break-words">
                                                                                {order.address || order.delivery_address}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-xs font-semibold text-slate-700">
                                                                        {formatCurrency(getOrderTotal(order))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {selectedOrders.length > 0 && (
                            <div className="fixed bottom-20 left-4 right-4 z-30">
                                <button
                                    onClick={() => setActiveTab('drivers')}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-emerald-700 transition-all"
                                >
                                    Next: Select Driver ({selectedOrders.length} orders)
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'drivers' && (
                    <div className="p-4 pb-24">
                        <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg shadow-sm p-3 mb-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <span className="text-sm font-semibold text-emerald-800">Select Driver</span>
                                    {selectedDriver && (
                                        <p className="text-xs text-emerald-600 mt-1">Driver selected</p>
                                    )}
                                </div>
                                {selectedOrders.length > 0 && (
                                    <button
                                        onClick={() => setActiveTab('orders')}
                                        className="text-sm text-slate-700 px-3 py-1 rounded-lg bg-white shadow-sm flex items-center gap-1 hover:bg-slate-100"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Back
                                    </button>
                                )}
                            </div>
                            {selectedOrders.length > 0 && (
                                <div className="mt-2 text-xs text-slate-600">
                                    Assigning {selectedOrders.length} order(s)
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 pb-32">
                            {drivers.length === 0 ? (
                                <div className="bg-white rounded-lg p-8 text-center text-gray-500">
                                    <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No drivers found</p>
                                </div>
                            ) : (
                                drivers.map(driver => {
                                    const isSelected = selectedDriver === driver.id;
                                    const assignedCount = assignedOrders[driver.id]?.filter(order => order.status !== 'done')?.length || 0;
                                    
                                    return (
                                        <div
                                            key={driver.id}
                                            onClick={() => setSelectedDriver(driver.id)}
                                            className={`rounded-lg p-4 shadow-sm border-l-4 transition-all ${
                                                isSelected
                                                    ? 'border-emerald-600 bg-emerald-50'
                                                    : 'border-emerald-200 bg-white hover:bg-emerald-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-emerald-900">
                                                            {driver.full_name || driver.name}
                                                        </span>
                                                        {assignedCount > 0 && (
                                                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                                                {assignedCount} orders
                                                            </span>
                                                        )}
                                                    </div>
                                                    {driver.phone && (
                                                        <div className="text-xs text-gray-500 mt-1">{driver.phone}</div>
                                                    )}
                                                    {driver.city && (
                                                        <div className="text-xs text-gray-400 mt-1">{driver.city}</div>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {selectedOrders.length > 0 && selectedDriver && (
                            <div className="fixed bottom-20 left-4 right-4 z-30">
                                <button
                                    onClick={handleAssignOrders}
                                    disabled={assigning}
                                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {assigning ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Assigning...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Assign {selectedOrders.length} Order(s)
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // Helper render functions for desktop
    function renderOrdersList() {
        if (orders.length === 0) {
            return (
                <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>All orders have been assigned!</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {groupedOrders.map((group, groupIndex) => (
                    <div key={groupIndex} className={`rounded-2xl border-2 border-slate-200 shadow-md overflow-hidden ${getClusterColor(groupIndex)}`}>
                        <div className="flex items-center justify-between gap-3 px-4 py-4 bg-white/90 backdrop-blur-sm border-b-2 border-slate-200">
                            <div className="flex-1">
                                <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    📦 {group.title}
                                </div>
                                <div className="text-xs text-slate-600 mt-1">
                                    {group.orders.length} order{group.orders.length !== 1 ? 's' : ''} • Nearby deliveries
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const ids = group.orders.map(order => order.id);
                                    const allSelected = ids.every(id => selectedOrders.includes(id));
                                    if (allSelected) {
                                        setSelectedOrders(prev => prev.filter(id => !ids.includes(id)));
                                    } else {
                                        setSelectedOrders(prev => Array.from(new Set([...prev, ...ids])));
                                    }
                                }}
                                className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                            >
                                {group.orders.every(order => selectedOrders.includes(order.id)) ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="space-y-4 p-4">
                            {Object.entries(groupOrdersBySlot(group.orders)).map(([slot, slotOrders]) => (
                                <div key={slot} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-400 to-orange-500 border-b border-orange-600">
                                        <span className="text-sm font-bold text-black flex items-center gap-2">
                                            🕐 {formatSlotTime(slot)}
                                        </span>
                                        <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-semibold border border-white/30 backdrop-blur-sm">
                                            {slotOrders.length}
                                        </span>
                                    </div>
                                    {slotOrders.map(order => {
                                        const isSelected = selectedOrders.includes(order.id);
                                        const orderTotal = getOrderTotal(order);
                                        return (
                                            <div
                                                key={order.id}
                                                onClick={() => toggleOrderSelection(order.id)}
                                                className={`border-t border-pink-200 px-4 py-4 transition-all ${
                                                isSelected
  ? 'bg-orange-200 shadow-md ring-2 ring-orange-300 rounded-xl'
  : 'bg-pink-50 hover:bg-pink-100 rounded-xl'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                            {isSelected && <CheckCircle className="w-5 h-5 text-blue-500" />}
                                                            <span className="font-bold text-gray-900">
                                                                Order #{order.order_number || order.id.slice(0, 8)}
                                                            </span>
                                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                                                                Pending
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-600 mb-2 font-medium">
                                                            📅 {formatOrderDate(order.created_at)}
                                                        </div>
                                                        <div className="text-sm font-semibold text-gray-800 mb-2">
                                                            👤 {order.name || 'Customer'}
                                                        </div>
                                                        <div className="text-xs text-gray-600 flex items-start gap-1 mb-3">
                                                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                            <span className="break-words">
                                                                {order.address || order.delivery_address}
                                                                {(order.city || order.delivery_city) && `, ${order.city || order.delivery_city}`}
                                                            </span>
                                                        </div>
                                                        <div className="font-bold text-gray-900 text-sm">
                                                            💰 {formatCurrency(orderTotal)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    function renderDriversSelection() {
        return (
            <div className="bg-emerald-50 rounded-xl shadow-md overflow-hidden border border-emerald-100">
                <div className="p-4 border-b bg-emerald-100">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-emerald-900">
                        <User className="w-5 h-5 text-emerald-600" />
                        Select Driver
                        {selectedDriver && (
                            <span className="text-sm bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full ml-2">
                                Selected
                            </span>
                        )}
                    </h2>
                </div>
                
                <div className="p-4 max-h-[400px] overflow-y-auto">
                    {drivers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No drivers found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {drivers.map(driver => {
const assignedCount = assignedOrders[driver.id]?.filter(order => order.status !== 'done')?.length || 0;
                                const isSelected = selectedDriver === driver.id;
                                
                                return (
                                    <div
                                        key={driver.id}
                                        onClick={() => setSelectedDriver(driver.id)}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                            isSelected
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <div className="font-semibold text-gray-900">
                                                    {driver.full_name || driver.name || 'Driver'}
                                                </div>
                                                {driver.phone && (
                                                    <div className="text-sm text-gray-600">{driver.phone}</div>
                                                )}
                                            </div>
                                            {assignedCount > 0 && (
                                                <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                    {assignedCount} assigned
                                                </div>
                                            )}
                                        </div>
                                        
                                        {driver.city && (
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {driver.city}
                                            </div>
                                        )}
                                        
                                        {isSelected && (
                                            <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Ready to assign
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    function renderAssignButton() {
        if (selectedOrders.length === 0 || !selectedDriver) return null;
        
        return (
            <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-blue-500">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <div className="font-semibold text-gray-900">Ready to Assign</div>
                        <div className="text-sm text-gray-600">
                            {selectedOrders.length} order(s) to {drivers.find(d => d.id === selectedDriver)?.full_name}
                        </div>
                    </div>
                    <button
                        onClick={handleAssignOrders}
                        disabled={assigning}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        {assigning ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Assigning...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Assign Orders
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    function renderAssignedSummary() {
        if (Object.keys(assignedOrders).length === 0) return null;
        
        return (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        Currently Assigned
                    </h2>
                </div>
                <div className="p-4 max-h-[300px] overflow-y-auto">
                    <div className="space-y-3">
                        {drivers
                            .filter(d => assignedOrders[d.id]?.length > 0)
                            .map(driver => (
                                <div key={driver.id} className="border-l-4 border-blue-500 pl-3">
                                    <div className="font-medium text-gray-900">
                                        {driver.full_name || driver.name}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {assignedOrders[driver.id].length} active order(s)
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        );
    }
};

export default DeliveryAssign;
