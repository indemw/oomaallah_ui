import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { exportToExcel, exportToPDF } from "@/lib/export";

export const ReportsSection = () => {
  const [start, setStart] = useState<string>(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0,10));
  const [end, setEnd] = useState<string>(new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState<string | null>(null);

  const dateFilter = useMemo(() => ({ start, end }), [start, end]);

  const fetchJournal = async () => {
    const { data } = await supabase
      .from('journal_entries')
      .select('entry_number, entry_date, description, total_debit, total_credit, status')
      .gte('entry_date', dateFilter.start)
      .lte('entry_date', dateFilter.end)
      .order('entry_date');
    return data || [];
  };

  const fetchPosRevenue = async () => {
    const { data } = await supabase
      .from('pos_bills')
      .select('created_at, subtotal, tax_amount, service_charge, discount_amount, total_amount, status')
      .gte('created_at', `${dateFilter.start}T00:00:00.000Z`)
      .lte('created_at', `${dateFilter.end}T23:59:59.999Z`)
      .order('created_at');
    return data || [];
  };

  const handleExport = async (type: 'journal' | 'pos' | 'vat', fmt: 'excel' | 'pdf') => {
    try {
      setLoading(`${type}-${fmt}`);
      if (type === 'journal') {
        const rows = await fetchJournal();
        const columns = [
          { header: 'Entry #', key: 'entry_number' },
          { header: 'Date', key: 'entry_date' },
          { header: 'Description', key: 'description' },
          { header: 'Debit', key: 'total_debit' },
          { header: 'Credit', key: 'total_credit' },
          { header: 'Status', key: 'status' },
        ];
        if (fmt === 'excel') await exportToExcel({ columns, rows, fileName: `journal-${start}_to_${end}` });
        else exportToPDF({ title: `Journal Entries ${start} to ${end}`, columns, rows, fileName: `journal-${start}_to_${end}` });
      }
      if (type === 'pos' || type === 'vat') {
        const rows = await fetchPosRevenue();
        const columns = [
          { header: 'Date', key: 'created_at' },
          { header: 'Subtotal', key: 'subtotal' },
          { header: 'Tax (VAT)', key: 'tax_amount' },
          { header: 'Service Charge', key: 'service_charge' },
          { header: 'Discount', key: 'discount_amount' },
          { header: 'Total', key: 'total_amount' },
          { header: 'Status', key: 'status' },
        ];
        const fileBase = type === 'vat' ? 'vat-summary' : 'pos-revenue';
        if (fmt === 'excel') await exportToExcel({ columns, rows, fileName: `${fileBase}-${start}_to_${end}` });
        else exportToPDF({ title: `${type === 'vat' ? 'VAT Summary' : 'POS Revenue'} ${start} to ${end}` , columns, rows, fileName: `${fileBase}-${start}_to_${end}` });
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports & Tax</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Start</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>End</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => handleExport('journal','excel')} disabled={loading!==null}>{loading==='journal-excel'?'Working...':'Journal • Excel'}</Button>
          <Button variant="secondary" onClick={() => handleExport('journal','pdf')} disabled={loading!==null}>{loading==='journal-pdf'?'Working...':'Journal • PDF'}</Button>

          <Button onClick={() => handleExport('pos','excel')} disabled={loading!==null}>{loading==='pos-excel'?'Working...':'POS Revenue • Excel'}</Button>
          <Button variant="secondary" onClick={() => handleExport('pos','pdf')} disabled={loading!==null}>{loading==='pos-pdf'?'Working...':'POS Revenue • PDF'}</Button>

          <Button onClick={() => handleExport('vat','excel')} disabled={loading!==null}>{loading==='vat-excel'?'Working...':'VAT Summary • Excel'}</Button>
          <Button variant="secondary" onClick={() => handleExport('vat','pdf')} disabled={loading!==null}>{loading==='vat-pdf'?'Working...':'VAT Summary • PDF'}</Button>
        </div>
        <p className="text-sm text-muted-foreground">VAT is calculated from POS bills tax_amount. Ensure menu tax rates are set under Restaurant ➝ Menu Items.</p>
      </CardContent>
    </Card>
  );
};
