import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FrontOfficeOverview from "@/components/frontoffice/FrontOfficeOverview";
import ArrivalsDepartures from "@/components/frontoffice/ArrivalsDepartures";
import QuickLinks from "@/components/frontoffice/QuickLinks";

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

export default function FrontOffice() {
  const [enabled, setEnabled] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setSEO("Front Office | Oomaallah Hotel", "Front office operations and guest management.", "/front-office");
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'modules')
      .maybeSingle()
      .then(({ data }) => {
        setEnabled(Boolean((data?.value as any)?.front_office ?? true));
        setChecked(true);
      });
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-hotel-primary">Front Office</h1>
        <p className="text-muted-foreground">Check-in/out, guest management, and invoicing.</p>
      </header>
      {!checked ? (
        <p>Loading...</p>
      ) : !enabled ? (
        <section className="p-6 border rounded-lg bg-gradient-card">
          <h2 className="text-xl font-semibold text-hotel-primary">Module disabled</h2>
          <p className="text-muted-foreground">Ask an administrator to enable Front Office in Settings.</p>
        </section>
      ) : (
        <div className="space-y-6">
          <FrontOfficeOverview />
          <ArrivalsDepartures />
          <QuickLinks />
        </div>
      )}
    </div>
  );
}
