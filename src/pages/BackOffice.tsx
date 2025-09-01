import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HotelNavigation } from "@/components/HotelNavigation";

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

type Profile = { user_id: string; role: string };

type ModuleFlags = {
  reservations?: boolean;
  restaurant?: boolean;
  front_office?: boolean;
  conference?: boolean;
};

type StockRequest = {
  id: string;
  stock_item_id: string;
  quantity_requested: number;
  reason: string | null;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  created_at: string;
  request_type?: 'replenishment' | 'deduction';
};

type StockItem = { id: string; name: string; unit: string };

export default function BackOffice() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [modules, setModules] = useState<ModuleFlags>({});
  const [modSaving, setModSaving] = useState(false);

  const [pending, setPending] = useState<StockRequest[]>([]);
  const [items, setItems] = useState<StockItem[]>([]);

  const isAdmin = useMemo(() => ['admin','super_admin'].includes(profile?.role ?? ''), [profile]);
  const isManager = useMemo(() => ['manager','admin','super_admin'].includes(profile?.role ?? ''), [profile]);

  useEffect(() => {
    setSEO("Back Office | Oomaallah Hotel", "Administrative operations and internal tools.", "/back-office");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate("/auth");
      setUserId(session?.user?.id ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data: prof } = await supabase.from('profiles').select('user_id, role').eq('user_id', userId).maybeSingle();
      if (prof) setProfile(prof as Profile);

      const { data: mod } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'modules')
        .maybeSingle();
      setModules(((mod?.value as ModuleFlags) || {}) as ModuleFlags);

      // map stock item names for approvals list
      const { data: stockItems } = await supabase.from('stock_items').select('id, name, unit').order('name');
      setItems((stockItems as unknown as StockItem[]) || []);

      if (isManager) {
        const { data: pend } = await supabase
          .from('stock_requests')
          .select('id, stock_item_id, quantity_requested, reason, urgency, status, created_at, request_type')
          .eq('status', 'pending')
          .order('created_at', { ascending: true });
        setPending((pend as unknown as StockRequest[]) || []);
      } else {
        setPending([]);
      }
    };
    load();
  }, [userId, isManager]);

  const toggleModule = (key: keyof ModuleFlags, value: boolean) => {
    setModules(prev => ({ ...prev, [key]: value }));
  };

  const saveModules = async () => {
    if (!isAdmin || !userId) return;
    setModSaving(true);
    try {
      await supabase.from('app_settings').upsert({
        key: 'modules',
        value: modules,
        updated_by: userId,
      });
    } finally {
      setModSaving(false);
    }
  };

  const itemName = (id: string) => items.find(i => i.id === id)?.name || 'Unknown item';

  const decide = async (id: string, status: 'approved' | 'rejected') => {
    if (!isManager || !userId) return;

    if (status === 'approved') {
      const req = pending.find(r => r.id === id);
      if (req?.request_type === 'deduction') {
        // Deduct from stock and record movement
        const { data: item } = await supabase
          .from('stock_items')
          .select('current_quantity')
          .eq('id', req.stock_item_id)
          .maybeSingle();
        const newQty = Math.max(0, (item?.current_quantity ?? 0) - req.quantity_requested);
        await supabase.from('stock_items').update({ current_quantity: newQty }).eq('id', req.stock_item_id);
        await supabase.from('stock_movements').insert({
          stock_item_id: req.stock_item_id,
          movement_type: 'out',
          quantity: req.quantity_requested,
          reference_table: 'stock_requests',
          reference_id: id,
          notes: req.reason || 'Non-sales deduction',
          created_by: userId,
        });
      }
    }

    await supabase
      .from('stock_requests')
      .update({ status, approved_by: userId, approved_at: new Date().toISOString() })
      .eq('id', id);

    const { data: pend } = await supabase
      .from('stock_requests')
      .select('id, stock_item_id, quantity_requested, reason, urgency, status, created_at, request_type')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setPending((pend as unknown as StockRequest[]) || []);
  };

  return (
    <>
      <HotelNavigation />
      <main className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-8 space-y-8">
          <header>
            <h1 className="text-3xl font-bold text-hotel-primary">Back Office</h1>
            <p className="text-muted-foreground">Administrative operations and internal tools.</p>
          </header>

          {/* Quick Links */}
          <section className="grid md:grid-cols-4 gap-4">
            <Button asChild variant="secondary"><Link to="/users">User Management</Link></Button>
            <Button asChild variant="secondary"><Link to="/settings">Settings</Link></Button>
            <Button asChild variant="secondary"><Link to="/stock">Stock</Link></Button>
            <Button asChild variant="secondary"><Link to="/accounting">Accounting</Link></Button>
          </section>

          {/* Module Management */}
          <Card>
            <CardHeader>
              <CardTitle>Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="space-y-1">
                    <Label>Reservations</Label>
                    <p className="text-sm text-muted-foreground">Enable room reservations and allocation tools.</p>
                  </div>
                  <Switch checked={modules.reservations ?? true} onCheckedChange={(v) => toggleModule('reservations', v)} disabled={!isAdmin} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="space-y-1">
                    <Label>Restaurant</Label>
                    <p className="text-sm text-muted-foreground">Enable POS and kitchen/bar tickets.</p>
                  </div>
                  <Switch checked={modules.restaurant ?? true} onCheckedChange={(v) => toggleModule('restaurant', v)} disabled={!isAdmin} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="space-y-1">
                    <Label>Front Office</Label>
                    <p className="text-sm text-muted-foreground">Enable front office dashboards and quick links.</p>
                  </div>
                  <Switch checked={modules.front_office ?? true} onCheckedChange={(v) => toggleModule('front_office', v)} disabled={!isAdmin} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="space-y-1">
                    <Label>Conference</Label>
                    <p className="text-sm text-muted-foreground">Enable conference bookings and events.</p>
                  </div>
                  <Switch checked={modules.conference ?? true} onCheckedChange={(v) => toggleModule('conference', v)} disabled={!isAdmin} />
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={saveModules} disabled={!isAdmin || modSaving}>{modSaving ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </CardContent>
          </Card>

          {/* Approvals */}
          {isManager && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Stock Deductions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">No pending requests.</TableCell>
                      </TableRow>
                    )}
                    {pending.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{itemName(r.stock_item_id)}</TableCell>
                        <TableCell>{r.quantity_requested}</TableCell>
                        <TableCell className="capitalize">{r.urgency}</TableCell>
                        <TableCell className="max-w-md truncate" title={r.reason || ''}>{r.reason || '-'}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="secondary" onClick={() => decide(r.id, 'approved')}>Approve</Button>
                          <Button variant="destructive" onClick={() => decide(r.id, 'rejected')}>Reject</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </>
  );
}
