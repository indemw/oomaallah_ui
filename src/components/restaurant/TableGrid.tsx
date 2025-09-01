import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface PosTable {
  id: string;
  name: string;
  area: string | null;
  capacity: number;
  status: string;
}

export function TableGrid({ onSelect }: { onSelect: (table: PosTable) => void }) {
  const [tables, setTables] = useState<PosTable[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("pos_tables").select("*").order("name");
    setTables(data as PosTable[] || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addTable = async () => {
    const name = prompt("Table name/number");
    if (!name) return;
    await supabase.from("pos_tables").insert({ name });
    load();
  };

  if (loading) return <p className="text-muted-foreground">Loading tables…</p>;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-hotel-primary">Tables</h2>
        <Button variant="secondary" onClick={addTable}>Add Table</Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {tables.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className="rounded-lg border p-4 text-left hover:shadow transition"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{t.name}</span>
              <span className="text-xs text-muted-foreground">{t.status}</span>
            </div>
            {t.area && <p className="text-xs text-muted-foreground mt-1">{t.area}</p>}
            <p className="text-xs text-muted-foreground">Capacity: {t.capacity}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
