import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Ticket {
  id: string;
  station: string;
  ticket_type: string;
  status: string;
  created_at: string;
  items: { order_item_id: string; name: string; qty: number }[];
}

export function TicketsBoard({ station }: { station: 'kitchen' | 'bar' }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("pos_tickets")
      .select("id,station,ticket_type,status,created_at,items")
      .eq("station", station)
      .in("status", ["pending", "printed"])
      .order("created_at");
    setTickets((data as any) || []);
  };

  useEffect(() => {
    load();
    const int = setInterval(load, 4000);
    return () => clearInterval(int);
  }, [station]);

  const complete = async (id: string) => {
    await supabase.from("pos_tickets").update({ status: 'completed' }).eq("id", id);
    load();
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {tickets.map(t => (
        <div key={t.id} className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t.ticket_type}</h3>
            <span className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleTimeString()}</span>
          </div>
          <ul className="mt-2 space-y-1">
            {t.items.map((it, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <span>{it.name}</span>
                <span className="font-medium">x{it.qty}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <Button className="w-full" onClick={() => complete(t.id)}>Mark Completed</Button>
          </div>
        </div>
      ))}
      {tickets.length === 0 && <p className="text-muted-foreground">No tickets.</p>}
    </section>
  );
}
