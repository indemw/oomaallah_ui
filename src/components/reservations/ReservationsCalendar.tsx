import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
//import { supabase } from "@/integrations/supabase/client";
import ReservationService from "@/service/ReservationService";
import { addDays, eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";

export default function ReservationsCalendar() {
  const reservationService= new ReservationService();
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));

  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  const { data, isLoading } = useQuery({
    queryKey: ["reservations", "calendar", month.toISOString()],
    queryFn: async () => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
     
      const { data, error } = await reservationService.getMonthlyReservation({date:month});
        /*.from("reservations")
        .select("id, check_in_date, check_out_date, room_id")
        .lte("check_in_date", toISO(end))
        .gte("check_out_date", toISO(start));*/
      if (error) throw error;
      return data as { id: string; check_in_date: string; check_out_date: string; room_id: string | null }[];
    },
  });

  const days = useMemo(() => eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }), [month]);

  const occupancy = useMemo(() => {
    const counts: Record<string, number> = {};
    (data || []).forEach((r) => {
      const start = new Date(r.check_in_date);
      const end = new Date(r.check_out_date);
      const inclusiveEnd = addDays(end, -1); // checkout day not occupied
      eachDayOfInterval({ start, end: inclusiveEnd }).forEach((d) => {
        const key = d.toISOString().slice(0,10);
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return counts;
  }, [data]);

  const { data: rooms } = useQuery({
    queryKey: ["rooms", "count"],
    queryFn: async () => {
      const { data, error } = await reservationService.getRoomsCount();//supabase.from("rooms").select("id", { count: "exact", head: true });
      if (error) throw error;
      // supabase-js doesn't return count when selecting head:true; workaround by second select count(*)
      const { count } = await reservationService.getRoomsCount();//from("rooms").select("id", { count: "exact" });
      return count || 0;
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-hotel-primary">Calendar</h3>
        <div className="space-x-2">
          <button className="px-3 py-1 rounded border" onClick={() => setMonth(addDays(startOfMonth(month), -1))}>Prev</button>
          <span className="text-sm text-muted-foreground">{format(month, 'MMMM yyyy')}</span>
          <button className="px-3 py-1 rounded border" onClick={() => setMonth(addDays(endOfMonth(month), 1))}>Next</button>
        </div>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {days.map((d) => {
            const key = d.toISOString().slice(0,10);
            const count = occupancy[key] || 0;
            const capacity = rooms || 0;
            const pct = capacity ? Math.min(100, Math.round((count / capacity) * 100)) : 0;
            return (
              <div key={key} className="p-3 rounded border bg-gradient-card">
                <div className="text-sm font-medium">{format(d, 'd MMM')}</div>
                <div className="text-xs text-muted-foreground">{count}/{capacity} rooms</div>
                <div className="w-full h-1 mt-2 bg-muted-foreground/20 rounded">
                  <div className="h-1 rounded bg-hotel-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
