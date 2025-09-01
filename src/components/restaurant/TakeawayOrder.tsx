
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MenuGrid } from "./MenuGrid";
import { POSCart } from "./POSCart";
import { ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function TakeawayOrder() {
  const { toast } = useToast();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const createTakeawayOrder = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Customer Name Required",
        description: "Please enter customer name for takeaway order",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingOrder(true);
    const { data: user } = await supabase.auth.getUser();
    
    const { data: created, error } = await supabase
      .from('pos_orders')
      .insert({ 
        table_id: null, // No table for takeaway
        created_by: user.user?.id,
        notes: `Takeaway Order - Customer: ${customerName}${customerPhone ? `, Phone: ${customerPhone}` : ''}`
      })
      .select('id')
      .single();

    setIsCreatingOrder(false);

    if (!error && created?.id) {
      setOrderId(created.id);
      toast({
        title: "Takeaway Order Started",
        description: `Order created for ${customerName}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to create takeaway order",
        variant: "destructive",
      });
    }
  };

  const resetOrder = () => {
    setOrderId(null);
    setCustomerName("");
    setCustomerPhone("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Takeaway Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!orderId ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-name">Customer Name *</Label>
                  <Input
                    id="customer-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone">Phone Number (Optional)</Label>
                  <Input
                    id="customer-phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <Button 
                onClick={createTakeawayOrder} 
                disabled={isCreatingOrder || !customerName.trim()}
                className="bg-hotel-primary hover:bg-hotel-primary/90"
              >
                {isCreatingOrder ? "Creating Order..." : "Start Takeaway Order"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Takeaway Order for: {customerName}</p>
                {customerPhone && <p className="text-sm text-muted-foreground">Phone: {customerPhone}</p>}
              </div>
              <Button variant="outline" onClick={resetOrder}>
                New Takeaway Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {orderId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MenuGrid onAdd={async (item) => {
              await supabase.from('pos_order_items').insert({
                order_id: orderId,
                menu_item_id: item.id,
                name: item.name,
                category: item.category,
                station: item.station,
                price: item.price,
                quantity: 1,
              });
            }} />
          </div>
          <div>
            <POSCart orderId={orderId} />
          </div>
        </div>
      )}
    </div>
  );
}
