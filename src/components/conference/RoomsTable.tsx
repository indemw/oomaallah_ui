import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
export type ConferenceRoom = {
  id: string;
  name: string;
  capacity: number;
  location: string | null;
  base_rate: number;
  currency: string;
  amenities: string[];
  description: string | null;
  active: boolean;
  image_url: string | null;
};

const AMENITY_OPTIONS = [
  "WiFi",
  "Projector",
  "Whiteboard",
  "Air Conditioning",
  "Sound System",
  "Video Conferencing",
  "Microphone",
  "Screen",
  "Catering Setup",
  "Natural Light",
  "Parking",
  "Accessibility"
];

export const RoomsTable = () => {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<ConferenceRoom[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<ConferenceRoom | null>(null);

  const [form, setForm] = useState({
    name: "",
    capacity: 10,
    location: "",
    base_rate: 0,
    currency: "MWK",
    amenities: [] as string[],
    description: "",
    active: true,
    image_url: "",
  });

  const resetForm = () => {
    setForm({ name: "", capacity: 10, location: "", base_rate: 0, currency: "MWK", amenities: [], description: "", active: true, image_url: "" });
    setEditing(null);
  };

  const load = async () => {
    const { data, error } = await supabase.from("conference_rooms").select("*").order("name");
    if (!error) setRooms((data as ConferenceRoom[]) || []);
  };

  useEffect(() => { load(); }, []);

  const canSave = useMemo(() => form.name.trim().length > 0 && form.capacity > 0, [form]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `conference-rooms/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      setForm({ ...form, image_url: publicUrl });
      toast({ title: "Image uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
  };

  const toggleAmenity = (amenity: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const onSubmit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      // Prepare typed payloads for Supabase types
      if (editing) {
        const updatePayload: TablesUpdate<'conference_rooms'> = {
          name: form.name.trim(),
          capacity: Number(form.capacity) || 0,
          location: form.location || null,
          base_rate: Number(form.base_rate) || 0,
          currency: form.currency || "MWK",
          amenities: form.amenities,
          description: form.description || null,
          active: !!form.active,
          image_url: form.image_url || null,
        };
        const { error } = await supabase.from("conference_rooms").update(updatePayload).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Room updated" });
      } else {
        const insertPayload: TablesInsert<'conference_rooms'> = {
          name: form.name.trim(),
          capacity: Number(form.capacity) || 0,
          location: form.location || null,
          base_rate: Number(form.base_rate) || 0,
          currency: form.currency || "MWK",
          amenities: form.amenities,
          description: form.description || null,
          active: !!form.active,
          image_url: form.image_url || null,
        };
        const { error } = await supabase.from("conference_rooms").insert(insertPayload);
        if (error) throw error;
        toast({ title: "Room created" });
      }
      setOpen(false);
      resetForm();
      load();
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (r: ConferenceRoom) => {
    setEditing(r);
    setForm({
      name: r.name,
      capacity: r.capacity,
      location: r.location || "",
      base_rate: Number(r.base_rate) || 0,
      currency: r.currency,
      amenities: r.amenities || [],
      description: r.description || "",
      active: r.active,
      image_url: r.image_url || "",
    });
    setOpen(true);
  };

  const toggleActive = async (r: ConferenceRoom) => {
    const { error } = await supabase.from("conference_rooms").update({ active: !r.active }).eq("id", r.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      setRooms((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: !x.active } : x)));
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between flex-row">
        <CardTitle>Conference Rooms</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>New Room</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Room" : "Create Room"}</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value || 0) })} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Base Rate</Label>
                <Input type="number" min={0} step="0.01" value={form.base_rate} onChange={(e) => setForm({ ...form, base_rate: Number(e.target.value || 0) })} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Room Image</Label>
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {form.image_url && (
                  <div className="mt-2">
                    <img src={form.image_url} alt="Room preview" className="w-32 h-24 object-cover rounded" />
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Amenities</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity}
                        checked={form.amenities.includes(amenity)}
                        onCheckedChange={() => toggleAmenity(amenity)}
                      />
                      <Label htmlFor={amenity} className="text-sm">{amenity}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })} 
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={onSubmit} disabled={!canSave || saving}>{saving ? "Saving..." : editing ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Amenities</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  {r.image_url ? (
                    <img src={r.image_url} alt={r.name} className="w-16 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-12 bg-muted rounded flex items-center justify-center text-xs">No Image</div>
                  )}
                </TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.capacity}</TableCell>
                <TableCell>{r.location || '-'}</TableCell>
                <TableCell>{r.currency} {Number(r.base_rate).toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {r.amenities?.slice(0, 3).map((amenity) => (
                      <span key={amenity} className="text-xs bg-muted px-1 rounded">{amenity}</span>
                    ))}
                    {r.amenities?.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{r.amenities.length - 3} more</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{r.active ? 'Active' : 'Disabled'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="secondary" onClick={() => startEdit(r)}>Edit</Button>
                  <Button variant="outline" onClick={() => toggleActive(r)}>{r.active ? 'Disable' : 'Enable'}</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
