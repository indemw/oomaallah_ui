import { useEffect, useState } from "react";
import { HotelNavigation } from "@/components/HotelNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

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

interface GalleryImage {
  id: string;
  name: string;
  publicUrl: string;
}

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    setSEO("Photo Gallery - Oomaallah Hotel", "Explore our beautiful hotel facilities, rooms, and amenities through our photo gallery.", "/gallery");
    
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

        setImages(imageUrls);
      } catch (error) {
        console.error('Error loading gallery:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGalleryImages();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <HotelNavigation />
        <main className="container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-hotel-primary" />
            <p className="text-lg text-muted-foreground">Loading gallery...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HotelNavigation />
      
      <main className="container mx-auto px-4 py-16">
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-hotel-primary">Photo Gallery</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Discover the beauty and comfort of Oomaallah Hotel
            </p>
          </div>
        </div>

        {images.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <p className="text-lg text-muted-foreground">
                No images available in the gallery yet.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Check back soon for beautiful photos of our hotel.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {images.map((image) => (
              <Card 
                key={image.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => setSelectedImage(image.publicUrl)}
              >
                <div className="aspect-square relative">
                  <img
                    src={image.publicUrl}
                    alt={`Gallery image ${image.name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full">
              <img
                src={selectedImage}
                alt="Gallery image"
                className="w-full h-full object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => setSelectedImage(null)}
              >
                ×
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}