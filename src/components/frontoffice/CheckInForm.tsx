import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Users, Bed, CreditCard } from "lucide-react";

interface CheckInFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string | null;
}

interface Reservation {
  id: string;
  reservation_number: string;
  guest_name: string;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  status: string;
  rate: number;
  currency: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  room_type_id: string;
  room_id?: string;
  room_types?: {
    id: string;
    name: string;
    code: string;
  };
  rooms?: {
    id: string;
    room_number: string;
  };
}

interface Room {
  id: string;
  room_number: string;
  status: string;
  room_type_id: string;
}

export default function CheckInForm({ open, onOpenChange, reservationId }: CheckInFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [guestNotes, setGuestNotes] = useState("");

  // Get reservation details
  const { data: reservation, isLoading: loadingReservation } = useQuery({
    queryKey: ["reservation", reservationId],
    queryFn: async () => {
      if (!reservationId) return null;
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          room_types:room_type_id(id, name, code),
          rooms:room_id(id, room_number)
        `)
        .eq("id", reservationId)
        .single();
      
      if (error) throw error;
      return data as Reservation;
    },
    enabled: !!reservationId,
  });

  // Get available rooms for the reservation's room type
  const { data: availableRooms } = useQuery({
    queryKey: ["available-rooms", reservation?.room_type_id],
    queryFn: async () => {
      if (!reservation?.room_type_id) return [];
      
      const { data, error } = await supabase
        .from("rooms")
        .select("id, room_number, status, room_type_id")
        .eq("room_type_id", reservation.room_type_id)
        .eq("active", true)
        .in("status", ["vacant", "clean"])
        .order("room_number");
      
      if (error) throw error;
      return data as Room[];
    },
    enabled: !!reservation?.room_type_id,
  });

  // Set default room if reservation already has one assigned
  useEffect(() => {
    if (reservation?.room_id) {
      setSelectedRoomId(reservation.room_id);
    }
  }, [reservation]);

  const handleCheckIn = async () => {
    if (!reservation || !selectedRoomId) {
      toast({
        title: "Missing Information",
        description: "Please select a room for check-in.",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      // Update reservation status and room assignment
      const { error: reservationError } = await supabase
        .from("reservations")
        .update({
          status: "checked_in",
          room_id: selectedRoomId,
          notes: guestNotes || reservation.notes
        })
        .eq("id", reservation.id);

      if (reservationError) throw reservationError;

      // Update room status to occupied
      const { error: roomError } = await supabase
        .from("rooms")
        .update({ status: "occupied" })
        .eq("id", selectedRoomId);

      if (roomError) throw roomError;

      toast({
        title: "Check-in Successful",
        description: `${reservation.guest_name} has been checked into room ${availableRooms?.find(r => r.id === selectedRoomId)?.room_number}.`
      });

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["fo"] });
      queryClient.invalidateQueries({ queryKey: ["allocations"] });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!open || !reservationId) return null;

  if (loadingReservation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading reservation details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!reservation) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reservation Not Found</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Could not load reservation details.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bed className="h-5 w-5" />
            <span>Check-in Guest: {reservation.guest_name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reservation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reservation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Reservation #</Label>
                  <p className="text-sm text-muted-foreground">{reservation.reservation_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={reservation.status === "booked" ? "default" : "secondary"}>
                    {reservation.status}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {reservation.check_in_date} → {reservation.check_out_date}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {reservation.adults} Adults, {reservation.children} Children
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {reservation.currency} {reservation.rate.toLocaleString()} per night
                </span>
              </div>

              {reservation.room_types && (
                <div>
                  <Label className="text-sm font-medium">Room Type</Label>
                  <p className="text-sm text-muted-foreground">
                    {reservation.room_types.name} ({reservation.room_types.code})
                  </p>
                </div>
              )}

              {reservation.contact_email && (
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{reservation.contact_email}</p>
                </div>
              )}

              {reservation.contact_phone && (
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground">{reservation.contact_phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Check-in Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Room Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="room-select">Select Room</Label>
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an available room" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms?.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.room_number} ({room.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(!availableRooms || availableRooms.length === 0) && (
                  <p className="text-sm text-amber-600 mt-1">
                    No available rooms of this type. Please check room status or contact housekeeping.
                  </p>
                )}
              </div>

              {reservation.rooms && (
                <div>
                  <Label className="text-sm font-medium">Currently Assigned</Label>
                  <p className="text-sm text-muted-foreground">
                    Room {reservation.rooms.room_number}
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="guest-notes">Check-in Notes (Optional)</Label>
                <Textarea
                  id="guest-notes"
                  placeholder="Any special requests or notes for the guest..."
                  value={guestNotes}
                  onChange={(e) => setGuestNotes(e.target.value)}
                  className="min-h-20"
                />
              </div>

              {reservation.notes && (
                <div>
                  <Label className="text-sm font-medium">Existing Notes</Label>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {reservation.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCheckIn}
            disabled={!selectedRoomId || processing}
            className="bg-hotel-success hover:bg-hotel-success/90"
          >
            {processing ? "Processing..." : "Complete Check-in"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}