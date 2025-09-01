import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface WeeklyData {
  name: string;
  restaurant: number;
  rooms: number;
}

interface OccupancyData {
  name: string;
  value: number;
  color: string;
}

export function DashboardCharts() {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([
    { name: "Occupied", value: 0, color: "hsl(var(--hotel-success))" },
    { name: "Reserved", value: 0, color: "hsl(var(--hotel-accent))" },
    { name: "Available", value: 100, color: "hsl(var(--muted))" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      // Get last 7 days data
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const weeklyDataArray: WeeklyData[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = days[date.getDay()];

        // Get restaurant revenue for this day
        const { data: restaurantOrders } = await supabase
          .from('pos_orders')
          .select('total_amount')
          .gte('created_at', `${dateStr}T00:00:00.000Z`)
          .lt('created_at', `${dateStr}T23:59:59.999Z`);

        const restaurantRevenue = restaurantOrders?.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) || 0;

        // Get room revenue for this day (from reservations)
        const { data: reservations } = await supabase
          .from('reservations')
          .select('rate')
          .eq('check_in_date', dateStr)
          .eq('status', 'checked_in');

        const roomRevenue = reservations?.reduce((sum, res) => sum + Number(res.rate || 0), 0) || 0;

        weeklyDataArray.push({
          name: dayName,
          restaurant: Math.round(restaurantRevenue),
          rooms: Math.round(roomRevenue)
        });
      }

      setWeeklyData(weeklyDataArray);

      // Get current room occupancy data
      const { data: rooms } = await supabase
        .from('rooms')
        .select('status')
        .eq('active', true);

      const totalRooms = rooms?.length || 1;
      const occupiedRooms = rooms?.filter(room => room.status === 'occupied').length || 0;
      const reservedRooms = rooms?.filter(room => room.status === 'reserved').length || 0;
      const availableRooms = totalRooms - occupiedRooms - reservedRooms;

      const occupiedPercentage = Math.round((occupiedRooms / totalRooms) * 100);
      const reservedPercentage = Math.round((reservedRooms / totalRooms) * 100);
      const availablePercentage = Math.round((availableRooms / totalRooms) * 100);

      setOccupancyData([
        { name: "Occupied", value: occupiedPercentage, color: "hsl(var(--hotel-success))" },
        { name: "Reserved", value: reservedPercentage, color: "hsl(var(--hotel-accent))" },
        { name: "Available", value: availablePercentage, color: "hsl(var(--muted))" },
      ]);

    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-hotel animate-fade-in">
          <CardHeader>
            <CardTitle>Weekly Revenue</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Loading chart data...</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-hotel animate-fade-in">
          <CardHeader>
            <CardTitle>Room Occupancy</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Loading chart data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-hotel animate-fade-in">
        <CardHeader>
          <CardTitle>Weekly Revenue</CardTitle>
          <CardDescription>Restaurant vs Room Sales (Last 7 Days)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`MWK ${value.toLocaleString()}`, '']}
                labelFormatter={(label) => `Day: ${label}`}
              />
              <Bar dataKey="restaurant" fill="hsl(var(--hotel-accent))" name="Restaurant" />
              <Bar dataKey="rooms" fill="hsl(var(--hotel-primary))" name="Rooms" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-hotel animate-fade-in">
        <CardHeader>
          <CardTitle>Room Occupancy</CardTitle>
          <CardDescription>Current occupancy distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {occupancyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-4">
            {occupancyData.map((entry, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-muted-foreground">
                  {entry.name}: {entry.value}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}