import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, Car, Utensils, Tv, Users, Bed } from "lucide-react";

interface RoomCardProps {
  name: string;
  price: string;
  image: string;
  description: string;
  capacity: number;
  amenities: string[];
  available: boolean;
}

export const RoomCard = ({ name, price, image, description, capacity, amenities, available }: RoomCardProps) => {
  const amenityIcons: { [key: string]: React.ReactNode } = {
    wifi: <Wifi className="h-4 w-4" />,
    parking: <Car className="h-4 w-4" />,
    dining: <Utensils className="h-4 w-4" />,
    tv: <Tv className="h-4 w-4" />,
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img 
          src={image} 
          alt={name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4">
          <Badge variant={available ? "default" : "secondary"}>
            {available ? "Available" : "Fully Booked"}
          </Badge>
        </div>
      </div>
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-hotel-primary">{name}</CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-hotel-primary">{price}</p>
            <p className="text-sm text-muted-foreground">per night</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{description}</p>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4 text-hotel-accent" />
            <span className="text-sm">Up to {capacity} guests</span>
          </div>
          <div className="flex items-center space-x-1">
            <Bed className="h-4 w-4 text-hotel-accent" />
            <span className="text-sm">King bed</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {amenities.replace(/{|}/g, '').split(',').map((amenity, index) => (
            <div key={index+1} className="flex items-center space-x-1 text-sm text-muted-foreground">
              {amenityIcons[amenity.toLowerCase()] || <span>•</span>}
              <span>{amenity.replace(/"/g, '')}</span>
            </div>
          ))}
        </div>
        
        <Button 
          className="w-full" 
          variant={available ? "default" : "secondary"}
          disabled={!available}
        >
          {available ? "Book Now" : "Notify When Available"}
        </Button>
      </CardContent>
    </Card>
  );
};