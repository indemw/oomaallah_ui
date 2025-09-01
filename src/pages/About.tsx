import { HotelNavigation } from "@/components/HotelNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, 
  Users, 
  Target, 
  Eye,
  Star,
  Building,
  Car,
  Wifi,
  Utensils,
  Check
} from "lucide-react";

const About = () => {
  const features = [
    { icon: Building, title: "Central Location", description: "Located in Salima Town, close to shops, banks, and transport routes" },
    { icon: Car, title: "Modern Comfort", description: "Well-appointed rooms with en-suite bathrooms, air conditioning, and DSTv" },
    { icon: Utensils, title: "Local & International Cuisine", description: "Fresh, locally sourced ingredients" },
    { icon: Users, title: "Business & Leisure", description: "Perfect for meetings, stopovers, or family relaxation" },
    { icon: Star, title: "Community-Oriented", description: "Supporting local employment and eco-conscious practices" }
  ];

  const connections = [
    "Lake Malawi beaches (20-minute drive)",
    "Kuti Wildlife Reserve",
    "Salima Market & Cultural Sites",
    "Transport hubs connecting to Lilongwe and the lakeshore"
  ];

  return (
    <div className="min-h-screen bg-background">
      <HotelNavigation />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-hotel-primary/90 to-hotel-secondary/90">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: "url('/lovable-uploads/17bd6492-5efc-449d-bca7-820fcebafa7b.png')"
          }}
        />
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About Us
            </h1>
            <p className="text-xl md:text-2xl">
              Discover Oomaallah Hotel in the Heart of Salima Town
            </p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Welcome to Oomaallah Hotel, your ideal gateway to exploring the beauty and culture of Salima, Malawi. Conveniently located in Salima Town, just a short 20-minute drive from the golden shores of Lake Malawi, Oomaallah offers a peaceful and stylish environment for both leisure and business travelers.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Whether you're in town for a family visit, a lakeside adventure, or corporate travel, our hotel provides all the essentials for a comfortable and enriching stay.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-hotel-primary mb-8 text-center">
              Our Story
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                Founded with a vision to combine modern hospitality with authentic Malawian warmth, Oomaallah Hotel brings a refreshing experience to visitors in Central Malawi. The name "Oomaallah" reflects serenity and groundedness—values at the core of our guest philosophy.
              </p>
              <p>
                We saw the need for quality, affordable accommodation in Salima Town that's well-connected to both the natural attractions of the lake and the convenience of the town center. That's exactly what Oomaallah was built to offer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <Card className="border-hotel-primary/20">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <Target className="h-8 w-8 text-hotel-primary mr-3" />
                  <h3 className="text-2xl font-bold text-hotel-primary">Our Mission</h3>
                </div>
                <p className="text-muted-foreground">
                  To provide a memorable and comfortable guest experience rooted in quality service, cultural appreciation, and community pride—making every guest feel at home in the heart of Salima.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-hotel-primary/20">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <Eye className="h-8 w-8 text-hotel-primary mr-3" />
                  <h3 className="text-2xl font-bold text-hotel-primary">Our Vision</h3>
                </div>
                <p className="text-muted-foreground">
                  To become Salima Town's top hotel destination by consistently offering personalized service, clean and modern facilities, and strong local partnerships.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-hotel-primary mb-12 text-center">
              Why Choose Oomaallah Hotel?
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-12 h-12 bg-hotel-primary/10 rounded-lg flex items-center justify-center mx-auto">
                      <feature.icon className="h-6 w-6 text-hotel-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-hotel-primary">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Team */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-hotel-primary mb-6">
              Meet Our Team
            </h2>
            <p className="text-lg text-muted-foreground">
              Our friendly and professional staff are committed to making your stay enjoyable and stress-free. From a warm welcome at check-in to helping arrange transport to the lake or local tours, our team is here for you every step of the way.
            </p>
          </div>
        </div>
      </section>

      {/* A Stay That Connects You */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-hotel-primary mb-8 text-center">
              A Stay That Connects You
            </h2>
            <p className="text-lg text-muted-foreground mb-8 text-center">
              At Oomaallah, you get more than just a hotel room—you get easy access to:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {connections.map((connection, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-hotel-accent flex-shrink-0" />
                  <span className="text-muted-foreground">{connection}</span>
                </div>
              ))}
            </div>
            
            <p className="text-lg text-muted-foreground mt-8 text-center">
              Whether you're heading to the beach, planning a safari, or just passing through, Oomaallah Hotel connects you to the very best of Central Malawi.
            </p>
          </div>
        </div>
      </section>

      {/* Visit Us */}
      <section className="py-16 bg-hotel-primary text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Visit Us
            </h2>
            <p className="text-xl mb-8">
              Choose Oomaallah Hotel for your next trip to Salima—where modern hospitality meets local warmth.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-hotel-accent hover:bg-hotel-accent/90 text-white">
                Check Availability
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-hotel-primary">
                Contact Us
              </Button>
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
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <span className="text-xl font-bold text-hotel-primary">Oomaallah Hotel</span>
            </div>
            
            <p className="text-muted-foreground text-center md:text-left">
              © 2025 Oomaallah Hotel. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;