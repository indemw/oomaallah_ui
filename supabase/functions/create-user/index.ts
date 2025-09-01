// Supabase Edge Function: create-user
// Purpose: Admins can create a new user and corresponding profile
// CORS enabled

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Ensure caller is authenticated
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Check caller role
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userRes.user.id)
      .maybeSingle();

    if (!callerProfile || !["admin", "super_admin"].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const body = await req.json();
    const { email, full_name, role = "staff", department = null, password } = body ?? {};

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing email or password" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const allowedRoles = ["staff", "manager", "accountant", "admin", "super_admin"] as const;
    if (!allowedRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Create auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, department },
    });
    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message || "Failed to create user" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // Insert profile
    const { error: profileErr } = await admin.from("profiles").upsert({
      user_id: created.user.id,
      email,
      full_name: full_name ?? null,
      role,
      department,
    });
    if (profileErr) {
      return new Response(JSON.stringify({ error: profileErr.message }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    return new Response(JSON.stringify({ id: created.user.id, email, role, department }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || "Unexpected error" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
