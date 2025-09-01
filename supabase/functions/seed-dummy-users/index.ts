import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = 'https://zfjicwlopcwjjvojmgow.supabase.co';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY ?? '');

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const users = [
      { email: 'store.staff@sadc-gmi.org', password: 'Demo#Store123', full_name: 'Store Staff', role: 'staff', department: 'stores' },
      { email: 'stock.manager@sadc-gmi.org', password: 'Demo#Manager123', full_name: 'Stock Manager', role: 'manager', department: 'operations' },
      { email: 'accountant@sadc-gmi.org', password: 'Demo#Account123', full_name: 'Accountant', role: 'accountant', department: 'finance' },
      { email: 'admin.demo@sadc-gmi.org', password: 'Demo#Admin123', full_name: 'Admin Demo', role: 'admin', department: 'administration' },
      { email: 'super.admin@sadc-gmi.org', password: 'Demo#Super123', full_name: 'Super Admin', role: 'super_admin', department: 'executive' },
    ];

    const results: Array<{ email: string; user_id?: string; status: string; error?: string }> = [];

    for (const u of users) {
      let userId: string | null = null;

      const { data: createRes, error: createErr } = await adminClient.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name },
      });

      if (createErr) {
        // If user exists, find id
        const { data: listData, error: listErr } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listErr) {
          results.push({ email: u.email, status: 'failed', error: listErr.message });
          continue;
        }
        userId = listData.users.find((usr) => usr.email?.toLowerCase() === u.email.toLowerCase())?.id ?? null;
        if (!userId) {
          results.push({ email: u.email, status: 'failed', error: createErr.message });
          continue;
        }
      } else {
        userId = createRes?.user?.id ?? null;
      }

      if (!userId) {
        results.push({ email: u.email, status: 'failed', error: 'Unknown user ID' });
        continue;
      }

      const { error: upsertErr } = await adminClient
        .from('profiles')
        .upsert({ user_id: userId, email: u.email, full_name: u.full_name, role: u.role, department: u.department }, { onConflict: 'user_id' });

      if (upsertErr) {
        results.push({ email: u.email, user_id: userId, status: 'profile_failed', error: upsertErr.message });
      } else {
        results.push({ email: u.email, user_id: userId, status: 'ok' });
      }
    }

    return new Response(JSON.stringify({ count: results.length, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e) {
    console.error('Unexpected error:', e);
    return new Response(JSON.stringify({ error: 'Unexpected server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

Deno.serve(handler);
