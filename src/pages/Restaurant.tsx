
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TableGrid } from "@/components/restaurant/TableGrid";
import { MenuGrid } from "@/components/restaurant/MenuGrid";
import { POSCart } from "@/components/restaurant/POSCart";
import { TicketsBoard } from "@/components/restaurant/TicketsBoard";
import { BillingPanel } from "@/components/restaurant/BillingPanel";
import { TakeawayOrder } from "@/components/restaurant/TakeawayOrder";

const setSEO = (title: string, description: string, path: string) => {
  document.title = title;
  const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
  meta.setAttribute("name", "description");
  meta.setAttribute("content", description);
  document.head.appendChild(meta);
  const link = document.querySelector('link[rel="canonical"]') || document.createElement("link");
  link.setAttribute("rel", "canonical");
  link.setAttribute("href", `${window.location.origin}${path}`);
  document.head.appendChild(link);
};

export default function Restaurant() {
  const [enabled, setEnabled] = useState(true);
  const [checked, setChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("pos");
  const [selectedTable, setSelectedTable] = useState<{ id: string; name: string } | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    setSEO("Bar & Restaurant | Oomaallah Hotel", "Restaurant POS and billing.", "/restaurant");
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'modules')
      .maybeSingle()
      .then(({ data }) => {
        setEnabled(Boolean((data?.value as any)?.restaurant ?? true));
        setChecked(true);
      });
  }, []);

  const onSelectTable = async (table: { id: string; name: string }) => {
    setSelectedTable(table);
    // Find or create open order for this table
    const { data: existing } = await supabase
      .from('pos_orders')
      .select('id,status')
      .eq('table_id', table.id)
      .eq('status', 'open')
      .maybeSingle();

    if (existing?.id) {
      setOrderId(existing.id);
      setActiveTab('pos');
      return;
    }
    const { data: user } = await supabase.auth.getUser();
    const { data: created, error } = await supabase
      .from('pos_orders')
      .insert({ table_id: table.id, created_by: user.user?.id })
      .select('id')
      .single();
    if (!error && created?.id) {
      setOrderId(created.id);
      setActiveTab('pos');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-hotel-primary">Bar & Restaurant</h1>
        <p className="text-muted-foreground">POS, KOT/BOT, table management, and billing.</p>
      </header>
      {!checked ? (
        <p>Loading...</p>
      ) : !enabled ? (
        <section className="p-6 border rounded-lg bg-gradient-card">
          <h2 className="text-xl font-semibold text-hotel-primary">Module disabled</h2>
          <p className="text-muted-foreground">Ask an administrator to enable Restaurant in Settings.</p>
        </section>
      ) : (
        <main className="space-y-6">
          <section className="p-4 border rounded-lg">
            <TableGrid onSelect={onSelectTable} />
          </section>

          <section className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-hotel-primary">
                {activeTab === 'pos' && 'POS Workspace'}
                {activeTab === 'takeaway' && 'Takeaway Orders'}
                {activeTab === 'kitchen' && 'Kitchen Tickets'}
                {activeTab === 'bar' && 'Bar Tickets'}
                {activeTab === 'billing' && 'Billing'}
              </h2>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setActiveTab('pos')} className={`px-3 py-1 rounded border ${activeTab==='pos'?'bg-primary text-primary-foreground':'bg-background'}`}>POS</button>
              <button onClick={() => setActiveTab('takeaway')} className={`px-3 py-1 rounded border ${activeTab==='takeaway'?'bg-primary text-primary-foreground':'bg-background'}`}>Takeaway</button>
              <button onClick={() => setActiveTab('kitchen')} className={`px-3 py-1 rounded border ${activeTab==='kitchen'?'bg-primary text-primary-foreground':'bg-background'}`}>Kitchen</button>
              <button onClick={() => setActiveTab('bar')} className={`px-3 py-1 rounded border ${activeTab==='bar'?'bg-primary text-primary-foreground':'bg-background'}`}>Bar</button>
              <button onClick={() => setActiveTab('billing')} className={`px-3 py-1 rounded border ${activeTab==='billing'?'bg-primary text-primary-foreground':'bg-background'}`}>Billing</button>
            </div>

            {activeTab === 'pos' && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <MenuGrid onAdd={async (item) => {
                    if (!orderId) {
                      alert('Select a table to start an order.');
                      return;
                    }
                    // delegate to cart via a simple insert here so you can add before cart mounts
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
                  {orderId ? (
                    <POSCart orderId={orderId} />
                  ) : (
                    <div className="text-muted-foreground">Select a table to start.</div>
                  )}
                </div>
              </section>
            )}

            {activeTab === 'takeaway' && (
              <TakeawayOrder />
            )}

            {activeTab === 'kitchen' && (
              <TicketsBoard station="kitchen" />
            )}

            {activeTab === 'bar' && (
              <TicketsBoard station="bar" />
            )}

            {activeTab === 'billing' && (
              <BillingPanel />
            )}
          </section>
        </main>
      )}
    </div>
  );
}
