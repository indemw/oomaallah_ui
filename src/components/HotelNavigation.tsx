import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const HotelNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b border-border/40 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-hotel-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="text-xl font-bold text-hotel-primary">Oomaallah Hotel</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-foreground hover:text-hotel-primary transition-colors">Home</Link>
            <Link to="/about" className="text-foreground hover:text-hotel-primary transition-colors">About</Link>
            <Link to="/dining" className="text-foreground hover:text-hotel-primary transition-colors">Dining</Link>
            <Link to="/gallery" className="text-foreground hover:text-hotel-primary transition-colors">Gallery</Link>
            {location.pathname === '/' ? (
              <a href="#amenities" className="text-foreground hover:text-hotel-primary transition-colors">Amenities</a>
            ) : (
              <Link to="/#amenities" className="text-foreground hover:text-hotel-primary transition-colors">Amenities</Link>
            )}
            {location.pathname === '/' ? (
              <a href="#contact" className="text-foreground hover:text-hotel-primary transition-colors">Contact</a>
            ) : (
              <Link to="/#contact" className="text-foreground hover:text-hotel-primary transition-colors">Contact</Link>
            )}
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="text-foreground hover:text-hotel-primary transition-colors">Staff Dashboard</Link>
                <Button variant="outline" onClick={handleLogout} aria-label="Sign out">
                  Log out
                </Button>
              </>
            )}
            {!isAuthenticated && (
              <Button asChild variant="outline">
                <Link to="/auth">Staff Login</Link>
              </Button>
            )}

          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-3">
              <Link to="/" className="text-foreground hover:text-hotel-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link to="/about" className="text-foreground hover:text-hotel-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>About</Link>
              <Link to="/dining" className="text-foreground hover:text-hotel-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Dining</Link>
              <Link to="/gallery" className="text-foreground hover:text-hotel-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Gallery</Link>
              {location.pathname === '/' ? (
                <a href="#amenities" className="text-foreground hover:text-hotel-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Amenities</a>
              ) : (
                <Link to="/#amenities" className="text-foreground hover:text-hotel-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Amenities</Link>
              )}
              {location.pathname === '/' ? (
                <a href="#contact" className="text-foreground hover:text-hotel-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Contact</a>
              ) : (
                <Link to="/#contact" className="text-foreground hover:text-hotel-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Contact</Link>
              )}
              {isAuthenticated && (
                <>
                  <Link to="/dashboard" className="text-foreground hover:text-hotel-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>Staff Dashboard</Link>
                  <Button variant="outline" className="w-fit" onClick={handleLogout} aria-label="Sign out">
                    Log out
                  </Button>
                </>
              )}
              {!isAuthenticated && (
                <Button asChild variant="outline" className="w-fit">
                  <Link to="/auth">Staff Login</Link>
                </Button>
              )}

            </div>
          </div>
        )}
      </div>
    </nav>
  );
};