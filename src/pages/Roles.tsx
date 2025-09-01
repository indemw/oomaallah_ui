import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const setSEO = (title: string, description: string, path: string) => {
  document.title = title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', description);
  let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
  if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link); }
  link.setAttribute('href', `${window.location.origin}${path}`);
};


const MODULES = [
  "reservations",
  "conference",
  "restaurant",
  "stock",
  "accounting",
  "users",
  "chat",
] as const;

type Module = typeof MODULES[number];

interface Role { id: string; name: string; description: string | null }
interface Permission {
  id: string;
  role_id: string;
  module: Module;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export default function Roles() {
  const { toast } = useToast();
  const sb = supabase as any;
  const [roles, setRoles] = useState<Role[]>([]);
  const [perms, setPerms] = useState<Record<string, Permission[]>>({});
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: r }, { data: p }] = await Promise.all([
      sb.from("roles").select("id,name,description").order("name"),
      sb.from("role_permissions").select("id,role_id,module,can_create,can_read,can_update,can_delete"),
    ]);
    setRoles(r || []);
    const map: Record<string, Permission[]> = {};
    (p || []).forEach((perm) => {
      map[perm.role_id] = map[perm.role_id] || [];
      map[perm.role_id].push(perm as Permission);
    });
    setPerms(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setSEO("Roles & Permissions | Admin", "Manage roles and CRUD permissions", "/roles"); }, []);

  const upsertPerm = async (roleId: string, module: Module, key: keyof Permission, value: boolean) => {
    const existing = (perms[roleId] || []).find((p) => p.module === module);
    if (existing) {
      const { error } = await sb.from("role_permissions").update({ [key]: value }).eq("id", existing.id);
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      setPerms((m) => ({ ...m, [roleId]: (m[roleId] || []).map((p) => p.id === existing.id ? { ...p, [key]: value } as any : p) }));
    } else {
      const insert = { role_id: roleId, module, can_create: false, can_read: true, can_update: false, can_delete: false, [key]: value } as any;
      const { data, error } = await sb.from("role_permissions").insert(insert).select().single();
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      setPerms((m) => ({ ...m, [roleId]: [ ...(m[roleId] || []), data as Permission ] }));
    }
  };

  const createRole = async () => {
    if (!newRole.name.trim()) return;
    const { data, error } = await supabase.from("roles").insert({ name: newRole.name.trim(), description: newRole.description || null }).select().single();
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setNewRole({ name: "", description: "" });
    setRoles((r) => [...r, data as Role]);
  };

  const deleteRole = async (id: string) => {
    const { error } = await supabase.from("roles").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setRoles((r) => r.filter((x) => x.id !== id));
    setPerms((m) => { const c = { ...m }; delete c[id]; return c; });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Roles & Permissions</h1>
        <p className="text-sm opacity-70">Define CRUD per module. Only admins can manage.</p>
      </header>

      <Card className="p-4 space-y-2">
        <h2 className="text-sm font-medium">Create Role</h2>
        <div className="flex gap-2">
          <Input placeholder="Role name" value={newRole.name} onChange={(e) => setNewRole((s) => ({ ...s, name: e.target.value }))} />
          <Input placeholder="Description (optional)" value={newRole.description} onChange={(e) => setNewRole((s) => ({ ...s, description: e.target.value }))} />
          <Button onClick={createRole}>Add</Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium">{role.name}</div>
                {role.description && <div className="text-xs opacity-70">{role.description}</div>}
              </div>
              <Button variant="destructive" size="sm" onClick={() => deleteRole(role.id)}>Delete</Button>
            </div>
            <div className="grid grid-cols-5 gap-2 text-xs font-medium mb-1 opacity-70">
              <div>Module</div><div>Create</div><div>Read</div><div>Update</div><div>Delete</div>
            </div>
            <div className="space-y-2">
              {MODULES.map((mod) => {
                const p = (perms[role.id] || []).find((x) => x.module === mod);
                return (
                  <div key={mod} className="grid grid-cols-5 gap-2 items-center">
                    <div className="text-sm">{mod}</div>
                    {(["can_create","can_read","can_update","can_delete"] as (keyof Permission)[]).map((k) => (
                      <label key={k} className="flex items-center gap-2">
                        <Checkbox
                          checked={Boolean(p?.[k])}
                          onCheckedChange={(v) => upsertPerm(role.id, mod, k, Boolean(v))}
                        />
                        <span className="sr-only">{k}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
