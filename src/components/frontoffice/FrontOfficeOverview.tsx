import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/StatsCard";
import { DoorOpen, DoorClosed, Users, Percent } from "lucide-react";
import { format } from "date-fns";

export default function FrontOfficeOverview() {
  const todayISO = new Date().toISOString().slice(0, 10);

  const { data: arrivals } = useQuery({
    queryKey: ["fo", "arrivals", todayISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id")
        .eq("check_in_date", todayISO);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: departures } = useQuery({
    queryKey: ["fo", "departures", todayISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id")
        .eq("check_out_date", todayISO);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: inHouse } = useQuery({
    queryKey: ["fo", "inhouse"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id")
        .eq("status", "checked_in");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: rooms } = useQuery({
    queryKey: ["fo", "rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("id");
      if (error) throw error;
      return data || [];
    },
  });

  const occupancyRate = useMemo(() => {
    const total = rooms?.length || 0;
    const occupied = inHouse?.length || 0;
    if (!total) return 0;
    return Math.round((occupied / total) * 100);
  }, [rooms, inHouse]);

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        title={`Arrivals (${format(new Date(), 'MMM d')})`}
        value={arrivals?.length || 0}
        description="Guests due to check in today"
        icon={DoorOpen}
        variant="accent"
      />
      <StatsCard
        title={`Departures (${format(new Date(), 'MMM d')})`}
        value={departures?.length || 0}
        description="Guests checking out today"
        icon={DoorClosed}
        variant="warning"
      />
      <StatsCard
        title="In-house guests"
        value={inHouse?.length || 0}
        description="Currently checked in"
        icon={Users}
        variant="success"
      />
      <StatsCard
        title="Occupancy"
        value={`${occupancyRate}%`}
        description={`${inHouse?.length || 0} of ${rooms?.length || 0} rooms occupied`}
        icon={Percent}
      />
    </section>
  );
}
