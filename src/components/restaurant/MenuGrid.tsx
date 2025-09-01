import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  station: string; // kitchen | bar
}

export function MenuGrid({ onAdd }: { onAdd: (item: MenuItem) => void }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    supabase.from("menu_items").select("id,name,description,category,price,station").eq("is_active", true).then(({ data }) => {
      setItems((data as any) || []);
    });
  }, []);

  const categories = useMemo(() => Array.from(new Set(items.map(i => i.category))), [items]);
  const filtered = useMemo(() => filter === "all" ? items : items.filter(i => i.category === filter), [items, filter]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={filter === "all" ? "default" : "secondary"} onClick={() => setFilter("all")}>All</Button>
        {categories.map(cat => (
          <Button key={cat} size="sm" variant={filter === cat ? "default" : "secondary"} onClick={() => setFilter(cat)}>{cat}</Button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(item => (
          <div key={item.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-hotel-primary">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <span className="text-sm font-medium">{item.price.toFixed(2)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{item.station.toUpperCase()}</span>
              <Button size="sm" onClick={() => onAdd(item)}>Add</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
