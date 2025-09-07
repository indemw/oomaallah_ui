import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReservationService from "@/service/ReservationService";
import type { Tables } from "@/integrations/supabase/types";

export const BookingForm = () => {
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState("1");
  const [bookingType, setBookingType] = useState("room");
  const [roomType, setRoomType] = useState("");
  const [conferenceType, setConferenceType] = useState("");
  const [roomTypes, setRoomTypes] = useState<Tables<'room_types'>[]>([]);
  const [confRooms, setConfRooms] = useState<Tables<'conference_rooms'>[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const { toast } = useToast();
  const reservationService=new ReservationService();
  // Load real options from the system
  useEffect(() => {
    const load = async () => {
      setLoadingOptions(true);
      try {
        const { data: rtypes } = await reservationService.getRoomTypes();
          /*.from('room_types')
          .select('id, name, base_rate, capacity, currency, active')
          .eq('active', true)
          .order('name');*/
        setRoomTypes((rtypes as any) || []);

        const { data: crooms } = await reservationService.getConferenceRooms()
          /*.from('conference_rooms')
          .select('id, name, capacity, base_rate, currency, active')
          .eq('active', true)
          .order('name');*/
        setConfRooms((crooms as any) || []);
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, []);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const requiredField = bookingType === "room" ? roomType : conferenceType;
    if (!checkIn || !checkOut || !requiredField) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Booking Request Submitted", 
      description: `We'll contact you shortly to confirm your ${bookingType === "room" ? "reservation" : "conference booking"}.`,
    });
  };

  return (
    <Card className="w-full max-w-md bg-background/95 backdrop-blur-sm border-border/40">
      <CardHeader>
        <CardTitle className="text-hotel-primary">
          {bookingType === "room" ? "Book Your Stay" : "Book Conference Room"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleBooking} className="space-y-4">
          {/* Booking Type */}
          <div className="space-y-2">
            <Label htmlFor="bookingtype">Booking Type</Label>
            <Select value={bookingType} onValueChange={setBookingType}>
              <SelectTrigger>
                <SelectValue placeholder="Select booking type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="room">Hotel Room</SelectItem>
                <SelectItem value="conference">Conference Room</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Check-in Date */}
          <div className="space-y-2">
            <Label htmlFor="checkin">Check-in Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !checkIn && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkIn ? format(checkIn, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkIn}
                  onSelect={setCheckIn}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Check-out Date */}
          <div className="space-y-2">
            <Label htmlFor="checkout">Check-out Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !checkOut && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkOut ? format(checkOut, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={setCheckOut}
                  disabled={(date) => date <= (checkIn || new Date())}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Number of Guests */}
          <div className="space-y-2">
            <Label htmlFor="guests">Number of Guests</Label>
            <Select value={guests} onValueChange={setGuests}>
              <SelectTrigger>
                <SelectValue placeholder="Select guests">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    {guests} {guests === "1" ? "Guest" : "Guests"}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Guest</SelectItem>
                <SelectItem value="2">2 Guests</SelectItem>
                <SelectItem value="3">3 Guests</SelectItem>
                <SelectItem value="4">4 Guests</SelectItem>
                <SelectItem value="5">5+ Guests</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Room Type or Conference Type */}
          {bookingType === "room" ? (
            <div className="space-y-2">
              <Label htmlFor="roomtype">Room Type</Label>
              <Select value={roomType} onValueChange={setRoomType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {loadingOptions && <SelectItem value="__loading" disabled>Loading...</SelectItem>}
                  {!loadingOptions && roomTypes.length === 0 && (
                    <SelectItem value="__empty" disabled>No room types available</SelectItem>
                  )}
                  {!loadingOptions && roomTypes.map((rt) => (
                    <SelectItem key={rt.id as string} value={rt.id as string}>
                      {rt.name} - {rt.currency} {Number(rt.base_rate || 0).toFixed(2)}/night
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="conferencetype">Conference Room</Label>
              <Select value={conferenceType} onValueChange={setConferenceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select conference room" />
                </SelectTrigger>
                <SelectContent>
                  {loadingOptions && <SelectItem value="__loading" disabled>Loading...</SelectItem>}
                  {!loadingOptions && confRooms.length === 0 && (
                    <SelectItem value="__empty" disabled>No conference rooms available</SelectItem>
                  )}
                  {!loadingOptions && confRooms.map((cr) => (
                    <SelectItem key={cr.id as string} value={cr.id as string}>
                      {cr.name} ({cr.capacity} people) - {cr.currency} {Number(cr.base_rate || 0).toFixed(2)}/day
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" className="w-full bg-hotel-primary hover:bg-hotel-primary/90">
            Check Availability
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};