import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Room {
  id?: string;
  room_number: string;
  room_type_id: string;
  floor?: string | null;
  status: "vacant" | "occupied" | "oos";
  active: boolean;
  notes?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<Room> | null;
  onSuccess?: () => void;
}

interface RoomTypeOption { id: string; name: string; code: string }

export default function RoomForm({ open, onOpenChange, initial, onSuccess }: Props) {
  const isEdit = Boolean(initial?.id);
  const { toast } = useToast();

  const [roomTypes, setRoomTypes] = useState<RoomTypeOption[]>([]);
  const [form, setForm] = useState<Room>({
    id: initial?.id,
    room_number: initial?.room_number || "",
    room_type_id: (initial?.room_type_id as string) || "",
    floor: (initial?.floor as string) || "",
    status: (initial?.status as any) || "vacant",
    active: Boolean(initial?.active ?? true),
    notes: (initial?.notes as string) || "",
  });

  useEffect(() => {
    setForm({
      id: initial?.id,
      room_number: initial?.room_number || "",
      room_type_id: (initial?.room_type_id as string) || "",
      floor: (initial?.floor as string) || "",
      status: (initial?.status as any) || "vacant",
      active: Boolean(initial?.active ?? true),
      notes: (initial?.notes as string) || "",
    });
  }, [initial]);

  useEffect(() => {
    supabase.from("room_types").select("id,name,code").order("name").then(({ data, error }) => {
      if (!error && data) setRoomTypes(data as any);
    });
  }, []);

  const handleChange = (key: keyof Room, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    try {
      const payload = {
        room_number: form.room_number.trim(),
        room_type_id: form.room_type_id,
        floor: form.floor || null,
        status: form.status,
        notes: form.notes || null,
        active: !!form.active,
      };

      let error;
      if (isEdit && form.id) {
        ({ error } = await supabase.from("rooms").update(payload).eq("id", form.id));
      } else {
        ({ error } = await supabase.from("rooms").insert(payload));
      }
      if (error) throw error;
      toast({ title: isEdit ? "Room updated" : "Room created" });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Room" : "New Room"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="room_number">Room Number</Label>
            <Input id="room_number" value={form.room_number} onChange={(e) => handleChange("room_number", e.target.value)} />
          </div>
          <div>
            <Label>Room Type</Label>
            <Select value={form.room_type_id} onValueChange={(v) => handleChange("room_type_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>{rt.name} ({rt.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="floor">Floor</Label>
            <Input id="floor" value={form.floor || ""} onChange={(e) => handleChange("floor", e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="oos">Out of Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={form.notes || ""} onChange={(e) => handleChange("notes", e.target.value)} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="active" checked={form.active} onCheckedChange={(v) => handleChange("active", Boolean(v))} />
            <Label htmlFor="active">Active</Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEdit ? "Save Changes" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
