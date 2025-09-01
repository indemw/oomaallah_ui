import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

export function InvoicesSection() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [module, setModule] = useState<string>("accounting");
  const [referenceId, setReferenceId] = useState<string>("");
  const [customer, setCustomer] = useState<string>("");
  const [subtotal, setSubtotal] = useState<number>(0);
  const [service, setService] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("id,module,reference_id,customer_name,subtotal,tax_amount,tourism_levy,service_charge,discount_amount,total_amount,created_at,status")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) console.error(error);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const preview = useMemo(() => {
    const vat = +(subtotal * 0.165).toFixed(2);
    const levy = +(subtotal * 0.01).toFixed(2);
    const total = +(subtotal - discount + service + vat + levy).toFixed(2);
    return { vat, levy, total };
  }, [subtotal, discount, service]);

  const createInvoice = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("invoices").insert({
        module,
        reference_id: referenceId || null,
        customer_name: customer || null,
        subtotal,
        service_charge: service,
        discount_amount: discount,
        created_by: userId,
        status: 'open'
      });
      if (error) throw error;
      setModule('accounting'); setReferenceId(''); setCustomer(''); setSubtotal(0); setService(0); setDiscount(0);
      await load();
      toast({ title: "Invoice created" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-5 gap-3 items-end">
            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={module} onValueChange={setModule}>
                <SelectTrigger className="z-50"><SelectValue placeholder="Select module" /></SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="accounting">Accounting</SelectItem>
                  <SelectItem value="reservations">Reservations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference ID</Label>
              <Input value={referenceId} onChange={(e) => setReferenceId(e.target.value)} placeholder="Optional reservation/accounting ref" />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Customer name (optional)" />
            </div>
            <div className="space-y-2">
              <Label>Subtotal</Label>
              <Input type="number" min={0} step="0.01" value={subtotal} onChange={(e) => setSubtotal(Number(e.target.value || 0))} />
            </div>
            <div className="space-y-2">
              <Label>Service Charge</Label>
              <Input type="number" min={0} step="0.01" value={service} onChange={(e) => setService(Number(e.target.value || 0))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Discount</Label>
              <Input type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value || 0))} />
            </div>
            <div className="space-y-1 md:col-span-2 text-sm">
              <div className="flex justify-between"><span>VAT (16.5%)</span><span>{preview.vat.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tourism Levy (1%)</span><span>{preview.levy.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold"><span>Total</span><span>{preview.total.toFixed(2)}</span></div>
            </div>
            <div>
              <Button onClick={createInvoice} disabled={saving || subtotal <= 0}>{saving ? 'Saving…' : 'Create'}</Button>
            </div>
          </div>

          <div className="space-y-2">
            {loading && <p className="text-muted-foreground">Loading invoices…</p>}
            {!loading && rows.length === 0 && <p className="text-muted-foreground">No invoices yet.</p>}
            {!loading && rows.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="font-medium">{inv.module} • {inv.customer_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleString()} • VAT {Number(inv.tax_amount).toFixed(2)} • Levy {Number(inv.tourism_levy).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{Number(inv.total_amount).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Status: {inv.status}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
