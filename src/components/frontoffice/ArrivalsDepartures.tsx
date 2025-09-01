import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CheckInForm from "./CheckInForm";

export default function ArrivalsDepartures() {
  const todayISO = new Date().toISOString().slice(0, 10);
  const [checkInFormOpen, setCheckInFormOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);

  const { data: arrivals, isLoading: la } = useQuery({
    queryKey: ["fo", "arrivals-list", todayISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, guest_name, check_in_date, status, room_types:room_type_id(name,code), rooms:room_id(room_number)")
        .eq("check_in_date", todayISO)
        .order("guest_name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: departures, isLoading: ld } = useQuery({
    queryKey: ["fo", "departures-list", todayISO],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, guest_name, check_out_date, status, room_types:room_type_id(name,code), rooms:room_id(room_number)")
        .eq("check_out_date", todayISO)
        .order("guest_name");
      if (error) throw error;
      return data || [];
    },
  });

  const handleCheckIn = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    setCheckInFormOpen(true);
  };
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-hotel-primary">Today's Arrivals & Departures</h2>
        <NavLink to="/reservations">
          <Button variant="outline">Manage Bookings</Button>
        </NavLink>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b font-medium">Arrivals</div>
          {la ? (
            <p className="p-4 text-muted-foreground">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arrivals?.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.guest_name}</TableCell>
                    <TableCell>{r.room_types ? `${r.room_types.name} (${r.room_types.code})` : '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === 'checked_in' 
                          ? 'bg-green-100 text-green-800' 
                          : r.status === 'booked'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {r.status === 'booked' ? (
                        <Button 
                          size="sm" 
                          onClick={() => handleCheckIn(r.id)}
                          className="bg-hotel-success hover:bg-hotel-success/90"
                        >
                          Check In
                        </Button>
                      ) : r.status === 'checked_in' ? (
                        <span className="text-sm text-muted-foreground">
                          Room {r.rooms?.room_number || 'TBA'}
                        </span>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          {r.status}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {arrivals?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No arrivals today</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-2 border-b font-medium">Departures</div>
          {ld ? (
            <p className="p-4 text-muted-foreground">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departures?.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.guest_name}</TableCell>
                    <TableCell>{r.room_types ? `${r.room_types.name} (${r.room_types.code})` : '-'}</TableCell>
                    <TableCell>{r.rooms?.room_number || 'TBA'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === 'checked_out' 
                          ? 'bg-gray-100 text-gray-800' 
                          : r.status === 'checked_in'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {r.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {departures?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No departures today</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <CheckInForm
        open={checkInFormOpen}
        onOpenChange={setCheckInFormOpen}
        reservationId={selectedReservationId}
      />
    </section>
  );
}
