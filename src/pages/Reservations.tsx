import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoomTypesTable from "@/components/reservations/RoomTypesTable";
import RoomsTable from "@/components/reservations/RoomsTable";
import ReservationsTable from "@/components/reservations/ReservationsTable";
import AllocationBoard from "@/components/reservations/AllocationBoard";
import ReservationsCalendar from "@/components/reservations/ReservationsCalendar";

const setSEO = (title: string, description: string, path: string) => {
  document.title = title;
  const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
  meta.setAttribute("name", "description");
  meta.setAttribute("content", description);
  document.head.appendChild(meta);
  const link = document.querySelector('link[rel="canonical"]') || document.createElement("link");
  link.setAttribute("rel", "canonical");
  link.setAttribute("href", `${window.location.origin}${path}`);
  document.head.appendChild(link);
};

export default function Reservations() {
  const [enabled, setEnabled] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setSEO("Reservations | Oomaallah Hotel", "Manage room reservations and calendar.", "/reservations");
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'modules')
      .maybeSingle()
      .then(({ data }) => {
        setEnabled(Boolean((data?.value as any)?.reservations ?? true));
        setChecked(true);
      });
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-hotel-primary">Reservations</h1>
        <p className="text-muted-foreground">Room bookings, allocation control, and calendar view.</p>
      </header>
      {!checked ? (
        <p>Loading...</p>
      ) : !enabled ? (
        <section className="p-6 border rounded-lg bg-gradient-card">
          <h2 className="text-xl font-semibold text-hotel-primary">Module disabled</h2>
          <p className="text-muted-foreground">Ask an administrator to enable Reservations in Settings.</p>
        </section>
      ) : (
        <section className="p-2">
          <Tabs defaultValue="room-setup">
            <TabsList>
              <TabsTrigger value="room-setup">Room Setup</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="allocation">Allocation</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>
            <TabsContent value="room-setup" className="space-y-6 mt-4">
              <div className="grid grid-cols-1 gap-6">
                <RoomTypesTable />
                <RoomsTable />
              </div>
            </TabsContent>
            <TabsContent value="bookings" className="mt-4">
              <ReservationsTable />
            </TabsContent>
            <TabsContent value="allocation" className="mt-4">
              <AllocationBoard />
            </TabsContent>
            <TabsContent value="calendar" className="mt-4">
              <ReservationsCalendar />
            </TabsContent>
          </Tabs>
        </section>
      )}
    </div>
  );
}
