import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isAfter } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReservationService from "@/service/ReservationService";
export interface Reservation {
  id?: string;
  reservation_number?: string;
  guest_name: string;
  check_in_date: string; // ISO date (yyyy-MM-dd)
  check_out_date: string; // ISO date
  adults: number;
  children: number;
  room_type_id?: string | null;
  room_id?: string | null;
  rate: number;
  currency: string;
  status: string;
  notes?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

interface Option { id: string; label: string }

interface ReservationFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Reservation;
  onSuccess?: () => void;
}

export default function ReservationForm({ open, onOpenChange, initial, onSuccess }: ReservationFormProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
const reservationService =new ReservationService();
  const [guestName, setGuestName] = useState(initial?.guest_name || "");
  const [checkIn, setCheckIn] = useState<Date | undefined>(initial?.check_in_date ? new Date(initial.check_in_date) : undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(initial?.check_out_date ? new Date(initial.check_out_date) : undefined);
  const [adults, setAdults] = useState(initial?.adults ?? 1);
  const [children, setChildren] = useState(initial?.children ?? 0);
  const [roomTypeId, setRoomTypeId] = useState<string | undefined>(initial?.room_type_id || undefined);
  const [roomId, setRoomId] = useState<string | undefined>(initial?.room_id || undefined);
  const [rate, setRate] = useState<number>(initial?.rate ?? 0);
  const [currency, setCurrency] = useState<string>(initial?.currency ?? "MWK");
  const [status, setStatus] = useState<string>(initial?.status ?? "booked");
  const [notes, setNotes] = useState<string>(initial?.notes || "");
  const [email, setEmail] = useState<string>(initial?.contact_email || "");
  const [phone, setPhone] = useState<string>(initial?.contact_phone || "");

  const [roomTypes, setRoomTypes] = useState<Option[]>([]);
  const [rooms, setRooms] = useState<Option[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: rt } = await reservationService.getRoomTypes();//supabase.from("room_types").select("id,name,code").eq("active", true).order("name");
      setRoomTypes((rt || []).map((r: any) => ({ id: r.id, label: `${r.name} (${r.code})` })));
    };
    load();
  }, []);

  useEffect(() => {
    const loadRooms = async () => {
      if (!roomTypeId) { setRooms([]); return; }
      const { data: rms } = await getActiveRoomsByRoomType(roomTypeId)
        /*.from("rooms")
        .select("id, room_number, active")
        .eq("room_type_id", roomTypeId)
        .eq("active", true)
        .order("room_number");*/
      setRooms((rms || []).map((r: any) => ({ id: r.id, label: r.room_number })));
    };
    loadRooms();
  }, [roomTypeId]);

  const disabledCheckOut = useMemo(() => (date: Date) => {
    if (!checkIn) return false;
    return !isAfter(date, checkIn);
  }, [checkIn]);

  const handleSubmit = async () => {
    if (!guestName || !checkIn || !checkOut) {
      toast({ title: "Missing info", description: "Guest name and dates are required.", variant: "destructive" });
      return;
    }
    if (!roomTypeId) {
      toast({ title: "Room type required", description: "Select a room type to continue.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      guest_name: guestName,
      check_in_date: format(checkIn, "yyyy-MM-dd"),
      check_out_date: format(checkOut, "yyyy-MM-dd"),
      adults: adults, 
      children: children,
      room_type_id: roomTypeId || null,
      room_id: roomId || null,
      rate: rate, 
      currency: currency || "MWK",
      status: status,
      notes: notes || null,
      contact_email: email || null,
      contact_phone: phone || null,
      id:initial.id||null,
    } as any;

    let error;
    if (initial?.id) {
      ({ error } = await reservationService.editReservation(payload));//supabase.from("reservations").update(payload).eq("id", initial.id));
    } else {
      ({ error } = await reservationService.saveReservation(payload));//supabase.from("reservations").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: initial?.id ? "Updated" : "Created" });
      onSuccess?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit Reservation" : "New Reservation"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Guest name</Label>
            <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="John Doe" />
          </div>

          <div className="space-y-2">
            <Label>Adults</Label>
            <Input type="number" min={1} value={adults} onChange={(e) => setAdults(parseInt(e.target.value || "1"))} />
          </div>

          <div className="space-y-2">
            <Label>Children</Label>
            <Input type="number" min={0} value={children} onChange={(e) => setChildren(parseInt(e.target.value || "0"))} />
          </div>

          <div className="space-y-2">
            <Label>Room type</Label>
            <Select value={roomTypeId} onValueChange={(v) => { setRoomTypeId(v); setRoomId(undefined); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>{rt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Specific room (optional)</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue placeholder={roomTypeId ? "Select room" : "Pick room type first"} />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rate</Label>
            <Input type="number" min={0} value={rate} onChange={(e) => setRate(parseFloat(e.target.value || "0"))} />
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['booked','checked_in','checked_out','cancelled','no_show'].map(s => (
                  <SelectItem key={s} value={s}>{s.replace('_',' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Check-in date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !checkIn && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkIn ? format(checkIn, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkIn}
                  onSelect={(d) => setCheckIn(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Check-out date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !checkOut && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkOut ? format(checkOut, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={(d) => setCheckOut(d)}
                  disabled={disabledCheckOut}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special requests" />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guest@email.com" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+265..." />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Saving..." : (initial?.id ? "Update" : "Create")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
