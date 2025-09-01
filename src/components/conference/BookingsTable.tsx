import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { TablesInsert } from "@/integrations/supabase/types";

export type Booking = {
  id: string;
  room_id: string;
  event_name: string;
  organizer: string;
  start_datetime: string;
  end_datetime: string;
  attendees_count: number;
  layout: string;
  status: string;
  room?: { name: string };
};

export const BookingsTable = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    room_id: "",
    event_name: "",
    organizer: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    attendees_count: 1,
    layout: "theater",
  });

  const canSave = useMemo(() =>
    form.room_id && form.event_name.trim() && form.organizer.trim() && form.start_date && form.start_time && form.end_date && form.end_time,
  [form]);

  const load = async () => {
    const { data: bks } = await supabase
      .from("conference_bookings")
      .select("id, room_id, event_name, organizer, start_datetime, end_datetime, attendees_count, layout, status, conference_rooms(name)")
      .gte("start_datetime", new Date(Date.now() - 24*60*60*1000).toISOString())
      .order("start_datetime");
    const shaped = (bks || []).map((b: any) => ({ ...b, room: b.conference_rooms }));
    setBookings(shaped as Booking[]);

    const { data: rms } = await supabase.from("conference_rooms").select("id, name").eq("active", true).order("name");
    setRooms(rms || []);
  };

  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const start = new Date(`${form.start_date}T${form.start_time}:00`);
      const end = new Date(`${form.end_date}T${form.end_time}:00`);
      const payload: TablesInsert<'conference_bookings'> = {
        room_id: form.room_id,
        event_name: form.event_name.trim(),
        organizer: form.organizer.trim(),
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
        attendees_count: Number(form.attendees_count) || 1,
        layout: form.layout,
        status: 'booked',
      };
      const { error } = await supabase.from('conference_bookings').insert(payload);
      if (error) throw error;
      toast({ title: 'Booking created' });
      setOpen(false);
      setForm({ room_id: "", event_name: "", organizer: "", start_date: "", start_time: "", end_date: "", end_time: "", attendees_count: 1, layout: "theater" });
      load();
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between flex-row">
        <CardTitle>Upcoming Bookings</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New Booking</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Booking</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Room</Label>
                <select className="w-full h-10 rounded-md border bg-background px-3" value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })}>
                  <option value="">Select room</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Event Name</Label>
                <Input value={form.event_name} onChange={(e) => setForm({ ...form, event_name: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Organizer</Label>
                <Input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Attendees</Label>
                <Input type="number" min={1} value={form.attendees_count} onChange={(e) => setForm({ ...form, attendees_count: Number(e.target.value || 1) })} />
              </div>
              <div className="space-y-2">
                <Label>Layout</Label>
                <Input value={form.layout} onChange={(e) => setForm({ ...form, layout: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={onCreate} disabled={!canSave || saving}>{saving ? 'Saving...' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Organizer</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Attendees</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map(b => (
              <TableRow key={b.id}>
                <TableCell>{new Date(b.start_datetime).toLocaleString()}</TableCell>
                <TableCell>{new Date(b.end_datetime).toLocaleString()}</TableCell>
                <TableCell>{b.event_name}</TableCell>
                <TableCell>{b.organizer}</TableCell>
                <TableCell>{b.room?.name || '-'}</TableCell>
                <TableCell>{b.attendees_count}</TableCell>
                <TableCell>{b.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
