import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DriverCard from '@/components/admin/DriverCard';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
    latitude?: number;
    longitude?: number;
}

const DeliveryAssign: React.FC = () => {
    const [drivers, setDrivers] = useState<DriverProfile[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [assignments, setAssignments] = useState<Record<string, string>>({}); // orderId -> driverId
    const [autoAssigned, setAutoAssigned] = useState<boolean>(false);
    const [geocodedDrivers, setGeocodedDrivers] = useState<DriverProfile[]>([]);
    const [geocodedOrders, setGeocodedOrders] = useState<OrderItem[]>([]);

    // Simple in-memory cache to avoid repeated geocode requests
    const geocodeCache = React.useRef<Record<string, { lat: number; lng: number } | null>>({});

    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const primary = await (supabase as any).from('drivers').select('*');
                console.debug('DeliveryAssign: primary drivers response', primary);
                let data = primary.data as any[] | null;
                let error = primary.error;

                if ((!data || (Array.isArray(data) && data.length === 0)) && !error) {
                    const res = await (supabase as any).from('profiles').select('*');
                    console.debug('DeliveryAssign: fallback profiles response', res);
                    data = res.data as any[];
                    error = res.error;
                }

                console.debug('DeliveryAssign: drivers data after fallbacks', { data, error });
                setDrivers((data as DriverProfile[]) || []);
            } catch (err) {
                console.error('Error fetching drivers:', err);
                setDrivers([]);
            } finally {
                setLoading(false);
            }
        };

        const fetchOrders = async () => {
            try {
                const res = await (supabase as any)
                    .from('orders')
                    .select('*')
                    .neq('status', 'completed')
                    .order('created_at', { ascending: false });
                if (res.error) throw res.error;
                setOrders((res.data as any[]) || []);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setOrders([]);
            }
        };

        fetchDrivers();
        fetchOrders();
    }, []);

    // Levenshtein kept (unused by assignment) in case you want to preserve fuzzy fallback
    const levenshtein = (a: string, b: string) => {
        if (!a || !b) return Math.max(a?.length || 0, b?.length || 0);
        const an = a.length;
        const bn = b.length;
        const matrix: number[][] = Array.from({ length: an + 1 }, () => Array(bn + 1).fill(0));
        for (let i = 0; i <= an; i++) matrix[i][0] = i;
        for (let j = 0; j <= bn; j++) matrix[0][j] = j;
        for (let i = 1; i <= an; i++) {
            for (let j = 1; j <= bn; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        return matrix[an][bn];
    };

    const similarity = (a?: string, b?: string) => {
        if (!a && !b) return 0;
        a = (a || '').toLowerCase().trim();
        b = (b || '').toLowerCase().trim();
        if (a === b) return 1;
        const dist = levenshtein(a, b);
        const maxLen = Math.max(a.length, b.length) || 1;
        return 1 - dist / maxLen;
    };

    // ---------------- Nominatim geocoding (OpenStreetMap) ----------------
    // No API key required. Be polite: set User-Agent. Use in-memory cache and concurrency limit.

    async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
        if (!address || !address.trim()) return null;
        const key = address.trim().toLowerCase();
        if (geocodeCache.current[key] !== undefined) return geocodeCache.current[key];

        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'delivery-app/1.0 (your-email@example.com)', // replace email if you have one
                },
            });

            if (!res.ok) {
                console.warn('geocodeAddress: non-ok response', res.status, address);
                geocodeCache.current[key] = null;
                return null;
            }

            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) {
                console.debug('geocodeAddress: no results for', address);
                geocodeCache.current[key] = null;
                return null;
            }

            const out = { lat: Number(data[0].lat), lng: Number(data[0].lon) };
            geocodeCache.current[key] = out;
            return out;
        } catch (err) {
            console.error('geocodeAddress error:', err);
            geocodeCache.current[key] = null;
            return null;
        }
    }

    // Concurrency-safe batch geocode (limit concurrent requests)
    async function batchGeocode<T extends { address?: string; fullAddr?: string }>(
        items: T[],
        makeAddress: (it: T) => string,
        concurrency = 4
    ) {
        const out: (T & { _coords?: { lat?: number; lng?: number } | null })[] = [];

        const queue = items.slice(); // clone
        const workers: Promise<void>[] = [];

        const worker = async () => {
            while (queue.length > 0) {
                const item = queue.shift();
                if (!item) break;
                const addr = makeAddress(item);
                const coords = await geocodeAddress(addr);
                (item as any)._coords = coords;
                out.push(item as any);
                // polite pause to reduce chance of throttling
                await new Promise((r) => setTimeout(r, 120));
            }
        };

        for (let i = 0; i < concurrency; i++) {
            workers.push(worker());
        }

        await Promise.all(workers);
        return out;
    }

    const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const toRad = (v: number) => (v * Math.PI) / 180;
        const R = 6371; // Earth radius km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Geocode drivers and orders when initial data arrives
    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            if (!drivers || drivers.length === 0 || !orders || orders.length === 0) return;
            console.debug('Starting geocode for drivers and orders', { driversCount: drivers.length, ordersCount: orders.length });

            // Map drivers -> ensure an address string exists
            const driversWithAddr = drivers.map((d) => ({
                ...d,
                fullAddr: [d.address, d.city]
                    .filter(Boolean)
                    .join(', ')
                    .trim(),
            }));

            // Map orders -> full address
            const ordersWithAddr = orders.map((o) => ({
                ...o,
                fullAddr: [o.delivery_address, o.delivery_city, o.delivery_state]
                    .filter(Boolean)
                    .join(', ')
                    .trim(),

            }));

            // Do batch geocode with concurrency
            const dd = await batchGeocode(driversWithAddr, (d) => d.fullAddr || '', 4);
            const oo = await batchGeocode(ordersWithAddr, (o) => o.fullAddr || '', 4);

            if (cancelled) return;

            // copy coords into typed objects
            const typedDrivers = dd.map((d) => {
                const coords = (d as any)._coords;
                return { ...(d as any), latitude: coords?.lat, longitude: coords?.lng };
            }) as DriverProfile[];

            const typedOrders = oo.map((o) => {
                const coords = (o as any)._coords;
                return { ...(o as any), latitude: coords?.lat, longitude: coords?.lng };
            }) as OrderItem[];

            setGeocodedDrivers(typedDrivers);
            setGeocodedOrders(typedOrders);
            console.debug('Geocoding complete', { geocodedDrivers: typedDrivers.length, geocodedOrders: typedOrders.length });
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [drivers, orders]);

    // Assign orders to nearest driver (Haversine distance) with load balancing penalty
    const runProximityAssign = () => {
        try {
            const srcDrivers = geocodedDrivers.length ? geocodedDrivers : drivers;
            const srcOrders = geocodedOrders.length ? geocodedOrders : orders;
            console.debug('runProximityAssign start (geo aware)', { driversCount: srcDrivers.length, ordersCount: srcOrders.length });
            if (srcDrivers.length === 0 || srcOrders.length === 0) {
                console.debug('runProximityAssign: nothing to assign');
                return;
            }

            const newAssignments: Record<string, string> = {};
            const driverLoad: Record<string, number> = {};
            srcDrivers.forEach((d) => (driverLoad[d.id] = 0));

            srcOrders.forEach((order) => {
                // Try Haversine assignment if coordinates available
                const oLat = Number((order as any).latitude);
                const oLng = Number((order as any).longitude);

                const driversWithCoords = srcDrivers.filter((d) => isFinite(Number((d as any).latitude)) && isFinite(Number((d as any).longitude)));

                let assignedDriverId: string | null = null;

                if (isFinite(oLat) && isFinite(oLng) && driversWithCoords.length > 0) {
                    // assign by nearest adjusted distance
                    let bestAdjDistance = Number.POSITIVE_INFINITY;
                    driversWithCoords.forEach((driver) => {
                        const dLat = Number((driver as any).latitude);
                        const dLng = Number((driver as any).longitude);
                        const dist = distanceKm(oLat, oLng, dLat, dLng);
                        const adjusted = dist + (driverLoad[driver.id] || 0) * 0.5;
                        if (adjusted < bestAdjDistance) {
                            bestAdjDistance = adjusted;
                            assignedDriverId = driver.id;
                        }
                    });
                    console.debug('order distance match', { orderId: order.id, assignedDriverId, bestAdjDistance });
                } else {
                    // Fallback strategies when geocoding missing
                    const orderCity = (order.delivery_city || '').toString().toLowerCase().trim();
                    const orderAddr = (order.delivery_address || '').toString().toLowerCase().trim();

                    // 1) Exact city match
                    const cityMatches = srcDrivers.filter((d) => ((d.city || '').toString().toLowerCase().trim()) === orderCity);
                    if (cityMatches.length > 0) {
                        // pick least-loaded driver among matches
                        cityMatches.sort((a, b) => (driverLoad[a.id] || 0) - (driverLoad[b.id] || 0));
                        assignedDriverId = cityMatches[0].id;
                        console.debug('order fallback city match', { orderId: order.id, assignedDriverId });
                    }

                    // 2) Address contains
                    if (!assignedDriverId && orderAddr) {
                        const addrMatches = srcDrivers.filter((d) => {
                            const daddr = (d.address || '').toString().toLowerCase().trim();
                            return daddr && (orderAddr.includes(daddr) || daddr.includes(orderAddr));
                        });
                        if (addrMatches.length > 0) {
                            addrMatches.sort((a, b) => (driverLoad[a.id] || 0) - (driverLoad[b.id] || 0));
                            assignedDriverId = addrMatches[0].id;
                            console.debug('order fallback address match', { orderId: order.id, assignedDriverId });
                        }
                    }

                    // 3) Fuzzy similarity on city/address
                    if (!assignedDriverId) {
                        let bestSim = 0;
                        let bestId: string | null = null;
                        srcDrivers.forEach((d) => {
                            const dcity = (d.city || '').toString().toLowerCase().trim();
                            const daddr = (d.address || '').toString().toLowerCase().trim();
                            const simCity = orderCity ? similarity(dcity, orderCity) : 0;
                            const simAddr = orderAddr ? similarity(daddr, orderAddr) : 0;
                            const sim = Math.max(simCity * 0.9, simAddr * 0.95);
                            if (sim > bestSim) {
                                bestSim = sim;
                                bestId = d.id;
                            }
                        });
                        if (bestId && bestSim >= 0.25) {
                            assignedDriverId = bestId;
                            console.debug('order fallback fuzzy match', { orderId: order.id, assignedDriverId, bestSim });
                        }
                    }

                    // 4) Final fallback: assign to least-loaded driver (round-robin style)
                    if (!assignedDriverId) {
                        const sorted = srcDrivers.slice().sort((a, b) => (driverLoad[a.id] || 0) - (driverLoad[b.id] || 0));
                        assignedDriverId = sorted[0]?.id || null;
                        console.debug('order fallback least-loaded', { orderId: order.id, assignedDriverId });
                    }
                }

                if (assignedDriverId) {
                    newAssignments[String(order.id)] = String(assignedDriverId);
                    driverLoad[assignedDriverId] = (driverLoad[assignedDriverId] || 0) + 1;
                }
            });

            console.debug('runProximityAssign result', { assignedCount: Object.keys(newAssignments).length });
            setAssignments(newAssignments);
        } catch (err) {
            console.error('runProximityAssign error', err);
        }
    };

    // Auto-run once geocoded data ready (or raw data if geocoding failed)
    useEffect(() => {
        const readyDrivers = geocodedDrivers.length ? geocodedDrivers.length : drivers.length;
        const readyOrders = geocodedOrders.length ? geocodedOrders.length : orders.length;
        if (!autoAssigned && readyDrivers > 0 && readyOrders > 0) {
            runProximityAssign();
            setAutoAssigned(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drivers, orders, geocodedDrivers, geocodedOrders]);

    const clearAssignments = () => {
        console.debug('clearAssignments clicked');
        setAssignments({});
    };

    const copyAssignmentsCSV = async () => {
        console.debug('copyAssignmentsCSV clicked', { assignmentsCount: Object.keys(assignments).length });
        if (!orders || orders.length === 0) return;
        const lines = ['order_id,order_number,driver_id,driver_name,driver_city'];
        orders.forEach((o) => {
            const did = assignments[String(o.id)];
            const d =
                // prefer geocodedDrivers for display (they are the same ids but may include coords)
                (geocodedDrivers.length ? geocodedDrivers : drivers).find((x) => String(x.id) === String(did));
            lines.push(`${o.id || ''},${o.order_number || ''},${did || ''},${d?.full_name || d?.name || ''},${d?.city || ''}`);
        });
        const csv = lines.join('\n');
        try {
            await navigator.clipboard.writeText(csv);
            alert('Assignments copied to clipboard');
        } catch (err) {
            console.error('Failed to copy CSV', err);
            alert('Failed to copy; see console for CSV');
        }
    };

    // choose driver list used for display (geocoded if available)
    const srcDriversForDisplay = geocodedDrivers.length ? geocodedDrivers : drivers;

    return (
        <main className="pt-20 min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h1 className="text-3xl font-bold mb-2 text-slate-800">Delivery Assign</h1>
                    <p className="text-sm text-slate-500 mb-4">Drivers fetched from Supabase are listed below. Assignments use geocoding when available and fallbacks otherwise.</p>

                    {loading ? (
                        <p className="mt-4 text-gray-500">Loading drivers...</p>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                                <div>
                                    <Dialog>
                                        <div className="flex items-center gap-2">
                                            <DialogTrigger asChild>
                                                <button className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition">
                                                    <span className="mr-2 text-sm">Drivers</span>
                                                    <span className="inline-flex items-center justify-center bg-white text-indigo-700 font-semibold text-sm rounded-full px-2 py-0.5">{drivers.length}</span>
                                                </button>
                                            </DialogTrigger>
                                        </div>

                                        <DialogContent>
                                            <DialogTitle className="mb-2">Drivers ({srcDriversForDisplay.length})</DialogTitle>
                                            <DialogDescription className="mb-4">Details for all registered drivers</DialogDescription>
                                            <div className="space-y-3 max-h-72 overflow-auto">
                                                {srcDriversForDisplay.map((d) => (
                                                    <div key={d.id} className="p-3 border rounded bg-white shadow-sm">
                                                        <div className="font-medium text-slate-800">{d.full_name || d.name || 'Unnamed Driver'}</div>
                                                        {d.phone && <div className="text-sm text-slate-600">{d.phone}</div>}
                                                        {(d.city || d.address) && <div className="text-sm text-slate-500">{d.city || ''}{d.address ? ` • ${d.address}` : ''}</div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <p className="text-sm text-slate-500 mt-1">
                                        Open Orders: <span className="font-semibold text-slate-700">{orders.length}</span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        className="bg-gray-200 text-gray-800 px-3 py-2 rounded hover:bg-gray-300 transition"
                                        onClick={() => copyAssignmentsCSV()}
                                    >
                                        Copy Assignments CSV
                                    </button>
                                    <button
                                        className="bg-red-100 text-red-800 px-3 py-2 rounded hover:bg-red-200 transition"
                                        onClick={() => clearAssignments()}
                                    >
                                        Clear Assignments
                                    </button>
                                </div>
                            </div>

                            {/* If we have assignments, render per-driver boxes showing assigned orders */}
                            {Object.keys(assignments).length > 0 ? (
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium mb-3">Assigned Orders by Driver</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {srcDriversForDisplay.map((driver) => {
                                            const assignedOrders = orders.filter(
                                                (o) => String(assignments[String(o.id)] || '') === String(driver.id)
                                            );
                                            return <DriverCard key={driver.id} driver={driver} orders={assignedOrders} />;
                                        })}
                                    </div>

                                    {/* Unassigned orders */}
                                    {orders.filter((o) => !assignments[String(o.id)]).length > 0 && (
                                        <div className="mt-6">
                                            <h4 className="font-medium mb-2">Unassigned Orders</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {orders.filter((o) => !assignments[String(o.id)]).map((o) => {
                                                    const shortId = (id: string) => (id && id.length > 8 ? id.slice(0, 8) : id);
                                                    const customer = (o as any).customer_name || (o as any).profiles?.name || (o as any).customer_phone || '';
                                                    const title = o.order_number ? `Order #${o.order_number}` : `Order ${shortId(o.id)}`;
                                                    const addrParts = [] as string[];
                                                    if (o.delivery_address) addrParts.push(o.delivery_address);
                                                    if (o.delivery_city) addrParts.push(o.delivery_city);
                                                    const addrDisplay = addrParts.join(' • ');
                                                    return (
                                                        <div key={o.id} className="p-3 border rounded bg-white">
                                                            <div className="text-sm font-medium">{title}</div>
                                                            {customer ? (
                                                                <div className="text-xs text-gray-500">{customer}</div>
                                                            ) : (
                                                                addrDisplay && <div className="text-xs text-gray-500">{addrDisplay}</div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // No assignments yet - show driver cards (empty)
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {srcDriversForDisplay.map((d) => (
                                        <DriverCard key={d.id} driver={d} orders={[]} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </main>
    );
};

export default DeliveryAssign;
