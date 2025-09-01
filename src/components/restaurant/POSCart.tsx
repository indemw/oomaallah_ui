import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MenuItem } from "./MenuGrid";
import { Button } from "@/components/ui/button";

interface OrderItem {
  id: string;
  name: string;
  station: string;
  price: number;
  quantity: number;
  status: string;
}

export function POSCart({ orderId }: { orderId: string }) {
  const [items, setItems] = useState<OrderItem[]>([]);

  const load = async () => {
    const { data } = await supabase.from("pos_order_items").select("id,name,station,price,quantity,status").eq("order_id", orderId).order("created_at");
    setItems((data as any) || []);
  };

  useEffect(() => { load(); }, [orderId]);

  const add = async (menuItem: MenuItem) => {
    await supabase.from("pos_order_items").insert({
      order_id: orderId,
      menu_item_id: menuItem.id,
      name: menuItem.name,
      category: menuItem.category,
      station: menuItem.station,
      price: menuItem.price,
      quantity: 1,
    });
    load();
  };

  const inc = async (id: string, qty: number) => {
    await supabase.from("pos_order_items").update({ quantity: qty + 1 }).eq("id", id);
    load();
  };

  const dec = async (id: string, qty: number) => {
    if (qty <= 1) {
      await supabase.from("pos_order_items").delete().eq("id", id);
    } else {
      await supabase.from("pos_order_items").update({ quantity: qty - 1 }).eq("id", id);
    }
    load();
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = 0; // keep simple; can be derived per item
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [items]);

  const sendTickets = async () => {
    const byStation: Record<string, OrderItem[]> = items.filter(i => i.status === 'new').reduce((acc, i) => {
      (acc[i.station] ||= []).push(i);
      return acc;
    }, {} as Record<string, OrderItem[]>);

    const { data: user } = await supabase.auth.getUser();

    for (const [station, list] of Object.entries(byStation)) {
      const payload = list.map(li => ({ order_item_id: li.id, name: li.name, qty: li.quantity }));
      await supabase.from("pos_tickets").insert({
        order_id: orderId,
        station,
        ticket_type: station === 'bar' ? 'BOT' : 'KOT',
        items: payload,
        created_by: user.user?.id || null,
      });
      const ids = list.map(li => li.id);
      await supabase.from("pos_order_items").update({ status: 'sent' }).in("id", ids);
    }
    load();
  };

  const createBill = async () => {
    await supabase.from("pos_bills").insert({
      order_id: orderId,
      subtotal: totals.subtotal,
      tax_amount: totals.tax,
      total_amount: totals.total,
      status: 'unpaid',
    });
    alert('Bill created. Go to Billing to take payment.');
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-hotel-primary">Order</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={sendTickets}>Send KOT/BOT</Button>
          <Button onClick={createBill}>Create Bill</Button>
        </div>
      </div>
      <div className="space-y-2">
        {items.map(i => (
          <div key={i.id} className="flex items-center justify-between rounded border p-2">
            <div>
              <p className="font-medium">{i.name} <span className="text-xs text-muted-foreground">({i.station})</span></p>
              <p className="text-xs text-muted-foreground">{i.status}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => dec(i.id, i.quantity)}>-</Button>
              <span>{i.quantity}</span>
              <Button size="sm" variant="secondary" onClick={() => inc(i.id, i.quantity)}>+</Button>
              <span className="w-16 text-right font-medium">{(i.price * i.quantity).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{totals.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Tax</span>
          <span>{totals.tax.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between font-semibold">
          <span>Total</span>
          <span>{totals.total.toFixed(2)}</span>
        </div>
      </div>
    </section>
  );
}
