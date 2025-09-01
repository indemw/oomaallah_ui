import { HotelNavigation } from "@/components/HotelNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEffect, useMemo, useState } from "react";
import { Plus, Minus, ShoppingCart, Clock, MapPin, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import diningHero from "@/assets/dining-hero.jpg";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  station: string;
  isAvailable: boolean;
}

const Dining = () => {
  const { toast } = useToast();
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // SEO: Title, meta description, canonical
  useEffect(() => {
    document.title = "Restaurant & Bar Menu | Oomaallah Hotel";
    const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", "Explore Oomaallah Hotel's Restaurant & Bar menu. Book a table and enjoy local Malawian cuisine, international dishes, and signature drinks.");
    document.head.appendChild(meta);
    const link = document.querySelector('link[rel="canonical"]') || document.createElement("link");
    link.setAttribute("rel", "canonical");
    link.setAttribute("href", `${window.location.origin}/dining`);
    document.head.appendChild(link);
  }, []);

  // Load active menu items from Supabase (public)
  useEffect(() => {
    supabase
      .from('menu_items')
      .select('id,name,description,category,price,station,is_active')
      .eq('is_active', true)
      .order('category')
      .order('name')
      .then(({ data }) => {
        const mapped = (data || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          description: d.description ?? null,
          category: d.category,
          price: Number(d.price ?? 0),
          station: d.station,
          isAvailable: true,
        }));
        setMenuItems(mapped);
      });
  }, []);

  const restaurantItems = useMemo(() => menuItems.filter(i => (i.station || 'kitchen') !== 'bar'), [menuItems]);
  const barItems = useMemo(() => menuItems.filter(i => i.station === 'bar'), [menuItems]);

  const restaurantCategories = useMemo(() => Array.from(new Set(restaurantItems.map(i => i.category))), [restaurantItems]);
  const barCategories = useMemo(() => Array.from(new Set(barItems.map(i => i.category))), [barItems]);

  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
    toast({
      title: "Added to cart",
      description: "Item has been added to your order.",
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((total, [itemId, quantity]) => {
      const item = menuItems.find(m => m.id === itemId);
      return total + (item ? item.price * quantity : 0);
    }, 0);
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  };

  const handleOrder = () => {
    if (getTotalItems() === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before ordering.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Order placed!",
      description: "Your order has been sent to the kitchen. Estimated time: 25-30 minutes.",
    });
    setCart({});
  };

  return (
    <div className="min-h-screen bg-background">
      <HotelNavigation />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] bg-cover bg-center">
        <img 
          src={diningHero}
          alt="Dining at Oomaallah Hotel"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Dining Experience
            </h1>
            <p className="text-xl md:text-2xl">
              Taste the Flavors of Malawi and Beyond
            </p>
          </div>
        </div>
      </section>

      {/* Restaurant Info */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-hotel-primary mb-6">
              Lake View Restaurant
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Indulge in a unique dining experience at our in-house restaurant. Enjoy a fusion of local Malawian cuisine, fresh lake fish, and international dishes made with the finest ingredients.
            </p>
            <p className="text-lg text-muted-foreground">
              Our lake-view terrace is the perfect spot for a romantic dinner or a relaxing breakfast as the sun rises over Lake Malawi.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 text-hotel-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Opening Hours</h3>
                <p className="text-muted-foreground">
                  Breakfast: 6:00 AM - 10:00 AM<br />
                  Lunch: 12:00 PM - 3:00 PM<br />
                  Dinner: 6:00 PM - 10:00 PM
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="h-8 w-8 text-hotel-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Location</h3>
                <p className="text-muted-foreground">
                  Ground Floor<br />
                  Lake View Terrace<br />
                  Main Building
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Phone className="h-8 w-8 text-hotel-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Reservations</h3>
                <p className="text-muted-foreground">
                  Call: +265888977798<br />
                  Or: +265888777729<br />
                  Walk-ins Welcome
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Digital Menu */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-hotel-primary mb-4">
                Restaurant & Bar Menu
              </h2>
              <p className="text-lg text-muted-foreground">
                Explore our dishes and drinks. Call to book a table.
              </p>
              <div className="mt-4">
                <a href="tel:+265888977798">
                  <Button size="lg" className="bg-hotel-primary hover:bg-hotel-primary/90">Book a Table</Button>
                </a>
              </div>
            </div>

            {/* Cart Summary */}
            {getTotalItems() > 0 && (
              <Card className="mb-8 border-hotel-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShoppingCart className="h-5 w-5 text-hotel-primary" />
                      <span className="font-semibold">
                        {getTotalItems()} item(s) in cart
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-xl font-bold text-hotel-primary">
                        MWK {getTotalPrice().toLocaleString()}
                      </span>
                      <Button onClick={handleOrder} className="bg-hotel-primary hover:bg-hotel-primary/90">
                        Place Order
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Menu Categories - Restaurant */}
            {restaurantCategories.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-hotel-primary mb-6">Restaurant Menu</h3>
                {restaurantCategories.map(category => (
                  <div key={`rest-${category}`} className="mb-10">
                    <h4 className="text-xl font-semibold text-hotel-primary mb-4">{category}</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      {restaurantItems
                        .filter(item => item.category === category)
                        .map(item => (
                          <Card key={item.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-3">
                                <h5 className="text-lg font-semibold text-hotel-primary">{item.name}</h5>
                                <Badge variant={item.isAvailable ? "default" : "secondary"}>
                                  {item.isAvailable ? "Available" : "Sold Out"}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mb-4">{item.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-hotel-primary">MWK {item.price.toLocaleString()}</span>
                                <div className="flex items-center space-x-2">
                                  {cart[item.id] > 0 && (
                                    <>
                                      <Button size="sm" variant="outline" onClick={() => removeFromCart(item.id)}>
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <span className="w-8 text-center font-semibold">{cart[item.id]}</span>
                                    </>
                                  )}
                                  <Button size="sm" onClick={() => addToCart(item.id)} disabled={!item.isAvailable} className="bg-hotel-primary hover:bg-hotel-primary/90">
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                    {category !== restaurantCategories[restaurantCategories.length - 1] && (
                      <Separator className="mt-8" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Menu Categories - Bar */}
            {barCategories.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-hotel-primary mb-6">Bar Menu</h3>
                {barCategories.map(category => (
                  <div key={`bar-${category}`} className="mb-10">
                    <h4 className="text-xl font-semibold text-hotel-primary mb-4">{category}</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      {barItems
                        .filter(item => item.category === category)
                        .map(item => (
                          <Card key={item.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-3">
                                <h5 className="text-lg font-semibold text-hotel-primary">{item.name}</h5>
                                <Badge variant={item.isAvailable ? "default" : "secondary"}>
                                  {item.isAvailable ? "Available" : "Sold Out"}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mb-4">{item.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-hotel-primary">MWK {item.price.toLocaleString()}</span>
                                <div className="flex items-center space-x-2">
                                  {cart[item.id] > 0 && (
                                    <>
                                      <Button size="sm" variant="outline" onClick={() => removeFromCart(item.id)}>
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <span className="w-8 text-center font-semibold">{cart[item.id]}</span>
                                    </>
                                  )}
                                  <Button size="sm" onClick={() => addToCart(item.id)} disabled={!item.isAvailable} className="bg-hotel-primary hover:bg-hotel-primary/90">
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                    {category !== barCategories[barCategories.length - 1] && (
                      <Separator className="mt-8" />
                    )}
                  </div>
                ))}
              </div>
            )}
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

export default Dining;