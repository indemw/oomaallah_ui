import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import CheckInForm from "@/components/frontoffice/CheckInForm";

export default function AllocationBoard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checkInFormOpen, setCheckInFormOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["allocations", "unassigned"],
    queryFn: async () => {
      const today = new Date();
      const toISO = (d: Date) => d.toISOString().slice(0, 10);
      const next = new Date(today);
      next.setDate(today.getDate() + 30);
      const { data, error } = await supabase
        .from("reservations")
        .select("id, guest_name, check_in_date, check_out_date, room_type_id, room_id, room_types:room_type_id(id,name,code), rooms:room_id(id,room_number)")
        .is("room_id", null)
        .gte("check_in_date", toISO(today))
        .lte("check_in_date", toISO(next))
        .order("check_in_date", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: rooms } = useQuery({
    queryKey: ["allocations", "rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("id, room_number, active, room_type_id").eq("active", true).order("room_number");
      if (error) throw error;
      return data as any[];
    },
  });

  const roomsByType = useMemo(() => {
    const map: Record<string, { id: string; room_number: string }[]> = {};
    (rooms || []).forEach((r: any) => {
      map[r.room_type_id] = map[r.room_type_id] || [];
      map[r.room_type_id].push({ id: r.id, room_number: r.room_number });
    });
    return map;
  }, [rooms]);

  const assign = async (reservationId: string, roomId: string) => {
    const { error } = await supabase.from("reservations").update({ room_id: roomId }).eq("id", reservationId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Assigned" });
      queryClient.invalidateQueries({ queryKey: ["allocations", "unassigned"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    }
  };

  const handleCheckIn = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    setCheckInFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-hotel-primary">Allocation Control</h3>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Assign to Room</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations?.map((r) => {
                const list = roomsByType[r.room_type_id] || [];
                return (
                  <TableRow key={r.id}>
                    <TableCell>{r.guest_name}</TableCell>
                    <TableCell>{r.check_in_date} → {r.check_out_date}</TableCell>
                    <TableCell>{r.room_types ? `${r.room_types.name} (${r.room_types.code})` : '-'}</TableCell>
                    <TableCell>
                      <Select onValueChange={(v) => assign(r.id, v)}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder={list.length ? "Select room" : "No rooms"} />
                        </SelectTrigger>
                        <SelectContent>
                          {list.map((room) => (
                            <SelectItem key={room.id} value={room.id}>{room.room_number}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleCheckIn(r.id)}
                          className="bg-hotel-success hover:bg-hotel-success/90 text-white"
                        >
                          Check In
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.alert("Use Bookings tab to edit details.")}
                        >
                          Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      
      <CheckInForm
        open={checkInFormOpen}
        onOpenChange={setCheckInFormOpen}
        reservationId={selectedReservationId}
      />
    </div>
  );
}
