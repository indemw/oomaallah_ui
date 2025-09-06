import { useQuery, useQueryClient } from "@tanstack/react-query";
//import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import RoomForm, { Room } from "./RoomForm";
import { useToast } from "@/hooks/use-toast";
import RoomService from "@/service/RoomService";
export default function RoomsTable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);

const roomService=new RoomService();
  const { data, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await roomService.getRooms();
       /* .from("rooms")
        .select("id, room_number, floor, status, active, room_types:room_type_id(id,name,code)")
        .order("room_number", { ascending: true });*/
      if (error) throw error;
      return data as any[];
    },
  });

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this room?")) return;
    const { error } = await  roomService.deleteRoom(id)//supabase.from("rooms").delete().eq("id", id);
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
        <h3 className="text-xl font-semibold text-hotel-primary">Rooms</h3>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>New Room</Button>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.room_number}</TableCell>
                  <TableCell>{r.room_type?.name} ({r.room_type?.code})</TableCell>
                  <TableCell>{r.floor || "-"}</TableCell>
                  <TableCell className="capitalize">{r.status}</TableCell>
                  <TableCell>{r.active ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditing({ ...r, room_type_id: r.room_type?.id }); setOpen(true); }}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(r.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RoomForm open={open} onOpenChange={setOpen} initial={editing || undefined} onSuccess={onSuccess} />
    </div>
  );
}
