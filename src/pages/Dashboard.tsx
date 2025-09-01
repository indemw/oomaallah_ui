import { useEffect, useState } from "react";
import { HotelNavigation } from "@/components/HotelNavigation";
import { StatsCard } from "@/components/StatsCard";
import { ModuleCard } from "@/components/ModuleCard";
import { DashboardCharts } from "@/components/DashboardCharts";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Package,
  Coffee,
  BedDouble,
  ClipboardList,
  BarChart3,
  Calculator,
  Presentation,
  Settings as SettingsIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  todayRevenue: number;
  totalRooms: number;
  occupiedRooms: number;
  totalGuests: number;
  pendingOrders: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    totalGuests: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's revenue from POS orders and bills
      const { data: todayOrders } = await supabase
        .from('pos_orders')
        .select('total_amount')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}T00:00:00.000Z`);
      
      const todayRevenue = todayOrders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0;

      // Get room statistics
      const { data: rooms } = await supabase
        .from('rooms')
        .select('id, status')
        .eq('active', true);
      
      const totalRooms = rooms?.length || 0;
      const occupiedRooms = rooms?.filter(room => room.status === 'occupied').length || 0;

      // Get active guests (current reservations)
      const { data: activeReservations } = await supabase
        .from('reservations')
        .select('adults, children')
        .eq('status', 'checked_in')
        .lte('check_in_date', today)
        .gte('check_out_date', today);
      
      const totalGuests = activeReservations?.reduce((sum, res) => sum + (res.adults || 0) + (res.children || 0), 0) || 0;

      // Get pending orders count
      const { data: pendingOrdersData } = await supabase
        .from('pos_orders')
        .select('id')
        .in('status', ['open', 'preparing']);
      
      const pendingOrders = pendingOrdersData?.length || 0;

      setStats({
        todayRevenue,
        totalRooms,
        occupiedRooms,
        totalGuests,
        pendingOrders
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const routeFor = (title: string) => {
    switch (title) {
      case "Stock Management":
        return "/stock";
      case "Back Office":
      case "Accounting":
        return "/accounting";
      case "User Management":
        return "/users";
      case "Settings":
        return "/settings";
      case "Reservations":
        return "/reservations";
      case "Bar & Restaurant":
        return "/restaurant";
      case "Front Office":
        return "/front-office";
      case "Conference Facilities":
        return "/conference";
      default:
        return "/dashboard";
    }
  };
  const modules = [
    {
      title: "Bar & Restaurant",
      description: "POS, KOT/BOT, Table Management, Billing",
      icon: Coffee,
      features: [
        "Order Management (KOT/BOT)",
        "Table & Waiter Assignment", 
        "Billing: Merge, Split, Void",
        "Receipt Printing",
        "Shift Summaries",
        "Sales Reports"
      ]
    },
    {
      title: "Reservations",
      description: "Room Bookings, Allocation Control, Calendar View",
      icon: Calendar,
      features: [
        "Room Bookings (Single & Group)",
        "Prevent Overbooking",
        "Booking Calendar View",
        "Cancellations & No-shows",
        "Source-based Reports"
      ]
    },
    {
      title: "Front Office",
      description: "Check-in/out, Guest Management, Invoicing",
      icon: BedDouble,
      features: [
        "Check-in/out Management",
        "Guest Deposits & Accounts",
        "Room Status Management",
        "Multi-room Trip Groups",
        "Night Audit Reports"
      ]
    },
    {
      title: "Stock Management",
      description: "Procurement, Inventory, Stock Control",
      icon: Package,
      features: [
        "Procurement & LPOs",
        "Stock Transfers & Issuing",
        "Multi-store Management",
        "Reorder Alerts",
        "Consumption Reports"
      ]
    },
    {
      title: "Conference Facilities",
      description: "Conference Room Bookings, Event Management",
      icon: Presentation,
      features: [
        "Conference Room Reservations",
        "A/V Equipment Management",
        "Event Scheduling",
        "Catering Integration",
        "Equipment Reports"
      ]
    },
    {
      title: "Back Office",
      description: "Financial Reporting, Audit Trail, Analytics",
      icon: Calculator,
      features: [
        "Consolidated Reports",
        "Daily Sales Posting",
        "Audit Trail & Logs",
        "Export to Accounting",
        "Tax & Levy Settings"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <HotelNavigation />
      
      <main className="container mx-auto p-6 space-y-8">
        {/* Dashboard Overview */}
        <div className="space-y-4">
          <div>
            <h2 className="text-3xl font-bold text-hotel-primary">Dashboard Overview</h2>
            <p className="text-muted-foreground">Welcome to Oomaallah Hotel - Your complete hospitality management solution</p>
          </div>
          
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Today's Revenue"
              value={loading ? "Loading..." : `MWK ${stats.todayRevenue.toLocaleString()}`}
              description="Restaurant + Rooms"
              icon={DollarSign}
              trend="up"
              trendValue="12%"
              variant="accent"
            />
            <StatsCard
              title="Room Occupancy"
              value={loading ? "Loading..." : `${stats.totalRooms > 0 ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0}%`}
              description={loading ? "..." : `${stats.occupiedRooms} of ${stats.totalRooms} rooms`}
              icon={BedDouble}
              trend="up"
              trendValue="5%"
              variant="success"
            />
            <StatsCard
              title="Active Guests"
              value={loading ? "Loading..." : stats.totalGuests.toString()}
              description="Checked-in guests"
              icon={Users}
              variant="default"
            />
            <StatsCard
              title="Pending Orders"
              value={loading ? "Loading..." : stats.pendingOrders.toString()}
              description="Restaurant orders"
              icon={ClipboardList}
              trend="down"
              trendValue="3"
              variant="warning"
            />
          </div>
        </div>

        {/* Charts */}
        <DashboardCharts />

        {/* Modules Grid */}
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-hotel-primary">System Modules</h3>
            <p className="text-muted-foreground">Access different areas of your hospitality management system</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...modules,
              { title: "User Management", description: "Manage staff profiles and roles", icon: Users, features: ["View users","Assign roles","Update profiles"] },
              { title: "Settings", description: "Configure system preferences", icon: SettingsIcon, features: ["Hotel info","Email","Branding"] }
            ].map((module, index) => (
              <ModuleCard
                key={index}
                title={module.title}
                description={module.description}
                icon={module.icon}
                features={module.features}
                onClick={() => navigate(routeFor(module.title))}
                variant={index === 0 ? "accent" : index === 1 ? "secondary" : "primary"}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-card rounded-lg border p-6 shadow-hotel">
          <h3 className="text-xl font-semibold text-hotel-primary mb-4">Quick Actions</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-hotel-success/10 border border-hotel-success/20">
              <BedDouble className="h-5 w-5 text-hotel-success" />
              <span className="text-sm font-medium">New Check-in</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-hotel-accent/10 border border-hotel-accent/20">
              <Coffee className="h-5 w-5 text-hotel-accent" />
              <span className="text-sm font-medium">Take Order</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-hotel-info/10 border border-hotel-info/20">
              <BarChart3 className="h-5 w-5 text-hotel-info" />
              <span className="text-sm font-medium">View Reports</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;