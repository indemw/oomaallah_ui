import { HotelNavigation } from "@/components/HotelNavigation";
import { BookingForm } from "@/components/BookingForm";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Star,
  Wifi,
  Car,
  Utensils,
  Dumbbell,
  Waves,
  Coffee,
  Presentation
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  base_rate: number;
  capacity: number;
  description: string | null;
  amenities: string[];
  active: boolean;
  currency: string;
  image_url?: string | null;
}

const Index = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const { data } = await supabase
          .from('room_types')
          .select('*')
          .eq('active', true)
          .order('base_rate');
        
        setRooms((data as Room[]) || []);
      } catch (error) {
        console.error('Error loading rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  const amenities = [
    { icon: Wifi, title: "Free WiFi", description: "High-speed internet throughout the property" },
    { icon: Car, title: "Free Parking", description: "Secure parking available for all guests" },
    { icon: Utensils, title: "Restaurant & Bar", description: "Fine dining and refreshments on-site" },
    { icon: Presentation, title: "Conference Facility", description: "Modern conference rooms with A/V equipment" },
    { icon: Coffee, title: "Room Service", description: "24/7 in-room dining service" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <HotelNavigation />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-gradient-to-r from-hotel-primary/90 to-hotel-secondary/90">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/lovable-uploads/17bd6492-5efc-449d-bca7-820fcebafa7b.png')"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-hotel-primary/80 to-hotel-secondary/60" />
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="text-white space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Welcome to Oomaallah Hotel
                <br />
                <span className="text-hotel-accent">Salima, Malawi</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90">
                Your perfect escape on the shores of Lake Malawi. Experience luxury accommodation with authentic Malawian hospitality.
              </p>
              <p className="text-lg text-white/80">
                Book your stay today and discover lakeside luxury.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-hotel-accent hover:bg-hotel-accent/90 text-white" asChild>
                  <Link to="#rooms">Explore Rooms</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-hotel-primary" asChild>
                  <Link to="/gallery">View Gallery</Link>
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <BookingForm />
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-hotel-primary mb-6">
              Your Gateway to Lake Malawi
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Experience the perfect blend of comfort and culture at our boutique hotel in Salima. Located just 20 minutes from Lake Malawi's golden beaches, we offer world-class amenities and authentic Malawian hospitality.
            </p>
            <p className="text-lg text-muted-foreground">
              Discover why we're the preferred choice for family-friendly accommodation and luxury stays near Senga Bay.
            </p>
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section id="rooms" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-hotel-primary mb-4">
              Relax in Style – Rooms & Suites Designed for Comfort
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Spacious rooms and suites with modern amenities including en-suite bathrooms, air conditioning, DSTv, and complimentary Wi-Fi. From affordable Lake Malawi accommodation to luxury suites.
            </p>
          </div>
          
            {loading ? (
              <div className="text-center py-8">
                <p className="text-lg text-muted-foreground">Loading rooms...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg text-muted-foreground">No rooms available at the moment.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rooms.map((room) => (
                  <RoomCard 
                    key={room.id} 
                    name={room.name}
                    price={`${room.currency} ${room.base_rate.toLocaleString()}`}
                    image={room.image_url || "https://images.unsplash.com/photo-1721322800607-8c38375eef04?auto=format&fit=crop&w=500&q=80"}
                    description={room.description || "Comfortable accommodation with modern amenities."}
                    capacity={room.capacity}
                    amenities={room.amenities}
                    available={room.active}
                  />
                ))}
              </div>
            )}
        </div>
      </section>

      {/* Amenities Section */}
      <section id="amenities" className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-hotel-primary mb-4">
              Hotel Amenities
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enjoy our comprehensive range of facilities designed to make your stay memorable.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {amenities.map((amenity, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 bg-hotel-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <amenity.icon className="h-6 w-6 text-hotel-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-hotel-primary">{amenity.title}</h3>
                  <p className="text-muted-foreground">{amenity.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dining Section */}
      <section id="dining" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-hotel-primary mb-6">
                Taste the Flavors of Malawi and Beyond
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Indulge in a unique dining experience at our in-house restaurant. Enjoy a fusion of local Malawian cuisine, fresh lake fish, and international dishes made with the finest ingredients.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                Our lake-view terrace is the perfect spot for a romantic dinner or a relaxing breakfast as the sun rises over Lake Malawi.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-hotel-accent" />
                  <span>Fresh Lake Malawi fish</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-hotel-accent" />
                  <span>Local Malawian cuisine fusion</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-hotel-accent" />
                  <span>Lake-view dining terrace</span>
                </div>
              </div>
              <Link to="/dining">
                <Button className="mt-6" size="lg">
                  View Menu
                </Button>
              </Link>
            </div>
            <div>
              <img 
                src="https://zfjicwlopcwjjvojmgow.supabase.co/storage/v1/object/public/gallery/1755223704924_bdtvse3hqa.jpg"
                alt="Delicious food at Oomaallah Hotel restaurant"
                className="rounded-lg shadow-lg w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Meetings & Events Section */}
      <section id="events" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-hotel-primary mb-6">
              Plan Unforgettable Events in Salima
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From boardroom meetings to lakeside weddings, Oomaallah Hotel provides versatile event venues in Salima Malawi for all kinds of occasions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-hotel-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Presentation className="h-6 w-6 text-hotel-primary" />
                </div>
                <h3 className="text-xl font-semibold text-hotel-primary">Conference Room Rental</h3>
                <p className="text-muted-foreground">Modern meeting spaces with lake views</p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-hotel-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Utensils className="h-6 w-6 text-hotel-primary" />
                </div>
                <h3 className="text-xl font-semibold text-hotel-primary">Catering Services</h3>
                <p className="text-muted-foreground">Customized menus for your events</p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-hotel-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Star className="h-6 w-6 text-hotel-primary" />
                </div>
                <h3 className="text-xl font-semibold text-hotel-primary">Event Planning</h3>
                <p className="text-muted-foreground">Professional assistance for seamless events</p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-hotel-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Presentation className="h-6 w-6 text-hotel-primary" />
                </div>
                <h3 className="text-xl font-semibold text-hotel-primary">A/V Equipment</h3>
                <p className="text-muted-foreground">Audio-visual technology for presentations</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-hotel-primary text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Ready to book your stay or have questions? We're here to help make your visit unforgettable.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Location</h3>
               <p className="text-white/90">
                123 Luxury Lane<br />
                Salima District, Malawi
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Phone</h3>
              <p className="text-white/90">
                +265888977798<br />
                +265888777729
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Email</h3>
               <p className="text-white/90">
                oomaallahhotel@gmail.com<br />
                reservations@oomaallahhotel.mw
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-hotel-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-bold text-hotel-primary">Oomaallah Hotel</span>
            </div>
            
            <p className="text-muted-foreground text-center md:text-left">
              © 2025 Oomaallah Hotel. All rights reserved. Powered by Inde Technologies.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;