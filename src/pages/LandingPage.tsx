import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ShieldCheck,
  Users,
  Box,
  Truck,
  BarChart2,
  Archive,
  Zap,
  Clock,
  ArrowRight,
  CheckCircle,
  Settings,
  PieChart,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <div className="pt-24 pb-16 px-6 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-2xl">
              <Building2 size={56} className="text-red-600" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            SCR Admin Panel
          </h1>
          
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Built for ops teams — track orders, manage stock, control roles & permissions,
            and monitor performance from a single, secure dashboard.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="bg-red-600 hover:bg-red-700 px-8 text-white">
              <Link to="/auth" className="flex items-center">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="px-8 border-slate-300 text-slate-700">
              <Link to="/about" className="flex items-center">
                Learn More
                <Settings className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FeatureCard 
            icon={<Truck className="h-6 w-6" />}
            title="Order Tracking"
            description="Follow orders from placement to delivery with timestamps and status updates."
            features={["Real-time tracking", "Status updates", "Delivery management"]}
          />
          
          <FeatureCard 
            icon={<Box className="h-6 w-6" />}
            title="Stock & Inventory"
            description="Monitor stock levels, low-stock alerts, and bulk updates."
            features={["Live inventory", "Stock alerts", "Bulk operations"]}
          />
          
          <FeatureCard 
            icon={<BarChart2 className="h-6 w-6" />}
            title="Analytics & Reports"
            description="Sales insights, trend charts, and exportable reports."
            features={["Sales analytics", "Trend charts", "Export reports"]}
          />
          
          <FeatureCard 
            icon={<Archive className="h-6 w-6" />}
            title="Orders Archive"
            description="Searchable order history with filters and export options."
            features={["Order history", "Advanced filters", "Data export"]}
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Designed for Scale
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Integrates with your existing systems — payments, shipping, and inventory providers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              icon={<Clock className="h-5 w-5" />}
              label="Active Orders"
              value="1,248"
              description="Currently processing"
              trend="+12% this week"
              trendColor="text-green-600"
            />
            
            <StatCard 
              icon={<Box className="h-5 w-5" />}
              label="Products"
              value="4,320"
              description="In catalog"
              trend="+5% this month"
              trendColor="text-green-600"
            />
            
            <StatCard 
              icon={<Zap className="h-5 w-5" />}
              label="Low Stock"
              value="27"
              description="Need restocking"
              trend="Attention needed"
              trendColor="text-red-600"
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="text-center">
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <div className="bg-red-100 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <PieChart className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Ready to Optimize Your Operations?
            </h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Want the admin UX tailored for your business? Contact us to configure roles, workflows, and integrations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-red-600 hover:bg-red-700 text-white">
                <Link to="/auth" className="flex items-center">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  features 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  features: string[];
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start space-x-4">
        <div className="bg-red-100 p-3 rounded-lg group-hover:bg-red-200 transition-colors">
          <div className="text-red-600">{icon}</div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 text-lg mb-2">{title}</h3>
          <p className="text-slate-600 text-sm mb-4">{description}</p>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm text-slate-500">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  description, 
  trend,
  trendColor = "text-slate-600"
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  description: string;
  trend: string;
  trendColor?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 text-center hover:shadow-md transition-shadow">
      <div className="flex justify-center mb-4">
        <div className="bg-slate-100 p-3 rounded-lg">
          <div className="text-slate-600">{icon}</div>
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="font-medium text-slate-700 mb-2">{label}</div>
      <div className="text-sm text-slate-500 mb-2">{description}</div>
      <div className={`text-xs ${trendColor} font-medium`}>{trend}</div>
    </div>
  );
}