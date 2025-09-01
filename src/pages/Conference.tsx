import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { RoomsTable } from "@/components/conference/RoomsTable";
import { BookingsTable } from "@/components/conference/BookingsTable";

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

export default function Conference() {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(true);
  const [checked, setChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setSEO("Conference Facilities | Oomaallah Hotel", "Conference bookings and event management.", "/conference");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate('/auth');
      setUserId(session?.user?.id ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/auth');
      setUserId(session?.user?.id ?? null);
    });

    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'modules')
      .maybeSingle()
      .then(({ data }) => {
        setEnabled(Boolean((data?.value as any)?.conference ?? true));
        setChecked(true);
      });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-hotel-primary">Conference Facilities</h1>
        <p className="text-muted-foreground">Conference room bookings and event management.</p>
      </header>
      {!checked ? (
        <p>Loading...</p>
      ) : !enabled ? (
        <section className="p-6 border rounded-lg bg-gradient-card">
          <h2 className="text-xl font-semibold text-hotel-primary">Module disabled</h2>
          <p className="text-muted-foreground">Ask an administrator to enable Conference in Settings.</p>
        </section>
      ) : (
        <section className="space-y-6">
          <RoomsTable />
          <BookingsTable />
        </section>
      )}
    </main>
  );
}
