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
    const { email, password, full_name, role } = await req.json().catch(() => ({
      email: 'jwmanda@gmail.com',
      password: 'Mlimi1985##@',
      full_name: 'Super Admin',
      role: 'super_admin',
    }));

    // Restrict to a safe whitelist of emails for setup
    const allowedEmails = ['jwmanda@gmail.com', 'jamesm@sadc-gmi.org'];
    if (!allowedEmails.includes(email)) {
      return new Response(JSON.stringify({ error: 'Unauthorized email' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Try to create the user (idempotent: if exists, proceed to lookup)
    const { data: createRes, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    let userId = createRes?.user?.id ?? null;

    if (createErr) {
      console.warn('Create user error (might exist already):', createErr.message);
      // Try to find existing user by listing users and matching email
      const { data: listData, error: listErr } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listErr) {
        console.error('List users error:', listErr.message);
      } else {
        userId = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unable to create or locate user' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Upsert profile with specified role
    const { error: upsertErr } = await adminClient
      .from('profiles')
      .upsert({ user_id: userId, email, full_name: full_name ?? 'Super Admin', role: role ?? 'super_admin' }, { onConflict: 'user_id' });

    if (upsertErr) {
      console.error('Profile upsert error:', upsertErr.message);
      return new Response(JSON.stringify({ error: 'Profile setup failed', details: upsertErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
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

// Deno entrypoint
Deno.serve(handler);
