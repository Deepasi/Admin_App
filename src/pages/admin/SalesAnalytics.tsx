import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { format, parseISO } from 'date-fns';
import React, { useEffect, useState } from 'react';
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
  cancelled_at?: string;
  order_number?: string;
  profiles?: { name?: string; email?: string };
  // other optional fields
}

interface SalesAnalyticsProps {
  orders: Order[];
}

const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({ orders }) => {
  // Calculate sales per month
  const calculateSalesData = (orders: Order[]) => {
    const salesByMonth: Record<string, number> = {};
    orders.forEach(order => {
      // Ensure created_at is valid before processing
      if (order.created_at) {
        const monthKey = format(new Date(order.created_at), 'yyyy-MM');
        salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + (order.total || 0);
      }
    });

    // Generate last 4 months including current month
    const months: string[] = [];
    const current = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
      months.push(format(d, 'yyyy-MM'));
    }

    // --- MOBILE IMPROVEMENT: Simplify labels to 'MMM' (e.g., 'Nov') ---
    const labels = months.map(m => format(parseISO(m + '-01'), 'MMM'));

    const data = months.map(m => salesByMonth[m] || 0);

    const peakIndex = data.length ? data.indexOf(Math.max(...data)) : 0;

    return { labels, data, peakIndex };
  };

  // Order statistics
  const calculateOrderStats = (orders: Order[]) => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const deliveredOrdersCount = orders.filter(
      o => (o.status === 'completed' || o.status === 'delivered') && !o.cancelled_at
    ).length;
    return { totalOrders, totalRevenue, averageOrderValue, statusCounts, deliveredOrdersCount };
  };

  const salesData = calculateSalesData(orders);
  const orderStats = calculateOrderStats(orders);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // NEW: range state + dynamic chart state
  const [range, setRange] = useState<'monthly' | 'quarterly' | 'half-yearly' | 'yearly'>('monthly');
  const [dynamicChart, setDynamicChart] = useState<any>({
    data: {
      labels: salesData.labels,
      datasets: [
        {
          label: 'Monthly Sales',
          data: salesData.data,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.2,
          pointBackgroundColor: salesData.data.map((_, i) =>
            i === salesData.peakIndex ? 'rgb(255, 99, 132)' : 'rgb(75, 192, 192)'
          ),
          pointRadius: salesData.data.map((_, i) => (i === salesData.peakIndex ? 7 : 4)),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' as const, labels: { font: { size: 10 } } },
        title: { display: true, text: 'Monthly Sales Trend', font: { size: 14 } },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              return `₹${context.raw.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 10 } } },
        x: { ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 } }
      }
    }
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModalOpen]);

  // Default chart options used as base
  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allows chart to respect container height
    plugins: {
      legend: { position: 'top' as const, labels: { font: { size: 10 } } },
      title: { display: true, text: 'Sales Trend', font: { size: 14 } },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `₹${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, ticks: { font: { size: 10 } } },
      x: { ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 } }
    }
  };

  // Recompute dynamicChart whenever range or orders change
  useEffect(() => {
    // safety: if no orders, still show labels/zeros for the selected range
    let labels: string[] = [];
    let values: number[] = [];

    if (range === 'monthly') {
      labels = salesData.labels;
      values = salesData.data;
    }

    if (range === 'quarterly') {
      const q = [0, 0, 0, 0];
      orders.forEach(order => {
        if (!order.created_at) return;
        const month = new Date(order.created_at).getMonth();
        const quarter = Math.floor(month / 3); // 0..3
        q[quarter] += order.total || 0;
      });
      labels = ['Q1', 'Q2', 'Q3', 'Q4'];
      values = q;
      // if all zeros but there are no orders, leave it zero - that's fine
    }

    if (range === 'half-yearly') {
      const h = [0, 0];
      orders.forEach(order => {
        if (!order.created_at) return;
        const month = new Date(order.created_at).getMonth();
        if (month < 6) h[0] += order.total || 0; // Jan–Jun
        else h[1] += order.total || 0; // Jul–Dec
      });
      labels = ['H1 (Jan–Jun)', 'H2 (Jul–Dec)'];
      values = h;
    }

    // ========== YEARLY (Last 3 Years) ==========
    if (range === "yearly") {
      const currentYear = new Date().getFullYear();

      // Generate last 3 years including current year
      const yearLabels = [
        (currentYear - 2).toString(),
        (currentYear - 1).toString(),
        currentYear.toString(),
      ];

      const yearTotals: Record<string, number> = {
        [currentYear - 2]: 0,
        [currentYear - 1]: 0,
        [currentYear]: 0,
      };

      // Sum totals by year
      orders.forEach(order => {
        const orderYear = new Date(order.created_at).getFullYear();
        if (yearTotals[orderYear] !== undefined) {
          yearTotals[orderYear] += order.total || 0;
        }
      });

      labels = yearLabels;
      values = yearLabels.map(y => yearTotals[Number(y)]);
    }


    // ensure labels/values are defined
    if (!labels || labels.length === 0) {
      labels = salesData.labels.length ? salesData.labels : ['No data'];
      values = salesData.data.length ? salesData.data : [0];
    }

    // compute peak to highlight
    const peakIndex = values.length ? values.indexOf(Math.max(...values)) : 0;

    // dataset styling with highlighted peak
    const dataset = {
      label: `${range[0].toUpperCase() + range.slice(1)} Sales`,
      data: values,
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.2,
      pointBackgroundColor: values.map((_, i) =>
        i === peakIndex ? 'rgb(255, 99, 132)' : 'rgb(75, 192, 192)'
      ),
      pointRadius: values.map((_, i) => (i === peakIndex ? 7 : 4))
    };

    // set dynamic chart
    setDynamicChart({
      data: {
        labels,
        datasets: [dataset]
      },
      options: {
        ...baseChartOptions,
        plugins: {
          ...baseChartOptions.plugins,
          title: {
            display: true,
            text:
              range === 'monthly'
                ? 'Monthly Sales Trend'
                : range === 'quarterly'
                  ? 'Quarterly Sales Trend'
                  : range === 'half-yearly'
                    ? 'Half-Yearly Sales Trend'
                    : 'Yearly Sales Trend',
            font: { size: 14 }
          }
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, orders]); // intentionally only depend on range and orders

  // Peak period derived from current dynamicChart (first non-empty label)
  const peakPeriod = dynamicChart?.data?.labels?.[dynamicChart?.data?.datasets?.[0]?.data?.indexOf(Math.max(...(dynamicChart?.data?.datasets?.[0]?.data || [0])))] || 'N/A';

  // Compute peak hour (most orders by hour) as a simple heuristic
  const peakHour = (() => {
    const hourCounts: Record<number, number> = {};
    orders.forEach(o => {
      if (o.created_at) {
        const h = new Date(o.created_at).getHours();
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      }
    });
    let maxH = 0;
    let maxCount = 0;
    Object.keys(hourCounts).forEach(k => {
      const h = Number(k);
      if (hourCounts[h] > maxCount) {
        maxCount = hourCounts[h];
        maxH = h;
      }
    });
    return maxCount > 0 ? maxH : 0;
  })();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sales Overview */}
      <div className="bg-white p-3 sm:p-6 rounded-lg shadow hover:shadow-md transition duration-300">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Sales Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          <div className="p-2 sm:p-4 rounded-lg bg-blue-100 border border-blue-300 hover:bg-blue-200 transition">
            <h4 className="text-xs sm:text-sm font-medium text-blue-600">Total Orders</h4>
            <p className="text-xl sm:text-2xl font-bold">{orderStats.totalOrders}</p>
          </div>
          <div className="p-2 sm:p-4 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200 transition">
            <h4 className="text-xs sm:text-sm font-medium text-green-600">Total Revenue</h4>
            <p className="text-xl sm:text-2xl font-bold">₹{orderStats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="p-2 sm:p-4 bg-purple-100 border border-purple-300 rounded-lg hover:bg-purple-200 transition sm:col-span-2 lg:col-span-1">
            <h4 className="text-xs sm:text-sm font-medium text-purple-600">Average Order Value</h4>
            <p className="text-xl sm:text-2xl font-bold">₹{orderStats.averageOrderValue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Sales Trend */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition duration-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Sales Trend</h3>

          {/* Dropdown to switch range
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
            className="border border-gray-300 rounded-md p-2 text-sm"
            aria-label="Select sales range"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="half-yearly">Half-Yearly</option>
            <option value="yearly">Yearly</option>
          </select> */}
        </div>

        {/* The container height is maintained for better mobile visibility */}
        <div className="w-full min-h-[300px] sm:min-h-[350px] lg:min-h-[400px]">
          <Line data={dynamicChart.data} options={dynamicChart.options} />
        </div>

        {/* --- NEW BUTTON FOR DETAILED ANALYSIS --- */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center sm:justify-end">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out text-sm"
          >
            View Detailed Analysis
          </button>
        </div>

        {/* Modal for Detailed Analysis */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-black opacity-50"
              onClick={() => setIsModalOpen(false)}
            />

            <div
              role="dialog"
              aria-modal="true"
              className="bg-white rounded-lg shadow-lg z-60 max-w-2xl w-full mx-4 p-6 relative"
            >
              <h4 className="text-lg font-semibold mb-4">Detailed Sales Analysis</h4>

              {/* ---- FILTER DROPDOWN ---- */}
              <div className="mb-4">
                <label className="text-sm font-medium">Select Range</label>
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value as any)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half-yearly">Half Yearly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {/* ---- SALES CHART ---- */}
              <div className="w-full min-h-[300px] sm:min-h-[350px] mb-6">
                <Line data={dynamicChart.data} options={dynamicChart.options} />
              </div>

              {/* ---- PEAK MONTH / HOURS ---- */}
              <div className="p-4 bg-gray-50 rounded-lg border mb-4">
                <h5 className="font-semibold text-gray-700 mb-2">Insights</h5>

                <p className="text-sm text-gray-600">
                  📌 <b>Peak Period:</b> {peakPeriod}
                </p>
                {/* <p className="text-sm text-gray-600">
                  🕒 <b>Peak Hour:</b> {peakHour}:00 – {peakHour + 1}:00
                </p> */}
              </div>

              {/* CLOSE BUTTON */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-white p-3 sm:p-6 rounded-lg shadow hover:shadow-md transition duration-300">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <div className="text-center p-2 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="text-xl sm:text-2xl font-bold text-indigo-600">{orders.filter(o => o.status === 'completed').length}</div>
            <div className="text-xs sm:text-sm text-indigo-600">Completed Orders</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</div>
            <div className="text-xs sm:text-sm text-yellow-600">Pending Orders</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
            <div className="text-xl sm:text-2xl font-bold text-red-600">{orders.filter(o => o.status === 'cancelled').length}</div>
            <div className="text-xs sm:text-sm text-red-600">Cancelled Orders</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{orderStats.deliveredOrdersCount}</div>
            <div className="text-xs sm:text-sm text-green-600">Delivered Orders</div>
          </div>
        </div>
      </div>
      {/* Recent Orders */}
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
                  {order.profiles?.name || (order as any).customer_name || 'Unknown Customer'}
                </div>
                <div className="text-xs text-gray-400">
                  {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">₹{order.total?.toFixed(2) || '0.00'}</div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
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







// import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
// import { format, parseISO } from 'date-fns';
// import React, { useEffect, useState } from 'react';
// import { Line } from 'react-chartjs-2';

// // Initialize Chart.js
// ChartJS.register(
//   CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
// );

// interface Order {
//   id: string;
//   created_at: string;
//   status: string;
//   total: number;
//   cancelled_at?: string;
//   order_number?: string;
//   profiles?: { name?: string; email?: string };
//   // other optional fields
// }

// interface SalesAnalyticsProps {
//   orders: Order[];
// }

// const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({ orders }) => {
//   // Calculate sales per month
//   const calculateSalesData = (orders: Order[]) => {
//     const salesByMonth: Record<string, number> = {};
//     orders.forEach(order => {
//       // Ensure created_at is valid before processing
//       if (order.created_at) {
//         const monthKey = format(new Date(order.created_at), 'yyyy-MM');
//         salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + (order.total || 0);
//       }
//     });

//     // Generate last 4 months including current month
//     const months: string[] = [];
//     const current = new Date();
//     for (let i = 3; i >= 0; i--) {
//       const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
//       months.push(format(d, 'yyyy-MM'));
//     }

//     // --- MOBILE IMPROVEMENT: Simplify labels to 'MMM' (e.g., 'Nov') ---
//     const labels = months.map(m => format(parseISO(m + '-01'), 'MMM'));

//     const data = months.map(m => salesByMonth[m] || 0);

//     const peakIndex = data.indexOf(Math.max(...data));

//     return { labels, data, peakIndex };
//   };

//   // Order statistics
//   const calculateOrderStats = (orders: Order[]) => {
//     const totalOrders = orders.length;
//     const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
//     const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

//     const statusCounts = orders.reduce((acc, order) => {
//       acc[order.status] = (acc[order.status] || 0) + 1;
//       return acc;
//     }, {} as Record<string, number>);

//     const deliveredOrdersCount = orders.filter(
//       o => (o.status === 'completed' || o.status === 'delivered') && !o.cancelled_at
//     ).length;
//     return { totalOrders, totalRevenue, averageOrderValue, statusCounts, deliveredOrdersCount };
//   };

//   const salesData = calculateSalesData(orders);
//   const orderStats = calculateOrderStats(orders);

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedRange, setSelectedRange] = useState("monthly");


//   // Basic detailedChart fallback (will re-render when orders change)
//   const detailedChart = {
//     data: {
//       labels: salesData.labels,
//       datasets: [
//         {
//           label: 'Detailed Sales',
//           data: salesData.data,
//           fill: false,
//           borderColor: 'rgb(99,102,241)',
//           tension: 0.2,
//         },
//       ],
//     },
//     options: {
//       responsive: true,
//       maintainAspectRatio: false,
//       plugins: {
//         legend: { display: false },
//       },
//     },
//   };

//   // Peak period derived from salesData
//   const peakPeriod = salesData.labels[salesData.peakIndex] || 'N/A';

//   // Compute peak hour (most orders by hour) as a simple heuristic
//   const peakHour = (() => {
//     const hourCounts: Record<number, number> = {};
//     orders.forEach(o => {
//       if (o.created_at) {
//         const h = new Date(o.created_at).getHours();
//         hourCounts[h] = (hourCounts[h] || 0) + 1;
//       }
//     });
//     let maxH = 0;
//     let maxCount = 0;
//     Object.keys(hourCounts).forEach(k => {
//       const h = Number(k);
//       if (hourCounts[h] > maxCount) {
//         maxCount = hourCounts[h];
//         maxH = h;
//       }
//     });
//     return maxCount > 0 ? maxH : 0;
//   })();

//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === 'Escape') setIsModalOpen(false);
//     };
//     if (isModalOpen) window.addEventListener('keydown', onKey);
//     return () => window.removeEventListener('keydown', onKey);
//   }, [isModalOpen]);

//   const lineChartData = {
//     labels: salesData.labels,
//     datasets: [
//       {
//         label: 'Monthly Sales',
//         data: salesData.data,
//         fill: false,
//         borderColor: 'rgb(75, 192, 192)',
//         tension: 0.2,
//         pointBackgroundColor: salesData.data.map((_, i) =>
//           i === salesData.peakIndex ? 'rgb(255, 99, 132)' : 'rgb(75, 192, 192)'
//         ),
//         pointRadius: salesData.data.map((_, i) => (i === salesData.peakIndex ? 7 : 4)),
//       },
//     ],
//   };

//   // --- MOBILE IMPROVEMENT: Updated Chart Options ---
//   const lineChartOptions = {
//     responsive: true,
//     maintainAspectRatio: false, // Allows chart to respect container height
//     plugins: {
//       legend: {
//         position: 'top' as const,
//         labels: {
//           font: { size: 10 }, // Smaller font for legend
//         }
//       },
//       title: {
//         display: true,
//         text: 'Monthly Sales Trend',
//         font: { size: 14 } // Smaller font for title
//       },
//       tooltip: {
//         callbacks: {
//           label: function (context: any) {
//             return `₹${context.raw.toFixed(2)}`;
//           }
//         }
//       }
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         ticks: {
//           font: { size: 10 }, // Smaller font for Y-axis numbers
//         },
//       },
//       x: {
//         ticks: {
//           font: { size: 10 }, // Smaller font for X-axis labels
//           maxRotation: 45, // Rotate labels by 45 degrees
//           minRotation: 45,
//         },
//       }
//     },
//   };
//   // --- END OF UPDATED CHART OPTIONS ---

//   return (
//     <div className="space-y-4 sm:space-y-6">
//       {/* Sales Overview */}
//       <div className="bg-white p-3 sm:p-6 rounded-lg shadow hover:shadow-md transition duration-300">
//         <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Sales Overview</h3>
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
//           <div className="p-2 sm:p-4 rounded-lg bg-blue-100 border border-blue-300 hover:bg-blue-200 transition">
//             <h4 className="text-xs sm:text-sm font-medium text-blue-600">Total Orders</h4>
//             <p className="text-xl sm:text-2xl font-bold">{orderStats.totalOrders}</p>
//           </div>
//           <div className="p-2 sm:p-4 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200 transition">
//             <h4 className="text-xs sm:text-sm font-medium text-green-600">Total Revenue</h4>
//             <p className="text-xl sm:text-2xl font-bold">₹{orderStats.totalRevenue.toFixed(2)}</p>
//           </div>
//           <div className="p-2 sm:p-4 bg-purple-100 border border-purple-300 rounded-lg hover:bg-purple-200 transition sm:col-span-2 lg:col-span-1">
//             <h4 className="text-xs sm:text-sm font-medium text-purple-600">Average Order Value</h4>
//             <p className="text-xl sm:text-2xl font-bold">₹{orderStats.averageOrderValue.toFixed(2)}</p>
//           </div>
//         </div>
//       </div>



//       {/* Sales Trend */}
//       <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition duration-300">
//         <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
//         {/* The container height is maintained for better mobile visibility */}
//         <div className="w-full min-h-[300px] sm:min-h-[350px] lg:min-h-[400px]">
//           <Line data={lineChartData} options={lineChartOptions} />
//         </div>

//         {/* --- NEW BUTTON FOR DETAILED ANALYSIS --- */}
//         <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center sm:justify-end">
//           <button
//             type="button"
//             onClick={() => setIsModalOpen(true)}
//             className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out text-sm"
//           >
//             View Detailed Analysis
//           </button>
//         </div>

//         {/* Modal for Detailed Analysis */}
//         {isModalOpen && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center">
//             <div
//               className="fixed inset-0 bg-black opacity-50"
//               onClick={() => setIsModalOpen(false)}
//             />

//             <div
//               role="dialog"
//               aria-modal="true"
//               className="bg-white rounded-lg shadow-lg z-60 max-w-2xl w-full mx-4 p-6 relative"
//             >
//               <h4 className="text-lg font-semibold mb-4">Detailed Sales Analysis</h4>

//               {/* ---- FILTER DROPDOWN ---- */}
//               <div className="mb-4">
//                 <label className="text-sm font-medium">Select Range</label>
//                 <select
//                   value={selectedRange}
//                   onChange={(e) => setSelectedRange(e.target.value)}
//                   className="w-full mt-1 p-2 border border-gray-300 rounded-md"
//                 >
//                   <option value="monthly">Monthly</option>
//                   <option value="quarterly">Quarterly</option>
//                   <option value="half-yearly">Half Yearly</option>
//                   <option value="yearly">Yearly</option>
//                 </select>
//               </div>

//               {/* ---- SALES CHART ---- */}
//               <div className="w-full min-h-[300px] sm:min-h-[350px] mb-6">
//                 <Line data={detailedChart.data} options={detailedChart.options} />
//               </div>

//               {/* ---- PEAK MONTH / HOURS ---- */}
//               <div className="p-4 bg-gray-50 rounded-lg border mb-4">
//                 <h5 className="font-semibold text-gray-700 mb-2">Insights</h5>

//                 <p className="text-sm text-gray-600">
//                   📌 <b>Peak Period:</b> {peakPeriod}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   🕒 <b>Peak Hour:</b> {peakHour}:00 – {peakHour + 1}:00
//                 </p>
//               </div>

//               {/* CLOSE BUTTON */}
//               <div className="flex justify-end mt-4">
//                 <button
//                   onClick={() => setIsModalOpen(false)}
//                   className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>



//       {/* Quick Stats */}
//       <div className="bg-white p-3 sm:p-6 rounded-lg shadow hover:shadow-md transition duration-300">
//         <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Stats</h3>
//         <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
//           <div className="text-center p-2 bg-indigo-50 rounded-lg border border-indigo-200">
//             <div className="text-xl sm:text-2xl font-bold text-indigo-600">{orders.filter(o => o.status === 'completed').length}</div>
//             <div className="text-xs sm:text-sm text-indigo-600">Completed Orders</div>
//           </div>
//           <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
//             <div className="text-xl sm:text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</div>
//             <div className="text-xs sm:text-sm text-yellow-600">Pending Orders</div>
//           </div>
//           <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
//             <div className="text-xl sm:text-2xl font-bold text-red-600">{orders.filter(o => o.status === 'cancelled').length}</div>
//             <div className="text-xs sm:text-sm text-red-600">Cancelled Orders</div>
//           </div>
//           <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
//             <div className="text-xl sm:text-2xl font-bold text-green-600">{orderStats.deliveredOrdersCount}</div>
//             <div className="text-xs sm:text-sm text-green-600">Delivered Orders</div>
//           </div>
//         </div>
//       </div>
//       {/* Recent Orders */}
//       <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition duration-300">
//         <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
//         <div className="space-y-2">
//           {orders.slice(0, 5).map((order) => (
//             <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
//               <div className="flex-1">
//                 <div className="font-medium text-sm">
//                   Order #{order.order_number || order.id.slice(0, 8)}
//                 </div>
//                 <div className="text-xs text-gray-500">
//                   {order.profiles?.name || (order as any).customer_name || 'Unknown Customer'}
//                 </div>
//                 <div className="text-xs text-gray-400">
//                   {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
//                 </div>
//               </div>
//               <div className="text-right">
//                 <div className="font-semibold">₹{order.total?.toFixed(2) || '0.00'}</div>
//                 <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
//                   order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
//                     order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
//                       'bg-gray-100 text-gray-800'
//                   }`}>
//                   {order.status}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//         {orders.length === 0 && (
//           <div className="text-center py-8 text-gray-500">
//             No orders found to display analytics.
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SalesAnalytics;