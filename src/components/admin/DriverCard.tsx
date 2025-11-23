import React from 'react';

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
    delivery_address?: string;
    delivery_city?: string;
    delivery_state?: string;
    status?: string;
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
                        if (o.delivery_address) addrParts.push(o.delivery_address);
                        if (o.delivery_city) addrParts.push(o.delivery_city);
                        if (o.delivery_state) addrParts.push(o.delivery_state);
                        const addrDisplay = addrParts.join(' • ');
                        const shortId = (id: string) => (id && id.length > 8 ? id.slice(0, 8) : id);
                        const customer = (o as any).customer_name || (o as any).profiles?.name || (o as any).customer_phone || '';
                        const title = o.order_number ? `Order #${o.order_number}` : `Order ${shortId(o.id)}`;
                        return (
                            <div key={o.id} className="p-3 border rounded hover:bg-slate-50 transition">
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
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DriverCard;
