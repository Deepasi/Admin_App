import React from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Driver {
    id: string;
    full_name?: string;
    name?: string;
    phone?: string;
    city?: string;
    address?: string;
}

interface Order {
    id: string;
    order_number?: string;
    // support both older and newer column names
    delivery_address?: string;
    delivery_city?: string;
    delivery_state?: string;
    // fields from provided SQL schema
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    status?: string;
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

const DriverCard: React.FC<{ driver: Driver; orders?: Order[] }> = ({ driver, orders = [] }) => {
    return (
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-4 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">{driver.full_name || driver.name || 'Unnamed Driver'}</h3>
                    {driver.city && <div className="text-xs text-slate-500">{driver.city}</div>}
                </div>
                {driver.phone && <div className="text-sm text-slate-600">{driver.phone}</div>}
            </div>

            {driver.address && (
                <div className="mb-3 text-sm text-slate-700">{driver.address}</div>
            )}

            <div className="space-y-2">
                {orders.length === 0 ? (
                    <div className="text-sm text-slate-500">No assigned orders</div>
                ) : (
                    orders.map((o) => {
                        const addrParts = [] as string[];
                        // prefer `address/city/state/zip_code` (SQL schema), fall back to delivery_* fields
                        if ((o as any).address) addrParts.push((o as any).address);
                        if ((o as any).delivery_address) addrParts.push((o as any).delivery_address);
                        if ((o as any).city) addrParts.push((o as any).city);
                        if ((o as any).delivery_city) addrParts.push((o as any).delivery_city);
                        if ((o as any).state) addrParts.push((o as any).state);
                        if ((o as any).delivery_state) addrParts.push((o as any).delivery_state);
                        if ((o as any).zip_code) addrParts.push((o as any).zip_code);
                        const addrDisplay = addrParts.join(' • ');
                        const shortId = (id: string) => (id && id.length > 8 ? id.slice(0, 8) : id);
                        const customer = (o as any).name || (o as any).customer_name || (o as any).profiles?.name || '';
                        const customerPhone = (o as any).phone || (o as any).customer_phone || '';
                        const customerEmail = (o as any).email || (o as any).customer_email || '';
                        const title = o.order_number ? `Order #${o.order_number}` : `Order ${shortId(o.id)}`;
                        return (
                            <Dialog key={o.id}>
                                <DialogTrigger asChild>
                                    <div className="p-3 border rounded hover:bg-slate-50 transition cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-sm text-slate-800">{title}</div>
                                                {customer ? (
                                                    <div className="text-xs text-slate-500">{customer}</div>
                                                ) : (
                                                    addrDisplay && <div className="text-xs text-slate-500">{addrDisplay}</div>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500">{o.status || ''}</div>
                                        </div>
                                    </div>
                                </DialogTrigger>

                                <DialogContent>
                                    <DialogTitle className="mb-2">{title}</DialogTitle>
                                    <DialogDescription className="mb-4">Details for this order</DialogDescription>
                                    <div className="space-y-3 text-sm text-slate-700">
                                        <div><strong>Order ID:</strong> {o.id}</div>
                                        {o.order_number && <div><strong>Order #:</strong> {o.order_number}</div>}
                                        {customer && <div><strong>Customer:</strong> {customer}</div>}
                                        {customerEmail && <div><strong>Email:</strong> {customerEmail}</div>}
                                        {customerPhone && <div><strong>Phone:</strong> {customerPhone}</div>}
                                        {(addrDisplay) && <div><strong>Address:</strong> {addrDisplay}</div>}
                                        {o.status && <div><strong>Status:</strong> {o.status}</div>}
                                        {(o as any).created_at && <div><strong>Created:</strong> {(o as any).created_at}</div>}
                                        {(o as any).latitude && (o as any).longitude && (
                                            <div><strong>Coords:</strong> {(o as any).latitude}, {(o as any).longitude}</div>
                                        )}

                                        {/* Order items listing */}
                                        {o.order_items && o.order_items.length > 0 && (
                                            <div>
                                                <h4 className="font-medium mt-2 mb-1">Items</h4>
                                                <div className="space-y-2">
                                                    {o.order_items.map((it) => (
                                                        <div key={it.id} className="flex items-center gap-3">
                                                            {it.products?.image && (
                                                                <img src={it.products.image} alt={it.products.title || ''} className="w-10 h-10 object-cover rounded" />
                                                            )}
                                                            <div className="flex-1">
                                                                <div className="font-medium text-sm text-slate-800">{it.products?.title || 'Item'}</div>
                                                                <div className="text-xs text-slate-500">Qty: {it.quantity} • Price: {typeof it.price === 'number' ? `₹${it.price}` : it.price}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DriverCard;
