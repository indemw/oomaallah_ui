import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HotelNavigation } from "@/components/HotelNavigation";
import { toast } from "@/components/ui/use-toast";
import { Trash2, Upload, Loader2 } from "lucide-react";

const setSEO = (title: string, description: string, path: string) => {
  document.title = title;
  const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
  meta.setAttribute("name", "description");
  meta.setAttribute("content", description);
  document.head.appendChild(meta);
  const link = document.querySelector('link[rel="canonical"]') || document.createElement("link");
  link.setAttribute("rel", "canonical");
  link.setAttribute("href", `${window.location.origin}${path}`);
  document.head.appendChild(link);
};

type Me = { user_id: string; role: string };

type AppSetting = { key: string; value: any };

interface GalleryImage {
  id: string;
  name: string;
  publicUrl: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const isAdmin = useMemo(() => ['admin','super_admin'].includes(me?.role ?? ''), [me]);

  const [hotelName, setHotelName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [modules, setModules] = useState<{ reservations: boolean; restaurant: boolean; front_office: boolean; conference: boolean }>({
    reservations: true,
    restaurant: true,
    front_office: true,
    conference: true,
  });
  const [saving, setSaving] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingGallery, setLoadingGallery] = useState(true);

  useEffect(() => {
    setSEO("Settings | Oomaallah Hotel", "Manage application settings.", "/settings");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate('/auth');
      setUserId(session?.user?.id ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/auth');
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data: my } = await supabase.from('profiles').select('user_id, role').eq('user_id', userId).maybeSingle();
      if (my) setMe(my as Me);
      const { data } = await supabase.from('app_settings').select('key, value').in('key', ['hotel_name','contact_email','modules']);
      const settings = (data as AppSetting[]) || [];
      const hn = settings.find(s => s.key === 'hotel_name');
      const ce = settings.find(s => s.key === 'contact_email');
      const mod = settings.find(s => s.key === 'modules');
      setHotelName(hn?.value?.text || "");
      setContactEmail(ce?.value?.email || "");
      setModules({
        reservations: Boolean(mod?.value?.reservations ?? true),
        restaurant: Boolean(mod?.value?.restaurant ?? true),
        front_office: Boolean(mod?.value?.front_office ?? true),
        conference: Boolean(mod?.value?.conference ?? true),
      });
    };
    load();
    loadGalleryImages();
  }, [userId]);

  const loadGalleryImages = async () => {
    try {
      const { data, error } = await supabase.storage.from('gallery').list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      });

      if (error) {
        console.error('Error loading gallery images:', error);
        return;
      }

      const imageUrls = await Promise.all(
        (data || [])
          .filter(file => file.name !== '.emptyFolderPlaceholder')
          .map(async (file) => {
            const { data: { publicUrl } } = supabase.storage
              .from('gallery')
              .getPublicUrl(file.name);
            
            return {
              id: file.id || file.name,
              name: file.name,
              publicUrl
            };
          })
      );

      setGalleryImages(imageUrls);
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoadingGallery(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !isAdmin) return;
    setSaving(true);
    try {
      await supabase.from('app_settings').upsert([
        { key: 'hotel_name', value: { text: hotelName }, updated_by: userId },
        { key: 'contact_email', value: { email: contactEmail }, updated_by: userId },
        { key: 'modules', value: modules, updated_by: userId },
      ], { onConflict: 'key' });
      toast({ title: "Settings saved", description: "Your changes have been saved successfully." });
    } catch (error) {
      toast({ title: "Error saving settings", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('gallery')
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      toast({ title: "Image uploaded", description: "Gallery image uploaded successfully." });
      loadGalleryImages();
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Upload failed", description: "Failed to upload image. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleImageDelete = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from('gallery')
        .remove([fileName]);

      if (error) {
        throw error;
      }

      toast({ title: "Image deleted", description: "Gallery image removed successfully." });
      setGalleryImages(prev => prev.filter(img => img.name !== fileName));
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: "Delete failed", description: "Failed to delete image. Please try again.", variant: "destructive" });
    }
  };

  if (!me) return <main className="min-h-screen bg-background flex items-center justify-center"><p>Loading...</p></main>;
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader><CardTitle>Access restricted</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You need the admin or super_admin role to access settings.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <>
      <HotelNavigation />
      <main className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold text-hotel-primary">Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>Hotel Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label>Hotel Name</Label>
                <Input value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder="e.g. Oomaallah Hotel" />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="e.g. info@example.com" />
              </div>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modules Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center justify-between border rounded-lg p-4 bg-gradient-card">
                <div>
                  <p className="font-medium">Reservations</p>
                  <p className="text-sm text-muted-foreground">Enable room bookings module</p>
                </div>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Toggle Reservations"
                  className="h-5 w-10"
                  checked={modules.reservations}
                  onChange={(e) => setModules(s => ({ ...s, reservations: e.target.checked }))}
                />
              </div>
              <div className="flex items-center justify-between border rounded-lg p-4 bg-gradient-card">
                <div>
                  <p className="font-medium">Bar & Restaurant</p>
                  <p className="text-sm text-muted-foreground">Enable POS and billing</p>
                </div>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Toggle Restaurant"
                  className="h-5 w-10"
                  checked={modules.restaurant}
                  onChange={(e) => setModules(s => ({ ...s, restaurant: e.target.checked }))}
                />
              </div>
              <div className="flex items-center justify-between border rounded-lg p-4 bg-gradient-card">
                <div>
                  <p className="font-medium">Front Office</p>
                  <p className="text-sm text-muted-foreground">Enable check-in/out</p>
                </div>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Toggle Front Office"
                  className="h-5 w-10"
                  checked={modules.front_office}
                  onChange={(e) => setModules(s => ({ ...s, front_office: e.target.checked }))}
                />
              </div>
              <div className="flex items-center justify-between border rounded-lg p-4 bg-gradient-card">
                <div>
                  <p className="font-medium">Conference Facilities</p>
                  <p className="text-sm text-muted-foreground">Enable conference bookings</p>
                </div>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label="Toggle Conference"
                  className="h-5 w-10"
                  checked={modules.conference}
                  onChange={(e) => setModules(s => ({ ...s, conference: e.target.checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gallery Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Image Upload Guidelines</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Maximum file size: 10MB</li>
                    <li>• Supported formats: JPG, PNG, WebP, GIF</li>
                    <li>• Recommended resolution: 1920x1080 or higher</li>
                    <li>• Images will be publicly visible in the gallery</li>
                  </ul>
                </div>
                <div className="flex items-center space-x-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="flex-1"
                  />
                  <Button disabled={uploading} className="min-w-fit">
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {loadingGallery ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading gallery images...</p>
                </div>
              ) : galleryImages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No images in gallery yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Upload images to showcase your hotel.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.publicUrl}
                        alt={`Gallery image ${image.name}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleImageDelete(image.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
      </main>
    </>
  );
}
