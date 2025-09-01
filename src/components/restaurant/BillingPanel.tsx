import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface BillRow { id: string; order_id: string; subtotal: number; tax_amount: number; tourism_levy: number; total_amount: number; status: string; created_at: string; }

export function BillingPanel() {
  const [bills, setBills] = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("pos_bills")
      .select("id,order_id,subtotal,tax_amount,tourism_levy,total_amount,status,created_at")
      .order("created_at", { ascending: false });
    setBills((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const pay = async (billId: string) => {
    const amount = prompt("Amount paid", "0");
    if (!amount) return;
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) return;
    const { data: user } = await supabase.auth.getUser();
    await supabase.from("pos_payments").insert({ bill_id: billId, amount: amt, method: 'cash', received_by: user.user?.id || null });
    await supabase.from("pos_bills").update({ status: 'paid', paid_at: new Date().toISOString() }).eq("id", billId);
    load();
  };

  const postToAccounting = async (billId: string) => {
    const { data, error } = await supabase.functions.invoke("post-pos-accounting", {
      body: { bill_id: billId }
    });
    if (error) {
      alert(`Posting failed: ${error.message}`);
    } else {
      alert("Posted to accounting.");
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-hotel-primary">Billing</h2>
      <div className="space-y-2">
        {bills.map(b => (
          <div key={b.id} className="flex items-center justify-between rounded border p-3">
            <div>
              <p className="font-medium">Bill {b.id.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()} • {b.status}</p>
              <p className="text-xs text-muted-foreground">Subtotal {b.subtotal.toFixed(2)} • VAT {b.tax_amount.toFixed(2)} • Levy {b.tourism_levy.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{b.total_amount.toFixed(2)}</span>
              {b.status !== 'paid' && <Button size="sm" variant="secondary" onClick={() => pay(b.id)}>Take Payment</Button>}
              <Button size="sm" onClick={() => postToAccounting(b.id)}>Post to Accounting</Button>
            </div>
          </div>
        ))}
        {bills.length === 0 && <p className="text-muted-foreground">No bills yet.</p>}
      </div>
    </section>
  );
}
