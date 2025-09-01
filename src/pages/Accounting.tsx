import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HotelNavigation } from "@/components/HotelNavigation";
import { exportToExcel, exportToPDF } from "@/lib/export";
import { ReportsSection } from "@/components/accounting/ReportsSection";
import { InvoicesSection } from "@/components/accounting/InvoicesSection";
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

type Account = { id: string; account_code: string; account_name: string };

type Line = { account_id: string; description?: string; debit_amount: number; credit_amount: number };

export default function Accounting() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [description, setDescription] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [lines, setLines] = useState<Line[]>([
    { account_id: "", debit_amount: 0, credit_amount: 0 },
    { account_id: "", debit_amount: 0, credit_amount: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const isAccountant = useMemo(() => ['accountant','admin','super_admin'].includes(profile?.role ?? ''), [profile]);
  const totals = useMemo(() => ({
    debit: lines.reduce((s, l) => s + (Number(l.debit_amount) || 0), 0),
    credit: lines.reduce((s, l) => s + (Number(l.credit_amount) || 0), 0),
  }), [lines]);

  useEffect(() => {
    setSEO(
      "Accounting | Oomaallah Hotel",
      "Create balanced journal entries and manage chart of accounts.",
      "/accounting"
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate('/auth');
      setUserId(session?.user?.id ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/auth');
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data: prof } = await supabase.from('profiles').select('user_id, role').eq('user_id', userId).maybeSingle();
      if (prof) setProfile(prof as Profile);
      const { data: accts } = await supabase.from('chart_of_accounts').select('id, account_code, account_name').order('account_code');
      setAccounts(accts || []);
    };
    load();
  }, [userId]);

  const canSave = isAccountant && description.trim().length > 0 && totals.debit > 0 && totals.debit === totals.credit && lines.every(l => !!l.account_id && (Number(l.debit_amount) > 0 || Number(l.credit_amount) > 0));

  const updateLine = (idx: number, patch: Partial<Line>) => {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  };

  const addLine = () => setLines(prev => [...prev, { account_id: "", debit_amount: 0, credit_amount: 0 }]);
  const removeLine = (idx: number) => setLines(prev => prev.filter((_, i) => i !== idx));

  const saveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !canSave) return;
    setSaving(true);
    try {
      const entryNumber = `JE-${Date.now()}`;
      const { data: je, error: jeErr } = await supabase.from('journal_entries').insert({
        entry_number: entryNumber,
        entry_date: entryDate,
        description,
        reference: reference || null,
        total_debit: totals.debit,
        total_credit: totals.credit,
        created_by: userId,
        status: 'posted'
      }).select('id').maybeSingle();
      if (jeErr) throw jeErr;
      if (!je) throw new Error('Failed to create journal entry');

      const payload = lines.map(l => ({
        journal_entry_id: je.id,
        account_id: l.account_id,
        description: l.description || null,
        debit_amount: Number(l.debit_amount) || 0,
        credit_amount: Number(l.credit_amount) || 0,
      }));
      const { error: lineErr } = await supabase.from('journal_entry_lines').insert(payload);
      if (lineErr) throw lineErr;

      // reset form
      setDescription("");
      setReference("");
      setLines([
        { account_id: "", debit_amount: 0, credit_amount: 0 },
        { account_id: "", debit_amount: 0, credit_amount: 0 },
      ]);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return <main className="min-h-screen bg-background flex items-center justify-center"><p>Loading...</p></main>;
  }

  if (!isAccountant) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You need the accountant or admin role to access the accounting module.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <>
      <HotelNavigation />
      <main className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold text-hotel-primary">Accounting</h1>

        <Card>
          <CardHeader>
            <CardTitle>Create Journal Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveEntry} className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Record room revenue" />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>Reference</Label>
                  <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="optional" />
                </div>
              </div>

              <div className="space-y-4">
                {lines.map((l, idx) => (
                  <div key={idx} className="grid md:grid-cols-5 gap-3 items-end">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Account</Label>
                      <Select value={l.account_id} onValueChange={(v) => updateLine(idx, { account_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.account_code} • {a.account_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Debit</Label>
                      <Input type="number" min={0} step="0.01" value={l.debit_amount}
                        onChange={(e) => updateLine(idx, { debit_amount: Number(e.target.value || 0), credit_amount: 0 })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Credit</Label>
                      <Input type="number" min={0} step="0.01" value={l.credit_amount}
                        onChange={(e) => updateLine(idx, { credit_amount: Number(e.target.value || 0), debit_amount: 0 })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="invisible md:visible">Action</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={addLine}>Add</Button>
                        {lines.length > 2 && (
                          <Button type="button" variant="destructive" onClick={() => removeLine(idx)}>Remove</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Totals — Debit: {totals.debit.toFixed(2)} • Credit: {totals.credit.toFixed(2)}</div>
                <Button type="submit" disabled={!canSave || saving}>{saving ? 'Saving...' : 'Post Entry'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <ReportsSection />
        <InvoicesSection />
      </section>
      </main>
    </>
  );
}
