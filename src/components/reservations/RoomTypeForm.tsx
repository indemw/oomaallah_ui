import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
//import { supabase } from "@/integrations/supabase/client";
import ReservationService from "@/service/ReservationService";
import { useToast } from "@/hooks/use-toast";

// Predefined amenity options for selection
const AMENITY_OPTIONS = [
  "Air conditioning",
  "Private bathroom",
  "Free toiletries",
  "Hairdryer",
  "Bathrobe & slippers",
  "Towels & linens provided",
  "Television (DSTV)",
  "Work desk",
  "Wardrobe/Closet",
  "Safe (in-room)",
  "Refrigerator",
  "Iron & ironing board",
  "Wi-Fi",
];

export interface RoomType {
  id?: string;
  name: string;
  code: string;
  capacity: number;
  base_rate: number;
  currency: string;
  amenities: string[];
  description?: string | null;
  active: boolean;
  image_url?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<RoomType> | null;
  onSuccess?: () => void;
}

export default function RoomTypeForm({ open, onOpenChange, initial, onSuccess }: Props) {
  const isEdit = Boolean(initial?.id);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
const reservationService =new ReservationService();
  const [form, setForm] = useState<RoomType>({
    id: initial?.id,
    name: initial?.name || "",
    code: initial?.code || "",
    capacity: Number(initial?.capacity ?? 1),
    base_rate: Number(initial?.base_rate ?? 0),
    currency: initial?.currency || "MWK",
    amenities: (initial?.amenities as string[]) || [],
    description: (initial?.description as string) || "",
    active: Boolean(initial?.active ?? true),
    image_url: (initial?.image_url as string) || "",
  });

  useEffect(() => {
    setForm({
      id: initial?.id,
      name: initial?.name || "",
      code: initial?.code || "",
      capacity: Number(initial?.capacity ?? 1),
      base_rate: Number(initial?.base_rate ?? 0),
      currency: initial?.currency || "MWK",
      amenities: (initial?.amenities as string[]) || [],
      description: (initial?.description as string) || "",
      active: Boolean(initial?.active ?? true),
      image_url: (initial?.image_url as string) || "",
    });
  }, [initial]);

  const handleChange = (key: keyof RoomType, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const mfile = event.target.files?.[0];
    if (!mfile) return;

    try {
      setUploading(true);
      const fileExt = mfile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      console.log(form)
          const formData = new FormData();
      formData.append('file', mfile);
      formData.append('file_name',fileName);
         const { data: publicUrl ,error: uploadError } = await reservationService.uploadImage(formData)
    /*.from('gallery')
        .upload(fileName, file);*/

      if (uploadError) throw uploadError;

      /*const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName);*/
//console.log(publicUrl);
      handleChange('image_url', publicUrl);
      toast({ title: "Image uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        capacity: Number(form.capacity || 1),
        base_rate: Number(form.base_rate || 0),
        currency: form.currency || "MWK",
        amenities: form.amenities,
        description: form.description || null,
        active: !!form.active,
        image_url: form.image_url || null,
      };

      let error;
      if (isEdit && form.id) {
        ({ error } = await reservationService.updateRoomType({payload:payload,id: form.id}));
      } else {
        ({ error } = await  reservationService.createRoomType(payload)); 
      }

      if (error) throw error;
      toast({ title: isEdit ? "Room type updated" : "Room type created" });
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
          <DialogTitle>{isEdit ? "Edit Room Type" : "New Room Type"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-">

          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="code">Code</Label>
            <Input id="code" value={form.code} onChange={(e) => handleChange("code", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="capacity">Capacity</Label>
            <Input id="capacity" type="number" min={1} value={form.capacity} onChange={(e) => handleChange("capacity", Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="base_rate">Base Rate</Label>
            <Input id="base_rate" name="base_rate" type="number" min={0} value={form.base_rate} onChange={(e) => handleChange("base_rate", Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" value={form.currency} onChange={(e) => handleChange("currency", e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Amenities</Label>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              {AMENITY_OPTIONS.map((opt) => {
                const isChecked = form.amenities.includes(opt);
                return (
                  <label key={opt} className="flex items-center gap-2">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(v) => {
                        const checked = Boolean(v);
                        const next = checked
                          ? Array.from(new Set([...(form.amenities || []), opt]))
                          : (form.amenities || []).filter((a) => a !== opt);
                        handleChange("amenities", next);
                      }}
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={form.description || ""} onChange={(e) => handleChange("description", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="image">Room Image</Label>
            <Input 
              id="image" 
              name="image"
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              disabled={uploading}
            />
            {form.image_url && (
              <div className="mt-2">
                <img 
                  src={form.image_url} 
                  alt="Room preview" 
                  className="w-32 h-24 object-cover rounded-md"
                />
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="active" checked={form.active} onCheckedChange={(v) => handleChange("active", Boolean(v))} />
            <Label htmlFor="active">Active</Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? "Uploading..." : isEdit ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
