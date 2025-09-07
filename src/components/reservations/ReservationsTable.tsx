import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import ReservationForm, { Reservation } from "./ReservationForm";
import { useToast } from "@/hooks/use-toast";
import ReservationService from "@/service/ReservationService";
export default function ReservationsTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);
const reservationService=new ReservationService();
  const { data, isLoading } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const { data, error } = await reservationService.getReservations();
       /* .from("reservations")
        .select("id,reservation_number,guest_name,check_in_date,check_out_date,adults,children,status,rate,currency,room_type_id,room_id, room_types:room_type_id(id,name,code), rooms:room_id(id,room_number)")
        .order("check_in_date", { ascending: false });*/
      if (error) throw error;
      return data as any[];
    },
  });

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["reservations"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reservation?")) return;
    const { error } = await  reservationService.deleteReservation(id)//supabase.from("reservations").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-hotel-primary">Bookings</h3>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>New Booking</Button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No.</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.reservation_number}</TableCell>
                  <TableCell>{r.guest_name}</TableCell>
                  <TableCell>{r.check_in_date} → {r.check_out_date}</TableCell>
                  <TableCell>{r.room_type ? `${r.room_type.name} (${r.room_type.code})` : '-'}</TableCell>
                  <TableCell>{r.room?.room_number || '-'}</TableCell>
                  <TableCell className="capitalize">{r.status}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditing({ ...r }); setOpen(true); }}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(r.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ReservationForm open={open} onOpenChange={setOpen} initial={editing || undefined} onSuccess={onSuccess} />
    </div>
  );
}
