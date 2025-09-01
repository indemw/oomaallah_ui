import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HotelNavigation } from "@/components/HotelNavigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

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

 type Profile = { id: string; user_id: string; email: string; full_name: string | null; role: string; department: string | null };
 type Me = { user_id: string; role: string };

export default function UserManagement() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const isAdmin = useMemo(() => ['admin','super_admin'].includes(me?.role ?? ''), [me]);

  const [open, setOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', full_name: '', role: 'staff', department: '', password: '' });
  const [roles, setRoles] = useState<string[]>([]);
  const DEPARTMENTS = ['Food and Beverages','Front Office','Housekeeping','Admin','Accounts'];
  const ALLOWED_ROLES = ['staff','manager','accountant','admin','super_admin'] as const;
  type RoleKey = typeof ALLOWED_ROLES[number];
  const normalizeRole = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  useEffect(() => {
    setSEO("User Management | Oomaallah Hotel", "Manage staff roles and departments.", "/users");

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
      const { data: my } = await supabase.from('profiles').select('user_id, role').eq('user_id', userId).maybeSingle();
      if (my) setMe(my as Me);
      const [{ data: all }, { data: rolesData }] = await Promise.all([
        supabase.from('profiles').select('id, user_id, email, full_name, role, department').order('created_at', { ascending: false }),
        supabase.from('roles').select('name').order('name')
      ]);
      setProfiles((all as Profile[]) || []);
      
      // Use roles from roles table, fallback to allowed roles
      const tableRoles = ((rolesData as { name: string }[] | null) || []).map(r => r.name);
      setRoles(tableRoles.length ? tableRoles : Array.from(ALLOWED_ROLES));
    };
    load();
  }, [userId]);

  useEffect(() => {
    if (roles.length && !roles.includes(newUser.role)) {
      setNewUser((s) => ({ ...s, role: roles[0] }));
    }
  }, [roles]);
  const updateRole = async (id: string, role: string) => {
    if (!isAdmin) return;
    setSavingId(id);
    try {
      await supabase.from('profiles').update({ role }).eq('id', id);
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, role } : p));
    } finally {
      setSavingId(null);
    }
  };

  if (!me) return <main className="min-h-screen bg-background flex items-center justify-center"><p>Loading...</p></main>;
  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader><CardTitle>Access restricted</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You need the admin or super_admin role to manage users.</p>
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
        <h1 className="text-3xl font-bold text-hotel-primary">User Management</h1>
        <div className="flex items-center justify-between">
          <div />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={newUser.email} onChange={(e) => setNewUser(s => ({ ...s, email: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Full name</Label>
                  <Input value={newUser.full_name} onChange={(e) => setNewUser(s => ({ ...s, full_name: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Department</Label>
                  <Select value={newUser.department} onValueChange={(v) => setNewUser(s => ({ ...s, department: v }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select value={newUser.role} onValueChange={(v) => setNewUser(s => ({ ...s, role: v }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Temporary Password</Label>
                  <Input type="password" value={newUser.password} onChange={(e) => setNewUser(s => ({ ...s, password: e.target.value }))} />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={creating}
                    onClick={async () => {
                      const email = newUser.email.trim();
                      const pwd = newUser.password;
                      const emailValid = /.+@.+\..+/.test(email);
                      if (!emailValid) {
                        toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
                        return;
                      }
                      if (!pwd || pwd.length < 8) {
                        toast({ title: "Weak password", description: "Password must be at least 8 characters.", variant: "destructive" });
                        return;
                      }
                      setCreating(true);
                      const { error } = await supabase.functions.invoke('create-user', { body: newUser });
                      if (error) {
                        toast({ title: "Failed to create user", description: error.message, variant: "destructive" });
                      } else {
                        toast({ title: "User created", description: `${newUser.email} has been added.` });
                        setOpen(false);
                        setNewUser({ email: '', full_name: '', role: roles[0] ?? 'staff', department: '', password: '' });
                        const { data: all } = await supabase.from('profiles').select('id, user_id, email, full_name, role, department').order('created_at', { ascending: false });
                        setProfiles((all as Profile[]) || []);
                      }
                      setCreating(false);
                    }}
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Staff Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(p => (
                    <tr key={p.id} className="border-b">
                      <td className="py-3 pr-4">{p.full_name || '—'}</td>
                      <td className="py-3 pr-4">{p.email}</td>
                      <td className="py-3 pr-4">
                        <Select value={p.role} onValueChange={(v) => updateRole(p.id, v)}>
                          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {roles.map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                  {profiles.length === 0 && (
                    <tr><td className="py-6 text-muted-foreground" colSpan={3}>No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
      </main>
    </>
  );
}
