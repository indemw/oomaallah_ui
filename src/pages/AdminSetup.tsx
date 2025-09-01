import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AdminSetup = () => {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string>("");
  const [seedLoading, setSeedLoading] = useState(false);
  const [deptStatus, setDeptStatus] = useState<string>("");
  const [deptLoading, setDeptLoading] = useState(false);

  useEffect(() => {
    document.title = "Admin Setup | Oomaallah Hotel";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Create initial admin and dummy users for staff access');
    const link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', `${window.location.origin}/admin-setup`);
    if (!link.parentNode) document.head.appendChild(link);
  }, []);

  const run = async () => {
    try {
      setLoading(true);
      setStatus("");
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: 'jamesm@sadc-gmi.org',
          password: 'Mlimi1985##@',
          full_name: 'System Administrator'
        }
      });
      if (error) throw error;
      setStatus(`Success. User ID: ${data?.user_id ?? 'created'}`);
    } catch (e: any) {
      setStatus(`Failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const runSuperAdmin = async () => {
    try {
      setLoading(true);
      setStatus("");
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: 'jwmanda@gmail.com',
          password: 'Mlimi1985##@',
          full_name: 'Super Admin',
          role: 'super_admin'
        }
      });
      if (error) throw error;
      setStatus(`Super Admin created. User ID: ${data?.user_id ?? 'created'}`);
    } catch (e: any) {
      setStatus(`Failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  const createDepartments = async () => {
    try {
      setDeptLoading(true);
      setDeptStatus("");
      const { data, error } = await supabase.functions.invoke('create-department-users');
      if (error) throw error;
      setDeptStatus(`Created: ${data?.count ?? 0} accounts`);
    } catch (e: any) {
      setDeptStatus(`Failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setDeptLoading(false);
    }
  };
  const seed = async () => {
    try {
      setSeedLoading(true);
      setSeedStatus("");
      const { data, error } = await supabase.functions.invoke('seed-dummy-users');
      if (error) throw error;
      setSeedStatus(`Seeded: ${data?.count ?? 0} users`);
    } catch (e: any) {
      setSeedStatus(`Failed: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Admin User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-2">
            <p className="text-muted-foreground">Click the button below to create the admin account.</p>
            <Button onClick={run} disabled={loading}>{loading ? 'Creating…' : 'Create Admin'}</Button>
            {status && <p className="text-sm">{status}</p>}
          </section>
          <section className="space-y-2">
            <p className="text-muted-foreground">Create Super Admin for jwmanda@gmail.com.</p>
            <Button onClick={runSuperAdmin} disabled={loading}>{loading ? 'Creating…' : 'Create Super Admin'}</Button>
          </section>
          <section className="space-y-2">
            <p className="text-muted-foreground">Create departmental accounts (Front Office, Restaurant, Accountant, GM).</p>
            <Button onClick={createDepartments} disabled={deptLoading}>{deptLoading ? 'Creating…' : 'Create Department Accounts'}</Button>
            {deptStatus && <p className="text-sm">{deptStatus}</p>}
          </section>
          <section className="space-y-2">
            <p className="text-muted-foreground">Then create dummy users for Stock and Accounting.</p>
            <Button onClick={seed} disabled={seedLoading}>{seedLoading ? 'Seeding…' : 'Create Dummy Users'}</Button>
            {seedStatus && <p className="text-sm">{seedStatus}</p>}
          </section>
        </CardContent>
      </Card>
    </main>
  );
};

export default AdminSetup;
