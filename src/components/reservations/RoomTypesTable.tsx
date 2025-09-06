import { useQuery, useQueryClient } from "@tanstack/react-query";
//import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import RoomTypeForm, { RoomType } from "./RoomTypeForm";
import { useToast } from "@/hooks/use-toast";
import ReservationService from "@/service/ReservationService";
export default function RoomTypesTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const reservationService=new ReservationService();

  const { data, isLoading } = useQuery({
    queryKey: ["room_types"],
    queryFn: async () => {
      const { data, error } = await reservationService.getRoomTypes();//get room types;
      if (error) throw error;
      return data as RoomType[];
    },
  });

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["room_types"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this room type?")) return;
    const { error } = await  reservationService.deleteRoomType(id)//delete;
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
        <h3 className="text-xl font-semibold text-hotel-primary">Room Types</h3>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>New Room Type</Button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Base Rate</TableHead>
                <TableHead>Amenities</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((rt) => (
                <TableRow key={rt.id}>
                  <TableCell>{rt.name}</TableCell>
                  <TableCell>{rt.code}</TableCell>
                  <TableCell>{rt.capacity}</TableCell>
                  <TableCell>{rt.currency} {Number(rt.base_rate).toLocaleString()}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{rt.amenities}</TableCell>
                  <TableCell>{rt.active ? "Active" : "Inactive"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditing(rt); setOpen(true); }}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(rt.id!)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RoomTypeForm open={open} onOpenChange={setOpen} initial={editing || undefined} onSuccess={onSuccess} />
    </div>
  );
}
